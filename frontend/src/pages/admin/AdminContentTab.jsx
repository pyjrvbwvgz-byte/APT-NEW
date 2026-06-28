import { useEffect, useState } from "react";
import { toast } from "sonner";
import { adminApi, API } from "../../lib/api";
import axios from "axios";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Save, Plus, Trash2 } from "lucide-react";
import ImageUploader from "../../components/ImageUploader";

function Section({ title, children }) {
  return (
    <div className="bg-white border border-[#E5EFE8] rounded-2xl p-6">
      <div className="font-display text-lg font-semibold text-[#111C15] mb-4">{title}</div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-[#5C7063]">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export default function AdminContentTab() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    axios.get(`${API}/site`).then((r) => setContent(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading || !content) return <div className="text-[#5C7063]">Loading…</div>;

  const updateHero = (k, v) =>
    setContent((c) => ({ ...c, landing: { ...c.landing, hero: { ...c.landing.hero, [k]: v } } }));
  const updateTile = (k, v) =>
    setContent((c) => ({ ...c, landing: { ...c.landing, weekly_tile: { ...c.landing.weekly_tile, [k]: v } } }));
  const updatePricing = (path, v) =>
    setContent((c) => {
      const p = JSON.parse(JSON.stringify(c.landing.pricing));
      const keys = path.split(".");
      let cur = p;
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]];
      cur[keys[keys.length - 1]] = v;
      return { ...c, landing: { ...c.landing, pricing: p } };
    });
  const updateHow = (k, v) =>
    setContent((c) => ({ ...c, landing: { ...c.landing, how: { ...c.landing.how, [k]: v } } }));
  const updateCta = (k, v) =>
    setContent((c) => ({ ...c, landing: { ...c.landing, cta: { ...c.landing.cta, [k]: v } } }));
  const setExtras = (arr) => setContent((c) => ({ ...c, extras: arr }));

  const save = async () => {
    setSaving(true);
    try {
      await adminApi.put(`/admin/site`, { content });
      toast.success("Saved");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-semibold text-[#111C15]">Website content</h2>
        <Button onClick={save} disabled={saving} className="bg-[#10B981] hover:bg-[#059669] text-white" data-testid="save-content-btn">
          <Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Section title="Hero (top of homepage)">
        <Field label="Eyebrow badge text">
          <Input value={content.landing.hero.badge} onChange={(e) => updateHero("badge", e.target.value)} />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Headline line 1">
            <Input value={content.landing.hero.title_line1} onChange={(e) => updateHero("title_line1", e.target.value)} />
          </Field>
          <Field label="Headline line 2 (green)">
            <Input value={content.landing.hero.title_line2} onChange={(e) => updateHero("title_line2", e.target.value)} />
          </Field>
        </div>
        <Field label="Subtitle (HTML allowed)">
          <textarea
            value={content.landing.hero.subtitle_html}
            onChange={(e) => updateHero("subtitle_html", e.target.value)}
            rows={3}
            className="w-full border border-[#E5EFE8] rounded-md p-2 text-sm"
          />
        </Field>
        <Field label="Hero image">
          <ImageUploader
            value={content.landing.hero.image_url}
            onChange={(v) => updateHero("image_url", v)}
            height="h-48"
            testId="hero-image"
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Subscribe CTA"><Input value={content.landing.hero.subscribe_cta} onChange={(e) => updateHero("subscribe_cta", e.target.value)} /></Field>
          <Field label="Code CTA"><Input value={content.landing.hero.code_cta} onChange={(e) => updateHero("code_cta", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="This week tile (small card on hero)">
        <div className="grid md:grid-cols-3 gap-4">
          <Field label="Label"><Input value={content.landing.weekly_tile.label} onChange={(e) => updateTile("label", e.target.value)} /></Field>
          <Field label="Title"><Input value={content.landing.weekly_tile.title} onChange={(e) => updateTile("title", e.target.value)} /></Field>
          <Field label="Subtitle"><Input value={content.landing.weekly_tile.subtitle} onChange={(e) => updateTile("subtitle", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Pricing section">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Kicker"><Input value={content.landing.pricing.kicker} onChange={(e) => updatePricing("kicker", e.target.value)} /></Field>
          <Field label="Title"><Input value={content.landing.pricing.title} onChange={(e) => updatePricing("title", e.target.value)} /></Field>
        </div>
        <Field label="Subtitle"><Input value={content.landing.pricing.subtitle} onChange={(e) => updatePricing("subtitle", e.target.value)} /></Field>
        <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-[#E5EFE8]">
          <div className="space-y-3">
            <div className="font-medium text-[#111C15]">Subscription card</div>
            <Field label="Label"><Input value={content.landing.pricing.subscription.label} onChange={(e) => updatePricing("subscription.label", e.target.value)} /></Field>
            <Field label="Price"><Input value={content.landing.pricing.subscription.price} onChange={(e) => updatePricing("subscription.price", e.target.value)} /></Field>
            <Field label="Period"><Input value={content.landing.pricing.subscription.period} onChange={(e) => updatePricing("subscription.period", e.target.value)} /></Field>
            <Field label="Badge (e.g. Recommended)"><Input value={content.landing.pricing.subscription.badge || ""} onChange={(e) => updatePricing("subscription.badge", e.target.value)} /></Field>
            <Field label="CTA"><Input value={content.landing.pricing.subscription.cta} onChange={(e) => updatePricing("subscription.cta", e.target.value)} /></Field>
            <BulletEditor
              bullets={content.landing.pricing.subscription.bullets}
              onChange={(b) => updatePricing("subscription.bullets", b)}
            />
          </div>
          <div className="space-y-3">
            <div className="font-medium text-[#111C15]">4-digit code card</div>
            <Field label="Label"><Input value={content.landing.pricing.code.label} onChange={(e) => updatePricing("code.label", e.target.value)} /></Field>
            <Field label="Title"><Input value={content.landing.pricing.code.title} onChange={(e) => updatePricing("code.title", e.target.value)} /></Field>
            <Field label="Subtitle"><Input value={content.landing.pricing.code.subtitle} onChange={(e) => updatePricing("code.subtitle", e.target.value)} /></Field>
            <Field label="CTA"><Input value={content.landing.pricing.code.cta} onChange={(e) => updatePricing("code.cta", e.target.value)} /></Field>
            <BulletEditor
              bullets={content.landing.pricing.code.bullets}
              onChange={(b) => updatePricing("code.bullets", b)}
            />
          </div>
        </div>
      </Section>

      <Section title="How it works (3 steps)">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Kicker"><Input value={content.landing.how.kicker} onChange={(e) => updateHow("kicker", e.target.value)} /></Field>
          <Field label="Title"><Input value={content.landing.how.title} onChange={(e) => updateHow("title", e.target.value)} /></Field>
        </div>
        {(content.landing.how.steps || []).map((s, i) => (
          <div key={i} className="grid md:grid-cols-12 gap-3 items-end border-t pt-3 border-[#F3F7F4]">
            <div className="md:col-span-2">
              <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Step #</Label>
              <Input value={s.n} onChange={(e) => { const arr = [...content.landing.how.steps]; arr[i] = { ...arr[i], n: e.target.value }; updateHow("steps", arr); }} className="mt-1" />
            </div>
            <div className="md:col-span-3">
              <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Title</Label>
              <Input value={s.t} onChange={(e) => { const arr = [...content.landing.how.steps]; arr[i] = { ...arr[i], t: e.target.value }; updateHow("steps", arr); }} className="mt-1" />
            </div>
            <div className="md:col-span-7">
              <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Description</Label>
              <Input value={s.d} onChange={(e) => { const arr = [...content.landing.how.steps]; arr[i] = { ...arr[i], d: e.target.value }; updateHow("steps", arr); }} className="mt-1" />
            </div>
          </div>
        ))}
      </Section>

      <Section title="Bottom CTA strip">
        <Field label="Title"><Input value={content.landing.cta.title} onChange={(e) => updateCta("title", e.target.value)} /></Field>
        <Field label="Subtitle"><Input value={content.landing.cta.subtitle} onChange={(e) => updateCta("subtitle", e.target.value)} /></Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Primary button"><Input value={content.landing.cta.primary} onChange={(e) => updateCta("primary", e.target.value)} /></Field>
          <Field label="Secondary button"><Input value={content.landing.cta.secondary} onChange={(e) => updateCta("secondary", e.target.value)} /></Field>
        </div>
      </Section>

      <Section title="Extra cards (optional gallery section on homepage)">
        <ExtrasEditor extras={content.extras || []} onChange={setExtras} />
      </Section>

      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="bg-[#10B981] hover:bg-[#059669] text-white" data-testid="save-content-btn-bottom">
          <Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </div>
  );
}

function BulletEditor({ bullets, onChange }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Bullets</Label>
      <div className="mt-1.5 space-y-2">
        {(bullets || []).map((b, i) => (
          <div key={i} className="flex gap-2">
            <Input value={b} onChange={(e) => { const arr = [...bullets]; arr[i] = e.target.value; onChange(arr); }} className="flex-1" />
            <Button size="sm" variant="ghost" onClick={() => onChange(bullets.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => onChange([...(bullets || []), ""])}>
          <Plus className="w-3 h-3 mr-1" /> Add bullet
        </Button>
      </div>
    </div>
  );
}

function ExtrasEditor({ extras, onChange }) {
  return (
    <div className="space-y-3">
      {extras.map((e, i) => (
        <div key={i} className="grid md:grid-cols-12 gap-3 border-t border-[#F3F7F4] pt-3">
          <div className="md:col-span-3">
            <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Title</Label>
            <Input value={e.title || ""} onChange={(ev) => { const arr = [...extras]; arr[i] = { ...arr[i], title: ev.target.value }; onChange(arr); }} className="mt-1" />
          </div>
          <div className="md:col-span-3">
            <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Caption</Label>
            <Input value={e.caption || ""} onChange={(ev) => { const arr = [...extras]; arr[i] = { ...arr[i], caption: ev.target.value }; onChange(arr); }} className="mt-1" />
          </div>
          <div className="md:col-span-5">
            <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Image</Label>
            <div className="mt-1">
              <ImageUploader
                value={e.image_url || ""}
                onChange={(v) => { const arr = [...extras]; arr[i] = { ...arr[i], image_url: v }; onChange(arr); }}
                height="h-32"
                testId={`extras-image-${i}`}
              />
            </div>
          </div>
          <div className="md:col-span-1 flex items-start pt-6">
            <Button size="sm" variant="ghost" onClick={() => onChange(extras.filter((_, idx) => idx !== i))}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={() => onChange([...extras, { title: "", caption: "", image_url: "" }])}>
        <Plus className="w-3 h-3 mr-1" /> Add card
      </Button>
    </div>
  );
}
