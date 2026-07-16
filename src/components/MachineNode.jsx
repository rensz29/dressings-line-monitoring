import { STATUS } from "../config/lines.js";
import { machineIcon, STATUS_ICONS } from "../config/icons.jsx";
import { fmtAgo } from "../utils/format.js";
import StatusIndicator from "./StatusIndicator.jsx";

/* ============================================================================
   MACHINE NODE — compact control-panel row (~45px). Every status is shown
   with color + icon + text label so no state relies on color alone.
   Height: each node takes 1/maxRows of the stack so boxes stay uniform
   across the whole board row.
============================================================================ */
export default function MachineNode({ line, machine, entry, now, onClick, maxRows }) {
  const status = entry?.status || "OFFLINE";
  const st = STATUS[status];
  const MIcon = machineIcon(machine.type);
  const SIcon = STATUS_ICONS[status];
  const live = status !== "OFFLINE";

  return (
    <button
      onClick={() => onClick({ line, machine, entry })}
      title={`${line.name} — ${machine.label}: ${st.label}`}
      className="group flex w-full min-h-0 cursor-pointer items-center gap-[0.5rem] rounded-sm border border-border-subtle bg-gradient-to-b from-surface-2 to-surface-1 px-[0.5rem] text-left shadow-e1 transition-[transform,background-color] duration-150 hover:-translate-y-px hover:bg-surface-3"
      style={{
        flex: `0 1 calc((100% - ${(maxRows - 1) * 0.375}rem) / ${maxRows})`,
        borderLeft: `0.25rem solid ${st.color}`,
        opacity: live ? 1 : 0.6,
      }}
    >
      <span
        className="flex size-[1.75rem] shrink-0 items-center justify-center rounded-sm bg-bg-deep"
        style={{ color: st.color }}
      >
        <MIcon style={{ width: "1rem", height: "1rem", opacity: live ? 0.9 : 0.5 }} strokeWidth={1.75} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.8125rem] leading-[1.2] font-semibold text-text-hi">
          {machine.label}
        </span>
        <span
          className="flex items-center gap-[0.25rem] text-[0.625rem] font-bold tracking-[0.08em]"
          style={{ color: st.color }}
        >
          <SIcon style={{ width: "0.625rem", height: "0.625rem" }} strokeWidth={2.5} />
          {st.label}
        </span>
      </span>

      <span className="flex shrink-0 flex-col items-end gap-[0.2rem]">
        <span className="text-[0.6875rem] leading-none text-text-mid tabular-nums">
          {entry?.ts ? fmtAgo(entry.ts, now) : "—"}
        </span>
        <StatusIndicator status={status} size={10} />
      </span>
    </button>
  );
}
