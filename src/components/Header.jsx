import { Settings } from "lucide-react";
import { fmtTime, fmtDate, shiftForHour } from "../utils/format.js";
import unileverLogo from "../assets/unilever-logo.png";
import ConnectionStatus from "./ConnectionStatus.jsx";
import HealthRing from "./HealthRing.jsx";

/* ============================================================================
   HEADER — identity left, time center, system state right.
   One of only three glass (backdrop-blur) surfaces on the board.
============================================================================ */
export default function Header({ now, connected, links, factoryHealth, onOpenSettings }) {
  const shift = shiftForHour(new Date(now).getHours());
  return (
    <header className="flex h-[4rem] shrink-0 items-center justify-between gap-[1rem] border-b border-border-subtle bg-glass px-[1.125rem] shadow-e1 backdrop-blur-md">
      {/* identity */}
      <div className="flex min-w-0 items-center gap-[0.75rem]">
        <span className="flex h-[3.25rem] shrink-0 items-center justify-center rounded-md bg-white px-[0.625rem] shadow-e1">
          <img src={unileverLogo} alt="Unilever" className="h-[2.85rem] w-auto" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[1.25rem] leading-tight font-extrabold tracking-[0.12em]">
            DFOS · DRESSING HALAL
          </span>
          <span className="block text-[0.625rem] tracking-[0.2em] text-text-mid uppercase">
            Packaging Andon · Live
          </span>
        </span>
      </div>

      {/* time */}
      <div className="flex items-center gap-[0.875rem]">
        <span className="text-[0.6875rem] font-medium text-text-mid">{fmtDate(now)}</span>
        <span className="text-[1.375rem] font-bold tabular-nums">{fmtTime(now)}</span>
        <span className="rounded-sm border border-border-line bg-surface-2 px-[0.5rem] py-[0.2rem] text-[0.6875rem] font-bold tracking-[0.1em] text-accent-cyan">
          SHIFT {shift}
        </span>
      </div>

      {/* system state */}
      <div className="flex shrink-0 items-center gap-[0.875rem]">
        <ConnectionStatus connected={connected} links={links} />
        <span className="flex items-center gap-[0.375rem]" title="Factory health">
          <HealthRing value={factoryHealth} size={34} strokeWidth={3.5} fontSize={11} />
        </span>
        <button
          onClick={onOpenSettings}
          title="Settings"
          aria-label="Settings"
          className="flex size-[2rem] cursor-pointer items-center justify-center rounded-md border border-border-line bg-surface-2 text-text-mid transition-colors hover:border-border-strong hover:text-text-hi"
        >
          <Settings style={{ width: "1.1rem", height: "1.1rem" }} strokeWidth={2} />
        </button>
      </div>
    </header>
  );
}
