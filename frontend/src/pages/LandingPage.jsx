import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { ArrowRight, Salad, FileDown, KeyRound, Check, Sparkles, CreditCard, ShieldCheck } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header
        right={
          <>
            <Link
              to="/admin"
              className="text-sm text-[#5C7063] hover:text-[#10B981]"
              data-testid="admin-link"
            >
              Admin
            </Link>
            <Link to="/auth" data-testid="header-auth-link" className="hidden sm:block">
              <Button variant="outline" className="rounded-md border-[#E5EFE8]">
                I have a code
              </Button>
            </Link>
            <Link to="/subscribe" data-testid="header-subscribe-link">
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md">
                Subscribe
              </Button>
            </Link>
          </>
        }
      />

      {/* HERO */}
      <section className="relative overflow-hidden">
        {/* Large faded APT watermark behind hero */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        >
          <img
            src="/brand/apt-mark.png"
            alt=""
            className="w-[140%] max-w-none opacity-[0.08] lg:opacity-[0.1] -translate-y-4"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5EFE8] bg-white px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-[#5C7063]">
              <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
              Weekly meal prep · made simple
            </div>
            <h1 className="mt-6 font-display text-5xl lg:text-7xl font-bold text-[#111C15] tracking-tight text-balance">
              Eat strong.
              <br />
              <span className="text-[#10B981]">Train stronger.</span>
            </h1>
            <p className="mt-6 text-lg text-[#5C7063] max-w-xl leading-relaxed">
              APT · <em className="text-[#1A3622] not-italic font-medium">bruddatrain</em>
              {" "}— weekly meal plans from <span className="font-medium text-[#1A3622]">Abraham's Personal Training</span>.
              Simple recipes, an auto shopping list, macros and a downloadable PDF you can take to the shop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/subscribe" data-testid="hero-cta-subscribe">
                <Button
                  size="lg"
                  className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md px-7 h-12 text-base font-semibold"
                >
                  Subscribe · €14.99 / mo
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link to="/auth" data-testid="hero-cta-have-code">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-md px-7 h-12 text-base border-[#E5EFE8] hover:bg-[#F3F7F4]"
                >
                  <KeyRound className="w-4 h-4 mr-2" /> I have a 4-digit code
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-[#5C7063]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#10B981]" /> Cancel anytime
              </div>
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-[#10B981]" /> PDF download
              </div>
              <div className="flex items-center gap-2">
                <Salad className="w-4 h-4 text-[#10B981]" /> Mon–Sun plan + macros
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#E5EFE8] bg-white shadow-sm">
              <img
                src="https://images.pexels.com/photos/5794779/pexels-photo-5794779.jpeg"
                alt="Fresh vegetables prepped in containers"
                className="w-full h-[460px] object-cover"
              />
            </div>
            <div className="hidden lg:block absolute -bottom-6 -left-6 bg-white border border-[#E5EFE8] shadow-sm rounded-2xl px-5 py-4 max-w-[260px]">
              <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063]">
                This week
              </div>
              <div className="font-display text-2xl font-bold text-[#111C15] leading-tight mt-1">
                21 meals · macros built in
              </div>
              <div className="text-sm text-[#5C7063] mt-1">
                Real food. Real progress.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING / TWO PATHS */}
      <section id="access" className="py-16 lg:py-24 bg-[#F3F7F4]/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-12">
            <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
              Two ways in
            </div>
            <h2 className="mt-3 font-display text-3xl lg:text-5xl font-semibold text-[#111C15] tracking-tight">
              Pick your path.
            </h2>
            <p className="mt-3 text-[#5C7063]">
              Subscribe and access your plan anytime — or get a weekly 4-digit code from your APT coach.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Subscription card */}
            <div className="bg-white rounded-3xl border border-[#10B981] p-8 lg:p-10 relative overflow-hidden">
              <div className="absolute top-5 right-5 text-[10px] uppercase tracking-[0.2em] bg-[#10B981] text-white px-2.5 py-1 rounded-full">
                Recommended
              </div>
              <div className="inline-flex items-center gap-2 text-[#10B981]">
                <CreditCard className="w-5 h-5" />
                <span className="text-xs uppercase tracking-[0.2em] font-medium">Monthly subscription</span>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-6xl font-bold text-[#111C15] tracking-tight">€14.99</span>
                <span className="text-[#5C7063]">/ month</span>
              </div>
              <ul className="mt-8 space-y-3">
                {[
                  "Instant access to the weekly Mon–Sun plan",
                  "Full recipes with kcal & macros",
                  "Auto shopping list + PDF download",
                  "Cancel anytime — access ends at period end",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[#111C15]">
                    <Check className="w-5 h-5 text-[#10B981] flex-none mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
              <Link to="/subscribe" className="block mt-8" data-testid="pricing-subscribe-btn">
                <Button
                  size="lg"
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                >
                  Subscribe now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {/* Coach code card */}
            <div className="bg-white rounded-3xl border border-[#E5EFE8] p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 text-[#1A3622]">
                <KeyRound className="w-5 h-5" />
                <span className="text-xs uppercase tracking-[0.2em] font-medium">Coaching clients</span>
              </div>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-[#111C15] tracking-tight">4-digit code</span>
              </div>
              <p className="mt-3 text-[#5C7063]">From your APT coach. Rotates every Monday.</p>
              <ul className="mt-8 space-y-3">
                {[
                  "Active 1:1 coaching clients only",
                  "New code every Monday, hand-delivered by Abraham",
                  "Access stops the week your coaching ends",
                  "Want to stay after coaching? Switch to a subscription",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-[#111C15]">
                    <Check className="w-5 h-5 text-[#10B981] flex-none mt-0.5" /> {t}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="block mt-8" data-testid="pricing-have-code-btn">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full rounded-md h-12 font-semibold border-[#E5EFE8] hover:bg-[#F3F7F4]"
                >
                  Enter my code <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
              How it works
            </div>
            <h2 className="mt-3 font-display text-3xl lg:text-5xl font-semibold text-[#111C15] tracking-tight">
              Three steps. No excuses.
            </h2>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Get access", d: "Subscribe for €14.99/month — or use the weekly code from your coach." },
              { n: "02", t: "Get your week", d: "Open the dashboard for a full Mon–Sun plan with kcal & macros." },
              { n: "03", t: "Prep & eat", d: "Download one PDF with meals, recipes and a generated shopping list." },
            ].map((s) => (
              <div
                key={s.n}
                className="bg-white rounded-2xl border border-[#E5EFE8] p-8 hover:-translate-y-0.5 transition-transform"
              >
                <div className="font-display text-5xl font-bold text-[#10B981]/30 tracking-tight">
                  {s.n}
                </div>
                <div className="mt-4 font-display text-2xl font-semibold text-[#111C15]">
                  {s.t}
                </div>
                <p className="mt-2 text-[#5C7063] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-[#F3F7F4]/60">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#111C15] tracking-tight">
            Ready to train like a bruddha?
          </h2>
          <p className="mt-4 text-lg text-[#5C7063]">
            Subscribe in two minutes. Cancel anytime.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Link to="/subscribe" data-testid="bottom-cta-subscribe">
              <Button
                size="lg"
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md px-8 h-12 font-semibold"
              >
                Subscribe · €14.99 / mo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/auth" data-testid="bottom-cta-code">
              <Button
                size="lg"
                variant="outline"
                className="rounded-md px-8 h-12 border-[#E5EFE8] hover:bg-white"
              >
                I have a code
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
