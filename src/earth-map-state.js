import {SITE_RADIUS} from './earth-physics.js';
import {EARTH_REGIONS,validEarthRegion} from './earth-regions.js';
export {EARTH_REGIONS};
export const MAP_EXTENT=576,MAP_CELL=12,MAP_GRID=MAP_EXTENT*2/MAP_CELL;
const validCell=id=>Number.isInteger(id)&&id>=0&&id<MAP_GRID*MAP_GRID;
export const earthMapStorageKey=mode=>'odyssey-'+(mode==='exploration'?'exploration':'discovery')+'-earth-map-v1';
export function createEarthMapState(saved=null){
  const visited=new Set(Array.isArray(saved?.visited)?saved.visited.filter(id=>EARTH_REGIONS.some(r=>r.id===id&&r.available)):[]);
  const exploredByRegion=new Map(EARTH_REGIONS.map(region=>[region.id,new Set()]));
  let regionId='fernlilt',explored=exploredByRegion.get(regionId);
  if(saved?.version===3&&saved.regions&&typeof saved.regions==='object')for(const region of EARTH_REGIONS){const cells=saved.regions[region.id]?.explored;if(Array.isArray(cells))for(const id of cells)if(validCell(id))exploredByRegion.get(region.id).add(id);}
  if(Array.isArray(saved?.explored))for(const id of saved.explored){
    if(saved.version===1){
      if(!Number.isInteger(id)||id<0||id>=56*56)continue;
      const x=(id%56+.5)*4-112,z=(Math.floor(id/56)+.5)*4-112;
      explored.add(Math.floor((z+MAP_EXTENT)/MAP_CELL)*MAP_GRID+Math.floor((x+MAP_EXTENT)/MAP_CELL));
    }else if(validCell(id))explored.add(id);
  }

  const waypoints=new Map();
  let waypoint=null;
  const inside=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x,z)<=SITE_RADIUS;
  return {
    visited,get explored(){return explored;},get regionId(){return regionId;},
    setRegion(id){if(!validEarthRegion(id)||id===regionId)return false;waypoints.set(regionId,waypoint);regionId=id;explored=exploredByRegion.get(id);waypoint=waypoints.get(id)||null;return true;},
    visit(x,z){
      if(!inside(x,z))return false;
      const oldSize=explored.size,oldVisited=visited.size;
      // Discover only the loaded destination, never Fernlilt's local scenery.
      visited.add(regionId);
      const cx=Math.floor((x+MAP_EXTENT)/MAP_CELL),cz=Math.floor((z+MAP_EXTENT)/MAP_CELL);
      for(let iz=Math.max(0,cz-4);iz<=Math.min(MAP_GRID-1,cz+4);iz++)for(let ix=Math.max(0,cx-4);ix<=Math.min(MAP_GRID-1,cx+4);ix++){
        const px=(ix+.5)*MAP_CELL-MAP_EXTENT,pz=(iz+.5)*MAP_CELL-MAP_EXTENT;
        if(Math.hypot(px-x,pz-z)<=36&&inside(px,pz))explored.add(iz*MAP_GRID+ix);
      }
      return explored.size!==oldSize||visited.size!==oldVisited;
    },
    isExplored(x,z){
      if(!inside(x,z))return false;
      const ix=Math.floor((x+MAP_EXTENT)/MAP_CELL),iz=Math.floor((z+MAP_EXTENT)/MAP_CELL);
      return explored.has(iz*MAP_GRID+ix);
    },
    setWaypoint(x,z){if(!inside(x,z))return false;waypoint={x,z};return true;},
    clearWaypoint(){waypoint=null;},
    get waypoint(){return waypoint;},
    snapshot(){return {version:3,visited:[...visited],regions:Object.fromEntries([...exploredByRegion].map(([id,cells])=>[id,{explored:[...cells]}]))};},
  };
}
