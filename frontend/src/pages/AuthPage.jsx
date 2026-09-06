import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import OTPInput from "../components/OTPInput";
import { KeyRound, ArrowRight } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [busy, setBusy] = useState(false);

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");

  const onLogin = async (e) => {
    e?.preventDefault?.();
    if (!email || code.length !== 4) {
      toast.error("Enter email and your 4-digit code");
      return;
    }
    setBusy(true);
    try {
      await login(email, code);
      toast.success("Let's go!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0d10]">
      <Header />
      <main className="flex-1 py-16 lg:py-24">
        <div className="max-w-md mx-auto px-4">
          <div className="mb-10">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#38bdf8]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#38bdf8]">
                Coaching clients
              </span>
            </div>
            <h1 className="mt-6 font-display text-4xl font-bold uppercase leading-[0.95] tracking-tight text-white lg:text-5xl">
              Enter your code
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-white/50">
              Your APT coach sends a fresh 4-digit code every Monday.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-[#15161a] p-7">
            <form onSubmit={onLogin} className="space-y-6">
              <div>
                <Label
                  htmlFor="login-email"
                  className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45"
                >
                  Email
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email-input"
                  className="mt-2 h-12 border-white/15 bg-[#0c0d10] text-white placeholder:text-white/25"
                />
              </div>
              <div>
                <Label className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  4-digit code
                </Label>
                <div className="mt-4 flex justify-center">
                  <OTPInput value={code} onChange={setCode} />
                </div>
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="h-14 w-full rounded-full bg-[#38bdf8] text-xs font-semibold uppercase tracking-[0.2em] text-[#08090b] hover:bg-white"
                data-testid="login-submit-btn"
              >
                {busy ? "…" : "Enter dashboard"}
                {!busy && <ArrowRight className="ml-3 h-4 w-4" />}
              </Button>
            </form>
          </div>

          <div className="mt-8 flex items-start gap-3 text-sm text-white/45">
            <KeyRound className="mt-0.5 h-4 w-4 flex-none text-[#38bdf8]" />
            <div>
              Not coaching with Abraham?{" "}
              <Link
                to="/subscribe"
                className="font-medium text-[#38bdf8] hover:text-white"
                data-testid="to-subscribe-link"
              >
                Subscribe for €14.99/mo
              </Link>
            </div>
          </div>
          <div className="mt-4 text-xs text-white/30">
            <Link to="/" className="hover:text-white" data-testid="back-home-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
