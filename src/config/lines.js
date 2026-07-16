/* ============================================================================
   PLANT CONFIGURATION — machines in process order, top = infeed.
   `type` must match the bridge's machineType (data contract).
============================================================================ */
export const LINE_DEFS = {
  lineb: { name: "LINE B", machines: [
    { type: "Depalletizer", label: "Depalletizer" },
    { type: "Jar Blower", label: "Jar Blower" },
    { type: "Filler", label: "Filler" },
    { type: "Capper", label: "Capper 470/220" },
    { type: "SOB", label: "SOB 470/220" },
    { type: "Autocaser", label: "Autocaser" },
    { type: "Shrink Tunnel", label: "Shrink Tunnel" },
    { type: "Xray", label: "X-Ray" },
    { type: "Case Sealer", label: "Case Sealer" },
  ]},
  // bottlenh: { name: "BOTTLE NH", machines: [
  //   { type: "Depalletizer", label: "Depalletizer" },
  //   { type: "Filler", label: "Filler" },
  //   { type: "Capper", label: "Capper" },
  //   { type: "SOB", label: "SOB" },
  //   { type: "Check Weigher", label: "Check Weigher" },
  //   { type: "Shrink Tunnel", label: "Shrink Tunnel" },
  //   { type: "Autocaser", label: "Autocaser" },
  //   { type: "Case Sealer", label: "Case Sealer" },
  // ]},
  linea: { name: "LINE A", machines: [
    { type: "Filler", label: "Filler" },
    { type: "Capper", label: "Capper" },
    { type: "Jar Blower", label: "Jarblower" },
    { type: "SOB", label: "SOB" },
    { type: "Labeller", label: "Labeller" },
    { type: "Shrink Tunnel", label: "Shrink Tunnel" },
    { type: "Case Sealer", label: "Case Sealer" },
  ]},
  serac: { name: "SERAC", machines: [
    { type: "Filler", label: "Filler / Capper" },
    { type: "SOB", label: "SOB Applicator" },
    { type: "Shrink Tunnel", label: "Shrink Tunnel" },
    { type: "Xray", label: "X-Ray" },
    { type: "Case Sealer", label: "Case Sealer" },
  ]},
  boatopack: { name: "BOATOPACK", machines: [
    { type: "Filler", label: "Filler" },
    { type: "Check Weigher", label: "Check Weigher" },
    { type: "Case Former", label: "Case Former" },
    { type: "Autocaser", label: "Autocaser" },
    { type: "Case Sealer", label: "Case Taper" },
  ]},
  boatopack2: { name: "BOATOPACK 2", machines: [
    { type: "Filler", label: "Filler" },
    { type: "Check Weigher", label: "Check Weigher" },
    { type: "Case Former", label: "Case Former" },
    { type: "Autocaser", label: "Auto Caser" },
    { type: "Case Sealer", label: "Case Taper" },
  ]},
  toyo: { name: "MESPACK H", machines: [
    { type: "Filler", label: "Filler" },
    { type: "Case Former", label: "Case Former" },
    { type: "Case Packer", label: "Case Packer" },
    { type: "Check Weigher", label: "Check Weigher" },
    { type: "Case Sealer", label: "Case Taper" },
  ]},
  ilapak: { name: "ILAPAK", machines: [
    { type: "Filler", label: "Filler" },
    { type: "Check Weigher", label: "Check Weigher" },
    { type: "Case Sealer", label: "Case Sealer" },
  ]},
  volpak: { name: "VOLPAK", machines: [
    { type: "Filler", label: "Filler" },
    { type: "Autocaser", label: "BPA Autopacker" },
  ]},
  c1: { name: "C1", machines: [
    { type: "Filler", label: "Filler" },
    { type: "Case Sealer", label: "Case Sealer" },
  ]},
  // doynh: { name: "DOY NH", machines: [
  //   { type: "Filler", label: "Filler" },
  //   { type: "Case Sealer", label: "Case Sealer" },
  // ]},
  // akashnh: { name: "AKASH NH", machines: [
  //   { type: "Filler", label: "Akash Line" },
  // ]},
};

/* Two rows, grouped by line length so box sizes stay uniform per row. */
export const ROWS = [
  ["lineb", "linea", "serac", "boatopack", "boatopack2"], // longest: 9
  ["toyo", "ilapak", "volpak", "c1"],                                 // longest: 5
];

export const LINES = Object.entries(LINE_DEFS).map(([id, d]) => ({ id, ...d }));
export const TOTAL_MACHINES = LINES.reduce((n, ln) => n + ln.machines.length, 0);

export const keyOf = (lineId, type) => `${lineId}|${type}`;

/* ============================================================================
   STATUS META — colors point at the design tokens in index.css so the whole
   theme stays in one place. `rank` orders severity for line rollups.
============================================================================ */
export const STATUS = {
  RUNNING: { label: "RUN",     rank: 0,  color: "var(--color-status-run)",     glow: "var(--color-glow-run)" },
  WAITING: { label: "WAIT",    rank: 1,  color: "var(--color-status-wait)",    glow: "var(--color-glow-wait)" },
  BLOCKED: { label: "BLOCKED", rank: 2,  color: "var(--color-status-blocked)", glow: "var(--color-glow-blocked)" },
  STOPPED: { label: "STOP",    rank: 3,  color: "var(--color-status-stop)",    glow: "var(--color-glow-stop)" },
  OFFLINE: { label: "NO DATA", rank: -1, color: "var(--color-status-nodata)",  glow: "transparent" },
};

export function lineRollup(line, statuses) {
  let worst = null;
  line.machines.forEach((m) => {
    const st = statuses[keyOf(line.id, m.type)]?.status;
    if (!st || st === "OFFLINE") return;
    if (worst === null || STATUS[st].rank > STATUS[worst].rank) worst = st;
  });
  return worst || "OFFLINE";
}
