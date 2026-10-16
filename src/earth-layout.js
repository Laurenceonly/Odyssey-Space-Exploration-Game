// Shared layout coordinates keep scenery, paths and movement checks aligned.
export const EARTH_LOOP = [
  [6,7],[-9,-15],[-16,-37],[-6,-48],[14,-59],
  [42,-65],[67,-48],[72,-20],[62,1],[37,15],[6,7],
];
export const EARTH_RIDGE_ROUTE = [[-9,-15],[-31,-13],[-49,-9],[-67,-9]];
export const EARTH_RIDGE = {x:-67,z:-9,height:4.5};
export const EARTH_SUMMIT = {x:210,z:-1450,height:300};
export function polylineDistance(points,x,z){
  let distance=Infinity;
  for(let i=1;i<points.length;i++){
    const [ax,az]=points[i-1],[bx,bz]=points[i],dx=bx-ax,dz=bz-az;
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
    distance=Math.min(distance,Math.hypot(x-ax-dx*t,z-az-dz*t));
  }
  return distance;
}
export function earthPathDistance(x,z){return Math.min(polylineDistance(EARTH_LOOP,x,z),polylineDistance(EARTH_RIDGE_ROUTE,x,z));}
// Small edge groves leave Fernlilt's long meadow views open.
export function earthWoodland(x,z){
  const edge=.55*Math.exp(-(((x+87)/19)**2+((z+46)/24)**2));
  const survey=.38*Math.exp(-(((x+31)/13)**2+((z-27)/14)**2));
  return Math.max(edge,survey);
}
export const MEADOW_PATCHES = [
  {x:-27,z:-34,r:32},{x:-43,z:28,r:33},{x:18,z:40,r:32},
  {x:0,z:-5,r:23},
  {x:66,z:28,r:25},{x:-71,z:-37,r:24},{x:-2,z:-76,r:23},
  {x:56,z:-74,r:20},{x:-71,z:54,r:20},
];
export function earthMeadowCover(x,z){
  let cover=0;
  for(const patch of MEADOW_PATCHES){
    const edge=patch.r*(1+.10*Math.sin(x*.11+z*.07)+.07*Math.sin(z*.16-x*.08));
    const t=Math.max(0,Math.min(1,(edge-Math.hypot(x-patch.x,z-patch.z))/5));
    cover=Math.max(cover,t*t*(3-2*t));
  }
  return cover;
}
export function earthRidgeHeight(x,z){
  // Gentle, broad shoulders support walking without requiring jump boosts.
  const rise=EARTH_RIDGE.height*Math.exp(-(((x-EARTH_RIDGE.x)/32)**2+((z-EARTH_RIDGE.z)/43)**2));
  const landingFade=Math.min(1,Math.max(0,(Math.hypot(x,z)-15)/24));
  return rise*landingFade*landingFade*(3-2*landingFade);
}
// This landing patch belongs to Fernlilt. Its pond, grove and rise are
// local scenery, not substitutes for the other large Earth destinations.
export function earthRegionAt(){return 'Fernlilt Grasslands';}

// Relocate only obstructed old saves when vegetation changes between versions.
export function clearEarthResumePosition(x,z,isClear){
  if(isClear(x,z))return {x,z};
  for(let radius=.5;radius<=8;radius+=.5){
    const samples=Math.ceil(2*Math.PI*radius/.5);
    for(let i=0;i<samples;i++){
      const angle=i*2*Math.PI/samples,nx=x+Math.cos(angle)*radius,nz=z+Math.sin(angle)*radius;
      if(isClear(nx,nz))return {x:nx,z:nz};
    }
  }
  return {x:6,z:7};
}
