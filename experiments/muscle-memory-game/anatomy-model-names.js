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
