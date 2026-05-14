import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API } from "../lib/api";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Check, CreditCard, ShieldCheck, ArrowLeft, Lock, ArrowRight, KeyRound } from "lucide-react";

export default function SubscribePage() {
  const [params] = useSearchParams();
  const cancelled = params.get("cancelled");
  const [paymentLink, setPaymentLink] = useState("");

  useEffect(() => {
    axios.get(`${API}/pricing`).then((r) => setPaymentLink(r.data?.payment_link || ""));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFDFB]">
      <Header />
      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-start">
          {/* Left */}
          <div>
            <Link
              to="/"
              className="inline-flex items-center text-sm text-[#5C7063] hover:text-[#10B981] mb-6"
              data-testid="back-home-link"
            >
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to home
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F7F4] border border-[#E5EFE8] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#5C7063]">
              <CreditCard className="w-3 h-3 text-[#10B981]" /> Monthly subscription
            </div>
            <h1 className="font-display text-4xl lg:text-5xl font-bold mt-4 text-[#111C15] tracking-tight">
              €14.99 / month.
            </h1>
            <p className="mt-3 text-[#5C7063]">
              Full access to weekly meal plans, recipes with macros, the auto shopping list and PDF download. Cancel anytime.
            </p>

            {cancelled && (
              <div
                className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                data-testid="cancelled-notice"
              >
                Checkout was cancelled. No payment was taken — try again when you're ready.
              </div>
            )}

            <div className="mt-8 bg-white border border-[#E5EFE8] rounded-2xl p-6 shadow-sm">
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
                  className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                  data-testid="subscribe-submit-btn"
                >
                  Continue to secure checkout <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
              <div className="flex items-center justify-center gap-2 text-xs text-[#5C7063] pt-4">
                <Lock className="w-3 h-3" /> Secure payment by Stripe
              </div>
              <p className="text-xs text-[#5C7063] mt-3 text-center leading-relaxed">
                You'll enter your card details on Stripe. After payment we'll bring you back to log in.
              </p>
            </div>

            <div className="mt-6 text-sm text-[#5C7063] text-center">
              Already paid?{" "}
              <Link to="/subscribe/success" className="text-[#10B981] hover:underline font-medium">
                Activate access
              </Link>
            </div>
          </div>

          {/* Right */}
          <div className="bg-white border border-[#E5EFE8] rounded-2xl p-8 lg:sticky lg:top-24">
            <div className="text-xs uppercase tracking-[0.18em] text-[#10B981] font-medium">
              What's included
            </div>
            <h2 className="font-display text-2xl font-semibold text-[#111C15] mt-2">
              Everything you need to prep.
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                "Weekly Mon–Sun meal plan with 21 meals",
                "Per-recipe kcal, protein, carbs & fat",
                "Auto-aggregated shopping list",
                "Downloadable combined PDF",
                "New menus every Monday",
                "Cancel anytime — self-service in Stripe",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[#111C15]">
                  <Check className="w-5 h-5 text-[#10B981] flex-none mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-[#E5EFE8] pt-6 flex items-start gap-3 text-sm text-[#5C7063]">
              <KeyRound className="w-5 h-5 text-[#10B981] flex-none" />
              <div>
                Already a coaching client? Use your weekly{" "}
                <Link to="/auth" className="underline text-[#1A3622] hover:text-[#10B981]">
                  4-digit code instead
                </Link>
                .
              </div>
            </div>
            <div className="mt-3 flex items-start gap-3 text-sm text-[#5C7063]">
              <ShieldCheck className="w-5 h-5 text-[#10B981] flex-none" />
              <div>Powered by Stripe. We never see or store your card details.</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
