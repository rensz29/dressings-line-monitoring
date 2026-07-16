import { Play, OctagonX, Timer, Ban } from "lucide-react";
import { TOTAL_MACHINES } from "../config/lines.js";
import Sparkline from "./Sparkline.jsx";

/* ============================================================================
   KPI STRIP — machine-status counts across the whole factory at a glance.
============================================================================ */
function KpiCard({ icon: Icon, label, value, unit, color, sub, trend, demo }) {
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col justify-between rounded-md border border-border-subtle bg-surface-2 p-[0.75rem] shadow-e2">
      <div className="flex items-center gap-[0.375rem]">
        <Icon style={{ width: "1rem", height: "1rem", color: color || "var(--color-text-mid)" }} strokeWidth={1.75} />
        <span className="truncate text-[0.625rem] font-bold tracking-[0.08em] text-text-mid uppercase">
          {label}
        </span>
        {demo && (
          <span className="ml-auto rounded-sm border border-border-line px-[0.25rem] text-[0.5rem] font-bold tracking-[0.1em] text-text-low">
            DEMO
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-[0.375rem]">
        <span className="min-w-0">
          <span
            className="text-[2.125rem] leading-none font-bold tabular-nums"
            style={{ color: color || "var(--color-text-hi)" }}
          >
            {value}
          </span>
          {unit && <span className="ml-[0.25rem] text-[0.6875rem] font-semibold text-text-mid">{unit}</span>}
          {sub && <span className="block truncate text-[0.625rem] text-text-low tabular-nums">{sub}</span>}
        </span>
        {trend && <Sparkline points={trend} width={60} height={20} stroke={color || "var(--color-accent-cyan)"} />}
      </div>
    </div>
  );
}

export default function KpiStrip({ counts }) {
  return (
    <div className="flex h-[6rem] shrink-0 gap-[0.75rem]">
      <KpiCard
        icon={Play} label="Running" value={counts.RUNNING} color="var(--color-status-run)"
        sub={`of ${TOTAL_MACHINES} · ${counts.OFFLINE} no data`}
      />
      <KpiCard icon={OctagonX} label="Stopped" value={counts.STOPPED} color="var(--color-status-stop)" />
      <KpiCard icon={Timer} label="Waiting" value={counts.WAITING} color="var(--color-status-wait)" />
      <KpiCard icon={Ban} label="Blocked" value={counts.BLOCKED} color="var(--color-status-blocked)" />
    </div>
  );
}
