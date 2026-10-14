// Translate the chase rig with the ship before easing its relative offset.
// World-space easing alone makes frame-time changes look like catch-up jumps.
export function followChaseCamera(position,target,shipDisplacement,dt,response=9) {
  position.add(shipDisplacement);
  position.lerp(target,1-Math.exp(-response*Math.max(0,dt)));
}
