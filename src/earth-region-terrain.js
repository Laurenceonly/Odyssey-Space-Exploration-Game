import {terrainHeight,waterLevelAt} from './earth-physics.js';
import {getEarthRegion,earthRouteDistance,EARTH_REGION_RADIUS} from './earth-regions.js';
const smooth=(a,b,v)=>{const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t);};
export function earthRegionHeight(id,x,z){
 if(id==='fernlilt')return terrainHeight(x,z);
 const d=Math.hypot(x,z),hills=Math.sin(x*.009)*Math.cos(z*.011)*5+Math.sin((x+z)*.019)*2;
 const route=earthRouteDistance(id,x,z),routeBlend=smooth(6,24,route);
 let floor=hills;
 if(id==='rainselve')floor=hills*.6-2*Math.exp(-(((x-80-Math.sin(z*.01)*20)/15)**2));
 if(id==='evrathen'){const lake=Math.hypot((x-120)/1.12,z+30);floor=3+hills*.25-(1-smooth(155,220,lake))*12;}
 if(id==='vaelcren')floor=18+Math.sin((x+z)*.004)*15+9*Math.cos(z*.009);
 if(id==='ossamber')floor=hills*.7+6*Math.exp(-(((x+180)/120)**2+((z+130)/140)**2));
 if(id==='ashqarin')floor=7+Math.sin(x*.013+Math.sin(z*.007))*7+Math.sin(z*.025+x*.004)*2;
 if(id==='nacreloom')floor=-35+hills*.25-2*Math.exp(-(((x-160)/65)**2+((z+80)/80)**2));
 if(id==='keltrond')floor=15+130*Math.exp(-((d/280)**2))+hills*.4;
 if(id==='hyskrum')floor=12+hills*.55-3*Math.exp(-(((x+130)/100)**2+((z-70)/95)**2));
 if(id==='teshora')floor=4-12*smooth(-50,210,z)+hills*.25;
 if(id==='uloqai')floor=-2.8+Math.sin(x*.012)*Math.cos(z*.01)*3+4*Math.exp(-(((x+80)/110)**2+((z-80)/90)**2));
 // Every connection has a continuous dry, gently graded route. Water is optional.
 const routeFloor=id==='nacreloom'?-35:id==='keltrond'?15+125*Math.exp(-((d/300)**2)):id==='vaelcren'?18+Math.sin((x+z)*.004)*12:id==='hyskrum'?12:3;
 return routeFloor+(floor-routeFloor)*routeBlend;
}
export function earthRegionWater(id,x,z){
 if(id==='fernlilt')return waterLevelAt(x,z);
 const y=earthRegionHeight(id,x,z);
 const level=id==='nacreloom'?-36.5:['evrathen','teshora','uloqai'].includes(id)?0:null;
 return level!==null&&y<level?level:null;
}
export function earthRegionWalkable(id,x,z){return !Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x,z)>EARTH_REGION_RADIUS?'boundary':null;}
export function earthRegionResume(to,from,arrival,previous={}){
 const p={x:arrival.x,z:arrival.z,y:earthRegionHeight(to,arrival.x,arrival.z),vy:0,grounded:true,swimming:false,wading:false,boostReady:false,swimStamina:previous.position?.swimStamina??1};
 return {worldId:'earth',regionId:getEarthRegion(to).id,entryFrom:from,mode:'walking',hoverboard:previous.hoverboard===true,boardHeading:arrival.yaw,position:p,yaw:arrival.yaw,pitch:.18,facing:arrival.yaw+(previous.hoverboard?Math.PI/2:0),viewMode:previous.viewMode||'chase',explored:true};
}
