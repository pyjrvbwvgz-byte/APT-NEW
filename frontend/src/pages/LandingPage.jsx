import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { useSiteContent } from "../lib/siteContent";
import { ArrowRight, Salad, FileDown, KeyRound, Check, Sparkles, CreditCard, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  const { content } = useSiteContent();
  const h = content.landing.hero;
  const tile = content.landing.weekly_tile;
  const p = content.landing.pricing;
  const how = content.landing.how;
  const bottom = content.landing.cta;

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        right={
          <>
            <Link to="/admin" className="text-sm text-[#5C7063] hover:text-[#10B981]" data-testid="admin-link">Admin</Link>
            <Link to="/auth" data-testid="header-auth-link" className="hidden sm:block">
              <Button variant="outline" className="rounded-md border-[#E5EFE8]">I have a code</Button>
            </Link>
            <Link to="/subscribe" data-testid="header-subscribe-link">
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md">Subscribe</Button>
            </Link>
          </>
        }
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center select-none">
          <img src="/brand/apt-mark.png" alt="" className="w-[140%] max-w-none opacity-[0.08] lg:opacity-[0.1] -translate-y-4" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5EFE8] bg-white px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#5C7063]">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" /> {h.badge}
            </div>
            <h1 className="mt-6 font-display text-5xl lg:text-7xl font-bold text-[#111C15] tracking-tight text-balance">
              {h.title_line1}
              <br />
              <span className="text-[#10B981]">{h.title_line2}</span>
            </h1>
            <p
              className="mt-6 text-lg text-[#5C7063] max-w-xl leading-relaxed"
              dangerouslySetInnerHTML={{ __html: h.subtitle_html }}
            />
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/subscribe" data-testid="hero-cta-subscribe">
                <Button size="lg" className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md px-7 h-12 text-base font-semibold">
                  {h.subscribe_cta} <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/auth" data-testid="hero-cta-have-code">
                <Button size="lg" variant="outline" className="rounded-md px-7 h-12 text-base border-[#E5EFE8] hover:bg-[#F3F7F4]">
                  <KeyRound className="w-4 h-4 mr-2" /> {h.code_cta}
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-[#5C7063]">
              <div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#10B981]" /> Cancel anytime</div>
              <div className="flex items-center gap-2"><FileDown className="w-4 h-4 text-[#10B981]" /> PDF download</div>
              <div className="flex items-center gap-2"><Salad className="w-4 h-4 text-[#10B981]" /> Mon–Sun plan + macros</div>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#E5EFE8] bg-white shadow-sm">
              <img src={h.image_url} alt="Meal prep" className="w-full h-[460px] object-cover" />
            </div>
            <div className="hidden lg:block absolute -bottom-6 -left-6 bg-white border border-[#E5EFE8] shadow-sm rounded-2xl px-5 py-4 max-w-[260px]">
              <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063]">{tile.label}</div>
              <div className="font-display text-2xl font-bold text-[#111C15] leading-tight mt-1">{tile.title}</div>
              <div className="text-sm text-[#5C7063] mt-1">{tile.subtitle}</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="access" className="py-16 lg:py-24 bg-[#F3F7F4]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">{p.kicker}</div>
            <h2 className="mt-3 font-display text-3xl lg:text-5xl font-semibold text-[#111C15] tracking-tight">{p.title}</h2>
            <p className="mt-3 text-[#5C7063]">{p.subtitle}</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl border border-[#10B981] p-8 lg:p-10 relative overflow-hidden">
              {p.subscription.badge && (
                <div className="absolute top-5 right-5 text-[10px] uppercase tracking-[0.2em] bg-[#10B981] text-white px-2.5 py-1 rounded-full">{p.subscription.badge}</div>
              )}
              <div className="inline-flex items-center gap-2 text-[#10B981]">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs uppercase tracking-[0.2em] font-medium">{p.subscription.label}</span>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold text-[#111C15] tracking-tight">{p.subscription.price}</span>
                <span className="text-[#5C7063]">{p.subscription.period}</span>
              </div>
              <ul className="mt-8 space-y-3">
                {(p.subscription.bullets || []).map((t) => (
                  <li key={t} className="flex gap-3 text-[#111C15]"><Check className="w-5 h-5 text-[#10B981] flex-none mt-0.5" /> {t}</li>
                ))}
              </ul>
              <Link to="/subscribe" className="block mt-8" data-testid="pricing-subscribe-btn">
                <Button size="lg" className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold">{p.subscription.cta} <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            </div>

            <div className="bg-white rounded-3xl border border-[#E5EFE8] p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 text-[#1A3622]">
                <KeyRound className="w-5 h-5" />
                <span className="text-xs uppercase tracking-[0.2em] font-medium">{p.code.label}</span>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-[#111C15] tracking-tight">{p.code.title}</span>
              </div>
              <p className="mt-3 text-[#5C7063]">{p.code.subtitle}</p>
              <ul className="mt-8 space-y-3">
                {(p.code.bullets || []).map((t) => (
                  <li key={t} className="flex gap-3 text-[#111C15]"><Check className="w-5 h-5 text-[#10B981] flex-none mt-0.5" /> {t}</li>
                ))}
              </ul>
              <Link to="/auth" className="block mt-8" data-testid="pricing-have-code-btn">
                <Button size="lg" variant="outline" className="w-full rounded-md h-12 font-semibold border-[#E5EFE8] hover:bg-[#F3F7F4]">{p.code.cta} <ArrowRight className="w-4 h-4 ml-2" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">{how.kicker}</div>
            <h2 className="mt-3 font-display text-3xl lg:text-5xl font-semibold text-[#111C15] tracking-tight">{how.title}</h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {(how.steps || []).map((s) => (
              <div key={s.n} className="bg-white rounded-2xl border border-[#E5EFE8] p-8 hover:-translate-y-0.5 transition-transform">
                <div className="font-display text-5xl font-bold text-[#10B981]/30 tracking-tight">{s.n}</div>
                <div className="mt-4 font-display text-2xl font-semibold text-[#111C15]">{s.t}</div>
                <p className="mt-2 text-[#5C7063] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Extras (admin-uploadable) */}
      {content.extras && content.extras.length > 0 && (
        <section className="py-16 bg-[#F3F7F4]/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-6">
            {content.extras.map((e, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#E5EFE8] overflow-hidden">
                {e.image_url && <img src={e.image_url} alt={e.title || ""} className="w-full h-48 object-cover" />}
                <div className="p-5">
                  <div className="font-display text-xl font-semibold text-[#111C15]">{e.title}</div>
                  <div className="mt-1 text-[#5C7063] text-sm">{e.caption}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 bg-[#F3F7F4]/60">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#111C15] tracking-tight">{bottom.title}</h2>
          <p className="mt-4 text-lg text-[#5C7063]">{bottom.subtitle}</p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link to="/subscribe" data-testid="bottom-cta-subscribe">
              <Button size="lg" className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md px-8 h-12 font-semibold">{bottom.primary} <ArrowRight className="w-4 h-4 ml-2" /></Button>
            </Link>
            <Link to="/auth" data-testid="bottom-cta-code">
              <Button size="lg" variant="outline" className="rounded-md px-8 h-12 border-[#E5EFE8] hover:bg-white">{bottom.secondary}</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
