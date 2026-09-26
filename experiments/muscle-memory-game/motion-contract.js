import { motionPilot, motionVisualUnit } from "./motion-readiness.js";

function clampActivation(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error("Activation must be finite");
  return Math.min(1, Math.max(0, n));
}

export function pilotActuators(pilotId) {
  const pilot = motionPilot(pilotId);
  if (!pilot) return [];
  return pilot.muscleUnits.flatMap((unitId) => {
    const unit = motionVisualUnit(unitId);
    return unit?.myoActuators || [];
  });
}

export function createActivationFrame(pilotId, values = {}) {
  const actuators = pilotActuators(pilotId);
  if (!actuators.length) throw new Error("Unknown or empty motion pilot: " + pilotId);

  const known = new Set(actuators);
  for (const name of Object.keys(values || {})) {
    if (!known.has(name)) {
      throw new Error("Unknown actuator for " + pilotId + ": " + name);
    }
  }

  return Object.freeze({
    pilotId,
    actuators: Object.freeze(
      Object.fromEntries(
        actuators.map((name) => [name, clampActivation(values[name] ?? 0)])
      )
    ),
  });
}

function vector3(value, label) {
  if (!Array.isArray(value) || value.length !== 3 || value.some((n) => !Number.isFinite(Number(n)))) {
    throw new Error(label + " must be a finite vec3");
  }
  return Object.freeze(value.map(Number));
}

function quaternion(value, label) {
  if (!Array.isArray(value) || value.length !== 4 || value.some((n) => !Number.isFinite(Number(n)))) {
    throw new Error(label + " must be a finite quaternion");
  }
  const q = value.map(Number);
  const norm = Math.hypot(...q);
  if (!(norm > 1e-8)) throw new Error(label + " quaternion has zero norm");
  return Object.freeze(q.map((n) => n / norm));
}

export function createMotionSnapshot(pilotId, { time = 0, bodies = {} } = {}) {
  const pilot = motionPilot(pilotId);
  if (!pilot) throw new Error("Unknown motion pilot: " + pilotId);

  const normalized = {};
  for (const bodyId of pilot.bodies) {
    const value = bodies[bodyId];
    if (!value) continue;
    normalized[bodyId] = Object.freeze({
      position: vector3(value.position, bodyId + ".position"),
      quaternion: quaternion(value.quaternion, bodyId + ".quaternion"),
    });
  }

  return Object.freeze({
    pilotId,
    time: Number(time) || 0,
    bodies: Object.freeze(normalized),
  });
}
