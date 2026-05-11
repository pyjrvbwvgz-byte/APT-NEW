import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { api } from "../lib/api";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { generateMealPlanPDF } from "../lib/pdf";
import { FileDown, RefreshCw, LogOut, Clock, ChefHat, ShoppingBasket } from "lucide-react";

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
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner" };

function daysUntil(iso) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return `${days} day${days === 1 ? "" : "s"}`;
}

export default function DashboardPage() {
  const { client, logout, refreshCode } = useAuth();
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

  const onRefreshCode = async () => {
    try {
      const r = await refreshCode();
      toast.success(`New code: ${r.code}`);
    } catch (err) {
      toast.error("Could not refresh code");
    }
  };

  const onDownloadPDF = async () => {
    if (!menu || !shopping) return;
    setDownloading(true);
    try {
      generateMealPlanPDF({ client, menu, shopping });
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("PDF generation failed");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFDFB]">
      <Header
        right={
          <>
            <Badge
              variant="outline"
              className="hidden sm:inline-flex border-[#E5EFE8] text-[#5C7063]"
              data-testid="header-code-badge"
            >
              <Clock className="w-3.5 h-3.5 mr-1 text-[#10B981]" />
              Code: {client?.code} · {daysUntil(client?.code_expires_at)}
            </Badge>
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
                · Mon–Sun · 21 meals
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={onRefreshCode}
                className="border-[#E5EFE8] hover:bg-[#F3F7F4]"
                data-testid="refresh-code-btn"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Refresh code
              </Button>
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
                    <div className="px-4 py-3 border-b border-[#E5EFE8] bg-[#F3F7F4]/60">
                      <div className="text-[10px] uppercase tracking-[0.2em] text-[#5C7063]">
                        Day {di + 1}
                      </div>
                      <div className="font-display font-semibold text-[#111C15]">
                        {DAY_LABELS[day]}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col gap-3">
                      {["breakfast", "lunch", "dinner"].map((meal) => {
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
