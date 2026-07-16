import { useEffect } from "react";
import { X } from "lucide-react";
import { STATUS, keyOf } from "../config/lines.js";
import { machineIcon, STATUS_ICONS } from "../config/icons.jsx";
import { fmtTime, fmtAgo } from "../utils/format.js";
import StatusIndicator from "./StatusIndicator.jsx";

/* ============================================================================
   DETAIL DRAWER — walk-up inspection panel for a single machine.
   Same data contract as before (line, machine, entry) plus this machine's
   recent transitions from the alert log.
============================================================================ */
function Field({ label, value, mono }) {
  return (
    <div>
      <div className="mb-[0.2rem] text-[0.5625rem] font-bold tracking-[0.16em] text-text-mid uppercase">{label}</div>
      <div className={`text-[0.8125rem] break-all text-text-hi ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

export default function Drawer({ sel, events, now, tags = {}, onClose }) {
  useEffect(() => {
    if (!sel) return;
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sel, onClose]);

  if (!sel) return null;
  const status = sel.entry?.status || "OFFLINE";
  const st = STATUS[status];
  const MIcon = machineIcon(sel.machine.type);
  const SIcon = STATUS_ICONS[status];
  const configuredTag = tags[keyOf(sel.line.id, sel.machine.type)];
  const nodeId = configuredTag || `ns=2;s=${sel.line.name.replace(/\s+/g, "")}.${sel.machine.type.replace(/\s+/g, "")}.Status`;
  const history = events
    .filter((e) => e.lineId === sel.line.id && e.machineLabel === sel.machine.label)
    .slice(0, 6);

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-20 bg-black/55"
        style={{ animation: "an-fade .2s ease-out" }}
      />
      <div
        className="fixed top-0 right-0 bottom-0 z-21 flex w-[22.5rem] max-w-[92%] flex-col gap-[1rem] overflow-y-auto rounded-l-xl border-l border-border-line bg-glass p-[1.125rem] shadow-e4 backdrop-blur-md"
        style={{ animation: "an-drawer .28s cubic-bezier(.32,.72,0,1)" }}
      >
        {/* identity */}
        <div className="flex items-start justify-between gap-[0.75rem]">
          <div className="flex min-w-0 items-center gap-[0.75rem]">
            <span className="flex size-[2.5rem] shrink-0 items-center justify-center rounded-md bg-bg-deep" style={{ color: st.color }}>
              <MIcon style={{ width: "1.375rem", height: "1.375rem" }} strokeWidth={1.75} />
            </span>
            <span className="min-w-0">
              <span className="block text-[0.625rem] tracking-[0.2em] text-text-mid">{sel.line.name}</span>
              <span className="block truncate text-[1.125rem] font-extrabold text-text-hi">{sel.machine.label}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer rounded-sm p-[0.25rem] text-text-mid transition-colors hover:bg-surface-3 hover:text-text-hi"
            aria-label="Close"
          >
            <X style={{ width: "1.125rem", height: "1.125rem" }} />
          </button>
        </div>

        {/* status banner */}
        <div
          className="flex items-center gap-[0.75rem] rounded-md border bg-bg-deep p-[0.75rem]"
          style={{ borderColor: st.color }}
        >
          <StatusIndicator status={status} size={22} />
          <span className="flex items-center gap-[0.375rem] text-[1.125rem] font-extrabold tracking-[0.12em]" style={{ color: st.color }}>
            <SIcon style={{ width: "1rem", height: "1rem" }} strokeWidth={2.5} />
            {st.label}
          </span>
          <span className="ml-auto text-[0.75rem] text-text-mid tabular-nums">
            {sel.entry?.ts ? `${fmtAgo(sel.entry.ts, now)} in state` : "—"}
          </span>
        </div>

        {/* fields */}
        <div className="flex flex-col gap-[0.75rem]">
          <Field label="Station Type" value={sel.machine.type} />
          <Field label="Last Change" value={sel.entry?.ts ? `${fmtTime(sel.entry.ts)} · ${fmtAgo(sel.entry.ts, now)} ago` : "—"} />
          <Field label="OPC UA Node ID" value={nodeId} mono />
        </div>

        {/* recent events */}
        <div>
          <div className="mb-[0.375rem] text-[0.5625rem] font-bold tracking-[0.16em] text-text-mid uppercase">Recent Events</div>
          {history.length === 0 ? (
            <div className="text-[0.75rem] text-text-low">No transitions this session.</div>
          ) : (
            <div className="flex flex-col gap-[0.25rem]">
              {history.map((ev) => (
                <div key={ev.id} className="flex items-center gap-[0.5rem] rounded-sm bg-surface-1 px-[0.5rem] py-[0.3rem] text-[0.6875rem]">
                  <span className="text-text-mid">{STATUS[ev.from]?.label ?? ev.from}</span>
                  <span className="text-text-low">→</span>
                  <span className="font-bold" style={{ color: STATUS[ev.to]?.color }}>{STATUS[ev.to]?.label ?? ev.to}</span>
                  <span className="ml-auto text-text-low tabular-nums">{fmtTime(ev.ts)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-auto text-[0.6875rem] leading-relaxed text-text-low">
          {configuredTag
            ? "Node ID mapped in Settings — the bridge subscribes to this tag."
            : "Node ID is a placeholder pattern — set the real tag in Settings → Machine Tags."}
        </div>
      </div>
    </>
  );
}
