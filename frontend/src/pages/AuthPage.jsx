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
    <div className="min-h-screen flex flex-col bg-[#FCFDFB]">
      <Header />
      <main className="flex-1 py-12 lg:py-20">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F7F4] border border-[#E5EFE8] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#5C7063]">
              <KeyRound className="w-3 h-3 text-[#10B981]" /> Coaching clients
            </div>
            <h1 className="font-display text-4xl font-bold mt-4 text-[#111C15] tracking-tight">
              Enter your code
            </h1>
            <p className="mt-2 text-[#5C7063]">
              Your APT coach sends a fresh 4-digit code every Monday.
            </p>
          </div>

          <div className="bg-white border border-[#E5EFE8] rounded-2xl p-6 shadow-sm">
            <form onSubmit={onLogin} className="space-y-5">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  data-testid="login-email-input"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label>4-digit code</Label>
                <div className="mt-3 flex justify-center">
                  <OTPInput value={code} onChange={setCode} />
                </div>
              </div>
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                data-testid="login-submit-btn"
              >
                {busy ? "…" : "Enter dashboard"}
                {!busy && <ArrowRight className="w-4 h-4 ml-2" />}
              </Button>
            </form>
          </div>

          <div className="text-center mt-6 text-sm text-[#5C7063]">
            Not coaching with Abraham?{" "}
            <Link to="/subscribe" className="text-[#10B981] hover:underline font-medium" data-testid="to-subscribe-link">
              Subscribe for €14.99/mo
            </Link>
          </div>
          <div className="text-center mt-3 text-xs text-[#5C7063]">
            <Link to="/" className="hover:text-[#10B981]" data-testid="back-home-link">
              ← Back to home
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
