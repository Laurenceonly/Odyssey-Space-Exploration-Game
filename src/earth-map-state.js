import {SITE_RADIUS} from './earth-physics.js';
export const EARTH_REGIONS = [
  {id:'fernlilt',name:'Fernlilt Grasslands',kind:'Grasslands',available:true},
  {id:'rainselve',name:'Rainselve Woods',kind:'Forest',available:false},
  {id:'evrathen',name:'Lake Evrathen',kind:'Lake',available:false},
  {id:'vaelcren',name:'Vaelcren Ridge',kind:'Ridge',available:false},
  {id:'ossamber',name:'Ossamber Jungle',kind:'Jungle',available:false},
  {id:'ashqarin',name:'Ashqarin Desert',kind:'Desert',available:false},
  {id:'nacreloom',name:'Nacreloom Caverns',kind:'Caves',available:false},
  {id:'keltrond',name:'Mount Keltrond',kind:'Mountain',available:false},
  {id:'teshora',name:'Teshora Coast',kind:'Coast',available:false},
  {id:'hyskrum',name:'Hyskrum Tundra',kind:'Tundra',available:false},
  {id:'uloqai',name:'Uloqai Ocean',kind:'Ocean',available:false},
];
export const MAP_EXTENT=576,MAP_CELL=12,MAP_GRID=MAP_EXTENT*2/MAP_CELL;
const validCell=id=>Number.isInteger(id)&&id>=0&&id<MAP_GRID*MAP_GRID;
export const earthMapStorageKey=mode=>'odyssey-'+(mode==='exploration'?'exploration':'discovery')+'-earth-map-v1';
export function createEarthMapState(saved=null){
  const visited=new Set(Array.isArray(saved?.visited)?saved.visited.filter(id=>EARTH_REGIONS.some(r=>r.id===id&&r.available)):[]);
  const explored=new Set();
  if(Array.isArray(saved?.explored))for(const id of saved.explored){
    if(saved.version===1){
      if(!Number.isInteger(id)||id<0||id>=56*56)continue;
      const x=(id%56+.5)*4-112,z=(Math.floor(id/56)+.5)*4-112;
      explored.add(Math.floor((z+MAP_EXTENT)/MAP_CELL)*MAP_GRID+Math.floor((x+MAP_EXTENT)/MAP_CELL));
    }else if(validCell(id))explored.add(id);
  }

  let waypoint=null;
  const inside=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.hypot(x,z)<=SITE_RADIUS;
  return {
    visited,explored,
    visit(x,z){
      if(!inside(x,z))return false;
      const oldSize=explored.size,oldVisited=visited.size;
      // Only Fernlilt exists here. Local scenery never unlocks other regions.
      visited.add('fernlilt');
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
    snapshot(){return {version:2,visited:[...visited],explored:[...explored]};},
  };
}
