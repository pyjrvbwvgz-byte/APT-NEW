import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { adminApi } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { X, User, Flame, Beef, Wheat, Droplet, TrendingDown, TrendingUp, Minus, Activity, Target } from "lucide-react";

const GOAL_LABEL = { lose: "Lose fat", maintain: "Maintain", gain: "Gain muscle" };
const ACTIVITY_LABEL = {
  sedentary: "Sedentary",
  light: "Light",
  moderate: "Moderate",
  active: "Active",
  very_active: "Very active",
};

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/**
 * Admin — read-only view of a client's profile + weigh-in history.
 * Props: client { id, name, email }, onClose()
 */
export default function ClientProfileView({ client, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await adminApi.get(`/admin/clients/${client.id}/profile`);
        setData(r.data);
      } catch (err) {
        toast.error(err?.response?.data?.detail || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, [client.id]);

  const chartData = useMemo(
    () => (data?.weigh_ins || []).map((e) => ({ date: e.date, weight: e.weight_kg, label: fmtDate(e.date) })),
    [data]
  );

  const trend = useMemo(() => {
    if (!data?.weigh_ins || data.weigh_ins.length === 0) return null;
    const entries = data.weigh_ins;
    const start = entries[0].weight_kg;
    const now = entries[entries.length - 1].weight_kg;
    const delta = now - start;
    const goal = data.profile?.goal;
    let onTrack = false;
    if (goal === "lose") onTrack = delta < 0;
    else if (goal === "gain") onTrack = delta > 0;
    else onTrack = Math.abs(delta) < 2;
    return { start, now, delta, onTrack, count: entries.length };
  }, [data]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
      data-testid="client-profile-view"
    >
      <div
        className="bg-white border border-[#E5EFE8] rounded-2xl w-full max-w-4xl my-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#E5EFE8] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#10B981] font-medium">
              Client profile
            </div>
            <h2 className="font-display text-2xl font-bold text-[#111C15] mt-1 tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-[#10B981]" />
              {client.name}
            </h2>
            <div className="text-xs text-[#5C7063] mt-1">{client.email}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-[#5C7063]">Loading…</div>
          ) : !data?.profile ? (
            <div className="text-center py-10">
              <div className="text-[#5C7063] text-sm">
                This client hasn't completed their intake form yet.
              </div>
              <div className="text-xs text-[#5C7063] mt-2">
                They'll be prompted the next time they log in.
              </div>
            </div>
          ) : (
            <>
              {/* Body stats */}
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063] mb-3">Body stats</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Stat label="Sex" value={data.profile.sex} capitalize />
                  <Stat label="Age" value={data.profile.age} />
                  <Stat label="Height" value={`${data.profile.height_cm} cm`} />
                  <Stat label="Weight" value={`${data.profile.weight_kg} kg`} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="rounded-xl border border-[#E5EFE8] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063] flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Activity
                    </div>
                    <div className="font-medium text-[#111C15] mt-1">
                      {ACTIVITY_LABEL[data.profile.activity_level] || data.profile.activity_level}
                    </div>
                  </div>
                  <div className="rounded-xl border border-[#E5EFE8] p-4">
                    <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063] flex items-center gap-1">
                      <Target className="w-3 h-3" /> Goal
                    </div>
                    <div className="font-medium text-[#111C15] mt-1">
                      {GOAL_LABEL[data.profile.goal] || data.profile.goal}
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily targets */}
              {data.targets && (
                <div>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063] mb-3">
                    Daily targets
                  </div>
                  <div className="rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white p-5">
                    <div className="font-display text-3xl font-bold tracking-tight">
                      {data.targets.kcal.toLocaleString()} kcal
                    </div>
                    <div className="text-sm opacity-90 mt-1">
                      BMR {data.targets.bmr} · TDEE {data.targets.tdee}
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-3">
                      <MacroBlock icon={Beef} label="Protein" value={`${data.targets.protein_g}g`} />
                      <MacroBlock icon={Wheat} label="Carbs" value={`${data.targets.carbs_g}g`} />
                      <MacroBlock icon={Droplet} label="Fat" value={`${data.targets.fat_g}g`} />
                    </div>
                  </div>
                </div>
              )}

              {/* Progress */}
              <div>
                <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063] mb-3">
                  Progress log ({data.weigh_ins.length} entries)
                </div>
                {data.weigh_ins.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#E5EFE8] p-6 text-center text-sm text-[#5C7063]">
                    No weigh-ins logged yet.
                  </div>
                ) : (
                  <>
                    {trend && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <Stat label="Start" value={`${trend.start} kg`} sub={fmtDate(data.weigh_ins[0].date)} />
                        <Stat label="Current" value={`${trend.now} kg`} sub={fmtDate(data.weigh_ins[data.weigh_ins.length - 1].date)} />
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">Change</div>
                          <div
                            className={`font-display text-2xl font-bold mt-1 tabular-nums flex items-center gap-1.5 ${
                              trend.delta < 0 ? "text-[#059669]" : trend.delta > 0 ? "text-[#D4A24C]" : "text-[#111C15]"
                            }`}
                          >
                            {trend.delta < 0 ? <TrendingDown className="w-5 h-5" /> :
                              trend.delta > 0 ? <TrendingUp className="w-5 h-5" /> : <Minus className="w-5 h-5" />}
                            {trend.delta > 0 ? "+" : ""}{trend.delta.toFixed(1)} kg
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">Vs goal</div>
                          <div className="mt-1">
                            <Badge className={trend.onTrack
                              ? "bg-[#10B981] text-white hover:bg-[#059669]"
                              : "bg-[#F3F7F4] text-[#5C7063] hover:bg-[#F3F7F4]"}>
                              {trend.onTrack ? "On track" : "Off track"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}

                    {chartData.length >= 2 && (
                      <div className="h-48 -mx-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5EFE8" />
                            <XAxis dataKey="label" fontSize={11} stroke="#5C7063" />
                            <YAxis domain={["auto", "auto"]} fontSize={11} stroke="#5C7063" unit=" kg" width={60} />
                            <Tooltip
                              formatter={(v) => [`${v} kg`, "Weight"]}
                              contentStyle={{ borderRadius: 8, border: "1px solid #E5EFE8", fontSize: 12 }}
                            />
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

                    <div className="mt-4 border-t border-[#F3F7F4] pt-3 max-h-48 overflow-y-auto">
                      {[...data.weigh_ins].reverse().map((e) => (
                        <div key={e.id} className="flex items-center gap-4 py-1.5 border-b border-[#F3F7F4] last:border-0 text-sm">
                          <div className="font-mono text-xs text-[#5C7063] w-20">{fmtDate(e.date)}</div>
                          <div className="font-medium text-[#111C15] tabular-nums w-24">{e.weight_kg} kg</div>
                          {e.note && <div className="text-xs text-[#5C7063] italic">{e.note}</div>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className="p-5 border-t border-[#E5EFE8] flex justify-end bg-[#F3F7F4]/40">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, sub, capitalize }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">{label}</div>
      <div className={`font-display text-2xl font-bold text-[#111C15] mt-1 tabular-nums ${capitalize ? "capitalize" : ""}`}>
        {value}
      </div>
      {sub && <div className="text-xs text-[#5C7063] mt-0.5">{sub}</div>}
    </div>
  );
}

function MacroBlock({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-[0.18em] opacity-80">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-display text-xl font-bold tabular-nums mt-0.5">{value}</div>
    </div>
  );
}
