import { useState, useEffect, useRef } from "react";
import { ArrowLeft, SlidersHorizontal } from "lucide-react";
import { useConfig } from "../hooks/useConfig.js";
import { discoverTags } from "../api/client.js";
import { matchDiscoveredTags } from "../utils/discoverMatch.js";
import ConnectionForm from "../components/settings/ConnectionForm.jsx";
import TagMapping from "../components/settings/TagMapping.jsx";

/* ============================================================================
   SETTINGS PAGE — full-screen admin view (this one scrolls, unlike the board).
   Step 1 tests the OPC UA connection; a pass unlocks Step 2 tag mapping.
   Saving persists to the bridge, which restarts its live subscription.
============================================================================ */
export default function SettingsPage({ onBack }) {
  const { config, loading, save } = useConfig();
  const [connection, setConnection] = useState(config.connection);
  const [tags, setTags] = useState(config.tags);
  const [tested, setTested] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoverMsg, setDiscoverMsg] = useState("");
  const [matchStatus, setMatchStatus] = useState({});
  const hadEndpoint = useRef(false);

  // Seed the draft once the saved config arrives.
  useEffect(() => {
    if (loading) return;
    setConnection(config.connection);
    setTags(config.tags);
    hadEndpoint.current = Boolean(config.connection.endpoint);
  }, [loading, config]);

  const unlocked = tested || hadEndpoint.current;

  async function handleDiscover() {
    setDiscovering(true);
    setDiscoverMsg("");
    try {
      const res = await discoverTags(connection);
      if (!res.ok) { setDiscoverMsg(`Discovery failed: ${res.error}`); return; }
      const { tags: found, status, summary } = matchDiscoveredTags(res.tags);
      setTags((prev) => ({ ...prev, ...found }));
      setMatchStatus(status);
      setDiscoverMsg(
        `Found ${res.tags.length} tags on server · auto-filled ${summary.matched}, ` +
        `${summary.review} need review (⚠), ${summary.unmatched} unmatched` +
        (res.truncated ? " · scan hit its limit, some tags may be missing" : ""),
      );
    } catch (e) {
      setDiscoverMsg(`Discovery failed: ${e.message}`);
    } finally {
      setDiscovering(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSavedMsg("");
    try {
      await save({ connection, tags });
      hadEndpoint.current = Boolean(connection.endpoint);
      setSavedMsg("Saved ✓");
      setTimeout(() => setSavedMsg(""), 3000);
    } catch (e) {
      setSavedMsg(`Save failed: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* top bar mirrors the dashboard header's glass style */}
      <header className="flex h-[4rem] shrink-0 items-center gap-[1rem] border-b border-border-subtle bg-glass px-[1.125rem] shadow-e1 backdrop-blur-md">
        <button
          onClick={onBack}
          className="flex cursor-pointer items-center gap-[0.4rem] rounded-md border border-border-line bg-surface-2 px-[0.75rem] py-[0.45rem] text-[0.8125rem] font-semibold text-text-mid transition-colors hover:border-border-strong hover:text-text-hi"
        >
          <ArrowLeft style={{ width: "1rem", height: "1rem" }} /> Dashboard
        </button>
        <span className="flex items-center gap-[0.5rem]">
          <SlidersHorizontal style={{ width: "1.1rem", height: "1.1rem" }} className="text-accent-cyan" />
          <span className="text-[1.125rem] font-extrabold tracking-[0.1em]">SETTINGS</span>
        </span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[64rem] flex-col gap-[1rem] p-[1.25rem]">
          {loading ? (
            <div className="py-[3rem] text-center text-text-mid">Loading configuration…</div>
          ) : (
            <>
              <ConnectionForm value={connection} onChange={setConnection} onTested={setTested} />
              <TagMapping
                tags={tags}
                onChange={setTags}
                onSave={handleSave}
                saving={saving}
                savedMsg={savedMsg}
                disabled={!unlocked}
                onDiscover={handleDiscover}
                discovering={discovering}
                discoverMsg={discoverMsg}
                statusMap={matchStatus}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
