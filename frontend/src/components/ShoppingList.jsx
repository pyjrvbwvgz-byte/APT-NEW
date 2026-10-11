import { useEffect, useMemo, useState } from "react";
import { ShoppingBasket, Check, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { groupByAisle } from "../lib/aisles";

const keyFor = (weekStart) => `apt_shopping_${weekStart || "current"}`;

/** Grouped, tickable shopping list. Ticks persist per week so it survives a reload mid-shop. */
export default function ShoppingList({ shopping }) {
  const weekStart = shopping?.week_start;
  const [ticked, setTicked] = useState({});

  useEffect(() => {
    if (!weekStart) return;
    try {
      setTicked(JSON.parse(localStorage.getItem(keyFor(weekStart)) || "{}"));
    } catch {
      setTicked({});
    }
  }, [weekStart]);

  const persist = (next) => {
    setTicked(next);
    if (weekStart) localStorage.setItem(keyFor(weekStart), JSON.stringify(next));
  };

  const toggle = (name) => persist({ ...ticked, [name]: !ticked[name] });
  const reset = () => persist({});

  const groups = useMemo(() => groupByAisle(shopping?.items || []), [shopping]);
  const total = shopping?.items?.length || 0;
  const done = (shopping?.items || []).filter((i) => ticked[i.name]).length;

  if (!shopping) return <div className="text-[#5C7063]">Loading…</div>;

  return (
    <section data-testid="shopping-list">
      <div className="sticky top-[60px] md:top-[68px] z-20 -mx-4 px-4 py-3 bg-[#FAFBF9]/95 backdrop-blur border-b border-[#E5EFE8] sm:mx-0 sm:px-0 sm:border-0 sm:bg-transparent sm:backdrop-blur-none sm:static">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShoppingBasket className="w-5 h-5 text-[#10B981] flex-none" />
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#111C15] truncate">
              Shopping list
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-none">
            <span
              className="text-xs font-semibold tabular-nums text-[#059669] bg-[#10B981]/10 rounded-full px-3 py-1.5"
              data-testid="shopping-progress"
            >
              {done}/{total}
            </span>
            {done > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={reset}
                className="h-9 px-2 text-[#5C7063]"
                data-testid="shopping-reset-btn"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4">
        {groups.map((g) => (
          <div
            key={g.key}
            className="bg-white border border-[#E5EFE8] rounded-2xl overflow-hidden"
            data-testid={`shopping-group-${g.key}`}
          >
            <div className="px-4 py-2.5 bg-[#F3F7F4]/70 border-b border-[#E5EFE8] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C7063]">
              {g.label}
            </div>
            <ul>
              {g.items.map((it) => {
                const on = !!ticked[it.name];
                return (
                  <li key={it.index} className="border-b border-[#F3F7F4] last:border-0">
                    <button
                      type="button"
                      onClick={() => toggle(it.name)}
                      className="w-full flex items-center gap-3 px-4 py-4 text-left active:bg-[#F3F7F4]"
                      data-testid={`shopping-item-${it.index}`}
                      aria-pressed={on}
                    >
                      <span
                        className={`w-6 h-6 rounded-md border flex-none grid place-items-center transition-colors ${
                          on ? "bg-[#10B981] border-[#10B981] text-white" : "border-[#D7E3DA]"
                        }`}
                      >
                        {on && <Check className="w-4 h-4" />}
                      </span>
                      <span
                        className={`flex-1 text-base ${
                          on ? "line-through text-[#9AAAA0]" : "text-[#111C15]"
                        }`}
                      >
                        {it.name}
                      </span>
                      <span className="text-sm text-[#5C7063] tabular-nums flex-none">
                        {it.quantity % 1 === 0 ? it.quantity : it.quantity.toFixed(1)} {it.unit}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
