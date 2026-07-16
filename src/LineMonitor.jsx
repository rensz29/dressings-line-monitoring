import { useState } from "react";
import { LINE_DEFS, ROWS } from "./config/lines.js";
import { useMachineStatus } from "./hooks/useMachineStatus.js";
import { useNow } from "./hooks/useNow.js";
import { useDerivedMetrics } from "./hooks/useDerivedMetrics.js";
import { useSimulatedMetrics } from "./hooks/useSimulatedMetrics.js";
import { useAlertLog } from "./hooks/useAlertLog.js";
import { useConfig } from "./hooks/useConfig.js";
import Header from "./components/Header.jsx";
import KpiStrip from "./components/KpiStrip.jsx";
import LineCard from "./components/LineCard.jsx";
import AlertSidebar from "./components/AlertSidebar.jsx";
import Drawer from "./components/Drawer.jsx";

/* ============================================================================
   LINE MONITOR — viewport-locked control-room board.
   Hierarchy: header → factory KPIs → line cards (machine flow inside) →
   alert sidebar. Two card rows grouped by line length so every machine node
   on the board is the same height. Nothing scrolls on a wall display.
============================================================================ */
const rowMax = (row) => Math.max(...row.map((id) => LINE_DEFS[id].machines.length));

export default function LineMonitor({ onOpenSettings }) {
  const { statuses, connected } = useMachineStatus();
  const now = useNow();
  const metrics = useDerivedMetrics(statuses, now);
  const sim = useSimulatedMetrics();
  const events = useAlertLog(statuses, connected);
  const { config } = useConfig();
  const [sel, setSel] = useState(null);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header now={now} connected={connected} links={sim.links} factoryHealth={metrics.factoryHealth} onOpenSettings={onOpenSettings} />

      <div className="flex min-h-0 flex-1 gap-[0.75rem] p-[0.75rem]">
        {/* main column: KPIs + two rows of line cards */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-[0.75rem]">
          <KpiStrip counts={metrics.counts} />
          <div
            className="grid min-h-0 flex-1 gap-[0.75rem]"
            style={{ gridTemplateRows: "minmax(0, 1.61fr) minmax(0, 1fr)" }}
          >
            {ROWS.map((row, ri) => {
              const max = rowMax(row);
              return (
                <div key={ri} className="flex min-h-0 items-stretch gap-[0.75rem]">
                  {row.map((id) => (
                    <LineCard
                      key={id}
                      line={{ id, ...LINE_DEFS[id] }}
                      statuses={statuses}
                      metrics={metrics.perLine[id]}
                      sim={sim.perLine[id]}
                      now={now}
                      onClick={setSel}
                      maxRows={max}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </main>

        {/* <AlertSidebar events={events} now={now} /> */}
      </div>

      <Drawer sel={sel} events={events} now={now} tags={config.tags} onClose={() => setSel(null)} />
    </div>
  );
}
