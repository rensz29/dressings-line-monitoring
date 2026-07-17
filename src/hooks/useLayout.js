import { useState, useEffect, useCallback } from "react";
import { GROUPS } from "../config/lines.js";
import * as api from "../api/client.js";

/* ============================================================================
   BOARD LAYOUT HOOK — card arrangement, shared across displays.
   Row/group MEMBERSHIP always comes from code (GROUPS); the persisted layout
   (server config.json) only reorders cards within a row, so a stale or
   hand-edited layout can never lose a line or move it to the wrong row.
============================================================================ */
function mergeLayout(saved) {
  return GROUPS.map((g) => ({
    ...g,
    rows: g.rows.map((defaultRow, ri) => {
      const savedRow = saved?.[g.id]?.[ri];
      if (!Array.isArray(savedRow)) return defaultRow;
      const ordered = [...new Set(savedRow)].filter((id) => defaultRow.includes(id));
      defaultRow.forEach((id, di) => {
        if (!ordered.includes(id)) ordered.splice(Math.min(di, ordered.length), 0, id);
      });
      return ordered;
    }),
  }));
}

export function useLayout(savedLayout, remoteLayout) {
  const [groups, setGroups] = useState(() => mergeLayout(null));

  // Initial GET (via useConfig) and live WS broadcasts from other displays.
  useEffect(() => { setGroups(mergeLayout(savedLayout)); }, [savedLayout]);
  useEffect(() => { if (remoteLayout) setGroups(mergeLayout(remoteLayout)); }, [remoteLayout]);

  /* targetIdx = insertion index in the row BEFORE the dragged card is removed. */
  const moveLine = useCallback((groupId, rowIdx, dragId, targetIdx) => {
    const row = groups.find((g) => g.id === groupId)?.rows[rowIdx] ?? [];
    const from = row.indexOf(dragId);
    if (from === -1) return;
    const insertAt = targetIdx > from ? targetIdx - 1 : targetIdx;
    if (insertAt === from) return; // no-op drop → no save
    const nextRow = row.filter((id) => id !== dragId);
    nextRow.splice(insertAt, 0, dragId);
    const next = groups.map((g) => g.id !== groupId
      ? g
      : { ...g, rows: g.rows.map((r, ri) => (ri === rowIdx ? nextRow : r)) });
    setGroups(next); // optimistic — revert if the save fails
    api.saveConfig({ layout: Object.fromEntries(next.map((g) => [g.id, g.rows])) })
      .catch((e) => { console.error("[layout] save failed:", e); setGroups(groups); });
  }, [groups]);

  return { groups, moveLine };
}
