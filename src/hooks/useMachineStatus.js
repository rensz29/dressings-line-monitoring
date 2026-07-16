import { useState, useEffect, useRef } from "react";
import { LINES, keyOf } from "../config/lines.js";

/* ============================================================================
   LIVE DATA HOOK — subscribes to the bridge's WebSocket feed.
   Messages (from server/index.js):
     { type: "link", connected }              → OPC UA link state (also 30s heartbeat)
     { lineId, machineType, status, ts }      → one machine changed / snapshot replay
   On connect the bridge replays a snapshot, so the board fills immediately.
   A watchdog forces a reconnect if the heartbeat stops (silently dead socket).
   Every machine starts OFFLINE ("NO DATA") until the bridge reports a value.
============================================================================ */
const STALE_MS = 75000; // > 2 missed 30s heartbeats → assume the socket is dead
function buildInitial() {
  const s = {};
  LINES.forEach((ln) => ln.machines.forEach((m) => {
    s[keyOf(ln.id, m.type)] = { status: "OFFLINE", ts: Date.now() };
  }));
  return s;
}

function wsUrl() {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

export function useMachineStatus() {
  const [statuses, setStatuses] = useState(buildInitial);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    let stopped = false;
    let retry;
    let lastMsg = Date.now();

    function connect() {
      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onmessage = (ev) => {
        lastMsg = Date.now();
        let u;
        try { u = JSON.parse(ev.data); } catch { return; }
        if (u.type === "link") { setConnected(!!u.connected); return; }
        setStatuses((prev) => ({
          ...prev,
          [keyOf(u.lineId, u.machineType)]: { status: u.status, ts: u.ts },
        }));
      };

      ws.onopen = () => { lastMsg = Date.now(); };
      ws.onclose = () => {
        setConnected(false);
        if (!stopped) retry = setTimeout(connect, 3000); // auto-reconnect
      };
      ws.onerror = () => ws.close();
    }
    connect();

    // Watchdog: if the heartbeat stops (dead socket that never fired onclose,
    // common over ngrok/proxies), tear it down so the reconnect kicks in.
    const watchdog = setInterval(() => {
      if (!stopped && Date.now() - lastMsg > STALE_MS) {
        lastMsg = Date.now();
        wsRef.current?.close();
      }
    }, 15000);

    return () => {
      stopped = true;
      clearTimeout(retry);
      clearInterval(watchdog);
      wsRef.current?.close();
    };
  }, []);

  return { statuses, connected };
}
