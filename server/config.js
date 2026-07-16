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
};

export function loadConfig() {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULT_CONFIG };
  try {
    const raw = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
    return {
      connection: { ...DEFAULT_CONFIG.connection, ...raw.connection },
      tags: { ...(raw.tags || {}) },
    };
  } catch (err) {
    console.error("[config] failed to read config.json, using defaults:", err.message);
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(next) {
  const merged = {
    connection: { ...DEFAULT_CONFIG.connection, ...next.connection },
    tags: { ...(next.tags || {}) },
  };
  mkdirSync(dirname(CONFIG_PATH), { recursive: true }); // ensure the volume dir exists
  writeFileSync(CONFIG_PATH, JSON.stringify(merged, null, 2));
  return merged;
}
