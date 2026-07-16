import { BellRing, ShieldCheck, OctagonX, AlertTriangle, Info } from "lucide-react";
import { STATUS } from "../config/lines.js";
import { fmtAgo } from "../utils/format.js";

/* ============================================================================
   ALERT SIDEBAR — persistent event feed derived from status transitions.
   Grouped by severity (critical → warning → info), newest first inside each
   group. A wall display never scrolls: overflow collapses into "+N more".
============================================================================ */
const SEVERITY = {
  critical: { label: "CRITICAL", color: "var(--color-status-stop)", icon: OctagonX },
  warning:  { label: "WARNING",  color: "var(--color-status-wait)", icon: AlertTriangle },
  info:     { label: "INFO",     color: "var(--color-status-info)", icon: Info },
};
const MAX_VISIBLE = 11;

function AlertItem({ ev, now }) {
  const sev = SEVERITY[ev.severity];
  const Icon = sev.icon;
  const fromLabel = ev.from ? (STATUS[ev.from]?.label ?? ev.from) : null;
  const toLabel = STATUS[ev.to]?.label ?? ev.to;
  const toColor = STATUS[ev.to]?.color ?? sev.color;
  return (
    <div
      className="flex shrink-0 items-center gap-[0.5rem] rounded-sm border border-border-subtle bg-surface-1 py-[0.375rem] pr-[0.5rem] pl-[0.625rem]"
      style={{ borderLeft: `3px solid ${sev.color}`, animation: "an-slide-in .35s ease-out" }}
    >
      <Icon style={{ width: "0.875rem", height: "0.875rem", color: sev.color }} className="shrink-0" strokeWidth={2} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] leading-tight font-semibold text-text-hi">
          {ev.lineName} · {ev.machineLabel}
        </span>
        <span className="block text-[0.6875rem] leading-tight text-text-mid">
          {fromLabel ? (
            <>
              {fromLabel} <span className="text-text-low">→</span>{" "}
              <span style={{ color: toColor }} className="font-bold">{toLabel}</span>
            </>
          ) : (
            <span style={{ color: toColor }} className="font-bold">{toLabel}</span>
          )}
        </span>
      </span>
      <span className="shrink-0 text-[0.625rem] text-text-low tabular-nums">{fmtAgo(ev.ts, now)}</span>
    </div>
  );
}

export default function AlertSidebar({ events, now }) {
  const groups = ["critical", "warning", "info"]
    .map((sev) => ({ sev, items: events.filter((e) => e.severity === sev) }))
    .filter((g) => g.items.length > 0);

  let budget = MAX_VISIBLE;
  const hidden = Math.max(0, events.length - MAX_VISIBLE);

  return (
    <aside className="flex w-[18.75rem] shrink-0 flex-col overflow-hidden rounded-lg border border-border-subtle bg-glass shadow-e3 backdrop-blur-md">
      <div className="flex h-[2.5rem] shrink-0 items-center gap-[0.5rem] border-b border-border-subtle px-[0.75rem]">
        <BellRing style={{ width: "1rem", height: "1rem" }} className="text-text-mid" strokeWidth={1.75} />
        <span className="text-[0.8125rem] font-extrabold tracking-[0.12em]">ALERTS</span>
        <span className="ml-auto rounded-full bg-surface-3 px-[0.5rem] py-[0.1rem] text-[0.6875rem] font-bold text-text-mid tabular-nums">
          {events.length}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[0.375rem] overflow-hidden p-[0.5rem]">
        {events.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-[0.5rem] text-text-low">
            <ShieldCheck style={{ width: "1.75rem", height: "1.75rem" }} strokeWidth={1.5} />
            <span className="text-[0.75rem] font-semibold tracking-[0.08em]">ALL STATIONS NOMINAL</span>
          </div>
        ) : (
          <>
            {groups.map(({ sev, items }) => {
              if (budget <= 0) return null;
              const shown = items.slice(0, budget);
              budget -= shown.length;
              return (
                <div key={sev} className="flex flex-col gap-[0.375rem]">
                  <span
                    className="px-[0.125rem] pt-[0.125rem] text-[0.5625rem] font-extrabold tracking-[0.18em]"
                    style={{ color: SEVERITY[sev].color }}
                  >
                    {SEVERITY[sev].label}
                  </span>
                  {shown.map((ev) => <AlertItem key={ev.id} ev={ev} now={now} />)}
                </div>
              );
            })}
            {hidden > 0 && (
              <span className="mt-auto self-center rounded-full border border-border-line px-[0.75rem] py-[0.2rem] text-[0.6875rem] font-bold text-text-low tabular-nums">
                +{hidden} more
              </span>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
