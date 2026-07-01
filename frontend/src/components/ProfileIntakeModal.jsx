import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "./ui/select";
import { Flame, Beef, Wheat, Droplet, Target } from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary — desk job, little exercise" },
  { value: "light", label: "Light — walks, gym 1–2×/week" },
  { value: "moderate", label: "Moderate — gym 3–4×/week" },
  { value: "active", label: "Active — gym 5–6×/week" },
  { value: "very_active", label: "Very active — twice-daily training / manual job" },
];

const GOAL_OPTIONS = [
  { value: "lose", label: "Lose fat", hint: "500 kcal deficit" },
  { value: "maintain", label: "Maintain", hint: "keep current weight" },
  { value: "gain", label: "Gain muscle", hint: "300 kcal surplus" },
];

/**
 * Mandatory intake modal shown to logged-in clients until they complete their profile.
 * onSaved receives the updated client public object so parent auth ctx can refresh.
 */
export default function ProfileIntakeModal({ client, onSaved }) {
  const [form, setForm] = useState({
    sex: client?.profile?.sex || "",
    age: client?.profile?.age || "",
    height_cm: client?.profile?.height_cm || "",
    weight_kg: client?.profile?.weight_kg || "",
    activity_level: client?.profile?.activity_level || "",
    goal: client?.profile?.goal || "",
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(client?.targets || null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const canSubmit =
    form.sex && form.age && form.height_cm && form.weight_kg && form.activity_level && form.goal;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast.error("Please fill in every field");
      return;
    }
    setSaving(true);
    try {
      const r = await api.put("/client/profile", {
        sex: form.sex,
        age: Number(form.age),
        height_cm: Number(form.height_cm),
        weight_kg: Number(form.weight_kg),
        activity_level: form.activity_level,
        goal: form.goal,
      });
      setPreview(r.data.targets);
      // Refresh client
      const me = await api.get("/auth/me");
      toast.success("Profile saved — your plan is tuned to you");
      onSaved(me.data);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      data-testid="profile-intake-modal"
    >
      <div className="bg-white border border-[#E5EFE8] rounded-2xl w-full max-w-2xl my-8 shadow-xl">
        <div className="p-6 lg:p-8 border-b border-[#E5EFE8]">
          <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
            One-time setup
          </div>
          <h2 className="font-display text-3xl font-bold text-[#111C15] mt-2 tracking-tight">
            Let's tune your plan
          </h2>
          <p className="text-[#5C7063] mt-2 text-sm leading-relaxed">
            Tell us about you and we'll match your weekly meals to your goal — calories, protein,
            carbs, and fat all dialled in.
          </p>
        </div>

        <form onSubmit={submit} className="p-6 lg:p-8 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Sex</Label>
              <Select value={form.sex} onValueChange={(v) => set("sex", v)}>
                <SelectTrigger className="mt-1.5" data-testid="profile-sex">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                min={10}
                max={100}
                value={form.age}
                onChange={(e) => set("age", e.target.value)}
                className="mt-1.5"
                data-testid="profile-age"
              />
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                min={100}
                max={250}
                step="0.1"
                value={form.height_cm}
                onChange={(e) => set("height_cm", e.target.value)}
                className="mt-1.5"
                data-testid="profile-height"
              />
            </div>
            <div>
              <Label htmlFor="weight">Current weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={30}
                max={300}
                step="0.1"
                value={form.weight_kg}
                onChange={(e) => set("weight_kg", e.target.value)}
                className="mt-1.5"
                data-testid="profile-weight"
              />
            </div>
          </div>

          <div>
            <Label>Activity level</Label>
            <Select value={form.activity_level} onValueChange={(v) => set("activity_level", v)}>
              <SelectTrigger className="mt-1.5" data-testid="profile-activity">
                <SelectValue placeholder="Choose your typical week…" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Goal</Label>
            <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {GOAL_OPTIONS.map((o) => {
                const active = form.goal === o.value;
                return (
                  <button
                    type="button"
                    key={o.value}
                    onClick={() => set("goal", o.value)}
                    className={`rounded-xl border p-4 text-left transition-colors ${
                      active
                        ? "border-[#10B981] bg-[#10B981]/5"
                        : "border-[#E5EFE8] hover:border-[#10B981]/40"
                    }`}
                    data-testid={`profile-goal-${o.value}`}
                  >
                    <div className={`flex items-center gap-2 font-medium ${active ? "text-[#059669]" : "text-[#111C15]"}`}>
                      <Target className="w-4 h-4" />
                      {o.label}
                    </div>
                    <div className="text-xs text-[#5C7063] mt-1">{o.hint}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {preview && (
            <div className="rounded-xl bg-[#F3F7F4] border border-[#E5EFE8] p-4">
              <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
                Your daily targets
              </div>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Stat icon={Flame} label="kcal" value={preview.kcal} />
                <Stat icon={Beef} label="protein" value={`${preview.protein_g}g`} />
                <Stat icon={Wheat} label="carbs" value={`${preview.carbs_g}g`} />
                <Stat icon={Droplet} label="fat" value={`${preview.fat_g}g`} />
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={saving || !canSubmit}
              className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-11 px-6"
              data-testid="profile-save-btn"
            >
              {saving ? "Saving…" : preview ? "Continue to my plan" : "Calculate my plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-[#5C7063]">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="font-display text-2xl font-bold text-[#111C15] tabular-nums mt-0.5">
        {value}
      </div>
    </div>
  );
}
