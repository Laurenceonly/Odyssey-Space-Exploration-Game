import {earthRegionExits} from './earth-regions.js';
// Shared layout coordinates keep scenery, paths and movement checks aligned.
const LOOP_POINTS = [
  [6,7],[7,-5],[-9,-15],[-16,-37],[-6,-48],[14,-59],
  [42,-65],[67,-48],[72,-20],[62,1],[37,15],[6,7],
];
const RIDGE_POINTS=[[-9,-15],[-31,-13],[-49,-9],[-67,-9]];
// Smooth, gentle bends reveal scenery through walking rather than camera cuts.
function windingPath(points){
  const result=[];
  for(let i=0;i<points.length-1;i++){
    const p0=points[Math.max(0,i-1)],p1=points[i],p2=points[i+1],p3=points[Math.min(points.length-1,i+2)];
    const count=Math.max(4,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/4));
    for(let j=0;j<count;j++){
      const t=j/count,t2=t*t,t3=t2*t;
      result.push([0,1].map(axis=>.5*(2*p1[axis]+(-p0[axis]+p2[axis])*t+(2*p0[axis]-5*p1[axis]+4*p2[axis]-p3[axis])*t2+(-p0[axis]+3*p1[axis]-3*p2[axis]+p3[axis])*t3)));
    }
  }
  result.push(points.at(-1));return result;
}
export const EARTH_LOOP=windingPath(LOOP_POINTS);
export const EARTH_RIDGE_ROUTE=windingPath(RIDGE_POINTS);
export const EARTH_MEADOW_TRAIL=windingPath([
  [6,7],[18,32],[5,59],[-40,80],[-92,119],[-150,145],[-215,117],
  [-260,60],[-240,-15],[-185,-60],[-150,-112],[-180,-153],
  [-220,-170],[-190,-215],[-110,-247],[-30,-249],[45,-217],
  [78,-170],[107,-134],[126,-96],[114,-50],[93,-12],[62,1],
]);
// The bank-side trail stays west of the water, with several long view openings.
export const EARTH_STREAM_TRAIL=windingPath([
  [37,15],[75,36],[111,69],[151,87],[174,48],[160,5],[138,-39],
  [126,-96],[143,-147],[148,-192],[151,-227],
]);
export const EARTH_PATHS=[EARTH_LOOP,EARTH_RIDGE_ROUTE,EARTH_MEADOW_TRAIL,EARTH_STREAM_TRAIL,...earthRegionExits('fernlilt').map(exit=>exit.path)];
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
// Local segment bins keep detailed vegetation generation independent of trail length.
const pathCells=new Map(),PATH_CELL=32;
for(const route of EARTH_PATHS)for(let i=1;i<route.length;i++){
  const a=route[i-1],b=route[i],dx=b[0]-a[0],dz=b[1]-a[1];
  const segment=[a[0],a[1],dx,dz,1/(dx*dx+dz*dz)];
  for(let cx=Math.floor((Math.min(a[0],b[0])-24)/PATH_CELL);cx<=Math.floor((Math.max(a[0],b[0])+24)/PATH_CELL);cx++)
  for(let cz=Math.floor((Math.min(a[1],b[1])-24)/PATH_CELL);cz<=Math.floor((Math.max(a[1],b[1])+24)/PATH_CELL);cz++){
    const key=cx+','+cz;if(!pathCells.has(key))pathCells.set(key,[]);pathCells.get(key).push(segment);
  }
}
export function earthPathDistance(x,z){
  const nearby=pathCells.get(Math.floor(x/PATH_CELL)+','+Math.floor(z/PATH_CELL));
  if(!nearby)return Infinity;let distance=Infinity;
  for(const [ax,az,dx,dz,inverseLength] of nearby){
    const t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)*inverseLength));
    const ex=x-ax-dx*t,ez=z-az-dz*t;distance=Math.min(distance,ex*ex+ez*ez);
  }
  return Math.sqrt(distance);
}
export function earthTrailWidth(x,z){
  // Ordinary paths are 3–4 m wide, widening at meadow openings and junctions.
  const broad=EARTH_GRASS_OPENINGS.reduce((value,a)=>Math.max(value,Math.exp(-(((x-a.x)/a.rx)**2+((z-a.z)/a.rz)**2))),0);
  return 1.7+.16*Math.sin(x*.07+Math.sin(z*.045))+.10*Math.sin(z*.11-x*.05)+broad*.9;
}
// Enclosed passages alternate with low meadow windows and open resting places.
export const EARTH_GRASS_OPENINGS=[
  {x:0,z:4,rx:27,rz:26},{x:-67,z:-9,rx:31,rz:28},
  {x:-150,z:145,rx:42,rz:36},{x:-220,z:-170,rx:29,rz:27},
  {x:151,z:87,rx:37,rz:33},{x:50,z:-217,rx:36,rz:29},
];
const GRASS_PASSAGES=[
  {x:-54,z:92,rx:50,rz:34},{x:-246,z:35,rx:36,rz:65},
  {x:-80,z:-245,rx:65,rz:32},{x:135,z:-88,rx:32,rz:73},
];
export function earthGrassHeightScale(x,z,trailDistance=earthPathDistance(x,z)){
  const influence=areas=>{let value=0;for(const a of areas)value=Math.max(value,Math.exp(-(((x-a.x)/a.rx)**2+((z-a.z)/a.rz)**2)));return value;};
  const opening=influence(EARTH_GRASS_OPENINGS),passage=influence(GRASS_PASSAGES);
  const width=earthTrailWidth(x,z),t=Math.max(0,Math.min(1,(trailDistance-width-2)/17));
  const shoulder=1-t*t*(3-2*t);
  return (.94+.85*passage*shoulder)*(1-opening*.76);
}
// Small edge groves leave Fernlilt's long meadow views open.
// The creek lies east of the arrival loop; its broad banks remain walkable.
export const EARTH_STREAM = {start:-270,end:270};
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function earthStreamAt(x,z){
  if(z<EARTH_STREAM.start||z>EARTH_STREAM.end)return null;
  const center=177+27*Math.sin(z*.014)+9*Math.sin(z*.031);
  return {center,distance:Math.abs(x-center),width:3.2+.65*Math.sin(z*.023),
    level:-1.2-(z+270)*.005,envelope:1-smooth(225,270,Math.abs(z))};
}
// A shared field varies the thick grass continuously at near and far distances.
function grassNoise(x,z,size,seed){
  const px=x/size,pz=z/size,ix=Math.floor(px),iz=Math.floor(pz);
  const tx=px-ix,tz=pz-iz,u=tx*tx*(3-2*tx),v=tz*tz*(3-2*tz);
  const hash=(a,b)=>{const n=Math.sin(a*127.1+b*311.7+seed*74.7)*43758.5453;return n-Math.floor(n);};
  const a=hash(ix,iz),b=hash(ix+1,iz),c=hash(ix,iz+1),d=hash(ix+1,iz+1);
  return (a+(b-a)*u)*(1-v)+(c+(d-c)*u)*v;
}
export function earthGrassDensity(x,z){
  const broad=grassNoise(x+z*.24,z-x*.19,42,3);
  const broken=grassNoise(x,z,9,8);
  return .94+.06*smooth(.23,.72,broad*.72+broken*.28);
}
// Broad bands of exposed, drier grass follow the land rather than individual tufts.
export function earthGrassDryness(x,z){
  const swathe=.5+.5*Math.sin(x*.021+Math.sin(z*.013)*1.8)*Math.cos(z*.016-x*.004);
  const stream=earthStreamAt(x,z),moisture=stream?Math.exp(-((stream.distance/22)**2))*stream.envelope:0;
  return Math.max(0,Math.min(1,(swathe-.25)*1.2-moisture*.65));
}
export function earthWoodland(x,z){
  const edge=.55*Math.exp(-(((x+87)/19)**2+((z+46)/24)**2));
  const survey=.38*Math.exp(-(((x+31)/13)**2+((z-27)/14)**2));
  const stream=earthStreamAt(x,z);
  const shelter=stream?stream.envelope*Math.exp(-(((stream.distance-16)/15)**2))*.55:0;
  const hollow=.6*Math.exp(-(((x+235)/37)**2+((z+165)/48)**2));
  return Math.max(edge,survey,shelter,hollow);
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
