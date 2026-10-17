// Large Earth destinations use local metres and explicit, bidirectional walking routes.
export const EARTH_REGION_RADIUS=560;
export const EARTH_REGIONS=[
 {id:'fernlilt',name:'Fernlilt Grasslands',kind:'Grasslands',at:[0,0],ground:0xb4a16d,sky:0xd6e2e9,hue:48,description:'Wind-swept golden grass, sheltered groves, and a winding stream.'},
 {id:'rainselve',name:'Rainselve Woods',kind:'Forest',at:[0,-1],ground:0x4c6243,sky:0xa4bab3,hue:112,description:'Tall woodland, fern-covered ground, and a quiet stream.'},
 {id:'evrathen',name:'Lake Evrathen',kind:'Lake',at:[1,-1],ground:0x79936c,sky:0xc7dce4,hue:94,description:'A broad freshwater lake with reeds, islands, and dry shore paths.'},
 {id:'vaelcren',name:'Vaelcren Ridge',kind:'Ridge',at:[-1,-1],ground:0x888577,sky:0xc0cfdb,hue:74,description:'Weathered uplands, exposed stone, and open ridge views.'},
 {id:'ossamber',name:'Ossamber Jungle',kind:'Jungle',at:[-1,1],ground:0x3d6346,sky:0x9bb9a8,hue:132,description:'Broad-leaf canopy, hanging roots, and humid green hollows.'},
 {id:'ashqarin',name:'Ashqarin Desert',kind:'Desert',at:[1,1],ground:0xc18d62,sky:0xe1c9aa,hue:30,description:'Rust-colored dunes, sandstone shelves, and long dry views.'},
 {id:'nacreloom',name:'Nacreloom Caverns',kind:'Caves',at:[-2,-1],ground:0x6c7377,sky:0x10191f,hue:202,description:'An underground mineral chamber with pale pillars and shallow pools.'},
 {id:'keltrond',name:'Mount Keltrond',kind:'Mountain',at:[0,-2],ground:0x858782,sky:0xc0d2df,hue:78,description:'A broad mountain ascent above forested foothills and exposed rock.'},
 {id:'teshora',name:'Teshora Coast',kind:'Coast',at:[0,1],ground:0xc5b5a0,sky:0xc4dce5,hue:37,description:'Sheltered beaches, rose-colored headlands, and open sea.'},
 {id:'hyskrum',name:'Hyskrum Tundra',kind:'Tundra',at:[0,-3],ground:0xd8e2e4,sky:0xc2d3e2,hue:202,description:'Snowdrifts, frost-covered ground, and a frozen mountain basin.'},
 {id:'uloqai',name:'Uloqai Ocean',kind:'Ocean',at:[1,2],ground:0xc8c6a2,sky:0xbfdde3,hue:172,description:'Turquoise shallows, reef pools, and sandy islets. Follow the dry causeway home.'},
].map(region=>({...region,available:true}));
const byId=new Map(EARTH_REGIONS.map(r=>[r.id,r]));
export const EARTH_CONNECTIONS=[
 ['fernlilt','rainselve'],['fernlilt','evrathen'],['fernlilt','vaelcren'],['fernlilt','ossamber'],['fernlilt','teshora'],['fernlilt','ashqarin'],
 ['rainselve','evrathen'],['rainselve','vaelcren'],['evrathen','keltrond'],['vaelcren','keltrond'],['vaelcren','nacreloom'],['nacreloom','fernlilt'],
 ['keltrond','hyskrum'],['ossamber','teshora'],['ashqarin','teshora'],['teshora','uloqai'],
];
export const getEarthRegion=id=>byId.get(id)||byId.get('fernlilt');
export const validEarthRegion=id=>byId.has(id);
export const earthNeighbours=id=>EARTH_CONNECTIONS.flatMap(([a,b])=>a===id?[b]:b===id?[a]:[]);
const exitCache=new Map();
export function earthRegionExits(id){
 if(exitCache.has(id))return exitCache.get(id);
 const origin=getEarthRegion(id),neighbours=earthNeighbours(origin.id);
 // Fan routes apart if two destinations lie along the same compass bearing.
 const assigned=[];
 const exits=neighbours.map(to=>{
  const target=getEarthRegion(to);let angle=Math.atan2(target.at[0]-origin.at[0],target.at[1]-origin.at[1]);
  while(assigned.some(other=>Math.abs(Math.atan2(Math.sin(angle-other),Math.cos(angle-other)))<.27))angle+=.32;
  assigned.push(angle);
  const x=Math.sin(angle)*420,z=Math.cos(angle)*420;
  let path=[[6,7],[x*.45,z*.45],[x,z]];
  if(id==='fernlilt'){const approach=z< -100&&x>100?[[6,7],[7,-5],[-9,-15],[-16,-37],[-6,-48],[45,-90]]:z< -250&&Math.abs(x)<100?[[6,7],[7,-5],[-9,-15],[-16,-37],[-6,-48],[0,-90]]:x< -100&&z<100?[[6,7],[7,-5],[-9,-15],[-31,-13],[-70,-9]]:[[6,7],[18,32],[5,59]];path=[...approach,[x,z]];}
  return {to,name:target.name,x,z,path};
 });
 exitCache.set(id,exits);return exits;
}
export function earthExitNear(id,x,z){return earthRegionExits(id).find(exit=>Math.hypot(x-exit.x,z-exit.z)<=11)||null;}
export function earthRouteDistance(id,x,z){
 let result=Infinity;
 for(const {path}of earthRegionExits(id))for(let i=1;i<path.length;i++){
  const [ax,az]=path[i-1],[bx,bz]=path[i],dx=bx-ax,dz=bz-az,t=Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz)));
  result=Math.min(result,Math.hypot(x-ax-dx*t,z-az-dz*t));
 }
 return result;
}
export function earthNextRegion(from,to='fernlilt'){
 if(from===to)return null;const queue=[[from]],seen=new Set([from]);
 while(queue.length){const route=queue.shift();for(const next of earthNeighbours(route.at(-1))){if(seen.has(next))continue;const path=[...route,next];if(next===to)return path[1];seen.add(next);queue.push(path);}}
 return null;
}
export function earthRegionArrival(to,from){
 const exit=earthRegionExits(to).find(e=>e.to===from);if(!exit)return null;
 const x=exit.x*.92,z=exit.z*.92,yaw=Math.atan2(x,z);
 return {x,z,yaw};
}
