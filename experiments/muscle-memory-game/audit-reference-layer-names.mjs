const SOURCES = Object.freeze({
  nervous:
    "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/sinir.glb",
  vascular:
    "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/dolasim.glb",
  lymphatic:
    "https://raw.githubusercontent.com/DrMuratAltun/anatomi-simulatoru/37e85dfbbb398e11ba33c8f0e411f06f9bba592f/systems/lenf.glb",
});

function parseGlbJson(arrayBuffer) {
  const buffer = Buffer.from(arrayBuffer);
  if (buffer.length < 20 || buffer.toString("utf8", 0, 4) !== "glTF") {
    throw new Error("Invalid GLB header");
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const length = buffer.readUInt32LE(offset);
    const type = buffer.readUInt32LE(offset + 4);
    offset += 8;
    if (offset + length > buffer.length) throw new Error("Invalid GLB chunk length");
    if (type === 0x4e4f534a) {
      return JSON.parse(buffer.toString("utf8", offset, offset + length).replace(/\u0000+$/g, ""));
    }
    offset += length;
  }
  throw new Error("GLB JSON chunk not found");
}

const result = {};
for (const [layerKey, url] of Object.entries(SOURCES)) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(layerKey + ": HTTP " + response.status);
  const json = parseGlbJson(await response.arrayBuffer());

  const names = [];
  for (const node of json.nodes || []) {
    if (node.mesh == null) continue;
    const meshName = json.meshes?.[node.mesh]?.name || "";
    const name = String(node.name || meshName || "").trim();
    if (name) names.push(name);
  }

  result[layerKey] = [...new Set(names)].sort((a, b) => a.localeCompare(b, "en"));
}

process.stdout.write(JSON.stringify(result, null, 2) + "\n");
