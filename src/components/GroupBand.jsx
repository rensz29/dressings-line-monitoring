import { LINE_DEFS, STATUS, lineRollup } from "../config/lines.js";
import StatusIndicator from "./StatusIndicator.jsx";

/* ============================================================================
   GROUP BAND — slim section header above each board group (HALAL / NON HALAL):
   worst-of-group lamp + group name + line count.
============================================================================ */
function groupRollup(group, statuses) {
  let worst = null;
  group.rows.flat().forEach((id) => {
    const st = lineRollup({ id, ...LINE_DEFS[id] }, statuses);
    if (st === "OFFLINE") return;
    if (worst === null || STATUS[st].rank > STATUS[worst].rank) worst = st;
  });
  return worst || "OFFLINE";
}

export default function GroupBand({ group, statuses }) {
  const lineCount = group.rows.flat().length;
  return (
    <div className="flex h-[1.75rem] shrink-0 items-center gap-[0.5rem] rounded-md border border-border-subtle bg-gradient-to-b from-surface-2 to-surface-1 px-[0.625rem] shadow-e1">
      <StatusIndicator status={groupRollup(group, statuses)} size={9} />
      <span className="truncate text-[0.75rem] font-extrabold tracking-[0.18em] text-text-hi">
        {group.name}
      </span>
      <span className="ml-auto shrink-0 text-[0.625rem] font-semibold tracking-[0.06em] text-text-low tabular-nums">
        {lineCount} {lineCount === 1 ? "LINE" : "LINES"}
      </span>
    </div>
  );
}
