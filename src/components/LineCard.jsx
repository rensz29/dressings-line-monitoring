import { STATUS } from "../config/lines.js";
import { fmtDuration } from "../utils/format.js";
import HealthRing from "./HealthRing.jsx";
import MachineFlow from "./MachineFlow.jsx";
import Sparkline from "./Sparkline.jsx";
import StatusIndicator from "./StatusIndicator.jsx";

/* ============================================================================
   LINE CARD — one production line. Healthy lines stay calm; a line whose
   worst machine is STOPPED (or BLOCKED/WAITING) gets an accent border + glow
   so it pulls the eye from across the room. Cards never re-order: operators
   map board position to floor position.
============================================================================ */
const ATTENTION = {
  STOPPED: { border: "var(--color-status-stop)", shadow: "0 0 1.25rem var(--color-glow-stop), var(--shadow-e2)" },
  BLOCKED: { border: "var(--color-status-blocked)", shadow: "0 0 1rem var(--color-glow-blocked), var(--shadow-e2)" },
  WAITING: { border: "var(--color-status-wait)", shadow: "var(--shadow-e2)" },
};

export default function LineCard({ line, statuses, metrics, sim, now, onClick, maxRows }) {
  const worst = metrics.worst;
  const attn = ATTENTION[worst];

  return (
    <div
      className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-surface-1"
      style={{
        borderColor: attn ? attn.border : "var(--color-border-subtle)",
        boxShadow: attn?.shadow || "var(--shadow-e2)",
      }}
    >
      {/* nameplate */}
      <div className="flex h-[2.5rem] shrink-0 items-center justify-between gap-[0.5rem] border-b border-border-subtle bg-gradient-to-b from-surface-2 to-surface-1 px-[0.625rem]">
        <span className="truncate text-[1rem] font-extrabold tracking-[0.06em] text-text-hi">
          {line.name}
        </span>
        <span className="flex shrink-0 items-center gap-[0.5rem]">
          <StatusIndicator status={worst} size={10} />
          <HealthRing value={metrics.health} size={30} />
        </span>
      </div>

      {/* machine flow */}
      <div className="flex min-h-0 flex-1 flex-col p-[0.5rem] pb-[0.25rem]">
        <MachineFlow line={line} statuses={statuses} now={now} onClick={onClick} maxRows={maxRows} />
      </div>

      {/* footer metrics */}
      <div className="flex h-[1.625rem] shrink-0 items-center gap-[0.5rem] px-[0.625rem] text-[0.625rem] font-semibold tracking-[0.04em] text-text-mid tabular-nums">
        <span title="Machines running / active">
          RUN {metrics.runningPct == null ? "—" : `${Math.round(metrics.runningPct)}%`}
        </span>
        <span className="text-text-low">·</span>
        <span title="Downtime since session start">DT {fmtDuration(metrics.downtime)}</span>
        <span className="text-text-low">·</span>
        <span style={{ color: metrics.faultCount > 0 ? STATUS.STOPPED.color : undefined }} title="Stopped + blocked machines">
          FLT {metrics.faultCount}
        </span>
        <span className="flex-1" />
        <Sparkline points={sim?.trend} width={56} height={16} stroke="var(--color-text-low)" />
        <span
          aria-label={metrics.fresh ? "Data fresh" : "Data stale"}
          className="size-[0.3125rem] rounded-full"
          style={{
            background: metrics.fresh ? "var(--color-status-run)" : "var(--color-status-nodata)",
            animation: metrics.fresh ? "an-conn 2.4s ease-in-out infinite" : undefined,
          }}
        />
      </div>
    </div>
  );
}
