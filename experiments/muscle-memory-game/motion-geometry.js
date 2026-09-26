export function geometryRangeIndexPlan(range, indexArray = null) {
  if (!range || !Number.isInteger(range.start) || !Number.isInteger(range.count)) {
    throw new Error("Invalid geometry range");
  }
  if (range.start < 0 || range.count <= 0) {
    throw new Error("Invalid geometry range bounds");
  }

  if (!indexArray) {
    return {
      indexed: false,
      vertexStart: range.start,
      vertexCount: range.count,
      indices: null,
    };
  }

  const min = range.start;
  const max = range.start + range.count;
  const remapped = [];

  for (let i = 0; i + 2 < indexArray.length; i += 3) {
    const a = Number(indexArray[i]);
    const b = Number(indexArray[i + 1]);
    const c = Number(indexArray[i + 2]);
    const inside =
      a >= min && a < max &&
      b >= min && b < max &&
      c >= min && c < max;
    if (!inside) continue;
    remapped.push(a - min, b - min, c - min);
  }

  return {
    indexed: true,
    vertexStart: range.start,
    vertexCount: range.count,
    indices: remapped,
  };
}

export function copyAttributeRange(array, itemSize, start, count) {
  if (!array || !Number.isInteger(itemSize) || itemSize <= 0) {
    throw new Error("Invalid source attribute");
  }
  const begin = start * itemSize;
  const end = (start + count) * itemSize;
  return array.slice(begin, end);
}

export function motionGeometryDescriptor({
  kind,
  id,
  name,
  range,
  indexed = false,
}) {
  if (!["muscle", "bone"].includes(kind)) {
    throw new Error("Motion geometry kind must be muscle or bone");
  }
  return Object.freeze({
    kind,
    id,
    name: String(name || ""),
    range: Object.freeze({ start: range.start, count: range.count }),
    indexed: Boolean(indexed),
    restPoseSpace: "atlas-world",
    transformPolicy: kind === "bone" ? "rigid-body" : "deformable",
  });
}
