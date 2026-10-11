import { toast } from "sonner";
import { KeyRound, Copy, CreditCard, CalendarClock } from "lucide-react";

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/** Shows the member their own weekly code + expiry, and subscription state. */
export default function AccessCard({ client }) {
  const code = client?.code;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code || "");
      toast.success("Code copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div
      className="bg-white border border-[#E5EFE8] rounded-2xl p-4 sm:p-5"
      data-testid="access-card"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C7063]">
            <KeyRound className="w-3.5 h-3.5 text-[#10B981]" /> Your access code
          </div>
          <div
            className="font-display text-3xl sm:text-4xl font-bold tracking-[0.2em] text-[#111C15] tabular-nums mt-2"
            data-testid="access-code-value"
          >
            {code || "—"}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#5C7063]">
            <span className="inline-flex items-center gap-1">
              <CalendarClock className="w-3.5 h-3.5" /> Valid until {fmt(client?.code_expires_at)}
            </span>
            <span className="text-[#9AAAA0]">New code every Sunday, 6am</span>
          </div>
          {client?.is_subscribed && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/10 text-[#059669] px-3 py-1 text-xs font-semibold"
              data-testid="subscription-badge"
            >
              <CreditCard className="w-3.5 h-3.5" /> Subscriber · renews{" "}
              {fmt(client?.subscription_expires_at)}
            </div>
          )}
        </div>
        {code && (
          <button
            onClick={copy}
            className="flex-none w-11 h-11 grid place-items-center rounded-xl border border-[#E5EFE8] text-[#5C7063] active:bg-[#F3F7F4]"
            aria-label="Copy code"
            data-testid="copy-code-btn"
          >
            <Copy className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
