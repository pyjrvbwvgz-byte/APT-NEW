import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { generateMealPlanPDF } from "../lib/pdf";
import { FileDown, LogOut, CreditCard, Shuffle, Loader2 } from "lucide-react";
import ProfileIntakeModal from "../components/ProfileIntakeModal";
import ProgressLog from "../components/ProgressLog";
import DayPlan from "../components/DayPlan";
import ShoppingList from "../components/ShoppingList";
import AccessCard from "../components/AccessCard";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TABS = [
  { key: "plan", label: "Plan" },
  { key: "shopping", label: "Shopping" },
  { key: "progress", label: "Progress" },
];

export default function DashboardPage() {
  const { client, logout, setClientFromExternal } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [shopping, setShopping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [tab, setTab] = useState("plan");

  const loadAll = async () => {
    setLoading(true);
    try {
      const [m, s] = await Promise.all([
        api.get("/menu/current"),
        api.get("/menu/shopping-list"),
      ]);
      setMenu(m.data);
      setShopping(s.data);
    } catch (err) {
      toast.error("Failed to load this week's plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const { dailyTotals, weeklyTotals, dayScales, targets } = useMemo(() => {
    if (!menu)
      return {
        dailyTotals: {},
        weeklyTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
        dayScales: {},
        targets: null,
      };
    const daily = {};
    const weekly = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    const scales = menu.day_scales || {};
    DAYS.forEach((d) => {
      const scale = scales[d] || 1;
      const day = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
      ["breakfast", "lunch", "dinner", "snack"].forEach((meal) => {
        const slug = menu.days?.[d]?.[meal];
        const r = slug && menu.recipes?.[slug];
        if (r?.macros) {
          day.kcal += Math.round((r.macros.kcal || 0) * scale);
          day.protein += Math.round((r.macros.protein || 0) * scale);
          day.carbs += Math.round((r.macros.carbs || 0) * scale);
          day.fat += Math.round((r.macros.fat || 0) * scale);
        }
      });
      daily[d] = day;
      weekly.kcal += day.kcal;
      weekly.protein += day.protein;
      weekly.carbs += day.carbs;
      weekly.fat += day.fat;
    });
    return { dailyTotals: daily, weeklyTotals: weekly, dayScales: scales, targets: menu.targets };
  }, [menu]);

  const onDownloadPDF = async () => {
    if (!menu || !shopping) return;
    setDownloading(true);
    const t = toast.loading("Building your plan…");
    try {
      await new Promise((r) => setTimeout(r, 50));
      generateMealPlanPDF({ client, menu, shopping, totals: weeklyTotals, dailyTotals });
      toast.success("Plan downloaded", { id: t });
    } catch (err) {
      toast.error("Could not build the PDF", { id: t });
    } finally {
      setDownloading(false);
    }
  };

  const reshuffle = async () => {
    setLoading(true);
    try {
      await api.post("/menu/reshuffle");
      await loadAll();
      toast.success("Fresh plan generated");
    } catch {
      toast.error("Could not reshuffle");
      setLoading(false);
    }
  };

  const openPortal = async () => {
    try {
      const r = await api.post("/payments/portal", {
        return_url: window.location.origin + "/dashboard",
      });
      if (r.data?.url) window.location.href = r.data.url;
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not open portal");
    }
  };

  const needsProfile = !client?.profile_completed_at;

  return (
    <div className="min-h-screen flex flex-col theme-light">
      {needsProfile && (
        <ProfileIntakeModal
          client={client}
          onSaved={(updated) => setClientFromExternal(updated)}
        />
      )}
      <Header
        right={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="h-10 px-3 text-white/70 hover:bg-white/5 hover:text-white"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Log out</span>
          </Button>
        }
      />

      <main className="flex-1 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome */}
          <div className="pt-6 sm:pt-10">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#10B981]">
              Welcome back
            </div>
            <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#111C15] tracking-tight mt-1.5">
              Hey {client?.name?.split(" ")[0]}, your week is ready.
            </h1>
            <p className="mt-1.5 text-sm text-[#5C7063]">
              Week of{" "}
              {menu?.week_start
                ? new Date(menu.week_start).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                  })
                : "—"}{" "}
              · 28 meals
            </p>
          </div>

          {/* Access + targets */}
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <AccessCard client={client} />
            {targets && (
              <div
                className="rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white p-4 sm:p-5"
                data-testid="targets-card"
              >
                <div className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-80">
                  Your daily targets
                </div>
                <div className="font-display text-2xl sm:text-3xl font-bold mt-1.5 tracking-tight">
                  {targets.kcal.toLocaleString()} kcal
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {[
                    { l: "Protein", v: targets.protein_g },
                    { l: "Carbs", v: targets.carbs_g },
                    { l: "Fat", v: targets.fat_g },
                  ].map((m) => (
                    <div key={m.l} className="rounded-xl bg-white/15 py-2">
                      <div className="text-[10px] uppercase tracking-[0.16em] opacity-85">{m.l}</div>
                      <div className="font-display text-base font-bold tabular-nums">{m.v}g</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <Button
              onClick={onDownloadPDF}
              disabled={downloading || loading}
              className="h-12 bg-[#10B981] hover:bg-[#059669] text-white font-semibold col-span-2 sm:col-span-1"
              data-testid="download-pdf-btn"
            >
              {downloading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              {downloading ? "Building…" : "Download plan"}
            </Button>
            <Button
              variant="outline"
              onClick={reshuffle}
              disabled={loading}
              className="h-12 border-[#E5EFE8]"
              data-testid="reshuffle-btn"
            >
              <Shuffle className="w-4 h-4 mr-2" /> Reshuffle
            </Button>
            {client?.is_subscribed && (
              <Button
                variant="outline"
                onClick={openPortal}
                className="h-12 border-[#E5EFE8]"
                data-testid="manage-subscription-btn"
              >
                <CreditCard className="w-4 h-4 mr-2" /> Subscription
              </Button>
            )}
          </div>

          {/* Tabs */}
          <div className="mt-7 flex gap-2 border-b border-[#E5EFE8]" data-testid="dashboard-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                  tab === t.key ? "text-[#059669]" : "text-[#5C7063]"
                }`}
                data-testid={`tab-${t.key}`}
              >
                {t.label}
                {tab === t.key && (
                  <span className="absolute left-2 right-2 -bottom-px h-0.5 bg-[#10B981] rounded-full" />
                )}
              </button>
            ))}
          </div>

          <div className="mt-6">
            {tab === "plan" && (
              <DayPlan
                menu={menu}
                dailyTotals={dailyTotals}
                dayScales={dayScales}
                targets={targets}
                loading={loading}
              />
            )}
            {tab === "shopping" && <ShoppingList shopping={shopping} />}
            {tab === "progress" &&
              (client?.profile_completed_at ? (
                <ProgressLog
                  client={client}
                  onWeightChange={(updated) => {
                    setClientFromExternal(updated);
                    loadAll();
                  }}
                />
              ) : (
                <div className="text-sm text-[#5C7063]">
                  Complete your profile to start tracking progress.
                </div>
              ))}
          </div>

          {/* Weekly summary */}
          <div className="mt-10 rounded-2xl border border-[#E5EFE8] bg-white p-4 sm:p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C7063]">
              This week in total
            </div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { l: "Calories", v: weeklyTotals.kcal.toLocaleString(), u: "kcal" },
                { l: "Protein", v: weeklyTotals.protein.toLocaleString(), u: "g" },
                { l: "Carbs", v: weeklyTotals.carbs.toLocaleString(), u: "g" },
                { l: "Fat", v: weeklyTotals.fat.toLocaleString(), u: "g" },
              ].map((m) => (
                <div
                  key={m.l}
                  className="rounded-xl bg-[#F3F7F4]/70 p-3"
                  data-testid={`macro-${m.l.toLowerCase()}`}
                >
                  <div className="text-[10px] uppercase tracking-[0.16em] text-[#5C7063]">
                    {m.l}
                  </div>
                  <div className="font-display text-xl font-bold text-[#111C15] tabular-nums mt-0.5">
                    {m.v}
                    <span className="text-xs font-normal text-[#5C7063]"> {m.u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
