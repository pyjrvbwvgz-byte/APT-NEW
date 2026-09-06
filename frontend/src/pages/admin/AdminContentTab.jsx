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

  const setLanding = (block, k, v) =>
    setContent((c) => ({
      ...c,
      landing: { ...c.landing, [block]: { ...c.landing[block], [k]: v } },
    }));
  const setFooter = (k, v) => setContent((c) => ({ ...c, footer: { ...c.footer, [k]: v } }));
  const setExtras = (arr) => setContent((c) => ({ ...c, extras: arr }));
  const setNavLinks = (arr) => setContent((c) => ({ ...c, nav: { ...c.nav, links: arr } }));

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

  const hero = content.landing.hero || {};
  const stats = content.landing.stats || {};
  const features = content.landing.features || {};
  const how = content.landing.how || {};
  const cta = content.landing.cta || {};
  const footer = content.footer || {};

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-display text-2xl font-semibold text-[#111C15]">Website content</h2>
        <Button onClick={save} disabled={saving} className="bg-[#10B981] hover:bg-[#059669] text-white" data-testid="save-content-btn">
          <Save className="w-4 h-4 mr-2" />{saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      <Section title="Top announcement strip">
        <Field label="Scrolling banner text">
          <Input
            value={content.announcement || ""}
            onChange={(e) => setContent((c) => ({ ...c, announcement: e.target.value }))}
            data-testid="announcement-input"
          />
        </Field>
      </Section>

      <Section title="Navigation links">
        {(content.nav?.links || []).map((l, i) => (
          <div key={i} className="grid md:grid-cols-12 gap-3 items-end border-t border-[#F3F7F4] pt-3">
            <div className="md:col-span-5">
              <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Label</Label>
              <Input
                value={l.label}
                onChange={(e) => { const arr = [...content.nav.links]; arr[i] = { ...arr[i], label: e.target.value }; setNavLinks(arr); }}
                className="mt-1"
                data-testid={`nav-label-${i}`}
              />
            </div>
            <div className="md:col-span-6">
              <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Link (e.g. /#meals)</Label>
              <Input
                value={l.href}
                onChange={(e) => { const arr = [...content.nav.links]; arr[i] = { ...arr[i], href: e.target.value }; setNavLinks(arr); }}
                className="mt-1"
                data-testid={`nav-href-${i}`}
              />
            </div>
            <div className="md:col-span-1">
              <Button size="sm" variant="ghost" onClick={() => setNavLinks(content.nav.links.filter((_, idx) => idx !== i))} data-testid={`nav-remove-${i}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setNavLinks([...(content.nav?.links || []), { label: "", href: "/" }])} data-testid="nav-add-link">
          <Plus className="w-3 h-3 mr-1" /> Add link
        </Button>
      </Section>

      <Section title="Hero (top of homepage)">
        <Field label="Kicker (small blue text above headline)">
          <Input value={hero.kicker || ""} onChange={(e) => setLanding("hero", "kicker", e.target.value)} data-testid="hero-kicker" />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Headline (line 1)">
            <Input value={hero.title_prefix || ""} onChange={(e) => setLanding("hero", "title_prefix", e.target.value)} data-testid="hero-title-prefix" />
          </Field>
          <Field label="Headline highlight (italic blue)">
            <Input value={hero.title_highlight || ""} onChange={(e) => setLanding("hero", "title_highlight", e.target.value)} data-testid="hero-title-highlight" />
          </Field>
        </div>
        <Field label="Subtitle">
          <textarea
            value={hero.subtitle || ""}
            onChange={(e) => setLanding("hero", "subtitle", e.target.value)}
            rows={3}
            className="w-full border border-[#E5EFE8] rounded-md p-2 text-sm"
            data-testid="hero-subtitle"
          />
        </Field>
        <Field label="Hero background image">
          <ImageUploader
            value={hero.bg_image_url || ""}
            onChange={(v) => setLanding("hero", "bg_image_url", v)}
            height="h-48"
            testId="hero-image"
          />
        </Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Primary button"><Input value={hero.primary_cta || ""} onChange={(e) => setLanding("hero", "primary_cta", e.target.value)} data-testid="hero-primary-cta" /></Field>
          <Field label="Secondary button"><Input value={hero.secondary_cta || ""} onChange={(e) => setLanding("hero", "secondary_cta", e.target.value)} data-testid="hero-secondary-cta" /></Field>
        </div>
      </Section>

      <Section title="Stats band">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Kicker"><Input value={stats.kicker || ""} onChange={(e) => setLanding("stats", "kicker", e.target.value)} data-testid="stats-kicker" /></Field>
          <Field label="Title"><Input value={stats.title || ""} onChange={(e) => setLanding("stats", "title", e.target.value)} data-testid="stats-title" /></Field>
        </div>
        {(stats.items || []).map((s, i) => (
          <div key={i} className="grid md:grid-cols-12 gap-3 items-end border-t border-[#F3F7F4] pt-3">
            <div className="md:col-span-4">
              <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Value</Label>
              <Input value={s.value} onChange={(e) => { const arr = [...stats.items]; arr[i] = { ...arr[i], value: e.target.value }; setLanding("stats", "items", arr); }} className="mt-1" data-testid={`stat-value-${i}`} />
            </div>
            <div className="md:col-span-7">
              <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Label</Label>
              <Input value={s.label} onChange={(e) => { const arr = [...stats.items]; arr[i] = { ...arr[i], label: e.target.value }; setLanding("stats", "items", arr); }} className="mt-1" data-testid={`stat-label-${i}`} />
            </div>
            <div className="md:col-span-1">
              <Button size="sm" variant="ghost" onClick={() => setLanding("stats", "items", stats.items.filter((_, idx) => idx !== i))} data-testid={`stat-remove-${i}`}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        <Button size="sm" variant="outline" onClick={() => setLanding("stats", "items", [...(stats.items || []), { value: "", label: "" }])} data-testid="stat-add">
          <Plus className="w-3 h-3 mr-1" /> Add stat
        </Button>
      </Section>

      <Section title="Feature rows (image + text)">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Kicker"><Input value={features.kicker || ""} onChange={(e) => setLanding("features", "kicker", e.target.value)} data-testid="features-kicker" /></Field>
          <Field label="Title"><Input value={features.title || ""} onChange={(e) => setLanding("features", "title", e.target.value)} data-testid="features-title" /></Field>
        </div>
        {(features.items || []).map((f, i) => {
          const upd = (k, v) => { const arr = [...features.items]; arr[i] = { ...arr[i], [k]: v }; setLanding("features", "items", arr); };
          return (
            <div key={i} className="border-t border-[#F3F7F4] pt-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="font-medium text-[#111C15]">Row {i + 1}</div>
                <Button size="sm" variant="ghost" onClick={() => setLanding("features", "items", features.items.filter((_, idx) => idx !== i))} data-testid={`feature-remove-${i}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Kicker"><Input value={f.kicker || ""} onChange={(e) => upd("kicker", e.target.value)} data-testid={`feature-kicker-${i}`} /></Field>
                <Field label="Title"><Input value={f.title || ""} onChange={(e) => upd("title", e.target.value)} data-testid={`feature-title-${i}`} /></Field>
              </div>
              <Field label="Description">
                <textarea value={f.description || ""} onChange={(e) => upd("description", e.target.value)} rows={2} className="w-full border border-[#E5EFE8] rounded-md p-2 text-sm" data-testid={`feature-desc-${i}`} />
              </Field>
              <div className="grid md:grid-cols-2 gap-3">
                <Field label="Image">
                  <ImageUploader value={f.image_url || ""} onChange={(v) => upd("image_url", v)} height="h-32" testId={`feature-image-${i}`} />
                </Field>
                <Field label="Image shape">
                  <select
                    value={f.shape || "rounded"}
                    onChange={(e) => upd("shape", e.target.value)}
                    className="w-full border border-[#E5EFE8] rounded-md p-2 text-sm bg-white"
                    data-testid={`feature-shape-${i}`}
                  >
                    <option value="rounded">Rounded rectangle</option>
                    <option value="circle">Circle</option>
                    <option value="skew">Skewed</option>
                  </select>
                </Field>
              </div>
            </div>
          );
        })}
        <Button size="sm" variant="outline" onClick={() => setLanding("features", "items", [...(features.items || []), { kicker: "", title: "", description: "", image_url: "", shape: "rounded" }])} data-testid="feature-add">
          <Plus className="w-3 h-3 mr-1" /> Add feature row
        </Button>
      </Section>

      <Section title="How it works">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Kicker"><Input value={how.kicker || ""} onChange={(e) => setLanding("how", "kicker", e.target.value)} data-testid="how-kicker" /></Field>
          <Field label="Title"><Input value={how.title || ""} onChange={(e) => setLanding("how", "title", e.target.value)} data-testid="how-title" /></Field>
        </div>
        {(how.steps || []).map((s, i) => {
          const upd = (k, v) => { const arr = [...how.steps]; arr[i] = { ...arr[i], [k]: v }; setLanding("how", "steps", arr); };
          return (
            <div key={i} className="grid md:grid-cols-12 gap-3 items-end border-t border-[#F3F7F4] pt-3">
              <div className="md:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Step #</Label>
                <Input value={s.n} onChange={(e) => upd("n", e.target.value)} className="mt-1" data-testid={`how-n-${i}`} />
              </div>
              <div className="md:col-span-3">
                <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Title</Label>
                <Input value={s.t} onChange={(e) => upd("t", e.target.value)} className="mt-1" data-testid={`how-t-${i}`} />
              </div>
              <div className="md:col-span-6">
                <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Description</Label>
                <Input value={s.d} onChange={(e) => upd("d", e.target.value)} className="mt-1" data-testid={`how-d-${i}`} />
              </div>
              <div className="md:col-span-1">
                <Button size="sm" variant="ghost" onClick={() => setLanding("how", "steps", how.steps.filter((_, idx) => idx !== i))} data-testid={`how-remove-${i}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
        <Button size="sm" variant="outline" onClick={() => setLanding("how", "steps", [...(how.steps || []), { n: "", t: "", d: "" }])} data-testid="how-add">
          <Plus className="w-3 h-3 mr-1" /> Add step
        </Button>
      </Section>

      <Section title="Bottom CTA strip">
        <Field label="Title"><Input value={cta.title || ""} onChange={(e) => setLanding("cta", "title", e.target.value)} data-testid="cta-title" /></Field>
        <Field label="Subtitle"><Input value={cta.subtitle || ""} onChange={(e) => setLanding("cta", "subtitle", e.target.value)} data-testid="cta-subtitle" /></Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Primary button"><Input value={cta.primary || ""} onChange={(e) => setLanding("cta", "primary", e.target.value)} data-testid="cta-primary" /></Field>
          <Field label="Secondary button"><Input value={cta.secondary || ""} onChange={(e) => setLanding("cta", "secondary", e.target.value)} data-testid="cta-secondary" /></Field>
        </div>
      </Section>

      <Section title="Footer">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Brand name"><Input value={footer.brand || ""} onChange={(e) => setFooter("brand", e.target.value)} data-testid="footer-brand" /></Field>
          <Field label="Strapline (large scrolling text)"><Input value={footer.strapline || ""} onChange={(e) => setFooter("strapline", e.target.value)} data-testid="footer-strapline" /></Field>
        </div>
        <Field label="Tagline"><Input value={footer.tagline || ""} onChange={(e) => setFooter("tagline", e.target.value)} data-testid="footer-tagline" /></Field>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Support label"><Input value={footer.support_label || ""} onChange={(e) => setFooter("support_label", e.target.value)} data-testid="footer-support-label" /></Field>
          <Field label="Support email"><Input value={footer.support_email || ""} onChange={(e) => setFooter("support_email", e.target.value)} data-testid="footer-support-email" /></Field>
        </div>
        <Field label="Copyright line"><Input value={footer.copyright || ""} onChange={(e) => setFooter("copyright", e.target.value)} data-testid="footer-copyright" /></Field>
        <div>
          <Label className="text-xs uppercase tracking-wider text-[#5C7063]">Extra footer lines</Label>
          <div className="mt-1.5 space-y-2">
            {(footer.lines || []).map((l, i) => (
              <div key={i} className="flex gap-2">
                <Input value={l} onChange={(e) => { const arr = [...footer.lines]; arr[i] = e.target.value; setFooter("lines", arr); }} className="flex-1" data-testid={`footer-line-${i}`} />
                <Button size="sm" variant="ghost" onClick={() => setFooter("lines", footer.lines.filter((_, idx) => idx !== i))}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => setFooter("lines", [...(footer.lines || []), ""])} data-testid="footer-add-line">
              <Plus className="w-3 h-3 mr-1" /> Add line
            </Button>
          </div>
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
