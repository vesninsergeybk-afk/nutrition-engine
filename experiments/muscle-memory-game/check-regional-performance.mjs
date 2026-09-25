import { readFile } from "node:fs/promises";
const app=await readFile(new URL("./app.js",import.meta.url),"utf8");
function assert(condition,message){if(!condition)throw new Error(message);}
assert(
  app.includes("const activeSidSet = regional") &&
  app.includes("activeSidSet.has(sid)"),
  "Regional search still rebuilds the active structure list for every mesh"
);
assert(
  !/for \(let sid[\s\S]{0,350}activeRegionStructureIds\(\)\.includes\(sid\)/.test(app),
  "O(N²)-style regional search membership check returned"
);
assert(
  /function regionalBoneContextBox\(\)[\s\S]{0,260}availableTargets/.test(app),
  "Bone context is still enlarged by cover/context muscles"
);
assert(
  /function focusLearningRegion\(\)[\s\S]{0,220}const focusTargets = availableTargets/.test(app),
  "Camera focus is still enlarged by cover/context muscles"
);
console.log("Regional performance/framing contract: ok");


const regionHandler = app.slice(
  app.indexOf('learningRegion.addEventListener("change"'),
  app.indexOf('learningSessionMode.addEventListener', app.indexOf('learningRegion.addEventListener("change"'))
);
assert(
  !regionHandler.includes('applyRegionScene({ resetLayers: true, focus: true })'),
  "Changing a specimen still rebuilds the full regional scene twice"
);
assert(
  regionHandler.includes("focusLearningRegion()") &&
    regionHandler.includes("setFullBodyView()"),
  "Changing a specimen no longer focuses the already-updated scene"
);
console.log("Single-pass specimen switching: ok");


assert(
  app.includes("function pointWithinRegionalClip") &&
    /function boxForStructures[\s\S]*?pointWithinRegionalClip\(navPoint\)/.test(app),
  "Camera bounds still include geometry outside the virtual specimen clip"
);
assert(
  /function nearestTargetPointToCamera[\s\S]*?pointWithinRegionalClip\(point\)/.test(app),
  "Quiz/reveal targeting can still choose a clipped-away part of a long muscle"
);
console.log("Specimen clipping is shared by rendering, framing and target access");
