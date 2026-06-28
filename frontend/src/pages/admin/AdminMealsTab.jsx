import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi, API } from "../../lib/api";
import axios from "axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../../components/ui/select";
import { Plus, Trash2, Save, ImageIcon } from "lucide-react";

const CATEGORIES = ["breakfast", "lunch", "dinner"];

function slugify(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AdminMealsTab() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/recipes`);
      setRecipes(r.data.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)));
    } catch {
      toast.error("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const blank = () => ({
    slug: "",
    name: "",
    category: "breakfast",
    image_url: "",
    prep_time: 15,
    servings: 1,
    ingredients: [{ name: "", quantity: 1, unit: "g" }],
    instructions: [""],
    tags: [],
    macros: { kcal: 0, protein: 0, carbs: 0, fat: 0 },
    _new: true,
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl font-semibold text-[#111C15]">
          Meals ({recipes.length})
        </h2>
        <Button
          onClick={() => { setEditing(blank()); setCreating(true); }}
          className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md"
          data-testid="add-meal-btn"
        >
          <Plus className="w-4 h-4 mr-2" /> Add new meal
        </Button>
      </div>

      {loading ? (
        <div className="text-[#5C7063]">Loading…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((r) => (
            <div
              key={r.slug}
              className="bg-white border border-[#E5EFE8] rounded-2xl overflow-hidden"
              data-testid={`meal-card-${r.slug}`}
            >
              <div className="h-32 bg-[#F3F7F4] overflow-hidden">
                {r.image_url ? (
                  <img src={r.image_url} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#5C7063]">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium text-[#111C15] leading-tight">{r.name}</div>
                  <Badge variant="outline" className="border-[#E5EFE8] text-[#5C7063] capitalize text-xs">
                    {r.category}
                  </Badge>
                </div>
                <div className="text-xs text-[#5C7063] mt-1">
                  {r.prep_time} min · {r.macros?.kcal || 0} kcal · serves {r.servings}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setEditing({ ...r, _new: false }); setCreating(false); }}
                    data-testid={`edit-meal-${r.slug}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={async () => {
                      if (!window.confirm(`Delete "${r.name}"?`)) return;
                      try {
                        await adminApi.delete(`/admin/recipes/${r.slug}`);
                        toast.success("Deleted");
                        load();
                      } catch (err) {
                        toast.error(err?.response?.data?.detail || "Delete failed");
                      }
                    }}
                    data-testid={`delete-meal-${r.slug}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <MealEditor
          recipe={editing}
          isNew={creating}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function MealEditor({ recipe, isNew, onClose, onSaved }) {
  const [r, setR] = useState(recipe);
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setR((cur) => ({ ...cur, [k]: v }));
  const setMacro = (k, v) => setR((cur) => ({ ...cur, macros: { ...cur.macros, [k]: Number(v) || 0 } }));

  const updateIngredient = (i, key, v) => {
    setR((cur) => {
      const ings = [...cur.ingredients];
      ings[i] = { ...ings[i], [key]: key === "quantity" ? Number(v) || 0 : v };
      return { ...cur, ingredients: ings };
    });
  };
  const addIngredient = () =>
    setR((cur) => ({ ...cur, ingredients: [...cur.ingredients, { name: "", quantity: 1, unit: "g" }] }));
  const removeIngredient = (i) =>
    setR((cur) => ({ ...cur, ingredients: cur.ingredients.filter((_, idx) => idx !== i) }));

  const updateInstruction = (i, v) => {
    setR((cur) => {
      const ins = [...cur.instructions];
      ins[i] = v;
      return { ...cur, instructions: ins };
    });
  };
  const addInstruction = () => setR((cur) => ({ ...cur, instructions: [...cur.instructions, ""] }));
  const removeInstruction = (i) => setR((cur) => ({ ...cur, instructions: cur.instructions.filter((_, idx) => idx !== i) }));

  const save = async () => {
    if (!r.name.trim()) { toast.error("Name required"); return; }
    if (isNew && !r.slug.trim()) set("slug", slugify(r.name));
    setSaving(true);
    try {
      if (isNew) {
        const payload = { ...r, slug: r.slug.trim() || slugify(r.name) };
        delete payload._new;
        await adminApi.post(`/admin/recipes`, payload);
      } else {
        const { slug, _new, id, ...patch } = r;
        await adminApi.put(`/admin/recipes/${recipe.slug}`, patch);
      }
      toast.success("Saved");
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white border border-[#E5EFE8] rounded-2xl w-full max-w-3xl my-8 p-6 lg:p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="meal-editor"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display text-2xl font-semibold text-[#111C15]">
            {isNew ? "Add meal" : `Edit · ${recipe.name}`}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Name</Label>
            <Input
              value={r.name}
              onChange={(e) => set("name", e.target.value)}
              onBlur={() => { if (isNew && !r.slug) set("slug", slugify(r.name)); }}
              className="mt-1.5"
              data-testid="meal-name"
            />
          </div>
          {isNew && (
            <div>
              <Label>URL slug</Label>
              <Input value={r.slug} onChange={(e) => set("slug", slugify(e.target.value))} className="mt-1.5 font-mono text-sm" />
            </div>
          )}
          <div>
            <Label>Category</Label>
            <Select value={r.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="mt-1.5" data-testid="meal-category"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Prep time (min)</Label>
            <Input type="number" value={r.prep_time} onChange={(e) => set("prep_time", Number(e.target.value) || 0)} className="mt-1.5" />
          </div>
          <div>
            <Label>Servings</Label>
            <Input type="number" value={r.servings} onChange={(e) => set("servings", Number(e.target.value) || 1)} className="mt-1.5" />
          </div>
          <div className="md:col-span-2">
            <Label>Image URL (paste any web image link)</Label>
            <Input
              value={r.image_url}
              onChange={(e) => set("image_url", e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="mt-1.5"
              data-testid="meal-image-url"
            />
            {r.image_url && (
              <img src={r.image_url} alt="" className="mt-3 w-full h-48 object-cover rounded-lg border border-[#E5EFE8]" />
            )}
          </div>
        </div>

        <div className="mt-6">
          <Label>Macros (per serving)</Label>
          <div className="mt-2 grid grid-cols-4 gap-3">
            {["kcal", "protein", "carbs", "fat"].map((k) => (
              <div key={k}>
                <div className="text-xs uppercase tracking-wider text-[#5C7063]">{k}</div>
                <Input type="number" value={r.macros?.[k] ?? 0} onChange={(e) => setMacro(k, e.target.value)} className="mt-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center">
            <Label>Ingredients</Label>
            <Button size="sm" variant="outline" onClick={addIngredient}><Plus className="w-3 h-3 mr-1" /> Add</Button>
          </div>
          <div className="mt-2 space-y-2">
            {r.ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <Input placeholder="Ingredient" value={ing.name} onChange={(e) => updateIngredient(i, "name", e.target.value)} className="flex-1" />
                <Input type="number" placeholder="Qty" value={ing.quantity} onChange={(e) => updateIngredient(i, "quantity", e.target.value)} className="w-20" />
                <Input placeholder="unit" value={ing.unit} onChange={(e) => updateIngredient(i, "unit", e.target.value)} className="w-20" />
                <Button size="sm" variant="ghost" onClick={() => removeIngredient(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center">
            <Label>Instructions</Label>
            <Button size="sm" variant="outline" onClick={addInstruction}><Plus className="w-3 h-3 mr-1" /> Add step</Button>
          </div>
          <div className="mt-2 space-y-2">
            {r.instructions.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <span className="text-sm font-mono text-[#5C7063] mt-2">{i + 1}.</span>
                <textarea
                  value={step}
                  onChange={(e) => updateInstruction(i, e.target.value)}
                  rows={2}
                  className="flex-1 border border-[#E5EFE8] rounded-md p-2 text-sm"
                />
                <Button size="sm" variant="ghost" onClick={() => removeInstruction(i)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-[#10B981] hover:bg-[#059669] text-white"
            data-testid="save-meal-btn"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving…" : isNew ? "Create meal" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
