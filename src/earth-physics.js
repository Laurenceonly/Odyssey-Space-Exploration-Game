import {containsCollider,supportAt} from './surface-collision.js';
export const EARTH_GRAVITY = 9.81;
export const LAKE = { x: 34, z: -30, radius: 23, level: -0.45 };
export const SITE_RADIUS = 104;
export function terrainHeight(x,z){const distance=Math.hypot(x,z),clearing=Math.min(1,Math.max(0,(distance-13)/28));const hills=(Math.sin(x*.038)*Math.cos(z*.043)*5+Math.sin((x+z)*.072)*1.5)*clearing;const basin=Math.max(0,1-Math.hypot(x-LAKE.x,z-LAKE.z)/(LAKE.radius+8));return hills-basin*basin*12;}
export function waterLevelAt(x,z){return Math.hypot(x-LAKE.x,z-LAKE.z)<32&&terrainHeight(x,z)<LAKE.level?LAKE.level:null;}
export function walkableAt(x,z,obstacles=[],footY=terrainHeight(x,z)){
  if(Math.hypot(x,z)>SITE_RADIUS)return 'boundary';
  if(obstacles.some(o=>containsCollider(o,x,z)&&footY<(o.topY??Infinity)-.06))return 'obstacle';
  return null;
}
// Feet stay above real support surfaces. Water buoyancy holds the swimmer's head above the lake.
export function stepAstronaut(body,input,dt,obstacles=[],environment={}){
  const groundHeight=environment.terrainHeight??terrainHeight,walkable=environment.walkableAt??walkableAt,gravity=environment.gravity??EARTH_GRAVITY;
  const waterAt=environment.waterLevelAt??(environment.terrainHeight?()=>null:waterLevelAt);
  dt=Math.min(Math.max(dt,0),.1);body.vx??=0;body.vz??=0;body.vy??=0;
  const startX=body.x,startZ=body.z;let blocked=null,landed=false,landingSpeed=0;
  const magnitude=Math.hypot(input.x,input.z),water=waterAt(body.x,body.z);
  const immersed=Number.isFinite(water)&&body.y<water-.15,speed=immersed?(input.run?2.7:1.9):(input.run?5.6:2.8);
  const targetX=input.x/Math.max(1,magnitude)*speed,targetZ=input.z/Math.max(1,magnitude)*speed;
  const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
  if(input.jump&&(body.grounded||body.swimming)){body.vy=body.swimming?2.6:4.4;body.grounded=false;body.swimming=false;body.support=null;}
  for(let i=0;i<steps;i++){
    const blend=1-Math.exp(-(body.grounded?(magnitude>0?12:18):immersed?9:4)*h);body.vx+=(targetX-body.vx)*blend;body.vz+=(targetZ-body.vz)*blend;
    const dx=body.vx*h,dz=body.vz*h;
    const attempt=(x,z)=>{
      const boundary=walkable(x,z,[],body.y);if(boundary)return boundary;
      for(const o of obstacles){if(!containsCollider(o,x,z))continue;let span=o.spanAt?.(x,z);
        // The capsule's trailing margin must not catch a descending rock edge.
        // Only its leading margin blocks an approach; the visible center still stays solid.
        const movingOut=(x-o.x)**2+(z-o.z)**2>(body.x-o.x)**2+(body.z-o.z)**2+1e-10;
        if(o.spanAt&&!span&&movingOut)continue;
        if(o.spanAt&&!span){for(const [dx,dz] of [[.3,0],[-.3,0],[0,.3],[0,-.3]]){const candidate=o.spanAt(x+dx,z+dz);if(candidate&&(!span||candidate.top>span.top))span=candidate;}if(!span)continue;}
        const top=span?.top??o.topAt?.(x,z)??o.topY??Infinity;
        if(body.y>=top-.06)continue;
        if(o===body.support&&top<=body.y+.18)continue;
        const currentSpan=o.spanAt?.(body.x,body.z);
        if(o.climbable&&movingOut&&currentSpan&&body.y<currentSpan.top-.06&&top<=currentSpan.top)continue;
        if(Number.isFinite(span?.bottom??o.baseY)&&body.y+1.7<(span?.bottom??o.baseY))continue;
        return 'obstacle';
      }
      const current=supportAt(body.x,body.z,body.y+.06,obstacles,groundHeight,body.support).height;
      const next=supportAt(x,z,body.y+.06,obstacles,groundHeight,body.support).height;
      if(next<=body.y+.06&&!body.grounded)return null;
      return next-current>Math.hypot(x-body.x,z-body.z)*.85+.015?'slope':null;
    };
    const reason=attempt(body.x+dx,body.z+dz);
    if(!reason){body.x+=dx;body.z+=dz;}else{blocked=reason;if(!attempt(body.x+dx,body.z))body.x+=dx;else body.vx=0;if(!attempt(body.x,body.z+dz))body.z+=dz;else body.vz=0;}
    const surface=supportAt(body.x,body.z,body.y+.06,obstacles,groundHeight,body.support),floor=surface.height;
    const level=waterAt(body.x,body.z),floating=Number.isFinite(level)&&floor<level-1.05;
    const floatHeight=floating?level-1.05:-Infinity;
    if(body.grounded&&!floating&&Math.abs(body.y-floor)<.35){body.y=floor;body.vy=0;body.support=surface.support;body.swimming=false;continue;}
    body.vy-=gravity*h;body.y+=body.vy*h;
    if(floating&&body.y<=floatHeight){body.y=floatHeight;body.vy=0;body.grounded=false;body.support=null;body.swimming=true;}
    else if(body.y<=floor){if(!body.grounded){landed=true;landingSpeed=Math.max(landingSpeed,-body.vy);}body.y=floor;body.vy=0;body.grounded=true;body.support=surface.support;body.swimming=false;}
    else{body.grounded=false;body.support=null;body.swimming=false;}
  }
  const finalWater=waterAt(body.x,body.z);body.wading=Number.isFinite(finalWater)&&body.grounded&&body.y<finalWater-.1;
  const distance=Math.hypot(body.x-startX,body.z-startZ);
  return {moving:distance>.0001,blocked,distance,speed:dt?distance/dt:0,landed,landingSpeed,swimming:body.swimming===true,wading:body.wading===true};
}
