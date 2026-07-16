import { STATUS } from "../config/lines.js";

/* ============================================================================
   STATUS INDICATOR — andon lamp. A solid dot plus a dedicated glow layer
   whose opacity/transform is animated (never box-shadow) so 51 simultaneous
   lamps stay compositor-only.
     RUN     breathing glow      WAIT    slow pulse
     STOP    heartbeat + ripple  BLOCKED ripple
     NO DATA / OFFLINE           static, dimmed
============================================================================ */
const GLOW_ANIM = {
  RUNNING: "an-breath 3.2s ease-in-out infinite",
  WAITING: "an-pulse 2.2s ease-in-out infinite",
  STOPPED: "an-pulse 1.3s ease-in-out infinite",
  BLOCKED: "an-pulse 1.8s ease-in-out infinite",
};

export default function StatusIndicator({ status, size = 12 }) {
  const st = STATUS[status] || STATUS.OFFLINE;
  const live = status !== "OFFLINE";
  const px = `${size / 16}rem`;
  return (
    <span
      className="relative inline-block shrink-0"
      style={{ width: px, height: px, opacity: live ? 1 : 0.55 }}
    >
      {live && (
        <span
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: `-${size / 48}rem`,
            background: `radial-gradient(circle, ${st.glow} 0%, transparent 70%)`,
            animation: GLOW_ANIM[status],
          }}
        />
      )}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle at 35% 30%, rgb(255 255 255 / ${live ? 0.35 : 0.08}) 0%, transparent 45%), ${st.color}`,
          animation: status === "STOPPED" ? "an-heartbeat 1.3s ease-in-out infinite" : undefined,
        }}
      />
      {(status === "STOPPED" || status === "BLOCKED") && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full border"
          style={{
            borderColor: st.color,
            animation: `an-ripple ${status === "STOPPED" ? "1.2s" : "1.8s"} cubic-bezier(0,0,.2,1) infinite`,
          }}
        />
      )}
    </span>
  );
}
