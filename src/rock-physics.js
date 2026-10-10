// Sweep the ship's movement so fast flight cannot skip a small rock.
export function rockContact(start,end,center,radius,endCenter=center) {
  const offset=start.clone().sub(center);
  const displacement=endCenter.clone().sub(center);
  const travel=end.clone().sub(start).sub(displacement);
  const c=offset.lengthSq()-radius*radius;
  let fraction=0;
  if(c>0){
    const a=travel.lengthSq();
    if(a<1e-12)return null;
    const b=offset.dot(travel);
    const discriminant=b*b-a*c;
    if(discriminant<0)return null;
    fraction=(-b-Math.sqrt(discriminant))/a;
    if(fraction<0||fraction>1)return null;
  }
  const point=start.clone().lerp(end,fraction);
  const normal=point.clone().sub(center).addScaledVector(displacement,-fraction);
  if(normal.lengthSq()<1e-12)normal.copy(travel).negate();
  if(normal.lengthSq()<1e-12)normal.set(1,0,0);
  return {point,normal:normal.normalize(),fraction};
}

export function resolveRockImpact(shipVelocity,rockVelocity,normal,size,ice=false) {
  const shipMass=12;
  const rockMass=Math.max(.4,size**3*(ice?2.4:5));
  const relative=shipVelocity.clone().sub(rockVelocity);
  const speed=Math.max(0,-relative.dot(normal));
  const restitution=ice?.12:.22;
  const impulse=(1+restitution)*speed/(1/shipMass+1/rockMass);
  const shipAfter=shipVelocity.clone().addScaledVector(normal,impulse/shipMass);
  const rockAfter=rockVelocity.clone().addScaledVector(normal,-impulse/rockMass);
  // Tangential contact friction trades momentum rather than stopping the ship.
  const tangent=relative.addScaledVector(normal,speed);
  const friction=Math.min(.08*impulse,tangent.length()/(1/shipMass+1/rockMass));
  if(tangent.lengthSq()>1e-12){
    tangent.normalize();
    shipAfter.addScaledVector(tangent,-friction/shipMass);
    rockAfter.addScaledVector(tangent,friction/rockMass);
  }
  // Normal flight is 14 units/s: small stones fracture on a direct hit,
  // while glancing taps and larger bodies still deflect without shattering.
  const fractureSpeed=(ice?8:10)+size*(ice?3.5:2.5);
  return {shipVelocity:shipAfter,rockVelocity:rockAfter,speed,impulse,shipMass,rockMass,broken:speed>=fractureSpeed,severity:Math.min(1,impulse/(shipMass*28))};
}
