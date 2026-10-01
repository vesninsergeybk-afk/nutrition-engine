// Keep one render loop, including browser backgrounding and GPU recovery.
export function viewerPixelRatio(deviceRatio, coarsePointer) {
  const ratio = Number.isFinite(deviceRatio) && deviceRatio > 0 ? deviceRatio : 1;
  return Math.min(ratio, coarsePointer ? 1.5 : 2);
}

export function createWebGLSession({ canvas, renderFrame, onLost, onRestored }) {
  let frame = null;
  let lost = false;
  let restoring = false;
  let disposed = false;

  function stop() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
  }

  function schedule() {
    if (disposed || lost || document.hidden || frame !== null) return;
    frame = requestAnimationFrame(draw);
  }

  function draw(now) {
    frame = null;
    if (disposed || lost || document.hidden) return;
    renderFrame(now);
    canvas.dataset.webglSessionState = "ready";
    if (restoring) {
      restoring = false;
      onRestored?.();
    }
    schedule();
  }

  function contextLost(event) {
    event.preventDefault();
    if (lost || disposed) return;
    lost = true;
    stop();
    canvas.dataset.webglSessionState = "lost";
    onLost?.(event);
  }

  function contextRestored() {
    if (disposed) return;
    lost = false;
    restoring = true;
    canvas.dataset.webglSessionState = "restoring";
    schedule();
  }

  function visibilityChanged() {
    if (document.hidden) {
      stop();
      if (!lost) canvas.dataset.webglSessionState = "paused";
    } else {
      schedule();
    }
  }

  canvas.addEventListener("webglcontextlost", contextLost);
  canvas.addEventListener("webglcontextrestored", contextRestored);
  document.addEventListener("visibilitychange", visibilityChanged);
  schedule();
  return {
    dispose() {
      disposed = true;
      stop();
      canvas.removeEventListener("webglcontextlost", contextLost);
      canvas.removeEventListener("webglcontextrestored", contextRestored);
      document.removeEventListener("visibilitychange", visibilityChanged);
    },
  };
}
