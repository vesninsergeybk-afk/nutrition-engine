import {
  FIND_SELECTION_KINDS,
  classifyFindSelection,
} from "./learning-navigation.js";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(
  classifyFindSelection({
    selectedSid: 7,
    targetSids: [7, 8],
  }) === FIND_SELECTION_KINDS.correct,
  "Target click must be correct"
);

assert(
  classifyFindSelection({
    selectedSid: 2,
    targetSids: [7],
    rayHitSids: [2, 2, 7],
  }) === FIND_SELECTION_KINDS.navigation,
  "A structure directly in front of the target must be navigation, not an error"
);

assert(
  classifyFindSelection({
    selectedSid: 3,
    targetSids: [7],
    targetOccluderSids: [1, 3, 4],
  }) === FIND_SELECTION_KINDS.navigation,
  "A current target occluder must be navigation"
);

assert(
  classifyFindSelection({
    selectedSid: 5,
    targetSids: [7],
    verifiedCover: true,
  }) === FIND_SELECTION_KINDS.navigation,
  "A verified anatomical cover relation must be navigation"
);

assert(
  classifyFindSelection({
    selectedSid: 9,
    targetSids: [7],
    rayHitSids: [9, 10],
    targetOccluderSids: [1, 3],
    verifiedCover: false,
  }) === FIND_SELECTION_KINDS.wrong,
  "An unrelated muscle must remain a real identification error"
);

console.log("Find learning policy: correct/navigation/wrong semantics ok");
