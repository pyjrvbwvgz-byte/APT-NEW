import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi, API } from "../lib/api";
import axios from "axios";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ShieldCheck, RefreshCw, Trash2, Save, LogOut, UserPlus, Mail, CreditCard, Users, Calendar, Salad, Layout } from "lucide-react";
import AdminMealsTab from "./admin/AdminMealsTab";
import AdminContentTab from "./admin/AdminContentTab";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  // Validate any existing token on mount; if invalid, force re-login
  useEffect(() => {
    const token = sessionStorage.getItem("abpt_admin_token");
    if (!token) {
      setChecking(false);
      return;
    }
    adminApi
      .get("/admin/ping")
      .then(() => setAuthed(true))
      .catch(() => {
        sessionStorage.removeItem("abpt_admin_token");
        setAuthed(false);
      })
      .finally(() => setChecking(false));
  }, []);

  if (checking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center text-[#5C7063]">Checking session…</div>
      </div>
    );
  }

  if (!authed) {
    const onLogin = async (e) => {
      e.preventDefault();
      setBusy(true);
      try {
        const r = await axios.post(`${API}/admin/login`, { password });
        sessionStorage.setItem("abpt_admin_token", r.data.token);
        setAuthed(true);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Wrong password");
      } finally {
        setBusy(false);
      }
    };
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 py-16">
          <div className="max-w-sm mx-auto px-4">
            <div className="bg-white border border-[#E5EFE8] rounded-2xl p-8 shadow-sm">
              <ShieldCheck className="w-8 h-8 text-[#10B981]" />
              <h1 className="font-display text-3xl font-bold mt-4 tracking-tight">
                Admin
              </h1>
              <p className="text-[#5C7063] mt-1 text-sm">
                Manage clients & weekly menu.
              </p>
              <form onSubmit={onLogin} className="mt-6 space-y-4">
                <div>
                  <Label htmlFor="admin-pass">Password</Label>
                  <Input
                    id="admin-pass"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1.5"
                    autoFocus
                    data-testid="admin-password-input"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-11"
                  data-testid="admin-login-btn"
                >
                  Enter admin
                </Button>
                <p className="text-xs text-[#5C7063] pt-1">
                  Sessions expire after 8 hours and on browser close.
                </p>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleLogout = async () => {
    try { await adminApi.post("/admin/logout"); } catch (e) { /* ignore */ }
    sessionStorage.removeItem("abpt_admin_token");
    setAuthed(false);
  };

  return <AdminDashboard onLogout={handleLogout} />;
}

function AdminDashboard({ onLogout }) {
  const [clients, setClients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rotating, setRotating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, r, m] = await Promise.all([
        adminApi.get("/admin/clients"),
        axios.get(`${API}/recipes`),
        adminApi.get("/admin/menu/current"),
      ]);
      setClients(c.data);
      setRecipes(r.data);
      setMenu(m.data);
    } catch (err) {
      toast.error("Failed to load admin data");
      if (err?.response?.status === 401) onLogout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const removeClient = async (id) => {
    if (!window.confirm("Remove this client?")) return;
    try {
      await adminApi.delete(`/admin/clients/${id}`);
      toast.success("Client removed");
      setClients((cs) => cs.filter((c) => c.id !== id));
    } catch {
      toast.error("Failed to remove");
    }
  };

  const regenCode = async (id) => {
    try {
      const r = await adminApi.post(`/admin/clients/${id}/regenerate-code`);
      toast.success(`New code: ${r.data.code}`);
      setClients((cs) =>
        cs.map((c) =>
          c.id === id
            ? { ...c, code: r.data.code, code_expires_at: r.data.code_expires_at }
            : c
        )
      );
    } catch {
      toast.error("Failed to regenerate");
    }
  };

  const createClient = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      toast.error("Name and email required");
      return;
    }
    setCreating(true);
    try {
      const r = await adminApi.post(`/admin/clients`, {
        name: newName.trim(),
        email: newEmail.trim(),
      });
      toast.success(`Client created — code: ${r.data.code}`);
      setClients((cs) => [...cs, r.data]);
      setNewName("");
      setNewEmail("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  const rotateAll = async () => {
    setRotating(true);
    try {
      const r = await adminApi.post(`/admin/rotate-codes`);
      toast.success(`Rotated ${r.data.rotated?.length || 0} codes · digest emailed`);
      await load();
    } catch {
      toast.error("Rotate failed");
    } finally {
      setRotating(false);
    }
  };

  const updateMenuSlot = (day, meal, slug) => {
    setMenu((m) => ({
      ...m,
      days: { ...m.days, [day]: { ...m.days[day], [meal]: slug } },
    }));
  };

  const saveMenu = async () => {
    try {
      const r = await adminApi.put("/admin/menu/current", { days: menu.days, apply_to_all: true });
      toast.success(`Menu saved · applied to ${r.data?.applied_to_clients ?? 0} clients`);
    } catch {
      toast.error("Failed to save menu");
    }
  };

  const byCategory = (cat) => recipes.filter((r) => r.category === cat);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            data-testid="admin-logout-btn"
          >
            <LogOut className="w-4 h-4 mr-1" /> Log out
          </Button>
        }
      />
      <main className="flex-1 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
                Admin
              </div>
              <h1 className="font-display text-4xl font-bold text-[#111C15] tracking-tight mt-2">
                Control panel
              </h1>
            </div>
            <Button
              onClick={rotateAll}
              disabled={rotating}
              variant="outline"
              className="border-[#E5EFE8] hover:bg-[#F3F7F4]"
              data-testid="rotate-codes-btn"
            >
              <Mail className="w-4 h-4 mr-2" />
              {rotating ? "Rotating…" : "Rotate weekly codes & email digest"}
            </Button>
          </div>

          <Tabs defaultValue="clients" className="space-y-6">
            <TabsList className="bg-[#F3F7F4] flex-wrap h-auto">
              <TabsTrigger value="clients" data-testid="tab-clients">
                <Users className="w-4 h-4 mr-1" /> Clients
              </TabsTrigger>
              <TabsTrigger value="menu" data-testid="tab-menu">
                <Calendar className="w-4 h-4 mr-1" /> Weekly menu
              </TabsTrigger>
              <TabsTrigger value="meals" data-testid="tab-meals">
                <Salad className="w-4 h-4 mr-1" /> Meals
              </TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content">
                <Layout className="w-4 h-4 mr-1" /> Website
              </TabsTrigger>
            </TabsList>

            <TabsContent value="clients" className="space-y-8">
              <ClientsSection
                clients={clients}
                loading={loading}
                newName={newName}
                newEmail={newEmail}
                setNewName={setNewName}
                setNewEmail={setNewEmail}
                creating={creating}
                createClient={createClient}
                regenCode={regenCode}
                removeClient={removeClient}
              />
            </TabsContent>

            <TabsContent value="menu">
              <MenuSection
                menu={menu}
                recipes={recipes}
                updateMenuSlot={updateMenuSlot}
                saveMenu={saveMenu}
                byCategory={byCategory}
              />
            </TabsContent>

            <TabsContent value="meals">
              <AdminMealsTab />
            </TabsContent>

            <TabsContent value="content">
              <AdminContentTab />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ClientsSection({ clients, loading, newName, newEmail, setNewName, setNewEmail, creating, createClient, regenCode, removeClient }) {
  return (
    <>
          {/* Create coaching client */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#111C15] mb-4">
              Add coaching client
            </h2>
            <form
              onSubmit={createClient}
              className="bg-white border border-[#E5EFE8] rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Client name"
                  className="mt-1.5"
                  data-testid="new-client-name"
                />
              </div>
              <div className="flex-1 w-full">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="mt-1.5"
                  data-testid="new-client-email"
                />
              </div>
              <Button
                type="submit"
                disabled={creating}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-11 px-6"
                data-testid="create-client-btn"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {creating ? "…" : "Create + email code"}
              </Button>
            </form>
            <p className="text-xs text-[#5C7063] mt-2">
              A 4-digit code is generated and emailed to your inbox so you can pass it on. Codes rotate every Monday.
            </p>
          </section>

          {/* Clients table */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#111C15] mb-4">
              Clients ({clients.length})
            </h2>
            <div className="bg-white border border-[#E5EFE8] rounded-2xl overflow-x-auto">
              {loading ? (
                <div className="p-6 text-[#5C7063]">Loading…</div>
              ) : clients.length === 0 ? (
                <div className="p-6 text-[#5C7063]">No clients yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Code expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((c) => (
                      <TableRow key={c.id} data-testid={`client-row-${c.id}`}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm">{c.email}</TableCell>
                        <TableCell>
                          {c.is_subscribed ? (
                            <Badge className="bg-[#10B981] text-white hover:bg-[#059669]">
                              <CreditCard className="w-3 h-3 mr-1" /> Subscriber
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-[#E5EFE8] text-[#5C7063]">
                              Coaching
                            </Badge>
                          )}
                          {c.subscription_expires_at && c.is_subscribed && (
                            <div className="text-[10px] text-[#5C7063] mt-1">
                              until {new Date(c.subscription_expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.code ? (
                            <Badge className="bg-[#10B981]/10 text-[#059669] hover:bg-[#10B981]/15 font-mono tracking-widest">
                              {c.code}
                            </Badge>
                          ) : (
                            <span className="text-[#5C7063] text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-[#5C7063]">
                          {c.code_expires_at
                            ? new Date(c.code_expires_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          {!c.is_subscribed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regenCode(c.id)}
                              data-testid={`regen-${c.id}`}
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Code
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeClient(c.id)}
                            data-testid={`remove-${c.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>
    </>
  );
}

function MenuSection({ menu, recipes, updateMenuSlot, saveMenu, byCategory }) {
  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return (
    <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-semibold text-[#111C15]">
                This week's menu
              </h2>
              <Button
                onClick={saveMenu}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md"
                data-testid="save-menu-btn"
              >
                <Save className="w-4 h-4 mr-2" /> Save & apply to all clients
              </Button>
            </div>
            <p className="text-xs text-[#5C7063] mb-3">
              Saving immediately pushes this menu to every active client's dashboard.
            </p>
            <div className="bg-white border border-[#E5EFE8] rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5EFE8] bg-[#F3F7F4]/50">
                    <th className="text-left p-3 font-medium text-[#5C7063]">Day</th>
                    <th className="text-left p-3 font-medium text-[#5C7063]">Breakfast</th>
                    <th className="text-left p-3 font-medium text-[#5C7063]">Lunch</th>
                    <th className="text-left p-3 font-medium text-[#5C7063]">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day} className="border-b border-[#F3F7F4] last:border-0">
                      <td className="p-3 font-medium font-display text-[#111C15]">
                        {day}
                      </td>
                      {["breakfast", "lunch", "dinner"].map((meal) => (
                        <td key={meal} className="p-3">
                          <Select
                            value={menu?.days?.[day]?.[meal] || ""}
                            onValueChange={(v) => updateMenuSlot(day, meal, v)}
                          >
                            <SelectTrigger
                              className="min-w-[180px]"
                              data-testid={`menu-select-${day}-${meal}`}
                            >
                              <SelectValue placeholder="Choose…" />
                            </SelectTrigger>
                            <SelectContent>
                              {byCategory(meal).map((r) => (
                                <SelectItem key={r.slug} value={r.slug}>
                                  {r.name}
                                </SelectItem>
                              ))}
                              {byCategory(meal).length === 0 &&
                                recipes.map((r) => (
                                  <SelectItem key={r.slug} value={r.slug}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
    </section>
  );
}

          {/* Create coaching client */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#111C15] mb-4">
              Add coaching client
            </h2>
            <form
              onSubmit={createClient}
              className="bg-white border border-[#E5EFE8] rounded-2xl p-6 flex flex-col md:flex-row gap-4 items-end"
            >
              <div className="flex-1 w-full">
                <Label htmlFor="new-name">Name</Label>
                <Input
                  id="new-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Client name"
                  className="mt-1.5"
                  data-testid="new-client-name"
                />
              </div>
              <div className="flex-1 w-full">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="client@email.com"
                  className="mt-1.5"
                  data-testid="new-client-email"
                />
              </div>
              <Button
                type="submit"
                disabled={creating}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-11 px-6"
                data-testid="create-client-btn"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                {creating ? "…" : "Create + email code"}
              </Button>
            </form>
            <p className="text-xs text-[#5C7063] mt-2">
              A 4-digit code is generated and emailed to your inbox so you can pass it on. Codes rotate every Monday.
            </p>
          </section>

          {/* Clients */}
          <section>
            <h2 className="font-display text-2xl font-semibold text-[#111C15] mb-4">
              Clients ({clients.length})
            </h2>
            <div className="bg-white border border-[#E5EFE8] rounded-2xl overflow-x-auto">
              {loading ? (
                <div className="p-6 text-[#5C7063]">Loading…</div>
              ) : clients.length === 0 ? (
                <div className="p-6 text-[#5C7063]">No clients yet.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Code expires</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((c) => (
                      <TableRow key={c.id} data-testid={`client-row-${c.id}`}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell className="text-sm">{c.email}</TableCell>
                        <TableCell>
                          {c.is_subscribed ? (
                            <Badge className="bg-[#10B981] text-white hover:bg-[#059669]">
                              <CreditCard className="w-3 h-3 mr-1" /> Subscriber
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-[#E5EFE8] text-[#5C7063]">
                              Coaching
                            </Badge>
                          )}
                          {c.subscription_expires_at && c.is_subscribed && (
                            <div className="text-[10px] text-[#5C7063] mt-1">
                              until {new Date(c.subscription_expires_at).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {c.code ? (
                            <Badge className="bg-[#10B981]/10 text-[#059669] hover:bg-[#10B981]/15 font-mono tracking-widest">
                              {c.code}
                            </Badge>
                          ) : (
                            <span className="text-[#5C7063] text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-[#5C7063]">
                          {c.code_expires_at
                            ? new Date(c.code_expires_at).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right space-x-2 whitespace-nowrap">
                          {!c.is_subscribed && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => regenCode(c.id)}
                              data-testid={`regen-${c.id}`}
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Code
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeClient(c.id)}
                            data-testid={`remove-${c.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </section>

          {/* Menu editor */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-2xl font-semibold text-[#111C15]">
                This week's menu
              </h2>
              <Button
                onClick={saveMenu}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md"
                data-testid="save-menu-btn"
              >
                <Save className="w-4 h-4 mr-2" /> Save menu
              </Button>
            </div>
            <div className="bg-white border border-[#E5EFE8] rounded-2xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5EFE8] bg-[#F3F7F4]/50">
                    <th className="text-left p-3 font-medium text-[#5C7063]">Day</th>
                    <th className="text-left p-3 font-medium text-[#5C7063]">Breakfast</th>
                    <th className="text-left p-3 font-medium text-[#5C7063]">Lunch</th>
                    <th className="text-left p-3 font-medium text-[#5C7063]">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day} className="border-b border-[#F3F7F4] last:border-0">
                      <td className="p-3 font-medium font-display text-[#111C15]">
                        {day}
                      </td>
                      {["breakfast", "lunch", "dinner"].map((meal) => (
                        <td key={meal} className="p-3">
                          <Select
                            value={menu?.days?.[day]?.[meal] || ""}
                            onValueChange={(v) => updateMenuSlot(day, meal, v)}
                          >
                            <SelectTrigger
                              className="min-w-[180px]"
                              data-testid={`menu-select-${day}-${meal}`}
                            >
                              <SelectValue placeholder="Choose…" />
                            </SelectTrigger>
                            <SelectContent>
                              {byCategory(meal).map((r) => (
                                <SelectItem key={r.slug} value={r.slug}>
                                  {r.name}
                                </SelectItem>
                              ))}
                              {byCategory(meal).length === 0 &&
                                recipes.map((r) => (
                                  <SelectItem key={r.slug} value={r.slug}>
                                    {r.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
