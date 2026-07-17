import { Fragment, useState } from "react";
import { LINE_DEFS, ROW_MAXES } from "./config/lines.js";
import { useMachineStatus } from "./hooks/useMachineStatus.js";
import { useNow } from "./hooks/useNow.js";
import { useDerivedMetrics } from "./hooks/useDerivedMetrics.js";
import { useSimulatedMetrics } from "./hooks/useSimulatedMetrics.js";
import { useAlertLog } from "./hooks/useAlertLog.js";
import { useConfig } from "./hooks/useConfig.js";
import { useLayout } from "./hooks/useLayout.js";
import Header from "./components/Header.jsx";
import GroupBand from "./components/GroupBand.jsx";
import LineCard from "./components/LineCard.jsx";
import AlertSidebar from "./components/AlertSidebar.jsx";
import Drawer from "./components/Drawer.jsx";

/* ============================================================================
   LINE MONITOR — viewport-locked control-room board.
   Hierarchy: header → factory KPIs → grouped line sections (HALAL | NON HALAL),
   each with two card rows grouped by line length so every machine node on the
   board is the same height. Cards can be dragged (by their nameplate) to
   rearrange within their row; the arrangement is shared across displays via
   server config. Nothing scrolls on a wall display.
============================================================================ */
export default function LineMonitor({ onOpenSettings }) {
  const { statuses, connected, remoteLayout } = useMachineStatus();
  const now = useNow();
  const metrics = useDerivedMetrics(statuses, now);
  const sim = useSimulatedMetrics();
  const events = useAlertLog(statuses, connected);
  const { config } = useConfig();
  const { groups, moveLine } = useLayout(config.layout, remoteLayout);
  const [sel, setSel] = useState(null);
  const [drag, setDrag] = useState(null); // { groupId, rowIdx, lineId }
  const [over, setOver] = useState(null); // { lineId, side: "before" | "after" }

  const makeDnd = (groupId, rowIdx, row, id) => ({
    isDragging: drag?.lineId === id,
    indicator: over?.lineId === id ? over.side : null,
    onDragStart: (e, cardEl) => {
      e.dataTransfer.setData("text/plain", id); // Firefox needs data to start a drag
      e.dataTransfer.effectAllowed = "move";
      if (cardEl) e.dataTransfer.setDragImage(cardEl, 24, 24);
      setDrag({ groupId, rowIdx, lineId: id });
    },
    onDragOver: (e) => {
      // No preventDefault for another row/group → browser shows not-allowed.
      if (!drag || drag.groupId !== groupId || drag.rowIdx !== rowIdx) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      if (id === drag.lineId) { if (over) setOver(null); return; }
      const rect = e.currentTarget.getBoundingClientRect();
      const side = e.clientX < rect.left + rect.width / 2 ? "before" : "after";
      if (over?.lineId !== id || over.side !== side) setOver({ lineId: id, side });
    },
    onDragLeave: (e) => {
      if (e.currentTarget.contains(e.relatedTarget)) return; // still inside the card
      setOver((p) => (p?.lineId === id ? null : p));
    },
    onDrop: (e) => {
      e.preventDefault();
      if (drag && over && drag.groupId === groupId && drag.rowIdx === rowIdx && over.lineId === id) {
        const targetIdx = row.indexOf(id) + (over.side === "after" ? 1 : 0);
        moveLine(groupId, rowIdx, drag.lineId, targetIdx);
      }
      setDrag(null);
      setOver(null);
    },
    onDragEnd: () => { setDrag(null); setOver(null); },
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Header now={now} connected={connected} links={sim.links} counts={metrics.counts} factoryHealth={metrics.factoryHealth} onOpenSettings={onOpenSettings} />

      <div className="flex min-h-0 flex-1 gap-[0.75rem] p-[0.75rem]">
        {/* main column: grouped line sections */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col gap-[0.75rem]">
          <div className="flex min-h-0 flex-1 gap-[0.75rem]">
            {groups.map((g, gi) => (
              <Fragment key={g.id}>
                {gi > 0 && <div aria-hidden className="w-px shrink-0 self-stretch bg-border-line" />}
                <section
                  className="flex min-h-0 min-w-0 flex-col gap-[0.5rem]"
                  style={{ flex: `${Math.max(...g.rows.map((r) => r.length))} 1 0%` }}
                >
                  <GroupBand group={g} statuses={statuses} />
                  <div
                    className="grid min-h-0 flex-1 gap-[0.75rem]"
                    style={{ gridTemplateRows: "minmax(0, 1.61fr) minmax(0, 1fr)" }}
                  >
                    {g.rows.map((row, ri) => (
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
                            maxRows={ROW_MAXES[ri]}
                            dnd={makeDnd(g.id, ri, row, id)}
                          />
                        ))}
                      </div>
                    ))}
                  </div>
                </section>
              </Fragment>
            ))}
          </div>
        </main>

        {/* <AlertSidebar events={events} now={now} /> */}
      </div>

      <Drawer sel={sel} events={events} now={now} tags={config.tags} onClose={() => setSel(null)} />
    </div>
  );
}
