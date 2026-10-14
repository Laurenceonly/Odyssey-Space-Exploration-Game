// Interior dimensions are metres; the exterior retains compressed orbital units.
export const cabinLayout = Object.freeze({
  halfWidth: 2.9, halfDepth: 3.2, height: 3.2, eyeHeight: 1.65, playerRadius: .22,
  cockpit: Object.freeze({ halfWidth: 2.4, front: -7.6, doorwayHalfWidth: 1.05 }),
  window: Object.freeze({ width: 4.3, height: 1.9, x: 0, y: 1.85, z: -7.59, yaw: 0 }),
  sideWindow: Object.freeze({ width: 3.3, height: 1.75, x: -2.89, y: 1.85, z: -.9, yaw: Math.PI / 2 }),
  furniture: Object.freeze([
    Object.freeze({ minX: -2.9, maxX: -1.95, minZ: .6, maxZ: 2.4 }),
    Object.freeze({ minX: 2.05, maxX: 2.9, minZ: .65, maxZ: 2.45 }),
    Object.freeze({ minX: -.44, maxX: .44, minZ: -5.85, maxZ: -4.65 }),
    Object.freeze({ minX: -2.4, maxX: 2.4, minZ: -7.6, maxZ: -6.65 }),
  ]),
});

export function cabinPositionClear(x, z) {
  const { halfWidth, halfDepth, cockpit, playerRadius: r, furniture } = cabinLayout;
  if (z > halfDepth - r || z < cockpit.front + r || Math.abs(x) > (z < -halfDepth ? cockpit.halfWidth : halfWidth) - r) return false;
  if (Math.abs(z + halfDepth) < .12 + r && Math.abs(x) > cockpit.doorwayHalfWidth - r) return false;
  return !furniture.some(item => x > item.minX - r && x < item.maxX + r && z > item.minZ - r && z < item.maxZ + r);
}

export function moveCabinWalker(position, forward, strafe, yaw, dt, speed = 1.65) {
  const length = Math.hypot(forward, strafe);
  if (!length || dt <= 0) return;
  const distance = speed * Math.min(dt, .05) / Math.max(1, length);
  const dx = (strafe * Math.cos(yaw) - forward * Math.sin(yaw)) * distance;
  const dz = (-forward * Math.cos(yaw) - strafe * Math.sin(yaw)) * distance;
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / .08));
  for (let i = 0; i < steps; i++) {
    if (cabinPositionClear(position.x + dx / steps, position.z)) position.x += dx / steps;
    if (cabinPositionClear(position.x, position.z + dz / steps)) position.z += dz / steps;
  }
}

export function nearCabinCockpit(position) {
  // Exploring the room never takes control; the pilot seat is a separate action.
  return position.z < -4.05 && position.z > -6.6 && Math.abs(position.x) < 1.35;
}

// Match the canvas pixel grid, bounded by GPU dimensions and a 4K pixel budget.
export function windowRenderSize(width, height, maxDimension = 4096) {
  const w = Math.max(1, Math.round(width) || 1), h = Math.max(1, Math.round(height) || 1);
  const scale = Math.min(1, maxDimension / Math.max(w, h), Math.sqrt(3840 * 2160 / (w * h)));
  return { width: Math.max(1, Math.floor(w * scale)), height: Math.max(1, Math.floor(h * scale)) };
}
