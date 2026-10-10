// Keep the Exploration launch above the entire Moon orbit, at every phase.
export function orbitalSafeHeight(bodyRadius,shipRadius=1.4,margin=2.6) {
  return bodyRadius+shipRadius+margin;
}

// Saved flights may still sit in the old launch position. Clear the whole
// orbital sweep before the Moon reaches them, rather than waiting for impact.
export function clearOrbitalSweep(position,center,orbitRadius,bodyRadius) {
  const radialDistance=Math.hypot(position.x-center.x,position.z-center.z);
  const height=position.y-center.y;
  const safeHeight=orbitalSafeHeight(bodyRadius);
  if(Math.hypot(radialDistance-orbitRadius,height)>=safeHeight)return false;
  position.y=center.y+(height<0?-safeHeight:safeHeight);
  return true;
}

// An orbiting body can enter a stationary ship between frames. Rejecting the
// ship's next movement alone leaves it trapped inside that body's collider.
export function clearBodyOverlap(position,velocity,center,radius) {
  const normal=position.clone().sub(center);
  if(normal.lengthSq()>=radius*radius)return false;
  if(normal.lengthSq()<1e-12)normal.set(0,1,0);
  else normal.normalize();
  position.copy(center).addScaledVector(normal,radius+.05);
  const inward=velocity.dot(normal);
  if(inward<0)velocity.addScaledVector(normal,-inward);
  return true;
}
