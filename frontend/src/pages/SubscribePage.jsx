import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../lib/api";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Check, CreditCard, ShieldCheck, ArrowLeft, Lock } from "lucide-react";

export default function SubscribePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const cancelled = params.get("cancelled");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubscribe = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Please enter your name and email");
      return;
    }
    setBusy(true);
    try {
      const r = await axios.post(`${API}/payments/checkout`, {
        name: name.trim(),
        email: email.trim(),
        origin_url: window.location.origin,
      });
      if (r.data?.url) {
        window.location.href = r.data.url;
      } else {
        toast.error("Could not start checkout");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Checkout failed");
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFDFB]">
      <Header />
      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 grid lg:grid-cols-2 gap-10 items-start">
          {/* Form */}
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
              Full access to weekly meal plans, recipes with macros, the auto shopping list and PDF download.
            </p>

            {cancelled && (
              <div
                className="mt-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                data-testid="cancelled-notice"
              >
                Checkout was cancelled. No payment was taken — try again when you're ready.
              </div>
            )}

            <form onSubmit={onSubscribe} className="mt-8 bg-white border border-[#E5EFE8] rounded-2xl p-6 space-y-5 shadow-sm">
              <div>
                <Label htmlFor="sub-name">Full name</Label>
                <Input
                  id="sub-name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5"
                  data-testid="subscribe-name-input"
                />
              </div>
              <div>
                <Label htmlFor="sub-email">Email</Label>
                <Input
                  id="sub-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5"
                  data-testid="subscribe-email-input"
                />
                <p className="mt-1.5 text-xs text-[#5C7063]">
                  We'll use this to log you in after payment.
                </p>
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                data-testid="subscribe-submit-btn"
              >
                {busy ? "Redirecting to Stripe…" : "Continue to checkout"}
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-[#5C7063] pt-1">
                <Lock className="w-3 h-3" /> Secure payment by Stripe
              </div>
            </form>
          </div>

          {/* Benefits side */}
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
                "Cancel anytime",
              ].map((t) => (
                <li key={t} className="flex gap-3 text-[#111C15]">
                  <Check className="w-5 h-5 text-[#10B981] flex-none mt-0.5" /> {t}
                </li>
              ))}
            </ul>
            <div className="mt-8 border-t border-[#E5EFE8] pt-6 flex items-start gap-3 text-sm text-[#5C7063]">
              <ShieldCheck className="w-5 h-5 text-[#10B981] flex-none" />
              <div>
                Already a coaching client? Use your weekly{" "}
                <Link to="/auth" className="underline text-[#1A3622] hover:text-[#10B981]">
                  4-digit code instead
                </Link>
                .
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
