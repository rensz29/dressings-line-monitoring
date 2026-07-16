import { LINES, keyOf } from "../config/lines.js";

/* ============================================================================
   DISCOVER MATCH — map server-discovered *_iState tags onto the app's fixed
   lines/machines (config/lines.js). Best-effort: exact matches are trusted,
   fuzzy/multiple matches are flagged "review", the rest stay "unmatched".
   Kepware browse names look like:
     Dressing Halal_Line B_Depalletizer_Dressing Halal DFOS PLC_100460_iState
============================================================================ */
const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9]/g, "");

function parseTag(browseName) {
  let s = browseName.replace(/_iState$/i, "");
  s = s.replace(/^Dressings?\s+Halal_/i, "");            // channel prefix
  s = s.replace(/_Dressings?\s+Halal DFOS PLC_\d+$/i, ""); // trailing PLC id
  const i = s.indexOf("_");
  return i < 0 ? { line: "", machine: s } : { line: s.slice(0, i), machine: s.slice(i + 1) };
}

function sharesToken(a, b) {
  if (!a || !b) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i >= 3) return true;                                 // common prefix (jar…)
  for (let j = 0; j + 4 <= b.length; j++) if (a.includes(b.slice(j, j + 4))) return true;
  return false;
}

export function matchDiscoveredTags(discovered) {
  const parsed = discovered.map((d) => {
    const p = parseTag(d.browseName);
    return { nodeId: d.nodeId, nLine: norm(p.line), nMachine: norm(p.machine) };
  });

  const tags = {};
  const status = {}; // key -> "matched" | "review" | "unmatched"
  let matched = 0, review = 0, unmatched = 0;

  for (const line of LINES) {
    const nLine = norm(line.name);
    let pool = parsed.filter((t) => t.nLine === nLine);
    if (pool.length === 0) pool = parsed.filter((t) => t.nLine && (t.nLine.includes(nLine) || nLine.includes(t.nLine)));

    for (const m of line.machines) {
      const key = keyOf(line.id, m.type);
      const nType = norm(m.type);
      const nLabel = norm(m.label);

      let cands = pool.filter((t) => t.nMachine === nType || t.nMachine === nLabel);
      let conf = "matched";
      if (cands.length === 0) {
        cands = pool.filter((t) => t.nMachine.includes(nType) || nType.includes(t.nMachine));
        conf = cands.length === 1 ? "matched" : "review";
      }
      if (cands.length === 0) {
        cands = pool.filter((t) => t.nMachine.includes(nLabel) || sharesToken(t.nMachine, nType));
        conf = "review";
      }

      if (cands.length === 0) { status[key] = "unmatched"; unmatched++; continue; }
      if (cands.length > 1) conf = "review";
      tags[key] = cands[0].nodeId;
      status[key] = conf;
      if (conf === "matched") matched++; else review++;
    }
  }
  return { tags, status, summary: { matched, review, unmatched } };
}
