import { useState, useRef, useEffect } from "react";
import { LINES, keyOf } from "../config/lines.js";

/* ============================================================================
   ALERT LOG — derives an event feed from status transitions.
   critical: any machine entering STOPPED
   warning:  entering BLOCKED or WAITING
   info:     recovery to RUNNING from a fault, signal lost/restored, link flips
============================================================================ */
const CAP = 60;
let nextId = 1;

function severityOf(from, to) {
  if (to === "STOPPED") return "critical";
  if (to === "BLOCKED" || to === "WAITING") return "warning";
  if (to === "RUNNING" && (from === "STOPPED" || from === "BLOCKED")) return "info";
  if (to === "OFFLINE" || from === "OFFLINE") return "info";
  return null;
}

export function useAlertLog(statuses, connected) {
  const [events, setEvents] = useState([]);
  const prevRef = useRef(null);
  const prevLinkRef = useRef(connected);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = statuses;
    if (!prev) return; // no fake history on first render

    const fresh = [];
    LINES.forEach((ln) => ln.machines.forEach((m) => {
      const k = keyOf(ln.id, m.type);
      const was = prev[k]?.status;
      const is = statuses[k];
      if (!is || was === is.status) return;
      const severity = severityOf(was, is.status);
      if (!severity) return;
      fresh.push({
        id: nextId++,
        ts: is.ts,
        lineId: ln.id,
        lineName: ln.name,
        machineLabel: m.label,
        from: was || "OFFLINE",
        to: is.status,
        severity,
      });
    }));
    if (fresh.length)
      setEvents((p) => [...fresh.sort((a, b) => b.ts - a.ts), ...p].slice(0, CAP));
  }, [statuses]);

  useEffect(() => {
    if (prevLinkRef.current === connected) return;
    prevLinkRef.current = connected;
    setEvents((p) => [{
      id: nextId++,
      ts: Date.now(),
      lineId: null,
      lineName: "OPC UA",
      machineLabel: "Bridge",
      from: null,
      to: connected ? "LINK UP" : "LINK DOWN",
      severity: connected ? "info" : "critical",
    }, ...p].slice(0, CAP));
  }, [connected]);

  return events;
}
