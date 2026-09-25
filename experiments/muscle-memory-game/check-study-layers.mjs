import { readFile } from "node:fs/promises";

const root = new URL("./", import.meta.url);
const [html, app] = await Promise.all([
  readFile(new URL("index.html", root), "utf8"),
  readFile(new URL("app.js", root), "utf8"),
]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(html.includes('id="skin-mode"'), "Skin layer control is missing");
assert(
  html.includes('data-connective-layer="subcutaneous"') &&
  html.includes('data-connective-layer="fascia"') &&
  html.includes('data-connective-layer="tendon"') &&
  html.includes('data-connective-layer="ligament"') &&
  html.includes('data-connective-layer="joint"') &&
  html.includes('data-connective-layer="cartilage"') &&
  html.includes('data-connective-layer="other"'),
  "Massage-relevant connective sublayers are incomplete"
);

for (const layer of ["nervous", "vascular", "lymphatic"]) {
  assert(
    html.includes('data-reference-layer="' + layer + '"'),
    "Reference layer control is missing: " + layer
  );
  assert(
    app.includes(layer + ': "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/'),
    "Reference layer source is not pinned: " + layer
  );
}

assert(
  /skinDisplayMode\s*=\s*"off"/.test(app),
  "Skin must remain opt-in so it cannot cover the muscle atlas by default"
);
assert(
  app.includes("applyTrainingDisplayOverride") &&
  app.includes("referenceTrainingHidden") &&
  app.includes("skinTrainingHidden") &&
  app.includes("connectiveTrainingHidden"),
  "Training display does not explicitly protect muscle visibility from study layers"
);
assert(
  app.includes("CONNECTIVE_DISPLAY_NAME_RE") &&
  app.includes("iliotibial tract"),
  "Known connective-source recovery rule is missing"
);

console.log("Massage study layers: static contract ok");
console.log("Skin: opt-in");
console.log("Connective sublayers: 7");
console.log("Lazy safety-reference layers: 3");

assert(
  html.includes('id="show-nearest-muscle"'),
  "Nearest-muscle navigation is missing from the atlas"
);
assert(
  app.includes("studyStructureIdFromHit") &&
  app.includes("selectStudyStructure") &&
  app.includes("isolateSelectedStudyStructure"),
  "Study-layer structures are not individually selectable/isolatable"
);
assert(
  app.includes("Ближайшая мышечная структура в этой 3D-модели") &&
  app.includes("Это пространственный ориентир, а не утверждение о прикреплении"),
  "Nearest-muscle relation is not qualified carefully enough"
);
console.log("Study-layer interaction: selectable, isolatable, searchable");
