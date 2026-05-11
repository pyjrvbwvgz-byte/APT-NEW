import { Link } from "react-router-dom";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { ArrowRight, Salad, FileDown, Sparkles, KeyRound } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FCFDFB]">
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
            <Link to="/auth" data-testid="header-auth-link">
              <Button className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md">
                Get Access
              </Button>
            </Link>
          </>
        }
      />

      {/* HERO */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 lg:pt-24 lg:pb-20 grid lg:grid-cols-12 gap-10 items-center">
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
              ABPT · <em className="text-[#1A3622] not-italic font-medium">bruddatrain</em> —
              your no-nonsense weekly meal plan. Simple recipes, an auto
              shopping list, and a downloadable PDF you can take to the shop.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/auth" data-testid="hero-cta-access">
                <Button
                  size="lg"
                  className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md px-7 h-12 text-base font-semibold"
                >
                  Access Weekly Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <a href="#how" data-testid="hero-cta-howitworks">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-md px-7 h-12 text-base border-[#E5EFE8] hover:bg-[#F3F7F4]"
                >
                  How it works
                </Button>
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-[#5C7063]">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#10B981]" /> 4-digit access code
              </div>
              <div className="flex items-center gap-2">
                <FileDown className="w-4 h-4 text-[#10B981]" /> PDF download
              </div>
              <div className="flex items-center gap-2">
                <Salad className="w-4 h-4 text-[#10B981]" /> Mon–Sun plan
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
            <div className="hidden lg:block absolute -bottom-6 -left-6 bg-white border border-[#E5EFE8] shadow-sm rounded-2xl px-5 py-4 max-w-[240px]">
              <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063]">
                This week
              </div>
              <div className="font-display text-2xl font-bold text-[#111C15] leading-tight mt-1">
                21 simple meals
              </div>
              <div className="text-sm text-[#5C7063] mt-1">
                Built around real food.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-16 lg:py-24 bg-[#F3F7F4]/60">
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
              {
                n: "01",
                t: "Register",
                d: "Drop your name and email — we issue your personal 4-digit code that refreshes every 7 days.",
              },
              {
                n: "02",
                t: "Get your week",
                d: "Open the dashboard for a full Mon–Sun plan: breakfast, lunch, dinner with simple recipes.",
              },
              {
                n: "03",
                t: "Prep & eat",
                d: "Download one PDF with meals, recipes and a generated shopping list. Bring it to the shop.",
              },
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
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-[#111C15] tracking-tight">
            Ready to train like a bruddha?
          </h2>
          <p className="mt-4 text-lg text-[#5C7063]">
            Grab your weekly plan in seconds. No subscription gimmicks.
          </p>
          <div className="mt-8">
            <Link to="/auth" data-testid="bottom-cta">
              <Button
                size="lg"
                className="bg-[#10B981] hover:bg-[#059669] text-white rounded-md px-8 h-12 font-semibold"
              >
                Get my access code
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
