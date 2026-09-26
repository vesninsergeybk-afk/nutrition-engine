function section(xml, tag) {
  const match = String(xml || "").match(
    new RegExp("<" + tag + "\\b[^>]*>([\\s\\S]*?)<\\/" + tag + ">", "i")
  );
  if (!match) throw new Error("VTP section missing: " + tag);
  return match[1];
}

function attr(source, name) {
  const match = String(source || "").match(
    new RegExp("\\b" + name + '="([^"]+)"', "i")
  );
  return match ? match[1] : null;
}

function arraysIn(sectionText) {
  const arrays = [];
  const re = /<DataArray\b([^>]*)>([\s\S]*?)<\/DataArray>/gi;
  let match;
  while ((match = re.exec(sectionText))) {
    arrays.push({
      attrs: match[1],
      body: match[2],
      name: attr(match[1], "Name"),
      format: attr(match[1], "format"),
      components: Number(attr(match[1], "NumberOfComponents") || 1),
    });
  }
  return arrays;
}

function numbers(text, integer = false) {
  const values = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((value) => (integer ? Number.parseInt(value, 10) : Number(value)));
  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error("VTP contains a non-finite numeric value");
  }
  return values;
}

export function parseAsciiVtpPolyData(xml) {
  const source = String(xml || "");
  const vtk = source.match(/<VTKFile\b([^>]*)>/i);
  if (!vtk || attr(vtk[1], "type") !== "PolyData") {
    throw new Error("Only VTK PolyData is supported");
  }

  const piece = source.match(/<Piece\b([^>]*)>/i);
  if (!piece) throw new Error("VTP Piece missing");

  const pointCount = Number(attr(piece[1], "NumberOfPoints"));
  const polygonCount = Number(attr(piece[1], "NumberOfPolys"));
  if (!Number.isInteger(pointCount) || pointCount <= 0) {
    throw new Error("Invalid VTP point count");
  }
  if (!Number.isInteger(polygonCount) || polygonCount <= 0) {
    throw new Error("Invalid VTP polygon count");
  }

  const pointArrays = arraysIn(section(source, "Points"));
  if (pointArrays.length !== 1) {
    throw new Error("Expected exactly one VTP Points DataArray");
  }
  const pointsArray = pointArrays[0];
  if (
    pointsArray.format !== "ascii" ||
    pointsArray.components !== 3
  ) {
    throw new Error("Only ASCII vec3 VTP points are supported");
  }
  const positions = numbers(pointsArray.body);
  if (positions.length !== pointCount * 3) {
    throw new Error(
      "VTP point payload length does not match NumberOfPoints"
    );
  }

  const polyArrays = arraysIn(section(source, "Polys"));
  const connectivityArray = polyArrays.find(
    (item) => item.name === "connectivity"
  );
  const offsetsArray = polyArrays.find((item) => item.name === "offsets");
  if (!connectivityArray || !offsetsArray) {
    throw new Error("VTP polygon connectivity/offsets missing");
  }
  if (
    connectivityArray.format !== "ascii" ||
    offsetsArray.format !== "ascii"
  ) {
    throw new Error("Only ASCII VTP polygon arrays are supported");
  }

  const connectivity = numbers(connectivityArray.body, true);
  const offsets = numbers(offsetsArray.body, true);
  if (offsets.length !== polygonCount) {
    throw new Error("VTP offsets length does not match NumberOfPolys");
  }
  if (offsets[offsets.length - 1] !== connectivity.length) {
    throw new Error("VTP final polygon offset does not match connectivity");
  }

  const indices = [];
  let start = 0;
  for (let polygonIndex = 0; polygonIndex < offsets.length; polygonIndex += 1) {
    const end = offsets[polygonIndex];
    if (!Number.isInteger(end) || end <= start || end > connectivity.length) {
      throw new Error("Invalid VTP polygon offset");
    }
    const polygon = connectivity.slice(start, end);
    if (polygon.length < 3) {
      throw new Error("VTP polygon has fewer than three vertices");
    }
    for (const vertex of polygon) {
      if (!Number.isInteger(vertex) || vertex < 0 || vertex >= pointCount) {
        throw new Error("VTP polygon references an invalid vertex");
      }
    }
    for (let i = 1; i < polygon.length - 1; i += 1) {
      indices.push(polygon[0], polygon[i], polygon[i + 1]);
    }
    start = end;
  }

  return Object.freeze({
    pointCount,
    polygonCount,
    triangleCount: indices.length / 3,
    positions: new Float32Array(positions),
    indices: new Uint32Array(indices),
  });
}
