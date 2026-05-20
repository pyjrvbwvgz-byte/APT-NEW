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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 py-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white border border-[#E5EFE8] rounded-2xl p-10 text-center shadow-sm">
            {activated ? (
              <>
                <CheckCircle2 className="w-14 h-14 mx-auto text-[#10B981]" />
                <h1 className="mt-6 font-display text-3xl font-bold text-[#111C15]">
                  You're in!
                </h1>
                <p className="mt-2 text-[#5C7063]">
                  Your APT subscription is active. Time to prep.
                </p>
                <Button
                  className="mt-8 w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                  onClick={() => navigate("/dashboard")}
                  data-testid="goto-dashboard-btn"
                >
                  Go to my plan <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            ) : (
              <>
                <Mail className="w-12 h-12 mx-auto text-[#10B981]" />
                <h1 className="mt-6 font-display text-3xl font-bold text-[#111C15]">
                  Activate your access
                </h1>
                <p className="mt-2 text-[#5C7063] text-sm">
                  Enter the email you used at Stripe checkout. We'll confirm your subscription and log you in.
                </p>
                <div className="mt-6 text-left">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1.5"
                    data-testid="activate-email-input"
                  />
                </div>
                <Button
                  className="mt-5 w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                  onClick={tryLookup}
                  disabled={busy}
                  data-testid="activate-btn"
                >
                  {busy ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking…
                    </>
                  ) : (
                    "Activate my subscription"
                  )}
                </Button>
                {message && (
                  <p className="mt-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3" data-testid="activate-message">
                    {message}
                  </p>
                )}
                <p className="mt-6 text-xs text-[#5C7063]">
                  Just paid and not seeing it yet? Stripe sometimes takes a few seconds. Wait 10 seconds and try again.
                </p>
                <div className="mt-4 text-xs text-[#5C7063]">
                  Need help? <Link to="/" className="underline">Back to home</Link>
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
