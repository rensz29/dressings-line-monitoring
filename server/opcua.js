// ============================================================================
// OPC UA — thin wrapper around node-opcua for two jobs:
//   1. testConnection()  — one-shot connect/read/disconnect for the Settings
//      "Test Connection" button.
//   2. createBridge()     — a long-lived subscription that monitors each
//      configured tag and pushes {lineId,machineType,status,ts} on change,
//      matching the data contract the dashboard already expects.
// ============================================================================
import {
  OPCUAClient,
  MessageSecurityMode,
  SecurityPolicy,
  AttributeIds,
  TimestampsToReturn,
  UserTokenType,
  ClientSubscription,
  ClientMonitoredItem,
  NodeClass,
} from "node-opcua";

// ----- helpers ---------------------------------------------------------------
const toSecurityMode = (m) => MessageSecurityMode[m] ?? MessageSecurityMode.None;
const toSecurityPolicy = (p) => SecurityPolicy[p] ?? SecurityPolicy.None;

const toUserIdentity = ({ username, password } = {}) =>
  username
    ? { type: UserTokenType.UserName, userName: username, password: password || "" }
    : null; // null => anonymous

// A NodeId already looks like "ns=2;s=...", "i=123", "s=...", "g=...", "b=...".
// A bare Kepware address ("Channel.Device.Tag") gets the default namespace as
// a string identifier so the user doesn't have to type the ns=…;s= prefix.
function coerceNodeId(tag, nsIndex = 2) {
  const s = String(tag).trim();
  if (/^(ns=\d+;)?[isgb]=/.test(s)) return s;
  return `ns=${nsIndex};s=${s}`;
}

function withTimeout(promise, ms, message) {
  let t;
  const timeout = new Promise((_, reject) => {
    t = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

// ProductName lives at a well-known node — handy to prove a real session opened.
const PRODUCT_NAME_NODE = "ns=0;i=2261";

// ============================================================================
// VALUE → STATUS  (PLANT-SPECIFIC)
// The dashboard understands: RUNNING | WAITING | BLOCKED | STOPPED | OFFLINE.
//
// NUMERIC_MAP decodes the DFOS PLC `iState` integer. Verified 2026-07-16 by
// reading iState alongside the sibling "Machine Status - Running/Waiting/
// Blocked/Stopped" booleans on the Line B / All-Fill Fillers & Depalletizer:
//   0 = idle (no status boolean true — powered but not producing) → IDLE
//   1 = Running   2 = Stopped   3 = Waiting (by elimination)   4 = Blocked
// Adjust here if the PLC's state enumeration changes.
// ============================================================================
const STATUS_KEYS = ["RUNNING", "IDLE", "WAITING", "BLOCKED", "STOPPED", "OFFLINE"];
const NUMERIC_MAP = { 0: "IDLE", 1: "RUNNING", 2: "STOPPED", 3: "WAITING", 4: "BLOCKED" };

export function mapValueToStatus(raw) {
  if (raw === null || raw === undefined) return "OFFLINE";

  if (typeof raw === "boolean") return raw ? "RUNNING" : "STOPPED";

  if (typeof raw === "string") {
    const s = raw.trim().toUpperCase();
    if (STATUS_KEYS.includes(s)) return s;
    if (s.startsWith("RUN")) return "RUNNING";
    if (s.startsWith("IDLE")) return "IDLE";
    if (s.startsWith("WAIT") || s.startsWith("STARV")) return "WAITING";
    if (s.startsWith("BLOCK")) return "BLOCKED";
    if (s.startsWith("STOP") || s.startsWith("FAULT") || s.startsWith("ALARM")) return "STOPPED";
    return "OFFLINE";
  }

  const n = Number(raw);
  return NUMERIC_MAP[n] ?? "OFFLINE";
}

// ============================================================================
// TEST CONNECTION — connect, open a session, read ProductName, tear down.
// Fails fast (no retries, 5s cap) so the UI never hangs.
// ============================================================================
export async function testConnection({ endpoint, securityMode, securityPolicy, username, password } = {}) {
  if (!endpoint) return { ok: false, error: "Endpoint is required." };

  const client = OPCUAClient.create({
    endpointMustExist: false,
    connectionStrategy: { maxRetry: 0, initialDelay: 500, maxDelay: 1000 },
    securityMode: toSecurityMode(securityMode),
    securityPolicy: toSecurityPolicy(securityPolicy),
  });
  client.on("backoff", () => {}); // don't spam the console while probing

  try {
    await withTimeout(client.connect(endpoint), 5000, "Connection timed out.");
    const identity = toUserIdentity({ username, password });
    const session = identity ? await client.createSession(identity) : await client.createSession();

    let serverName = "OPC UA Server";
    try {
      const dv = await session.read({ nodeId: PRODUCT_NAME_NODE, attributeId: AttributeIds.Value });
      if (dv?.value?.value) serverName = String(dv.value.value);
    } catch {
      /* ProductName is optional — a live session already proves the endpoint. */
    }

    await session.close();
    await client.disconnect();
    return { ok: true, serverName, message: `Connected to ${serverName}` };
  } catch (err) {
    try { await client.disconnect(); } catch { /* ignore */ }
    return { ok: false, error: err?.message || String(err) };
  }
}

// ============================================================================
// DISCOVER — browse the address space for status tags (default: *_iState) so
// the Settings page can auto-fill NodeIds instead of hand-typing them.
// Bounded by visit count, depth, and a wall-clock deadline; skips Kepware's
// "_"-prefixed system channels. Returns [{ nodeId, browseName }].
// ============================================================================
const OBJECTS_FOLDER = "ns=0;i=85";
const clean = (browseName) => browseName.toString().replace(/^\d+:/, "");

export async function discoverTags(conn = {}, { pattern = /_iState$/i, perChannelBrowses = 800, maxDepth = 6, budgetMs = 90000, prioritize = /halal|dressing/i } = {}) {
  if (!conn.endpoint) return { ok: false, error: "Endpoint is required.", tags: [] };

  const client = OPCUAClient.create({
    endpointMustExist: false,
    connectionStrategy: { maxRetry: 0, initialDelay: 500, maxDelay: 1000 },
    securityMode: toSecurityMode(conn.securityMode),
    securityPolicy: toSecurityPolicy(conn.securityPolicy),
  });
  client.on("backoff", () => {});

  const found = [];
  const deadline = Date.now() + budgetMs;
  let truncated = false;

  try {
    await withTimeout(client.connect(conn.endpoint), 8000, "Connection timed out.");
    const identity = toUserIdentity(conn);
    const session = identity ? await client.createSession(identity) : await client.createSession();

    // top-level channels (skip Kepware "_" system channels + the Server node)
    const top = await session.browse(OBJECTS_FOLDER);
    let channels = (top.references || [])
      .filter((r) => r.nodeClass === NodeClass.Object)
      .map((r) => ({ nodeId: r.nodeId, name: clean(r.browseName) }))
      .filter((c) => !c.name.startsWith("_") && c.name !== "Server");
    // scan the deployment's own channel(s) first so a slow server can't time out before reaching them
    channels.sort((a, b) => (prioritize.test(b.name) ? 1 : 0) - (prioritize.test(a.name) ? 1 : 0));

    // per-channel bounded DFS — a single huge channel can't starve the others
    for (const ch of channels) {
      if (Date.now() > deadline) { truncated = true; break; }
      let budget = perChannelBrowses;
      const stack = [{ id: ch.nodeId, depth: 1 }];
      while (stack.length) {
        if (budget-- <= 0 || Date.now() > deadline) { truncated = true; break; }
        const { id, depth } = stack.pop();
        if (depth > maxDepth) continue;
        let res;
        try { res = await session.browse(id); } catch { continue; }
        for (const ref of res.references || []) {
          const bn = clean(ref.browseName);
          if (ref.nodeClass === NodeClass.Variable) {
            if (pattern.test(bn)) found.push({ nodeId: ref.nodeId.toString(), browseName: bn });
          } else if (ref.nodeClass === NodeClass.Object && !bn.startsWith("_")) {
            stack.push({ id: ref.nodeId, depth: depth + 1 });
          }
        }
      }
    }

    await session.close();
    await client.disconnect();
    return { ok: true, tags: found, truncated };
  } catch (err) {
    try { await client.disconnect(); } catch { /* ignore */ }
    return { ok: false, error: err?.message || String(err), tags: found };
  }
}

// ============================================================================
// BRIDGE — one client/session/subscription driven by the saved config.
// start(config) is idempotent: it always stops any prior connection first,
// so PUT /api/config can just call start() again with the new config.
// ============================================================================
export function createBridge({ onUpdate, onLink } = {}) {
  let client = null;
  let session = null;
  let subscription = null;
  let connected = false;
  let currentConfig = null;
  let stopping = false;
  let restartTimer = null;
  let generation = 0; // bumped each (re)start so stale event handlers become no-ops

  const setLink = (v) => {
    if (v !== connected) {
      connected = v;
      onLink?.(v);
    }
  };

  async function teardown() {
    try { if (subscription) await subscription.terminate(); } catch { /* ignore */ }
    try { if (session) await session.close(); } catch { /* ignore */ }
    try { if (client) await client.disconnect(); } catch { /* ignore */ }
    subscription = null;
    session = null;
    client = null;
  }

  // Rebuild after an UNEXPECTED drop (channel closed, subscription terminated,
  // start failed) so the feed recovers on its own. No-op while intentionally
  // stopping or if a restart is already queued.
  function scheduleRestart(reason) {
    if (stopping || restartTimer || !currentConfig?.connection?.endpoint) return;
    console.warn(`[bridge] reconnecting in 4s — ${reason}`);
    restartTimer = setTimeout(() => {
      restartTimer = null;
      if (!stopping) start(currentConfig);
    }, 4000);
  }

  async function _start(config) {
    stopping = false;
    const gen = ++generation; // invalidate any previous connection's handlers
    await teardown();
    currentConfig = config;
    const { connection, tags = {} } = config || {};
    if (!connection?.endpoint) { setLink(false); return; }

    client = OPCUAClient.create({
      endpointMustExist: false,
      connectionStrategy: { maxRetry: 5, initialDelay: 1000, maxDelay: 8000 },
      securityMode: toSecurityMode(connection.securityMode),
      securityPolicy: toSecurityPolicy(connection.securityPolicy),
    });
    client.on("backoff", () => {});
    client.on("connection_lost", () => { if (gen === generation) setLink(false); });      // node-opcua auto-retries
    client.on("connection_reestablished", () => { if (gen === generation) setLink(true); }); // …and resends values
    client.on("close", () => { if (gen === generation) { setLink(false); scheduleRestart("client channel closed"); } });

    let monitoredCount = 0;
    try {
      await client.connect(connection.endpoint);
      const identity = toUserIdentity(connection);
      session = identity ? await client.createSession(identity) : await client.createSession();
      session.on("session_closed", () => { if (gen === generation) setLink(false); });
      setLink(true);

      subscription = ClientSubscription.create(session, {
        requestedPublishingInterval: 1000,
        requestedLifetimeCount: 100,
        requestedMaxKeepAliveCount: 10,
        maxNotificationsPerPublish: 100,
        publishingEnabled: true,
        priority: 10,
      });
      // CRITICAL: a subscription emits 'error' (e.g. request timeout) async, after
      // start() returns — without this listener Node treats it as fatal and the
      // whole bridge process crashes. Log and keep the server alive instead.
      subscription.on("error", (err) => console.error("[bridge] subscription error:", err?.message || err));
      subscription.on("terminated", () => {
        if (gen !== generation) return;
        setLink(false);
        if (monitoredCount > 0) scheduleRestart("subscription terminated"); // don't loop when no tags are valid
      });

      const nsIndex = Number(connection.nsIndex) || 2;
      for (const [key, rawTag] of Object.entries(tags)) {
        if (!rawTag) continue;
        const idx = key.indexOf("|");
        const lineId = key.slice(0, idx);
        const machineType = key.slice(idx + 1);
        const nodeId = coerceNodeId(rawTag, nsIndex);

        try {
          const item = ClientMonitoredItem.create(
            subscription,
            { nodeId, attributeId: AttributeIds.Value },
            { samplingInterval: 1000, discardOldest: true, queueSize: 10 },
            TimestampsToReturn.Both,
          );
          item.on("changed", (dv) => {
            if (gen === generation) onUpdate?.({ lineId, machineType, status: mapValueToStatus(dv?.value?.value), ts: Date.now() });
          });
          item.on("err", (msg) => console.error(`[bridge] monitor ${nodeId} failed:`, msg));
          monitoredCount++;
        } catch (e) {
          // one bad tag must never abort the rest of the subscription
          console.error(`[bridge] skipping invalid tag for ${key} (${rawTag}):`, e?.message || e);
        }
      }
      console.log(`[bridge] connected — monitoring ${monitoredCount}/${Object.values(tags).filter(Boolean).length} tags`);
    } catch (err) {
      console.error("[bridge] start failed:", err?.message || err);
      setLink(false);
      scheduleRestart("start failed");
    }
  }

  async function stop() {
    stopping = true;
    if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    generation++; // invalidate handlers
    await teardown();
    setLink(false);
  }

  // Serialize start/stop so rapid saves (multiple PUT /api/config) and auto-
  // reconnects can't overlap and race each other's connect/disconnect.
  let queue = Promise.resolve();
  function start(config) {
    queue = queue.then(() => _start(config)).catch((e) => console.error("[bridge] start error:", e?.message || e));
    return queue;
  }

  return { start, stop, isConnected: () => connected };
}
