import assert from "node:assert/strict";
import { viewerPixelRatio } from "./webgl-session.js";

assert.equal(viewerPixelRatio(3, true), 1.75);
assert.equal(viewerPixelRatio(3, true, "high"), 2);
assert.equal(viewerPixelRatio(1, true, "high"), 1);
assert.equal(viewerPixelRatio(3, false), 2);
assert.equal(viewerPixelRatio(3, false, "high"), 2.25);
assert.equal(viewerPixelRatio(NaN, true, "high"), 1);

console.log("3D quality: balanced and high-resolution pixel budgets verified");
