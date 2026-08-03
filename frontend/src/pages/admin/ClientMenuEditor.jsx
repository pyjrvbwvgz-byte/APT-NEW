import { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { adminApi, API } from "../../lib/api";
import { Button } from "../../components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { Save, X, Utensils } from "lucide-react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEALS = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

/**
 * Per-client menu editor. Overwrites only THIS client's week — other clients' plans are untouched.
 * Props: client { id, name, email }, onClose()
 */
export default function ClientMenuEditor({ client, onClose }) {
  const [menu, setMenu] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [m, r] = await Promise.all([
          adminApi.get(`/admin/clients/${client.id}/menu`),
          axios.get(`${API}/recipes`),
        ]);
        setMenu(m.data);
        setRecipes(r.data);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Failed to load menu");
      } finally {
        setLoading(false);
      }
    })();
  }, [client.id]);

  const setSlot = (day, meal, slug) =>
    setMenu((m) => ({
      ...m,
      days: { ...m.days, [day]: { ...m.days[day], [meal]: slug } },
    }));

  const byCategory = (cat) => recipes.filter((r) => r.category === cat);

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.put(`/admin/clients/${client.id}/menu`, { days: menu.days });
      toast.success(`Saved · ${client.name}'s plan updated (other clients unaffected)`);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
      data-testid="client-menu-editor"
    >
      <div
        className="bg-white border border-[#E5EFE8] rounded-2xl w-full max-w-5xl my-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#E5EFE8] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#10B981] font-medium">
              Per-client meals
            </div>
            <h2 className="font-display text-2xl font-bold text-[#111C15] mt-1 tracking-tight flex items-center gap-2">
              <Utensils className="w-5 h-5 text-[#10B981]" />
              {client.name}
            </h2>
            <div className="text-xs text-[#5C7063] mt-1">
              Changes only affect this client · this week ({menu?.week_start || "…"})
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-[#5C7063]">Loading…</div>
          ) : (
            <div className="border border-[#E5EFE8] rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5EFE8] bg-[#F3F7F4]/60">
                    <th className="text-left p-3 font-medium text-[#5C7063]">Day</th>
                    {MEALS.map((m) => (
                      <th key={m} className="text-left p-3 font-medium text-[#5C7063]">
                        {MEAL_LABELS[m]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map((day) => (
                    <tr key={day} className="border-b border-[#F3F7F4] last:border-0">
                      <td className="p-3 font-medium font-display text-[#111C15]">{day}</td>
                      {MEALS.map((meal) => (
                        <td key={meal} className="p-2">
                          <Select
                            value={menu?.days?.[day]?.[meal] || ""}
                            onValueChange={(v) => setSlot(day, meal, v)}
                          >
                            <SelectTrigger
                              className="min-w-[180px]"
                              data-testid={`cme-select-${day}-${meal}`}
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
          )}
        </div>

        <div className="p-5 border-t border-[#E5EFE8] flex items-center justify-between bg-[#F3F7F4]/40">
          <div className="text-xs text-[#5C7063]">
            <strong className="text-[#111C15]">Save</strong> pushes only to this client — other clients keep their existing meals.
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button
              onClick={save}
              disabled={saving || loading}
              className="bg-[#10B981] hover:bg-[#059669] text-white"
              data-testid="save-client-menu-btn"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving…" : "Save this client's meals"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
