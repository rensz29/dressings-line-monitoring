import { Cable, Radio, Database, Globe } from "lucide-react";

/* ============================================================================
   CONNECTION STATUS — OPC UA is the real bridge link; MQTT / DB / API are
   simulated placeholders (from useSimulatedMetrics().links) shaped so real
   health flags drop straight in.
============================================================================ */
function Chip({ icon: Icon, label, up }) {
  const color = up ? "var(--color-status-run)" : "var(--color-status-stop)";
  return (
    <span
      className="flex items-center gap-[0.375rem] rounded-sm border border-border-subtle bg-bg-deep px-[0.5rem] py-[0.25rem]"
      title={`${label}: ${up ? "connected" : "down"}`}
    >
      <span
        className="size-[0.375rem] rounded-full"
        style={{ background: color, animation: up ? "an-conn 2.4s ease-in-out infinite" : undefined }}
      />
      <Icon style={{ width: "0.75rem", height: "0.75rem" }} className="text-text-mid" strokeWidth={1.75} />
      <span className="text-[0.625rem] font-bold tracking-[0.08em]" style={{ color: up ? "var(--color-text-mid)" : color }}>
        {label}
      </span>
    </span>
  );
}

export default function ConnectionStatus({ connected, links }) {
  return (
    <div className="flex items-center gap-[0.375rem]">
      <Chip icon={Cable} label="OPC UA" up={connected} />
    </div>
  );
}
