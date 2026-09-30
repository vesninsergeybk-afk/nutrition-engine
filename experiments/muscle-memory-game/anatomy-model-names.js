// GLTFLoader sanitizes display names and can represent a multi-primitive
// anatomical node as a Group containing several Mesh children. Resolve the
// original name through the node that owns this mesh, not a regional ancestor.
export function originalAnatomyName(object, parser) {
  const associations = parser?.associations;
  const meshIndex = associations?.get(object)?.meshes;
  for (let node = object; node; node = node.parent) {
    const nodeIndex = associations?.get(node)?.nodes;
    const definition = nodeIndex === undefined ? null : parser?.json?.nodes?.[nodeIndex];
    if (definition?.mesh !== undefined &&
        (meshIndex === undefined || definition.mesh === meshIndex) && definition.name) {
      return definition.name;
    }
  }
  return object?.userData?.name || String(object?.name || "").replace(/_/g, " ");
}

// The pinned muscular GLB also contains connective and joint structures.
// A name containing "infraspinatus muscle" may belong to its bursa; it must
// not be presented as a muscle result. Geometry is retained in the scene.
export function isZAnatomyMuscleSourceName(name) {
  return !/fascia|aponeuros|retinacul|peritone|pleura|dura mater|pericardi|omentum|epicardium|bursa|bursae|tendon|tendinous|sheath|ligament|tract|septum|tarsus|linea alba|trochlea|synovial|iliopectineal arch|common tendinous ring/i.test(String(name || ""));
}
