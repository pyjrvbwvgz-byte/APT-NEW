import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "../lib/api";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Check, ShieldCheck, ArrowLeft, Lock, ArrowRight, KeyRound } from "lucide-react";

const INCLUDED = [
  "Weekly Mon–Sun meal plan with 28 meals (incl. daily snack)",
  "Per-recipe kcal, protein, carbs & fat",
  "Auto-aggregated shopping list",
  "Downloadable combined PDF",
  "New menus every Monday",
  "Cancel anytime — self-service in Stripe",
];

export default function SubscribePage() {
  const [params] = useSearchParams();
  const cancelled = params.get("cancelled");
  const [paymentLink, setPaymentLink] = useState("");

  useEffect(() => {
    axios.get(`${API}/pricing`).then((r) => setPaymentLink(r.data?.payment_link || ""));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d10]">
      <Header />
      <main className="flex-1 py-16 lg:py-24">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-10 grid gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          {/* Left */}
          <div className="lg:col-span-7">
            <Link
              to="/"
              className="mb-8 inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.24em] text-white/40 hover:text-white"
              data-testid="back-home-link"
            >
              <ArrowLeft className="mr-2 h-3.5 w-3.5" /> Back to home
            </Link>
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#38bdf8]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#38bdf8]">
                Monthly subscription
              </span>
            </div>
            <h1 className="mt-6 font-display text-5xl font-bold uppercase leading-[0.9] tracking-tight text-white lg:text-7xl">
              €14.99
              <span className="block font-serif-accent normal-case italic text-[#38bdf8]">
                per month
              </span>
            </h1>
            <p className="mt-7 max-w-lg text-base leading-relaxed text-white/50">
              Full access to weekly meal plans, recipes with macros, the auto shopping list and PDF
              download. Cancel anytime.
            </p>

            {cancelled && (
              <div
                className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200"
                data-testid="cancelled-notice"
              >
                Checkout was cancelled. No payment was taken — try again when you're ready.
              </div>
            )}

            <div className="mt-10 rounded-[1.5rem] border border-white/10 bg-[#15161a] p-7">
              <a
                href={paymentLink || "#"}
                target={paymentLink ? "_self" : "_blank"}
                rel="noopener noreferrer"
                data-testid="subscribe-pay-link"
                aria-disabled={!paymentLink}
                onClick={(e) => {
                  if (!paymentLink) e.preventDefault();
                }}
              >
                <Button
                  type="button"
                  disabled={!paymentLink}
                  className="group h-14 w-full rounded-full bg-[#38bdf8] text-xs font-semibold uppercase tracking-[0.2em] text-[#08090b] hover:bg-white"
                  data-testid="subscribe-submit-btn"
                >
                  Continue to secure checkout
                  <ArrowRight className="ml-3 h-4 w-4 group-hover:translate-x-1" />
                </Button>
              </a>
              <div className="flex items-center justify-center gap-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
                <Lock className="h-3 w-3" /> Secure payment by Stripe
              </div>
              <p className="mt-4 text-center text-xs leading-relaxed text-white/35">
                You'll enter your card details on Stripe. After payment we'll bring you back to log in.
              </p>
            </div>

            <div className="mt-6 text-sm text-white/45">
              Already paid?{" "}
              <Link
                to="/subscribe/success"
                className="font-medium text-[#38bdf8] hover:text-white"
                data-testid="activate-access-link"
              >
                Activate access
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-5 rounded-[1.5rem] border border-white/10 bg-[#101216] p-8 lg:sticky lg:top-28">
            <div className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#38bdf8]">
              What's included
            </div>
            <h2 className="mt-4 font-display text-2xl font-bold uppercase leading-tight tracking-tight text-white">
              Everything you need to prep
            </h2>
            <ul className="mt-8 space-y-4">
              {INCLUDED.map((t) => (
                <li key={t} className="flex gap-3 text-sm text-white/70">
                  <Check className="mt-0.5 h-4 w-4 flex-none text-[#38bdf8]" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 flex items-start gap-3 border-t border-white/10 pt-7 text-sm text-white/45">
              <KeyRound className="h-4 w-4 flex-none text-[#38bdf8]" />
              <div>
                Already a coaching client? Use your weekly{" "}
                <Link to="/auth" className="underline hover:text-white">
                  4-digit code instead
                </Link>
                .
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 text-sm text-white/45">
              <ShieldCheck className="h-4 w-4 flex-none text-[#38bdf8]" />
              <div>Powered by Stripe. We never see or store your card details.</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
