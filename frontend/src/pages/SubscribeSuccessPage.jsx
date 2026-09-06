import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { CheckCircle2, Loader2, ArrowRight, Mail } from "lucide-react";

export default function SubscribeSuccessPage() {
  const navigate = useNavigate();
  const { setClientFromExternal } = useAuth();

  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [activated, setActivated] = useState(false);
  const [message, setMessage] = useState("");

  const tryLookup = async () => {
    if (!email.trim()) {
      toast.error("Enter the email you used to pay");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const r = await axios.post(`${API}/payments/lookup`, { email: email.trim() });
      if (r.data?.active) {
        localStorage.setItem("abpt_token", r.data.token);
        setClientFromExternal?.(r.data.client);
        setActivated(true);
        toast.success("Subscription active!");
      } else {
        setMessage(r.data?.message || "Not active yet — try again in a few seconds.");
      }
    } catch (err) {
      setMessage(err?.response?.data?.detail || "Lookup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d10]">
      <Header />
      <main className="flex-1 py-20">
        <div className="max-w-lg mx-auto px-4">
          <div className="rounded-[1.75rem] border border-white/10 bg-[#15161a] p-9 text-center">
            {activated ? (
              <>
                <CheckCircle2 className="mx-auto h-14 w-14 text-[#38bdf8]" />
                <h1 className="mt-7 font-display text-3xl font-bold uppercase tracking-tight text-white">
                  You're in
                </h1>
                <p className="mt-3 text-sm text-white/50">
                  Your APT subscription is active. Time to prep.
                </p>
                <Button
                  className="mt-9 h-14 w-full rounded-full bg-[#38bdf8] text-xs font-semibold uppercase tracking-[0.2em] text-[#08090b] hover:bg-white"
                  onClick={() => navigate("/dashboard")}
                  data-testid="goto-dashboard-btn"
                >
                  Go to my plan <ArrowRight className="ml-3 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Mail className="mx-auto h-12 w-12 text-[#38bdf8]" />
                <h1 className="mt-7 font-display text-3xl font-bold uppercase tracking-tight text-white">
                  Activate your access
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-white/50">
                  Enter the email you used at Stripe checkout. We'll confirm your subscription and log
                  you in.
                </p>
                <div className="mt-7 text-left">
                  <Label
                    htmlFor="email"
                    className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45"
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 h-12 border-white/15 bg-[#0c0d10] text-white placeholder:text-white/25"
                    data-testid="activate-email-input"
                  />
                </div>
                <Button
                  className="mt-6 h-14 w-full rounded-full bg-[#38bdf8] text-xs font-semibold uppercase tracking-[0.2em] text-[#08090b] hover:bg-white"
                  onClick={tryLookup}
                  disabled={busy}
                  data-testid="activate-btn"
                >
                  {busy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking…
                    </>
                  ) : (
                    "Activate my subscription"
                  )}
                </Button>
                {message && (
                  <p
                    className="mt-5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200"
                    data-testid="activate-message"
                  >
                    {message}
                  </p>
                )}
                <p className="mt-7 text-xs leading-relaxed text-white/30">
                  Just paid and not seeing it yet? Stripe sometimes takes a few seconds. Wait 10
                  seconds and try again.
                </p>
                <div className="mt-4 text-xs text-white/30">
                  Need help?{" "}
                  <Link to="/" className="underline hover:text-white">
                    Back to home
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
