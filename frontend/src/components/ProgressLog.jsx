import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from "recharts";
import { LineChart as LineIcon, TrendingDown, TrendingUp, Minus, Plus, Trash2 } from "lucide-react";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Progress log — client weekly weigh-in tracker.
 * Logging a new entry updates their profile weight so the plan auto-recalibrates.
 * onWeightChange is called with the new client after a save so parent can refresh targets.
 */
export default function ProgressLog({ client, onWeightChange }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weight, setWeight] = useState(client?.profile?.weight_kg || "");
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/client/weigh-ins");
      setEntries(r.data.entries || []);
    } catch {
      toast.error("Failed to load progress");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    if (entries.length === 0) return null;
    const first = entries[0];
    const latest = entries[entries.length - 1];
    const start = first.weight_kg;
    const now = latest.weight_kg;
    const delta = now - start;
    const goal = client?.profile?.goal;
    // On track: lose→delta<0, gain→delta>0, maintain→|delta|<2
    let onTrack = false;
    if (goal === "lose") onTrack = delta < 0;
    else if (goal === "gain") onTrack = delta > 0;
    else onTrack = Math.abs(delta) < 2;
    return { start, now, delta, onTrack, count: entries.length };
  }, [entries, client]);

  const chartData = useMemo(
    () => entries.map((e) => ({ date: e.date, weight: e.weight_kg, label: fmtDate(e.date) })),
    [entries]
  );

  const submit = async (e) => {
    e.preventDefault();
    const w = Number(weight);
    if (!w || w < 30 || w > 300) {
      toast.error("Enter a weight between 30 and 300 kg");
      return;
    }
    setSaving(true);
    try {
      await api.post("/client/weigh-ins", { weight_kg: w, date, note });
      toast.success("Logged");
      setShowForm(false);
      setNote("");
      await load();
      // Refresh client so targets on dashboard rescale
      const me = await api.get("/auth/me");
      onWeightChange?.(me.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      await api.delete(`/client/weigh-ins/${id}`);
      toast.success("Deleted");
      await load();
    } catch {
      toast.error("Delete failed");
    }
  };

  const goalWeight = null; // free-form; no target weight field

  return (
    <section className="mb-16" data-testid="progress-log">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <LineIcon className="w-5 h-5 text-[#10B981]" />
          <h2 className="font-display text-2xl font-semibold text-[#111C15]">
            Progress log
          </h2>
        </div>
        <Button
          onClick={() => { setShowForm((s) => !s); setWeight(client?.profile?.weight_kg || ""); setDate(todayISO()); }}
          className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md"
          data-testid="log-weight-btn"
        >
          <Plus className="w-4 h-4 mr-1.5" /> Log weight
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="bg-white border border-[#E5EFE8] rounded-2xl p-5 mb-6 grid md:grid-cols-4 gap-4 items-end"
          data-testid="weigh-in-form"
        >
          <div>
            <Label htmlFor="wl-date">Date</Label>
            <Input
              id="wl-date"
              type="date"
              value={date}
              max={todayISO()}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5"
              data-testid="weigh-in-date"
            />
          </div>
          <div>
            <Label htmlFor="wl-weight">Weight (kg)</Label>
            <Input
              id="wl-weight"
              type="number"
              step="0.1"
              min={30}
              max={300}
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="mt-1.5"
              data-testid="weigh-in-weight"
              autoFocus
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="wl-note">Note (optional)</Label>
            <Input
              id="wl-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. after 3 gym sessions"
              className="mt-1.5"
              data-testid="weigh-in-note"
            />
          </div>
          <div className="md:col-span-4 flex gap-3 justify-end">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#10B981] hover:bg-[#059669] text-white"
              data-testid="save-weigh-in-btn"
            >
              {saving ? "Saving…" : "Save entry"}
            </Button>
          </div>
        </form>
      )}

      <div className="bg-white border border-[#E5EFE8] rounded-2xl p-6 lg:p-8">
        {loading ? (
          <div className="text-[#5C7063]">Loading…</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-[#5C7063] text-sm">
              No entries yet. Log your first weigh-in to start tracking.
            </div>
          </div>
        ) : (
          <>
            {/* Summary strip */}
            {stats && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Stat label="Start" value={`${stats.start} kg`} sub={fmtDate(entries[0].date)} testid="stat-start" />
                <Stat label="Current" value={`${stats.now} kg`} sub={fmtDate(entries[entries.length - 1].date)} testid="stat-current" />
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">Change</div>
                  <div
                    className={`font-display text-2xl font-bold mt-1 tabular-nums flex items-center gap-1.5 ${
                      stats.delta < 0 ? "text-[#059669]" : stats.delta > 0 ? "text-[#D4A24C]" : "text-[#111C15]"
                    }`}
                    data-testid="stat-delta"
                  >
                    {stats.delta < 0 ? <TrendingDown className="w-5 h-5" /> :
                      stats.delta > 0 ? <TrendingUp className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                    {stats.delta > 0 ? "+" : ""}{stats.delta.toFixed(1)} kg
                  </div>
                  <div className="text-xs text-[#5C7063] mt-0.5">{stats.count} entries</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">Vs goal</div>
                  <div className="mt-1">
                    <Badge
                      className={stats.onTrack
                        ? "bg-[#10B981] text-white hover:bg-[#059669]"
                        : "bg-[#F3F7F4] text-[#5C7063] hover:bg-[#F3F7F4]"}
                      data-testid="stat-on-track"
                    >
                      {stats.onTrack ? "On track" : "Off track"}
                    </Badge>
                  </div>
                  <div className="text-xs text-[#5C7063] mt-1 capitalize">
                    Goal: {client?.profile?.goal || "—"}
                  </div>
                </div>
              </div>
            )}

            {/* Chart */}
            {chartData.length >= 2 && (
              <div className="h-56 -mx-2" data-testid="progress-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EFE8" />
                    <XAxis dataKey="label" fontSize={11} stroke="#5C7063" />
                    <YAxis
                      domain={["auto", "auto"]}
                      fontSize={11}
                      stroke="#5C7063"
                      unit=" kg"
                      width={60}
                    />
                    <Tooltip
                      formatter={(v) => [`${v} kg`, "Weight"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #E5EFE8", fontSize: 12 }}
                    />
                    {goalWeight && <ReferenceLine y={goalWeight} stroke="#10B981" strokeDasharray="4 4" />}
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#10B981"
                      strokeWidth={2.5}
                      dot={{ fill: "#10B981", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Recent entries */}
            <div className="mt-6 border-t border-[#F3F7F4] pt-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063] mb-3">
                Recent entries
              </div>
              <div className="space-y-1 max-h-56 overflow-y-auto">
                {[...entries].reverse().slice(0, 10).map((e) => (
                  <div
                    key={e.id}
                    className="flex items-center justify-between py-2 border-b border-[#F3F7F4] last:border-0"
                    data-testid={`weigh-in-row-${e.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="font-mono text-xs text-[#5C7063] w-20">{fmtDate(e.date)}</div>
                      <div className="font-medium text-[#111C15] tabular-nums">{e.weight_kg} kg</div>
                      {e.note && <div className="text-xs text-[#5C7063] italic">{e.note}</div>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(e.id)}
                      data-testid={`delete-weigh-in-${e.id}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value, sub, testid }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">{label}</div>
      <div className="font-display text-2xl font-bold text-[#111C15] mt-1 tabular-nums" data-testid={testid}>
        {value}
      </div>
      {sub && <div className="text-xs text-[#5C7063] mt-0.5">{sub}</div>}
    </div>
  );
}
