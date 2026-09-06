import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { useSiteContent } from "../lib/siteContent";
import { ArrowRight, KeyRound, ArrowDown } from "lucide-react";

const shapeClass = {
  circle: "rounded-full aspect-square",
  rounded: "rounded-[2rem] aspect-[4/3]",
  skew: "clip-skew aspect-[4/3]",
};

export default function LandingPage() {
  const { content } = useSiteContent();
  const l = content.landing || {};
  const h = l.hero || {};
  const stats = l.stats || {};
  const features = l.features || {};
  const how = l.how || {};
  const bottom = l.cta || {};

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d10]">
      <Header
        marketing
        right={
          <>
            <Link to="/auth" data-testid="header-auth-link">
              <Button
                variant="ghost"
                className="h-10 rounded-full px-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70 hover:bg-white/5 hover:text-white"
              >
                Client code
              </Button>
            </Link>
            <Link to="/subscribe" data-testid="header-subscribe-link">
              <Button className="h-10 rounded-full bg-[#38bdf8] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#08090b] hover:bg-white">
                Subscribe
              </Button>
            </Link>
          </>
        }
      />

      {/* ── HERO ───────────────────────────────────────── */}
      <section className="relative isolate grain overflow-hidden" data-testid="hero-section">
        {h.bg_image_url && (
          <img
            src={h.bg_image_url}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(105deg,#0c0d10_8%,rgba(12,13,16,0.82)_45%,rgba(12,13,16,0.35)_100%)]"
        />
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 pt-24 pb-20 lg:pt-36 lg:pb-32">
          <div className="max-w-4xl rise-in">
            <div className="flex items-center gap-4">
              <span className="h-px w-14 bg-[#38bdf8]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#38bdf8]">
                {h.kicker}
              </span>
            </div>
            <h1 className="mt-8 font-display text-[13vw] leading-[0.86] font-bold uppercase tracking-tight text-white sm:text-6xl lg:text-[7.5rem]">
              {h.title_prefix}{" "}
              <span className="font-serif-accent block normal-case italic text-[#38bdf8]">
                {h.title_highlight}
              </span>
            </h1>
            <p className="mt-9 max-w-xl text-base leading-relaxed text-white/55 lg:text-lg">
              {h.subtitle}
            </p>
            <div className="mt-11 flex flex-wrap items-center gap-4">
              <Link to="/subscribe" data-testid="hero-cta-subscribe">
                <Button className="group h-14 rounded-full bg-[#38bdf8] px-9 text-xs font-semibold uppercase tracking-[0.2em] text-[#08090b] hover:bg-white">
                  {h.primary_cta}
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/auth" data-testid="hero-cta-have-code">
                <Button
                  variant="outline"
                  className="h-14 rounded-full border-white/20 bg-transparent px-9 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/5 hover:text-white"
                >
                  <KeyRound className="mr-3 h-4 w-4" /> {h.secondary_cta}
                </Button>
              </Link>
            </div>
          </div>
          <div className="mt-24 hidden items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/30 lg:flex">
            <ArrowDown className="h-4 w-4 animate-bounce" /> Scroll
          </div>
        </div>
      </section>

      {/* ── STATS ──────────────────────────────────────── */}
      <section className="border-y border-white/10 bg-[#101216]" data-testid="stats-section">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-16 lg:py-24">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#38bdf8]">
                {stats.kicker}
              </div>
              <h2 className="mt-4 max-w-lg font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight text-white lg:text-5xl">
                {stats.title}
              </h2>
            </div>
          </div>
          <div className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
            {(stats.items || []).map((s, i) => (
              <div
                key={i}
                className="border-l border-white/10 pl-5"
                data-testid={`stat-item-${i}`}
              >
                <div className="font-display text-4xl font-bold tracking-tight text-[#38bdf8] lg:text-6xl">
                  {s.value}
                </div>
                <div className="mt-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────── */}
      <section id="meals" className="py-20 lg:py-32" data-testid="features-section">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#38bdf8]">
              {features.kicker}
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white lg:text-6xl">
              {features.title}
            </h2>
          </div>

          <div className="mt-20 space-y-24 lg:space-y-32">
            {(features.items || []).map((f, i) => (
              <div
                key={i}
                className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16"
                data-testid={`feature-row-${i}`}
              >
                <div
                  className={`lg:col-span-6 ${i % 2 === 1 ? "lg:order-2" : ""}`}
                >
                  <div className="overflow-hidden bg-[#15161a]">
                    {f.image_url && (
                      <img
                        src={f.image_url}
                        alt={f.title}
                        className={`w-full object-cover ${shapeClass[f.shape] || shapeClass.rounded}`}
                      />
                    )}
                  </div>
                </div>
                <div className="lg:col-span-6">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-sm font-bold text-white/20">
                      0{i + 1}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#38bdf8]">
                      {f.kicker}
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-3xl font-bold uppercase leading-[1.02] tracking-tight text-white lg:text-5xl">
                    {f.title}
                  </h3>
                  <p className="mt-6 max-w-lg text-base leading-relaxed text-white/50">
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW ────────────────────────────────────────── */}
      <section
        id="about"
        className="border-y border-white/10 bg-[#101216] py-20 lg:py-32"
        data-testid="how-section"
      >
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="max-w-2xl">
            <div className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#38bdf8]">
              {how.kicker}
            </div>
            <h2 className="mt-4 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white lg:text-6xl">
              {how.title}
            </h2>
          </div>
          <div className="mt-16 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
            {(how.steps || []).map((s, i) => (
              <div
                key={i}
                className="group bg-[#101216] p-8 transition-colors hover:bg-[#15171c]"
                data-testid={`how-step-${i}`}
              >
                <div className="font-display text-5xl font-bold tracking-tight text-white/10 group-hover:text-[#38bdf8]/40">
                  {s.n}
                </div>
                <div className="mt-8 font-display text-xl font-bold uppercase tracking-tight text-white">
                  {s.t}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/45">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXTRAS (admin-uploadable gallery) ──────────── */}
      {content.extras && content.extras.length > 0 && (
        <section className="py-20 lg:py-28" data-testid="extras-section">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 grid gap-8 md:grid-cols-3">
            {content.extras.map((e, i) => (
              <div key={i} className="group" data-testid={`extra-card-${i}`}>
                {e.image_url && (
                  <div className="overflow-hidden rounded-[1.5rem]">
                    <img
                      src={e.image_url}
                      alt={e.title || ""}
                      className="h-64 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="mt-5 font-display text-xl font-bold uppercase tracking-tight text-white">
                  {e.title}
                </div>
                <div className="mt-2 text-sm text-white/45">{e.caption}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── CLOSING CTA ────────────────────────────────── */}
      <section id="plans" className="relative overflow-hidden py-24 lg:py-36" data-testid="cta-section">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <img src="/brand/apt-mark.png" alt="" className="w-[120%] max-w-none opacity-[0.04] logo-on-dark" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10">
          <h2 className="max-w-4xl font-display text-4xl font-bold uppercase leading-[0.92] tracking-tight text-white lg:text-7xl">
            {bottom.title}
          </h2>
          <p className="mt-8 max-w-xl text-base leading-relaxed text-white/50 lg:text-lg">
            {bottom.subtitle}
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link to="/subscribe" data-testid="bottom-cta-subscribe">
              <Button className="group h-14 rounded-full bg-[#38bdf8] px-9 text-xs font-semibold uppercase tracking-[0.2em] text-[#08090b] hover:bg-white">
                {bottom.primary}
                <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link to="/auth" data-testid="bottom-cta-code">
              <Button
                variant="outline"
                className="h-14 rounded-full border-white/20 bg-transparent px-9 text-xs font-semibold uppercase tracking-[0.2em] text-white hover:bg-white/5 hover:text-white"
              >
                {bottom.secondary}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
