import { useRef } from "react";
import { GripVertical } from "lucide-react";
import { STATUS } from "../config/lines.js";
import { fmtDuration } from "../utils/format.js";
import HealthRing from "./HealthRing.jsx";
import MachineFlow from "./MachineFlow.jsx";
import Sparkline from "./Sparkline.jsx";
import StatusIndicator from "./StatusIndicator.jsx";

/* ============================================================================
   LINE CARD — one production line. The card glow is binary: GREEN as long as
   at least one machine is RUNNING, RED when none are. A line with no data at
   all (all machines NO DATA) stays calm instead of false-alarming red.
   The nameplate is a drag handle: cards can be rearranged within their row
   (arrangement is shared across displays via server config).
============================================================================ */
const GLOW = {
  green: { border: "var(--color-status-run)", shadow: "0 0 1.25rem var(--color-glow-run), var(--shadow-e2)" },
  red: { border: "var(--color-status-stop)", shadow: "0 0 1.25rem var(--color-glow-stop), var(--shadow-e2)" },
};

export default function LineCard({ line, statuses, metrics, sim, now, onClick, maxRows, dnd }) {
  const rootRef = useRef(null);
  const worst = metrics.worst;
  const noData = metrics.counts.OFFLINE === line.machines.length;
  const glow = noData ? null : metrics.counts.RUNNING > 0 ? GLOW.green : GLOW.red;

  return (
    <div
      ref={rootRef}
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-surface-1"
      style={{
        borderColor: glow ? glow.border : "var(--color-border-subtle)",
        boxShadow: glow?.shadow || "var(--shadow-e2)",
        ...(dnd?.isDragging && { opacity: 0.35, transform: "scale(0.98)" }),
      }}
      onDragOver={dnd?.onDragOver}
      onDragLeave={dnd?.onDragLeave}
      onDrop={dnd?.onDrop}
      onDragEnd={dnd?.onDragEnd}
    >
      {/* insertion indicator — zero layout shift, sits on the drop edge */}
      {dnd?.indicator && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-[0.5rem] z-10 w-[0.1875rem] rounded-full bg-accent-blue"
          style={{
            [dnd.indicator === "before" ? "left" : "right"]: "0.1875rem",
            boxShadow: "0 0 0.625rem var(--color-glow-idle)",
          }}
        />
      )}

      {/* nameplate — drag handle */}
      <div
        draggable={!!dnd}
        onDragStart={dnd ? (e) => dnd.onDragStart(e, rootRef.current) : undefined}
        className="group/plate flex h-[2.5rem] shrink-0 cursor-grab items-center justify-between gap-[0.5rem] border-b border-border-subtle bg-gradient-to-b from-surface-2 to-surface-1 px-[0.625rem] select-none active:cursor-grabbing"
      >
        <span className="flex min-w-0 items-center gap-[0.25rem]">
          <GripVertical
            style={{ width: "0.875rem", height: "0.875rem" }}
            className="-ml-[0.25rem] shrink-0 text-text-low opacity-0 transition-opacity duration-150 group-hover/plate:opacity-60"
            strokeWidth={2}
          />
          <span className="truncate text-[1rem] font-extrabold tracking-[0.06em] text-text-hi">
            {line.name}
          </span>
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
