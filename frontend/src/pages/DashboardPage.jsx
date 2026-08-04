import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { generateMealPlanPDF } from "../lib/pdf";
import { FileDown, LogOut, Clock, ChefHat, ShoppingBasket, Flame, Beef, Wheat, Droplet, CreditCard, Shuffle } from "lucide-react";
import ProfileIntakeModal from "../components/ProfileIntakeModal";
import ProgressLog from "../components/ProgressLog";

const DAY_LABELS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

function daysUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default function DashboardPage() {
  const { client, logout, setClientFromExternal } = useAuth();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(null);
  const [shopping, setShopping] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  const onDownloadPDF = async () => {
    if (!menu || !shopping) return;
    setDownloading(true);
    try {
      generateMealPlanPDF({ client, menu, shopping, totals: weeklyTotals, dailyTotals });
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("PDF generation failed");
    } finally {
      setDownloading(false);
    }
  };

  // Compute daily and weekly macros (respecting per-day scale from targets)
  const { dailyTotals, weeklyTotals, dayScales, targets } = useMemo(() => {
    if (!menu) return { dailyTotals: {}, weeklyTotals: { kcal: 0, protein: 0, carbs: 0, fat: 0 }, dayScales: {}, targets: null };
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

  const needsProfile = !client?.profile_completed_at;

  return (
    <div className="min-h-screen flex flex-col">
      {needsProfile && (
        <ProfileIntakeModal
          client={client}
          onSaved={(updated) => setClientFromExternal(updated)}
        />
      )}
      <Header
        right={
          <>
            {client?.is_subscribed ? (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex border-[#10B981] text-[#10B981]"
                data-testid="header-status-badge"
              >
                <Clock className="w-3.5 h-3.5 mr-1" />
                Subscriber · until {client?.subscription_expires_at ? new Date(client.subscription_expires_at).toLocaleDateString() : "—"}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="hidden sm:inline-flex border-[#E5EFE8] text-[#5C7063]"
                data-testid="header-status-badge"
              >
                <Clock className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
                Code: {client?.code} · {daysUntil(client?.code_expires_at)}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
              }}
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4 mr-1" /> Log out
            </Button>
          </>
        }
      />

      <main className="flex-1 py-10 lg:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* welcome strip */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
            <div>
              <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
                Welcome back
              </div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#111C15] tracking-tight mt-2">
                Hey {client?.name?.split(" ")[0]}, your week is ready.
              </h1>
              <p className="mt-2 text-[#5C7063]">
                Week of{" "}
                {menu?.week_start
                  ? new Date(menu.week_start).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
                · Mon–Sun · 28 meals
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true);
                  try {
                    await api.post("/menu/reshuffle");
                    await loadAll();
                    toast.success("Fresh plan generated");
                  } catch {
                    toast.error("Could not reshuffle");
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="border-[#E5EFE8] hover:bg-[#F3F7F4]"
                data-testid="reshuffle-btn"
              >
                <Shuffle className="w-4 h-4 mr-2" /> Reshuffle my plan
              </Button>
              {client?.is_subscribed && (
                <Button
                  variant="outline"
                  onClick={async () => {
                    try {
                      const r = await api.post("/payments/portal", {
                        return_url: window.location.origin + "/dashboard",
                      });
                      if (r.data?.url) window.location.href = r.data.url;
                    } catch (err) {
                      toast.error(err?.response?.data?.detail || "Could not open portal");
                    }
                  }}
                  className="border-[#E5EFE8] hover:bg-[#F3F7F4]"
                  data-testid="manage-subscription-btn"
                >
                  <CreditCard className="w-4 h-4 mr-2" /> Manage subscription
                </Button>
              )}
              <Button
                onClick={onDownloadPDF}
                disabled={downloading || loading}
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md font-semibold"
                data-testid="download-pdf-btn"
              >
                <FileDown className="w-4 h-4 mr-2" />
                {downloading ? "Building…" : "Download PDF"}
              </Button>
            </div>
          </div>

          {/* DAILY TARGETS */}
          {targets && (
            <section className="mb-6">
              <div className="rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] text-white p-5 lg:p-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] opacity-80">
                    Your daily targets
                  </div>
                  <div className="font-display text-2xl lg:text-3xl font-bold mt-1 tracking-tight">
                    {targets.kcal.toLocaleString()} kcal / day
                  </div>
                  <div className="text-sm opacity-90 mt-1">
                    {targets.protein_g}g protein · {targets.carbs_g}g carbs · {targets.fat_g}g fat
                    <span className="opacity-70"> · TDEE {targets.tdee}</span>
                  </div>
                </div>
                <div className="text-xs opacity-90 max-w-sm">
                  Your weekly meals are scaled to hit this target. Check each day's
                  <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded mx-1">×n</span>
                  badge to see the portion multiplier.
                </div>
              </div>
            </section>
          )}

          {/* WEEKLY MACROS */}
          <section className="mb-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MacroCard
                label="Weekly calories"
                value={weeklyTotals.kcal.toLocaleString()}
                unit="kcal"
                Icon={Flame}
                color="#10B981"
                testid="macro-kcal"
              />
              <MacroCard
                label="Protein"
                value={weeklyTotals.protein.toLocaleString()}
                unit="g"
                Icon={Beef}
                color="#E07A5F"
                testid="macro-protein"
              />
              <MacroCard
                label="Carbs"
                value={weeklyTotals.carbs.toLocaleString()}
                unit="g"
                Icon={Wheat}
                color="#D4A24C"
                testid="macro-carbs"
              />
              <MacroCard
                label="Fat"
                value={weeklyTotals.fat.toLocaleString()}
                unit="g"
                Icon={Droplet}
                color="#5C7063"
                testid="macro-fat"
              />
            </div>
            <p className="mt-3 text-xs text-[#5C7063]">
              Totals across all 28 meals · approx. {Math.round(weeklyTotals.kcal / 7).toLocaleString()} kcal / day
            </p>
          </section>

          {/* WEEK GRID */}
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <ChefHat className="w-5 h-5 text-[#10B981]" />
              <h2 className="font-display text-2xl font-semibold text-[#111C15]">
                This week's menu
              </h2>
            </div>

            {loading ? (
              <div className="text-[#5C7063]">Loading menu…</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                {DAYS.map((day, di) => (
                  <div
                    key={day}
                    className="bg-white border border-[#E5EFE8] rounded-2xl overflow-hidden flex flex-col"
                    data-testid={`day-card-${day}`}
                  >
                    <div className="px-4 py-3 border-b border-[#E5EFE8] bg-[#F3F7F4]/60 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#5C7063]">
                          Day {di + 1}
                          {dayScales[day] && dayScales[day] !== 1 && (
                            <span
                              className="ml-2 font-mono text-[#059669] bg-[#10B981]/10 px-1.5 py-0.5 rounded"
                              data-testid={`day-scale-${day}`}
                            >
                              ×{dayScales[day]}
                            </span>
                          )}
                        </div>
                        <div className="font-display font-semibold text-[#111C15]">
                          {DAY_LABELS[day]}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">
                          kcal
                        </div>
                        <div className="font-display font-bold text-[#10B981] tabular-nums">
                          {dailyTotals[day]?.kcal?.toLocaleString() || "—"}
                          {targets && (
                            <span className="text-[10px] text-[#5C7063] font-normal ml-1">
                              /{targets.kcal.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      {["breakfast", "lunch", "dinner", "snack"].map((meal) => {
                        const slug = menu?.days?.[day]?.[meal];
                        const recipe = slug && menu?.recipes?.[slug];
                        if (!recipe) return null;
                        return (
                          <Link
                            key={meal}
                            to={`/recipe/${slug}`}
                            className="group block rounded-lg overflow-hidden border border-[#E5EFE8] hover:border-[#10B981] transition-colors"
                            data-testid={`meal-link-${day}-${meal}`}
                          >
                            <div className="aspect-[16/10] overflow-hidden bg-[#F3F7F4]">
                              <img
                                src={recipe.image_url}
                                alt={recipe.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="p-3">
                              <div className="text-[10px] uppercase tracking-[0.18em] text-[#10B981] font-medium">
                                {MEAL_LABELS[meal]}
                              </div>
                              <div className="font-medium text-[#111C15] leading-tight mt-1">
                                {recipe.name}
                              </div>
                              <div className="text-xs text-[#5C7063] mt-1">
                                {recipe.prep_time} min
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* PROGRESS LOG */}
          {client?.profile_completed_at && (
            <ProgressLog
              client={client}
              onWeightChange={(updated) => {
                setClientFromExternal(updated);
                loadAll();
              }}
            />
          )}

          {/* SHOPPING LIST */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <ShoppingBasket className="w-5 h-5 text-[#10B981]" />
              <h2 className="font-display text-2xl font-semibold text-[#111C15]">
                Auto shopping list
              </h2>
            </div>
            <div className="bg-white border border-[#E5EFE8] rounded-2xl p-6 lg:p-8">
              {!shopping ? (
                <div className="text-[#5C7063]">Loading…</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-2">
                  {shopping.items.map((it, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-3 py-2 border-b border-[#F3F7F4] last:border-0 cursor-pointer group"
                      data-testid={`shopping-item-${i}`}
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-[#10B981] rounded"
                      />
                      <span className="flex-1 text-[#111C15] group-has-[:checked]:line-through group-has-[:checked]:text-[#5C7063]">
                        {it.name}
                      </span>
                      <span className="text-sm text-[#5C7063] tabular-nums">
                        {it.quantity % 1 === 0 ? it.quantity : it.quantity.toFixed(1)}{" "}
                        {it.unit}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MacroCard({ label, value, unit, Icon, color, testid }) {
  return (
    <div
      className="bg-white border border-[#E5EFE8] rounded-2xl p-5 flex items-start gap-4"
      data-testid={testid}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-none"
        style={{ backgroundColor: `${color}1A`, color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">
          {label}
        </div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-2xl lg:text-3xl font-bold text-[#111C15] tabular-nums">
            {value}
          </span>
          <span className="text-sm text-[#5C7063]">{unit}</span>
        </div>
      </div>
    </div>
  );
}
