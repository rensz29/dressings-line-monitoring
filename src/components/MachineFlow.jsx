import { keyOf } from "../config/lines.js";
import MachineNode from "./MachineNode.jsx";

/* ============================================================================
   MACHINE FLOW — vertical process sequence, top = infeed. Short connector
   bars between stations read as material flow; a connector brightens when
   the upstream machine is running.
============================================================================ */
export default function MachineFlow({ line, statuses, now, onClick, maxRows }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col rounded-sm bg-bg-deep p-[0.5rem] shadow-[inset_0_1px_3px_rgb(0_0_0/0.5)]">
      {line.machines.map((m, i) => {
        const entry = statuses[keyOf(line.id, m.type)];
        return (
          <div key={m.type} className="contents">
            {i > 0 && (
              <span
                aria-hidden
                className="ml-[1.3rem] h-[0.375rem] w-[2px] shrink-0"
                style={{
                  background:
                    statuses[keyOf(line.id, line.machines[i - 1].type)]?.status === "RUNNING"
                      ? "var(--color-status-run)"
                      : "var(--color-border-strong)",
                  opacity: 0.7,
                }}
              />
            )}
            <MachineNode
              line={line}
              machine={m}
              entry={entry}
              now={now}
              onClick={onClick}
              maxRows={maxRows}
            />
          </div>
        );
      })}
    </div>
  );
}
