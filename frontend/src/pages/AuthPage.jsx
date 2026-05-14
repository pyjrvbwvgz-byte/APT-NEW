import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../lib/auth";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../components/ui/tabs";
import OTPInput from "../components/OTPInput";
import { Sparkles } from "lucide-react";

export default function AuthPage() {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  const [busy, setBusy] = useState(false);

  // register state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  // login state
  const [loginEmail, setLoginEmail] = useState("");
  const [code, setCode] = useState("");

  const [issuedCode, setIssuedCode] = useState(null);

  const onRegister = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    setBusy(true);
    try {
      const c = await register(name, email);
      setIssuedCode(c.code);
      toast.success("Welcome to APT! Your code is ready.");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const onLogin = async (e) => {
    e?.preventDefault?.();
    if (!loginEmail || code.length !== 4) {
      toast.error("Enter email and 4-digit code");
      return;
    }
    setBusy(true);
    try {
      await login(loginEmail, code);
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
              <Sparkles className="w-3 h-3 text-[#10B981]" /> Members
            </div>
            <h1 className="font-display text-4xl font-bold mt-4 text-[#111C15] tracking-tight">
              Access your plan
            </h1>
            <p className="mt-2 text-[#5C7063]">
              Codes refresh every 7 days. Keep yours handy.
            </p>
          </div>

          {issuedCode ? (
            <div className="bg-white border border-[#E5EFE8] rounded-2xl p-8 text-center shadow-sm">
              <div className="text-xs uppercase tracking-[0.18em] text-[#5C7063]">
                Your access code
              </div>
              <div
                className="mt-3 font-display text-6xl font-bold text-[#10B981] tracking-[0.3em]"
                data-testid="issued-code"
              >
                {issuedCode}
              </div>
              <p className="mt-4 text-sm text-[#5C7063]">
                Save this code. It expires in 7 days and you can regenerate it
                anytime from your dashboard.
              </p>
              <Button
                className="mt-6 w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12"
                onClick={() => navigate("/dashboard")}
                data-testid="goto-dashboard-btn"
              >
                Go to my plan
              </Button>
            </div>
          ) : (
            <Tabs defaultValue="login" className="bg-white border border-[#E5EFE8] rounded-2xl p-6 shadow-sm">
              <TabsList className="grid grid-cols-2 w-full bg-[#F3F7F4]">
                <TabsTrigger value="login" data-testid="tab-login">
                  I have a code
                </TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">
                  New here
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="pt-6">
                <form onSubmit={onLogin} className="space-y-5">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="you@email.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
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
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="pt-6">
                <form onSubmit={onRegister} className="space-y-5">
                  <div>
                    <Label htmlFor="reg-name">Full name</Label>
                    <Input
                      id="reg-name"
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      data-testid="register-name-input"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="reg-email">Email</Label>
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="you@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      data-testid="register-email-input"
                      className="mt-1.5"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={busy}
                    className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                    data-testid="register-submit-btn"
                  >
                    {busy ? "Creating…" : "Get my 4-digit code"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}

          <div className="text-center mt-6 text-sm text-[#5C7063]">
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
