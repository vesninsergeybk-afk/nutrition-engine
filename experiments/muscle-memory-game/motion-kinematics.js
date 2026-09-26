const FLEXOR_UNITS = new Set([
  "biceps-long",
  "biceps-short",
  "brachialis",
  "brachioradialis",
]);

const EXTENSOR_UNITS = new Set([
  "triceps-long",
  "triceps-lateral",
  "triceps-medial",
]);

export const ELBOW_KINEMATIC_LIMITS = Object.freeze({
  minDeg: 0,
  maxDeg: 120,
  speedDegPerSecond: 55,
});

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

export function elbowMotionAction(unitIds = []) {
  const units = new Set(unitIds || []);
  const flexor = [...units].some((id) => FLEXOR_UNITS.has(id));
  const extensor = [...units].some((id) => EXTENSOR_UNITS.has(id));

  if (!flexor && !extensor) return null;

  // A combined antagonist selection is deliberately not resolved here.
  // MyoSim will be the authority for simultaneous competing activation.
  if (flexor && extensor) return null;

  return Object.freeze({
    pilotId: "elbow",
    movementId: "elbow-flexion",
    direction: flexor ? "flexion" : "extension",
    nameRu: flexor ? "Сгибание в локте" : "Разгибание в локте",
    minDeg: ELBOW_KINEMATIC_LIMITS.minDeg,
    maxDeg: ELBOW_KINEMATIC_LIMITS.maxDeg,
    startDeg: flexor
      ? ELBOW_KINEMATIC_LIMITS.minDeg
      : ELBOW_KINEMATIC_LIMITS.maxDeg,
    playDirection: flexor ? 1 : -1,
    authority: "kinematic-preview",
  });
}

export function clampElbowAngle(angleDeg) {
  return clamp(
    angleDeg,
    ELBOW_KINEMATIC_LIMITS.minDeg,
    ELBOW_KINEMATIC_LIMITS.maxDeg
  );
}

export function elbowFlexionRadians(angleDeg) {
  // Atlas coordinates use +Y superior and +Z anterior. A negative rotation
  // around the mediolateral X axis moves a dependent forearm anteriorly.
  return (-clampElbowAngle(angleDeg) * Math.PI) / 180;
}

export function elbowActivation(angleDeg, direction = "flexion") {
  const progress =
    (clampElbowAngle(angleDeg) - ELBOW_KINEMATIC_LIMITS.minDeg) /
    (ELBOW_KINEMATIC_LIMITS.maxDeg - ELBOW_KINEMATIC_LIMITS.minDeg);
  return direction === "extension" ? 1 - progress : progress;
}

export function contractionScale(
  angleDeg,
  direction = "flexion",
  {
    longitudinalShortening = 0.08,
    transverseBulge = 0.07,
  } = {}
) {
  const activation = elbowActivation(angleDeg, direction);
  return Object.freeze({
    x: 1 + transverseBulge * activation,
    y: 1 - longitudinalShortening * activation,
    z: 1 + transverseBulge * activation,
    activation,
  });
}

export function advanceElbowAngle(
  angleDeg,
  playDirection,
  deltaSeconds,
  limits = ELBOW_KINEMATIC_LIMITS
) {
  const direction = playDirection >= 0 ? 1 : -1;
  const next =
    Number(angleDeg) +
    direction * limits.speedDegPerSecond * Math.max(0, Number(deltaSeconds) || 0);

  if (next >= limits.maxDeg) {
    return Object.freeze({ angleDeg: limits.maxDeg, direction: -1 });
  }
  if (next <= limits.minDeg) {
    return Object.freeze({ angleDeg: limits.minDeg, direction: 1 });
  }
  return Object.freeze({ angleDeg: next, direction });
}
