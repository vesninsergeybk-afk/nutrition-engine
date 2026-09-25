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
