import { Tags, Save, Loader2, Lock, Search, AlertTriangle } from "lucide-react";
import { LINES, keyOf } from "../../config/lines.js";
import { machineIcon } from "../../config/icons.jsx";

/* ============================================================================
   TAG MAPPING — assign an OPC UA NodeID to each machine on each line.
   Lines/machines come from config/lines.js (not editable here); we only
   collect the tag string per machine, keyed by keyOf(lineId, type) so the
   bridge and dashboard address machines identically.
============================================================================ */
const fieldCls = "w-full rounded-md border border-border-line bg-surface-1 px-[0.6rem] py-[0.4rem] font-mono text-[0.75rem] text-text-hi outline-none transition-colors focus:border-accent-blue disabled:opacity-50";

const STATUS_STYLE = {
  matched: { borderColor: "color-mix(in srgb, var(--color-status-run) 55%, var(--color-border-line))" },
  review: { borderColor: "var(--color-status-wait)" },
};

export default function TagMapping({ tags, onChange, onSave, saving, savedMsg, disabled, onDiscover, discovering, discoverMsg, statusMap = {} }) {
  const setTag = (key, nodeId) => onChange({ ...tags, [key]: nodeId });
  const filled = Object.values(tags).filter(Boolean).length;

  return (
    <section className="rounded-lg border border-border-subtle bg-surface-2 p-[1.125rem] shadow-e2">
      <div className="mb-[1rem] flex items-center gap-[0.5rem]">
        <span className="flex size-[1.75rem] items-center justify-center rounded-md bg-bg-deep text-accent-cyan">
          <Tags style={{ width: "1rem", height: "1rem" }} strokeWidth={2} />
        </span>
        <h2 className="text-[0.9375rem] font-extrabold tracking-[0.06em] text-text-hi">
          <span className="text-text-low">Step 2 · </span>Machine Tags
        </h2>
        {disabled ? (
          <span className="ml-auto flex items-center gap-[0.35rem] text-[0.6875rem] font-semibold text-text-mid">
            <Lock style={{ width: "0.85rem", height: "0.85rem" }} /> Test the connection to unlock
          </span>
        ) : (
          <button
            onClick={onDiscover}
            disabled={discovering}
            className="ml-auto flex cursor-pointer items-center gap-[0.4rem] rounded-md border border-accent-cyan/60 bg-surface-1 px-[0.7rem] py-[0.4rem] text-[0.75rem] font-bold text-accent-cyan transition-colors hover:bg-surface-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {discovering
              ? <Loader2 style={{ width: "0.9rem", height: "0.9rem" }} className="animate-spin" />
              : <Search style={{ width: "0.9rem", height: "0.9rem" }} strokeWidth={2.5} />}
            {discovering ? "Discovering…" : "Discover from server"}
          </button>
        )}
      </div>

      {discoverMsg && (
        <div className="mb-[0.875rem] rounded-md border border-border-line bg-surface-1 px-[0.75rem] py-[0.5rem] text-[0.75rem] text-text-mid">
          {discoverMsg}
        </div>
      )}

      <div className={`grid grid-cols-2 gap-[1rem] ${disabled ? "pointer-events-none opacity-45" : ""}`}>
        {LINES.map((line) => (
          <div key={line.id} className="rounded-md border border-border-subtle bg-surface-1 p-[0.75rem]">
            <div className="mb-[0.6rem] flex items-baseline gap-[0.5rem]">
              <span className="text-[0.8125rem] font-extrabold tracking-[0.1em] text-text-hi">{line.name}</span>
              <span className="text-[0.625rem] text-text-low">{line.machines.length} machines</span>
            </div>
            <div className="flex flex-col gap-[0.45rem]">
              {line.machines.map((m) => {
                const key = keyOf(line.id, m.type);
                const MIcon = machineIcon(m.type);
                const st = statusMap[key];
                return (
                  <div key={key} className="flex items-center gap-[0.5rem]">
                    <span className="flex w-[9rem] shrink-0 items-center gap-[0.4rem] text-[0.75rem] text-text-mid" title={m.type}>
                      <MIcon style={{ width: "0.9rem", height: "0.9rem" }} strokeWidth={1.75} className="shrink-0 text-text-low" />
                      <span className="truncate">{m.label}</span>
                    </span>
                    <span className="relative flex-1">
                      <input
                        className={fieldCls + " w-full"}
                        placeholder="ns=2;s=Line.Machine.Status"
                        value={tags[key] || ""}
                        disabled={disabled}
                        style={STATUS_STYLE[st]}
                        onChange={(e) => setTag(key, e.target.value)}
                      />
                      {st === "review" && (
                        <AlertTriangle
                          title="Best-effort match — please verify"
                          className="absolute top-1/2 right-[0.4rem] -translate-y-1/2 text-status-wait"
                          style={{ width: "0.85rem", height: "0.85rem" }}
                        />
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-[1.125rem] flex items-center gap-[0.875rem]">
        <button
          onClick={onSave}
          disabled={saving || disabled}
          className="flex cursor-pointer items-center gap-[0.5rem] rounded-md bg-status-run px-[1rem] py-[0.55rem] text-[0.8125rem] font-bold text-bg-deep transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving
            ? <Loader2 style={{ width: "1rem", height: "1rem" }} className="animate-spin" />
            : <Save style={{ width: "1rem", height: "1rem" }} strokeWidth={2.5} />}
          {saving ? "Saving…" : "Save Configuration"}
        </button>
        <span className="text-[0.75rem] text-text-mid">{filled} tag{filled === 1 ? "" : "s"} mapped</span>
        {savedMsg && <span className="text-[0.8125rem] font-semibold text-status-run">{savedMsg}</span>}
      </div>
    </section>
  );
}
