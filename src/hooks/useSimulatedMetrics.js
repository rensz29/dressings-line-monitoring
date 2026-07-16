import { useState, useEffect } from "react";
import { LINES } from "../config/lines.js";

/* ============================================================================
   SIMULATED — replace with real feed.
   The bridge only reports status + timestamp today; OEE, production rate,
   availability, trends, and the MQTT/DB/API link flags below are demo
   random-walks so the layout is complete. Every consumer of this hook reads
   `simulated: true` — when a real historian/metrics feed exists, swap this
   hook's body and delete the "DEMO" tags in the UI.
============================================================================ */
const TREND_POINTS = 24;

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const walk = (v, step, lo, hi) => clamp(v + (Math.random() - 0.5) * step, lo, hi);

function seed() {
  const perLine = {};
  LINES.forEach((ln) => {
    const base = 70 + Math.random() * 22;
    perLine[ln.id] = {
      oee: base,
      availability: clamp(base + 5, 0, 98),
      rate: 40 + Math.round(Math.random() * 80), // units/min
      trend: Array.from({ length: TREND_POINTS }, () => clamp(base + (Math.random() - 0.5) * 14, 30, 100)),
    };
  });
  return perLine;
}

export function useSimulatedMetrics() {
  const [perLine, setPerLine] = useState(seed);

  useEffect(() => {
    const id = setInterval(() => {
      setPerLine((prev) => {
        const next = {};
        for (const [id, m] of Object.entries(prev)) {
          const oee = walk(m.oee, 4, 45, 97);
          next[id] = {
            oee,
            availability: walk(m.availability, 3, 50, 99),
            rate: Math.round(walk(m.rate, 8, 20, 140)),
            trend: [...m.trend.slice(1), oee],
          };
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const lines = Object.values(perLine);
  const avg = (f) => lines.reduce((s, m) => s + f(m), 0) / lines.length;

  return {
    simulated: true,
    perLine,
    factory: {
      oee: avg((m) => m.oee),
      availability: avg((m) => m.availability),
      rate: Math.round(lines.reduce((s, m) => s + m.rate, 0)),
      trend: Array.from({ length: TREND_POINTS }, (_, i) => avg((m) => m.trend[i])),
    },
    links: { mqtt: true, db: true, api: true },
  };
}
