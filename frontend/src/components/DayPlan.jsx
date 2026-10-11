import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { imgUrl, imgSrcSet } from "../lib/img";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const MEALS = ["breakfast", "lunch", "dinner", "snack"];
const MEAL_LABELS = { breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack" };

function todayKey() {
  const d = new Date().getDay(); // 0 = Sunday
  return DAYS[(d + 6) % 7] || "Mon";
}

/** One day at a time: sticky Mon–Sun selector, swipeable, defaults to today. */
export default function DayPlan({ menu, dailyTotals, dayScales, targets, loading }) {
  const [day, setDay] = useState(todayKey());
  const stripRef = useRef(null);
  const touchX = useRef(null);

  useEffect(() => {
    const el = stripRef.current?.querySelector(`[data-day="${day}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [day]);

  const move = (dir) => {
    const i = DAYS.indexOf(day);
    const next = DAYS[Math.min(DAYS.length - 1, Math.max(0, i + dir))];
    setDay(next);
  };

  const onTouchStart = (e) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 60) move(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  const totals = dailyTotals?.[day] || { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  const scale = dayScales?.[day] || 1;
  const pct = targets?.kcal ? Math.min(100, Math.round((totals.kcal / targets.kcal) * 100)) : null;

  return (
    <section data-testid="day-plan">
      {/* Sticky day selector */}
      <div
        className="sticky top-[60px] md:top-[68px] z-30 -mx-4 px-4 py-3 bg-[#FAFBF9]/95 backdrop-blur border-b border-[#E5EFE8]"
        data-testid="day-selector"
      >
        <div ref={stripRef} className="flex gap-2 overflow-x-auto no-scrollbar">
          {DAYS.map((d) => {
            const active = d === day;
            return (
              <button
                key={d}
                data-day={d}
                onClick={() => setDay(d)}
                className={`flex-none min-w-[58px] rounded-xl px-3 py-2.5 text-center border transition-colors ${
                  active
                    ? "bg-[#10B981] border-[#10B981] text-white"
                    : "bg-white border-[#E5EFE8] text-[#5C7063] active:bg-[#F3F7F4]"
                }`}
                data-testid={`day-tab-${d}`}
              >
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em]">{d}</div>
                <div
                  className={`text-[11px] tabular-nums mt-0.5 ${
                    active ? "text-white/80" : "text-[#9AAAA0]"
                  }`}
                >
                  {dailyTotals?.[d]?.kcal ? `${Math.round(dailyTotals[d].kcal / 100) / 10}k` : "—"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day header */}
      <div className="mt-5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#10B981]">
            {day === todayKey() ? "Today" : "Day plan"}
            {scale !== 1 && (
              <span
                className="ml-2 font-mono text-[#059669] bg-[#10B981]/10 px-1.5 py-0.5 rounded"
                data-testid={`day-scale-${day}`}
              >
                ×{scale}
              </span>
            )}
          </div>
          <h2
            className="font-display text-2xl sm:text-3xl font-bold text-[#111C15] tracking-tight mt-1"
            data-testid="day-plan-title"
          >
            {DAY_LABELS[day]}
          </h2>
        </div>
        <div className="flex gap-2 flex-none">
          <button
            onClick={() => move(-1)}
            disabled={day === DAYS[0]}
            className="w-11 h-11 grid place-items-center rounded-xl border border-[#E5EFE8] bg-white text-[#5C7063] disabled:opacity-40"
            aria-label="Previous day"
            data-testid="prev-day-btn"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => move(1)}
            disabled={day === DAYS[6]}
            className="w-11 h-11 grid place-items-center rounded-xl border border-[#E5EFE8] bg-white text-[#5C7063] disabled:opacity-40"
            aria-label="Next day"
            data-testid="next-day-btn"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Day totals */}
      <div className="mt-4 bg-white border border-[#E5EFE8] rounded-2xl p-4" data-testid="day-totals">
        <div className="flex items-baseline justify-between">
          <div className="font-display text-2xl font-bold text-[#111C15]">
            {totals.kcal.toLocaleString()}
            {targets?.kcal && (
              <span className="text-sm font-normal text-[#5C7063]">
                {" "}
                / {targets.kcal.toLocaleString()} kcal
              </span>
            )}
          </div>
          {pct !== null && (
            <div className="text-xs font-semibold text-[#059669] tabular-nums">{pct}%</div>
          )}
        </div>
        {pct !== null && (
          <div className="mt-2 h-1.5 rounded-full bg-[#F3F7F4] overflow-hidden">
            <div className="h-full bg-[#10B981]" style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { k: "protein", label: "Protein", target: targets?.protein_g },
            { k: "carbs", label: "Carbs", target: targets?.carbs_g },
            { k: "fat", label: "Fat", target: targets?.fat_g },
          ].map((m) => (
            <div key={m.k} className="rounded-xl bg-[#F3F7F4]/70 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.16em] text-[#5C7063]">{m.label}</div>
              <div className="font-display text-base font-bold text-[#111C15] tabular-nums mt-0.5">
                {totals[m.k]}
                <span className="text-[11px] font-normal text-[#5C7063]">
                  {m.target ? `/${m.target}` : ""}g
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Meals */}
      {loading ? (
        <div className="mt-5 text-[#5C7063]">Loading menu…</div>
      ) : (
        <div
          className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          data-testid={`day-card-${day}`}
        >
          {MEALS.map((meal) => {
            const slug = menu?.days?.[day]?.[meal];
            const recipe = slug && menu?.recipes?.[slug];
            if (!recipe) return null;
            const m = recipe.macros || {};
            return (
              <Link
                key={meal}
                to={`/recipe/${slug}`}
                className="block rounded-2xl overflow-hidden border border-[#E5EFE8] bg-white active:border-[#10B981]"
                data-testid={`meal-link-${day}-${meal}`}
              >
                <div className="aspect-[16/9] sm:aspect-[4/3] overflow-hidden bg-[#F3F7F4]">
                  <img
                    src={imgUrl(recipe.image_url, 700)}
                    srcSet={imgSrcSet(recipe.image_url, [420, 700, 1000])}
                    sizes="(max-width: 640px) 100vw, 25vw"
                    alt={recipe.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#10B981]">
                      {MEAL_LABELS[meal]}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-[#5C7063]">
                      <Clock className="w-3.5 h-3.5" /> {recipe.prep_time} min
                    </span>
                  </div>
                  <div className="font-display text-lg font-semibold text-[#111C15] leading-snug mt-1.5">
                    {recipe.name}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#5C7063] tabular-nums">
                    <span className="font-semibold text-[#059669]">
                      {Math.round((m.kcal || 0) * scale)} kcal
                    </span>
                    <span>P {Math.round((m.protein || 0) * scale)}g</span>
                    <span>C {Math.round((m.carbs || 0) * scale)}g</span>
                    <span>F {Math.round((m.fat || 0) * scale)}g</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
