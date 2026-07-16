export const fmtTime = (ts) =>
  new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

export const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

export const fmtAgo = (ts, now = Date.now()) => {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`;
};

export const fmtDuration = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
};

export const fmtPct = (v) => (v == null ? "—" : `${Math.round(v)}%`);

/* Shift schedule: 06–14 A, 14–22 B, 22–06 C. */
export const shiftForHour = (h) => (h >= 6 && h < 14 ? "1" : h >= 14 && h < 22 ? "2" : "3");
