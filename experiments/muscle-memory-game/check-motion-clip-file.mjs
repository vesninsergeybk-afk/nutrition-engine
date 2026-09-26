import fs from "node:fs";
import { createMotionClip } from "./motion-clip.js";

const files = process.argv.slice(2);
if (!files.length) {
  throw new Error("Pass at least one motion clip JSON file");
}

for (const file of files) {
  const parsed = JSON.parse(fs.readFileSync(file, "utf8"));
  const clip = createMotionClip(parsed);
  console.log(
    file +
      ": " +
      clip.frames.length +
      " frames, duration=" +
      clip.duration.toFixed(3) +
      "s, source=" +
      clip.sourceId +
      ", space=" +
      (clip.coordinateSpace || "unspecified") +
      ", reference=" +
      (clip.referenceBody || "ground")
  );
}
