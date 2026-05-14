import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { toast } from "sonner";
import axios from "axios";
import { API } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Header, Footer } from "../components/Layout";
import { Button } from "../components/ui/button";
import { CheckCircle2, Loader2, XCircle, ArrowRight } from "lucide-react";

const MAX_ATTEMPTS = 8;
const POLL_INTERVAL = 2500;

export default function SubscribeSuccessPage() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  const { setClientFromExternal } = useAuth();

  const [state, setState] = useState("polling"); // polling | success | failed | expired
  const [attempts, setAttempts] = useState(0);
  const stopped = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      setState("failed");
      return;
    }
    let attempt = 0;
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const r = await axios.get(`${API}/payments/checkout/status/${sessionId}`);
        const ps = r.data?.payment_status;
        const st = r.data?.status;
        if (ps === "paid") {
          // store token from response and log in
          if (r.data.token && r.data.client) {
            localStorage.setItem("abpt_token", r.data.token);
            setClientFromExternal?.(r.data.client);
          }
          setState("success");
          toast.success("Subscription active!");
          return;
        }
        if (st === "expired") {
          setState("expired");
          return;
        }
      } catch (e) {
        // continue
      }
      attempt += 1;
      setAttempts(attempt);
      if (attempt >= MAX_ATTEMPTS) {
        setState("failed");
        return;
      }
      setTimeout(poll, POLL_INTERVAL);
    };

    poll();
    return () => {
      cancelled = true;
      stopped.current = true;
    };
  }, [sessionId, setClientFromExternal]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FCFDFB]">
      <Header />
      <main className="flex-1 py-16">
        <div className="max-w-lg mx-auto px-4">
          <div className="bg-white border border-[#E5EFE8] rounded-2xl p-10 text-center shadow-sm">
            {state === "polling" && (
              <>
                <Loader2 className="w-12 h-12 mx-auto text-[#10B981] animate-spin" />
                <h1 className="mt-6 font-display text-3xl font-bold text-[#111C15]">
                  Confirming your payment…
                </h1>
                <p className="mt-2 text-[#5C7063]">
                  This usually takes a few seconds. Attempt {attempts}/{MAX_ATTEMPTS}.
                </p>
              </>
            )}
            {state === "success" && (
              <>
                <CheckCircle2 className="w-14 h-14 mx-auto text-[#10B981]" />
                <h1 className="mt-6 font-display text-3xl font-bold text-[#111C15]">
                  You're in!
                </h1>
                <p className="mt-2 text-[#5C7063]">
                  Your APT subscription is active for the next 30 days.
                </p>
                <Button
                  className="mt-8 w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold"
                  onClick={() => navigate("/dashboard")}
                  data-testid="goto-dashboard-btn"
                >
                  Go to my plan <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </>
            )}
            {(state === "failed" || state === "expired") && (
              <>
                <XCircle className="w-14 h-14 mx-auto text-red-500" />
                <h1 className="mt-6 font-display text-3xl font-bold text-[#111C15]">
                  {state === "expired" ? "Session expired" : "Payment not confirmed"}
                </h1>
                <p className="mt-2 text-[#5C7063]">
                  We couldn't confirm your payment automatically. If you completed payment, please contact us.
                </p>
                <Link to="/subscribe">
                  <Button className="mt-8 w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-md h-12 font-semibold">
                    Try again
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
