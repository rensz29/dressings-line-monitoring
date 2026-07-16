// ============================================================================
// BRIDGE SERVER — REST for the Settings page + a WebSocket feed for the board.
//   POST /api/opcua/test  → probe an endpoint (Test Connection button)
//   GET  /api/config      → current connection + tag map
//   PUT  /api/config      → save config, then (re)start the live subscription
//   GET  /api/status      → current link state
//   WS   /ws              → {type:"link",connected} + {lineId,machineType,status,ts}
//
// Traffic management: the bridge only emits on CHANGE, so we cache the latest
// status per machine and REPLAY it to every newly-connected client (a refresh
// or new tab would otherwise see a blank board until the next change). A 30s
// ping/heartbeat keeps sockets alive through proxies/ngrok and drops dead ones.
// ============================================================================
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { loadConfig, saveConfig } from "./config.js";
import { createBridge, testConnection, discoverTags } from "./opcua.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 8080;

// Last-resort safety net: node-opcua can emit errors from deep async paths.
// A long-running bridge must stay up, so log and keep serving rather than exit.
process.on("uncaughtException", (err) => console.error("[bridge] uncaughtException:", err?.message || err));
process.on("unhandledRejection", (err) => console.error("[bridge] unhandledRejection:", err?.message || err));

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

let linkConnected = false;
const statusCache = new Map(); // "lineId|machineType" -> { lineId, machineType, status, ts }

function broadcast(obj) {
  const msg = JSON.stringify(obj);
  for (const ws of wss.clients) {
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

const bridge = createBridge({
  onUpdate: (u) => {
    statusCache.set(`${u.lineId}|${u.machineType}`, u); // remember last-known
    broadcast(u);
  },
  onLink: (connected) => {
    linkConnected = connected;
    broadcast({ type: "link", connected });
  },
});

// A new client gets the link state AND a full snapshot of last-known statuses,
// so the board fills in immediately instead of waiting for the next change.
wss.on("connection", (ws) => {
  ws.isAlive = true;
  ws.on("pong", () => { ws.isAlive = true; });
  ws.send(JSON.stringify({ type: "link", connected: linkConnected }));
  for (const u of statusCache.values()) ws.send(JSON.stringify(u));
});

// Heartbeat: WS-level ping keeps proxies from idle-closing the socket and
// detects half-dead clients; an app-level link message gives the browser
// regular traffic so its own stale-connection watchdog stays satisfied.
const HEARTBEAT_MS = 30000;
const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    if (ws.isAlive === false) { ws.terminate(); continue; }
    ws.isAlive = false;
    try { ws.ping(); } catch { /* ignore */ }
    if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "link", connected: linkConnected }));
  }
}, HEARTBEAT_MS);
heartbeat.unref?.();
wss.on("close", () => clearInterval(heartbeat));

app.post("/api/opcua/test", async (req, res) => {
  const result = await testConnection(req.body || {});
  res.json(result);
});

app.post("/api/opcua/discover", async (req, res) => {
  const result = await discoverTags(req.body || {});
  res.json(result);
});

app.get("/api/config", (_req, res) => {
  res.json(loadConfig());
});

app.put("/api/config", (req, res) => {
  const saved = saveConfig(req.body || {});
  bridge.start(saved).catch((e) => console.error("[bridge] restart failed:", e?.message || e));
  res.json(saved);
});

app.get("/api/status", (_req, res) => {
  res.json({ connected: linkConnected });
});

// Serve the built SPA (produced by `npm run build`) so one container/port
// hosts the UI + API + WS. In dev this folder is absent — Vite serves the UI
// and proxies /api + /ws here instead.
const distPath = join(__dirname, "..", "dist");
if (existsSync(distPath)) {
  app.use(express.static(distPath));
  // SPA fallback (Express 5-safe): any non-API GET returns index.html
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) return next();
    res.sendFile(join(distPath, "index.html"));
  });
}

httpServer.listen(PORT, () => {
  console.log(`[bridge] listening on http://localhost:${PORT}  (ws: ws://localhost:${PORT}/ws)`);
  const cfg = loadConfig();
  if (cfg.connection.endpoint) {
    bridge.start(cfg).catch((e) => console.error("[bridge] initial start failed:", e?.message || e));
  }
});
