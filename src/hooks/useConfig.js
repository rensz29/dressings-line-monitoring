import { useState, useEffect, useCallback } from "react";
import * as api from "../api/client.js";

/* ============================================================================
   CONFIG HOOK — loads the saved connection + tag map from the bridge.
   Used by the Settings page (to edit) and the Drawer (to show real NodeIDs).
============================================================================ */
const EMPTY = { connection: { endpoint: "", securityMode: "None", securityPolicy: "None", username: "", password: "", nsIndex: 2 }, tags: {} };

export function useConfig() {
  const [config, setConfig] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    api.getConfig()
      .then((cfg) => { if (alive) setConfig({ ...EMPTY, ...cfg, connection: { ...EMPTY.connection, ...cfg.connection } }); })
      .catch((e) => { if (alive) setError(e.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const save = useCallback(async (next) => {
    const saved = await api.saveConfig(next);
    setConfig({ ...EMPTY, ...saved, connection: { ...EMPTY.connection, ...saved.connection } });
    return saved;
  }, []);

  return { config, loading, error, save };
}
