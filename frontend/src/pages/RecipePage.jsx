import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Header, Footer } from "../components/Layout";
import { Badge } from "../components/ui/badge";
import { ArrowLeft, Clock, Users } from "lucide-react";

export default function RecipePage() {
  const { slug } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/recipes/${slug}`)
      .then((r) => setRecipe(r.data))
      .finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-[#5C7063] hover:text-[#10B981] mb-6"
            data-testid="back-to-dashboard"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to plan
          </Link>

          {loading ? (
            <div className="text-[#5C7063]">Loading…</div>
          ) : !recipe ? (
            <div className="text-[#5C7063]">Recipe not found.</div>
          ) : (
            <div className="grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-7">
                <div className="rounded-2xl overflow-hidden border border-[#E5EFE8]">
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-full h-[420px] object-cover"
                  />
                </div>
                <div className="mt-8">
                  <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
                    {recipe.category}
                  </div>
                  <h1 className="font-display text-4xl lg:text-5xl font-bold text-[#111C15] tracking-tight mt-3">
                    {recipe.name}
                  </h1>
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[#5C7063]">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-4 h-4 text-[#10B981]" />
                      {recipe.prep_time} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="w-4 h-4 text-[#10B981]" />
                      Serves {recipe.servings}
                    </span>
                    {recipe.tags?.map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="border-[#E5EFE8] text-[#5C7063] capitalize"
                      >
                        {t}
                      </Badge>
                    ))}
                  </div>

                  {recipe.macros && (
                    <div
                      className="mt-6 grid grid-cols-4 gap-3"
                      data-testid="recipe-macros"
                    >
                      {[
                        { k: "kcal", label: "kcal", color: "#10B981" },
                        { k: "protein", label: "Protein", color: "#E07A5F", unit: "g" },
                        { k: "carbs", label: "Carbs", color: "#D4A24C", unit: "g" },
                        { k: "fat", label: "Fat", color: "#5C7063", unit: "g" },
                      ].map((m) => (
                        <div
                          key={m.k}
                          className="border border-[#E5EFE8] rounded-xl px-3 py-3 bg-white"
                        >
                          <div className="text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">
                            {m.label}
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span
                              className="font-display text-2xl font-bold tabular-nums"
                              style={{ color: m.color }}
                            >
                              {recipe.macros[m.k]}
                            </span>
                            {m.unit && (
                              <span className="text-xs text-[#5C7063]">{m.unit}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <h2 className="mt-10 font-display text-2xl font-semibold text-[#111C15]">
                    Instructions
                  </h2>
                  <ol className="mt-4 space-y-4">
                    {recipe.instructions.map((step, i) => (
                      <li key={i} className="flex gap-4">
                        <div className="flex-none w-8 h-8 rounded-full bg-[#10B981]/10 text-[#10B981] flex items-center justify-center font-display font-bold">
                          {i + 1}
                        </div>
                        <p className="text-[#111C15] leading-relaxed pt-1">
                          {step}
                        </p>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <aside className="lg:col-span-5">
                <div className="bg-white border border-[#E5EFE8] rounded-2xl p-6 lg:sticky lg:top-24">
                  <h2 className="font-display text-2xl font-semibold text-[#111C15]">
                    Ingredients
                  </h2>
                  <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063] mt-1">
                    For {recipe.servings} serving{recipe.servings > 1 ? "s" : ""}
                  </div>
                  <ul className="mt-5 space-y-1">
                    {recipe.ingredients.map((ing, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between py-2 border-b border-[#F3F7F4] last:border-0"
                        data-testid={`recipe-ingredient-${i}`}
                      >
                        <span className="text-[#111C15]">{ing.name}</span>
                        <span className="text-sm text-[#5C7063] tabular-nums">
                          {ing.quantity % 1 === 0
                            ? ing.quantity
                            : ing.quantity.toFixed(1)}{" "}
                          {ing.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
