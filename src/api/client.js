// ============================================================================
// API CLIENT — thin wrapper over the bridge server's REST endpoints.
// Same-origin `/api` in dev (Vite proxies it) and in prod (served together).
// ============================================================================
async function request(path, options) {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

/** Probe an OPC UA endpoint. Returns { ok, serverName?, message?, error? }. */
export function testConnection(connection) {
  return request("/opcua/test", { method: "POST", body: JSON.stringify(connection) });
}

/** Browse the server for status tags. Returns { ok, tags:[{nodeId,browseName}], truncated? }. */
export function discoverTags(connection) {
  return request("/opcua/discover", { method: "POST", body: JSON.stringify(connection) });
}

/** Load the saved connection + tag map. Returns { connection, tags }. */
export function getConfig() {
  return request("/config");
}

/** Persist { connection, tags } and restart the bridge subscription. */
export function saveConfig(config) {
  return request("/config", { method: "PUT", body: JSON.stringify(config) });
}

/** Current bridge link state: { connected }. */
export function getStatus() {
  return request("/status");
}
