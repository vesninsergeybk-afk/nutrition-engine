export const FIND_SELECTION_KINDS = Object.freeze({
  correct: "correct",
  navigation: "navigation",
  wrong: "wrong",
});

function uniqueVisibleOrder(values) {
  const seen = new Set();
  const ordered = [];
  for (const value of values || []) {
    if (value == null || seen.has(value)) continue;
    seen.add(value);
    ordered.push(value);
  }
  return ordered;
}

export function classifyFindSelection({
  selectedSid,
  targetSids = [],
  rayHitSids = [],
  targetOccluderSids = [],
  verifiedCover = false,
} = {}) {
  const targetSet = new Set(targetSids);
  if (targetSet.has(selectedSid)) return FIND_SELECTION_KINDS.correct;

  const ordered = uniqueVisibleOrder(rayHitSids);
  const selectedIndex = ordered.indexOf(selectedSid);
  const targetBehind =
    selectedIndex >= 0 &&
    ordered.slice(selectedIndex + 1).some((sid) => targetSet.has(sid));

  if (
    targetBehind ||
    new Set(targetOccluderSids).has(selectedSid) ||
    verifiedCover
  ) {
    return FIND_SELECTION_KINDS.navigation;
  }

  return FIND_SELECTION_KINDS.wrong;
}
