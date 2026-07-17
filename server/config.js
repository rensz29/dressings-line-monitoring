// ============================================================================
// CONFIG STORE — persists the OPC UA connection + per-machine tag map to a
// JSON file next to this module so the bridge can reload it on restart.
// Tag keys use the SAME `lineId|type` format as the frontend (keyOf in
// src/config/lines.js) so both sides agree on how to address a machine.
// ============================================================================
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
// CONFIG_PATH lets Docker point this at a mounted volume so settings survive
// container recreation; defaults to a file next to the server in dev.
const CONFIG_PATH = process.env.CONFIG_PATH || join(__dirname, "config.json");

export const DEFAULT_CONFIG = {
  connection: {
    endpoint: "",
    securityMode: "None",
    securityPolicy: "None",
    username: "",
    password: "",
    nsIndex: 2, // default namespace for bare tag addresses (Kepware = 2)
  },
  tags: {}, // { "lineb|Depalletizer": "ns=2;s=Channel.Device.Tag", ... }
  layout: {}, // board card arrangement: { halal: [["lineb",...],[...]], ... } — opaque to the bridge
};

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return {
      connection: { ...DEFAULT_CONFIG.connection, ...raw.connection },
      tags: { ...(raw.tags || {}) },
      layout: { ...(raw.layout || {}) },
    };
  } catch (err) {
    console.error("[config] failed to read config.json, using defaults:", err.message);
    return { ...DEFAULT_CONFIG };
  }
}

/* Section-preserving: callers may PUT any subset of {connection, tags, layout}
   (Settings sends connection+tags, the board sends layout) — omitted sections
   keep their on-disk value. */
export function saveConfig(next) {
  const current = loadConfig();
  const merged = {
    connection: { ...DEFAULT_CONFIG.connection, ...(next.connection ?? current.connection) },
    tags: { ...(next.tags ?? current.tags) },
    layout: { ...(next.layout ?? current.layout) },
  };
  mkdirSync(dirname(CONFIG_PATH), { recursive: true }); // ensure the volume dir exists
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return merged;
}
