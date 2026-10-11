import { useEffect, useState } from "react";
import { adminApi } from "../../lib/api";
import { Button } from "../../components/ui/button";
import { RefreshCw, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-GB", {
    timeZone: "Europe/Dublin",
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Plain-language panel: when codes last went out, how many, and when the next batch is due. */
export default function CodeStatusPanel({ onRotate, rotating }) {
  const [status, setStatus] = useState(null);

  const load = () => {
    adminApi
      .get("/admin/rotation-status")
      .then((r) => setStatus(r.data))
      .catch(() => setStatus(null));
  };
  useEffect(load, []);

  const ok = status?.rotated_this_week;

  return (
    <div
      className="bg-white border border-[#E5EFE8] rounded-2xl p-4 sm:p-5"
      data-testid="code-status-panel"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5C7063]">
            <CalendarClock className="w-3.5 h-3.5 text-[#10B981]" /> Weekly codes
          </div>
          <div className="mt-2 flex items-center gap-2">
            {ok ? (
              <CheckCircle2 className="w-5 h-5 text-[#10B981] flex-none" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-[#D4A24C] flex-none" />
            )}
            <span className="font-semibold text-[#111C15]" data-testid="code-status-headline">
              {ok ? "This week's codes are out" : "This week's codes are pending"}
            </span>
          </div>
          <dl className="mt-3 space-y-1 text-sm text-[#5C7063]">
            <div>
              Last sent{" "}
              <span className="text-[#111C15]" data-testid="code-status-last">
                {fmt(status?.last_rotated_at)}
              </span>
              {status?.last_rotated_count != null && (
                <span> · {status.last_rotated_count} members</span>
              )}
            </div>
            <div>
              Next batch{" "}
              <span className="text-[#111C15]" data-testid="code-status-next">
                {fmt(status?.next_rotation_at)}
              </span>{" "}
              · Irish time, every Sunday 6am
            </div>
            {status && !status.cron_configured && (
              <div className="text-[#B45309]">Scheduler secret missing — automatic renewal is off.</div>
            )}
          </dl>
        </div>
      </div>
      <Button
        onClick={async () => {
          await onRotate();
          load();
        }}
        disabled={rotating}
        variant="outline"
        className="mt-4 h-12 w-full border-[#E5EFE8] sm:w-auto sm:px-6"
        data-testid="rotate-codes-btn"
      >
        <RefreshCw className={`w-4 h-4 mr-2 ${rotating ? "animate-spin" : ""}`} />
        {rotating ? "Renewing…" : "Renew all codes now"}
      </Button>
    </div>
  );
}
