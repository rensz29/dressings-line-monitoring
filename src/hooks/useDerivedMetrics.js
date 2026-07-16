import { useMemo, useRef, useEffect } from "react";
import { LINES, keyOf, STATUS, lineRollup } from "../config/lines.js";

/* ============================================================================
   REAL METRICS — everything here is derived purely from the bridge feed
   (status + timestamp). No simulated numbers.

   Line health weights time-critical states: RUN full credit, WAIT partial,
   BLOCKED low, STOP none. OFFLINE machines are excluded (no signal ≠ broken).
============================================================================ */
const HEALTH_WEIGHT = { RUNNING: 1, WAITING: 0.6, BLOCKED: 0.25, STOPPED: 0 };

export function useDerivedMetrics(statuses, now) {
  /* Session downtime accumulator: when a machine leaves STOPPED, bank the
     completed stop duration; ongoing stops are measured live from entry.ts.
     Session-scoped ("since start") until a real historian feeds it. */
  const prevRef = useRef({});
  const bankedRef = useRef({}); // lineId → accumulated stop ms
  useEffect(() => {
    const prev = prevRef.current;
    LINES.forEach((ln) => ln.machines.forEach((m) => {
      const k = keyOf(ln.id, m.type);
      const was = prev[k];
      const is = statuses[k];
      if (was?.status === "STOPPED" && is && is.status !== "STOPPED") {
        bankedRef.current[ln.id] = (bankedRef.current[ln.id] || 0) + Math.max(0, is.ts - was.ts);
      }
    }));
    prevRef.current = statuses;
  }, [statuses]);

  return useMemo(() => {
    const counts = { RUNNING: 0, WAITING: 0, BLOCKED: 0, STOPPED: 0, OFFLINE: 0 };
    const perLine = {};
    const faults = [];
    let healthSum = 0;
    let healthMachines = 0;
    let totalDowntime = 0;

    LINES.forEach((ln) => {
      const c = { RUNNING: 0, WAITING: 0, BLOCKED: 0, STOPPED: 0, OFFLINE: 0 };
      let ongoingStop = 0;
      let fresh = false;
      ln.machines.forEach((m) => {
        const e = statuses[keyOf(ln.id, m.type)];
        const st = e?.status || "OFFLINE";
        c[st]++;
        counts[st]++;
        if (e && now - e.ts < 60_000) fresh = true;
        if (st === "STOPPED") ongoingStop += Math.max(0, now - e.ts);
        if (st === "STOPPED" || st === "BLOCKED")
          faults.push({ lineId: ln.id, line: ln.name, machine: m.label, status: st, ts: e.ts });
      });
      const active = ln.machines.length - c.OFFLINE;
      const health = active === 0
        ? null
        : (100 * (c.RUNNING * HEALTH_WEIGHT.RUNNING + c.WAITING * HEALTH_WEIGHT.WAITING +
                  c.BLOCKED * HEALTH_WEIGHT.BLOCKED)) / active;
      const downtime = (bankedRef.current[ln.id] || 0) + ongoingStop;
      totalDowntime += downtime;
      if (health != null) { healthSum += health * active; healthMachines += active; }
      perLine[ln.id] = {
        counts: c,
        active,
        health,
        runningPct: active === 0 ? null : (100 * c.RUNNING) / active,
        worst: lineRollup(ln, statuses),
        faultCount: c.STOPPED + c.BLOCKED,
        downtime,
        fresh,
      };
    });

    faults.sort((a, b) => STATUS[b.status].rank - STATUS[a.status].rank || b.ts - a.ts);

    return {
      counts,
      perLine,
      faults,
      factoryHealth: healthMachines === 0 ? null : healthSum / healthMachines,
      totalDowntime,
    };
  }, [statuses, now]);
}
