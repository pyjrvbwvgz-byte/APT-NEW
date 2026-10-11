import { useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Flame, Beef, Wheat, Droplet, Target, ArrowLeft, ArrowRight, Check } from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", hint: "Desk job, little exercise" },
  { value: "light", label: "Light", hint: "Walks, gym 1–2×/week" },
  { value: "moderate", label: "Moderate", hint: "Gym 3–4×/week" },
  { value: "active", label: "Active", hint: "Gym 5–6×/week" },
  { value: "very_active", label: "Very active", hint: "Twice-daily training / manual job" },
];

const GOAL_OPTIONS = [
  { value: "lose", label: "Lose fat", hint: "500 kcal deficit" },
  { value: "maintain", label: "Maintain", hint: "Keep current weight" },
  { value: "gain", label: "Gain muscle", hint: "300 kcal surplus" },
];

const STEPS = ["About you", "Your week", "Your goal"];

/** Short, stepped intake — one question group per screen, thumb-friendly on a phone. */
export default function ProfileIntakeModal({ client, onSaved }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    sex: client?.profile?.sex || "",
    age: client?.profile?.age || "",
    height_cm: client?.profile?.height_cm || "",
    weight_kg: client?.profile?.weight_kg || "",
    activity_level: client?.profile?.activity_level || "",
    goal: client?.profile?.goal || "",
  });
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const stepValid =
    step === 0
      ? form.sex && form.age && form.height_cm && form.weight_kg
      : step === 1
      ? !!form.activity_level
      : !!form.goal;

  const submit = async () => {
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
      const me = await api.get("/auth/me");
      toast.success("Profile saved — your plan is tuned to you");
      setTimeout(() => onSaved(me.data), 1200);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 overflow-y-auto"
      data-testid="profile-intake-modal"
    >
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#E5EFE8] max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-6 pb-4 sm:px-7">
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#10B981]">
            Step {Math.min(step + 1, 3)} of 3 · {STEPS[step]}
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111C15] mt-2 tracking-tight">
            {preview ? "You're all set" : "Let's tune your plan"}
          </h2>
          <div className="mt-4 flex gap-1.5">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full ${
                  i <= step ? "bg-[#10B981]" : "bg-[#E5EFE8]"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="px-5 pb-6 sm:px-7 space-y-5">
          {preview ? (
            <div className="rounded-2xl bg-[#F3F7F4] border border-[#E5EFE8] p-4">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#10B981]">
                Your daily targets
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat icon={Flame} label="kcal" value={preview.kcal} />
                <Stat icon={Beef} label="protein" value={`${preview.protein_g}g`} />
                <Stat icon={Wheat} label="carbs" value={`${preview.carbs_g}g`} />
                <Stat icon={Droplet} label="fat" value={`${preview.fat_g}g`} />
              </div>
              <p className="mt-4 text-sm text-[#5C7063]">
                Taking you to this week's meals…
              </p>
            </div>
          ) : step === 0 ? (
            <>
              <div>
                <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Sex</Label>
                <div className="mt-2 grid grid-cols-2 gap-3">
                  {["male", "female"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set("sex", s)}
                      className={`h-12 rounded-xl border font-medium capitalize ${
                        form.sex === s
                          ? "border-[#10B981] bg-[#10B981]/5 text-[#059669]"
                          : "border-[#E5EFE8] text-[#111C15]"
                      }`}
                      data-testid={`profile-sex-${s}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <NumField
                  id="age"
                  label="Age"
                  value={form.age}
                  onChange={(v) => set("age", v)}
                  testid="profile-age"
                />
                <NumField
                  id="height"
                  label="Height (cm)"
                  value={form.height_cm}
                  onChange={(v) => set("height_cm", v)}
                  testid="profile-height"
                  step="0.1"
                />
              </div>
              <NumField
                id="weight"
                label="Current weight (kg)"
                value={form.weight_kg}
                onChange={(v) => set("weight_kg", v)}
                testid="profile-weight"
                step="0.1"
              />
            </>
          ) : step === 1 ? (
            <div className="space-y-3">
              {ACTIVITY_OPTIONS.map((o) => {
                const active = form.activity_level === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set("activity_level", o.value)}
                    className={`w-full rounded-xl border p-4 text-left flex items-center justify-between gap-3 ${
                      active ? "border-[#10B981] bg-[#10B981]/5" : "border-[#E5EFE8]"
                    }`}
                    data-testid={`profile-activity-${o.value}`}
                  >
                    <span>
                      <span
                        className={`block font-semibold ${
                          active ? "text-[#059669]" : "text-[#111C15]"
                        }`}
                      >
                        {o.label}
                      </span>
                      <span className="block text-xs text-[#5C7063] mt-0.5">{o.hint}</span>
                    </span>
                    {active && <Check className="w-5 h-5 text-[#10B981] flex-none" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {GOAL_OPTIONS.map((o) => {
                const active = form.goal === o.value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => set("goal", o.value)}
                    className={`w-full rounded-xl border p-4 text-left flex items-center justify-between gap-3 ${
                      active ? "border-[#10B981] bg-[#10B981]/5" : "border-[#E5EFE8]"
                    }`}
                    data-testid={`profile-goal-${o.value}`}
                  >
                    <span className="flex items-center gap-3">
                      <Target
                        className={`w-5 h-5 ${active ? "text-[#10B981]" : "text-[#5C7063]"}`}
                      />
                      <span>
                        <span
                          className={`block font-semibold ${
                            active ? "text-[#059669]" : "text-[#111C15]"
                          }`}
                        >
                          {o.label}
                        </span>
                        <span className="block text-xs text-[#5C7063] mt-0.5">{o.hint}</span>
                      </span>
                    </span>
                    {active && <Check className="w-5 h-5 text-[#10B981] flex-none" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Sticky footer actions */}
        {!preview && (
          <div className="sticky bottom-0 bg-white border-t border-[#E5EFE8] px-5 py-4 sm:px-7 flex gap-3">
            {step > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((s) => s - 1)}
                className="h-12 border-[#E5EFE8] px-4"
                data-testid="profile-back-btn"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <Button
              type="button"
              disabled={!stepValid || saving}
              onClick={() => (step < 2 ? setStep((s) => s + 1) : submit())}
              className="h-12 flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-semibold"
              data-testid={step < 2 ? "profile-next-btn" : "profile-save-btn"}
            >
              {saving ? "Saving…" : step < 2 ? "Continue" : "Calculate my plan"}
              {!saving && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function NumField({ id, label, value, onChange, testid, step }) {
  return (
    <div>
      <Label htmlFor={id} className="text-xs uppercase tracking-wider text-[#5C7063]">
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-12 text-base"
        data-testid={testid}
      />
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
