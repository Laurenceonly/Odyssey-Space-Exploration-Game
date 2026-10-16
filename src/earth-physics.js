import {earthRidgeHeight} from './earth-layout.js';
import {containsCollider,supportAt} from './surface-collision.js';
export const EARTH_GRAVITY = 9.81;
export const FAST_SWIM_SECONDS = 12;
export const RUN_SECONDS = 24;
export const SWIM_RECOVERY_SECONDS = 8;
export const LAKE = { x: 34, z: -30, radius: 23, level: -0.45 };
export const SITE_RADIUS = 560;
export function terrainHeight(x,z){
  const distance=Math.hypot(x,z),clearing=Math.min(1,Math.max(0,(distance-13)/28));
  const hills=(Math.sin(x*.038)*Math.cos(z*.043)*2.2+Math.sin((x+z)*.072)*.6)*clearing;
  const lakeDistance=Math.hypot(x-LAKE.x,z-LAKE.z);
  const basin=Math.max(0,1-lakeDistance/(LAKE.radius+8));
  const outerT=Math.min(1,Math.max(0,(distance-104)/90)),outerBlend=outerT*outerT*(3-2*outerT);
  const broadHills=Math.sin(x*.009)*Math.cos(z*.011)*3.3+Math.sin((x+z)*.017)*1.4;
  const floor=hills*(1-outerBlend)+broadHills*outerBlend+earthRidgeHeight(x,z)-basin*basin*12;
  const smooth=(a,b,value)=>{const t=Math.min(1,Math.max(0,(value-a)/(b-a)));return t*t*(3-2*t);};
  // A continuous bank encloses the lake. The broad dry rim also covers the
  // water mesh edge between the terrain's 2.2-metre grid vertices.
  const bank=smooth(22,30,lakeDistance)*(1-smooth(34,40,lakeDistance));
  return floor+Math.max(0,LAKE.level+.9-floor)*bank;
}
export function waterLevelAt(x,z){return Math.hypot(x-LAKE.x,z-LAKE.z)<32&&terrainHeight(x,z)<LAKE.level?LAKE.level:null;}
// Surface exploration has no underwater camera mode: keep the near plane dry.
export function waterCameraHeight(x,z,y,clearance=.3){
  const water=waterLevelAt(x,z);return Number.isFinite(water)?Math.max(y,water+clearance):y;
}
export function walkableAt(x,z,obstacles=[],footY=terrainHeight(x,z)){
  if(Math.hypot(x,z)>SITE_RADIUS)return 'boundary';
  if(obstacles.some(o=>containsCollider(o,x,z)&&footY<(o.topY??Infinity)-.06))return 'obstacle';
  return null;
}
// Feet stay above real support surfaces. Water buoyancy holds the swimmer's head above the lake.
export function stepAstronaut(body,input,dt,obstacles=[],environment={}){
  const groundHeight=environment.terrainHeight??terrainHeight,walkable=environment.walkableAt??walkableAt,gravity=environment.gravity??EARTH_GRAVITY;
  const waterAt=environment.waterLevelAt??(environment.terrainHeight?()=>null:waterLevelAt);
  dt=Math.min(Math.max(dt,0),.1);body.vx??=0;body.vz??=0;body.vy??=0;body.swimStamina=Number.isFinite(body.swimStamina)?Math.min(1,Math.max(0,body.swimStamina)):1;
  const startX=body.x,startZ=body.z;let blocked=null,landed=false,landingSpeed=0;
  const magnitude=Math.hypot(input.x,input.z),water=waterAt(body.x,body.z);
  const immersed=Number.isFinite(water)&&body.y<water-.15;
  if(!input.run&&body.swimStamina>=.3)body.swimExhausted=false;
  // Existing swim stamina save fields now hold the shared exertion budget.
  const exerting=magnitude>.1&&input.run===true&&!body.swimExhausted&&body.swimStamina>0;
  const fastSwimming=body.swimming===true&&exerting;
  const running=!immersed&&!body.swimming&&exerting;
  if(fastSwimming||running){
    body.swimStamina=Math.max(0,body.swimStamina-dt/(fastSwimming?FAST_SWIM_SECONDS:RUN_SECONDS));
    if(body.swimStamina===0)body.swimExhausted=true;
  }else body.swimStamina=Math.min(1,body.swimStamina+dt/SWIM_RECOVERY_SECONDS);
  body.fastSwimming=fastSwimming;body.running=running;
  const speed=immersed?(fastSwimming?2.7:1.9):(running?5.8:2.4);
  const targetX=input.x/Math.max(1,magnitude)*speed,targetZ=input.z/Math.max(1,magnitude)*speed;
  const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
  let boosted=false;
  // Keydown edges are queued so a quick double tap survives a slow render frame.
  // Legacy jump input (and J) remains a normal jump, never an airborne boost.
  for(const code of input.jumpPresses??(input.jump?['KeyJ']:[])){
    if(body.swimming||(immersed&&!body.grounded)){
      // Swimming has no jump, water kick, or suit boost.
      body.boostReady=false;
    }else if(body.grounded){
      body.boostReady=!immersed;
      body.vy=4.4;body.grounded=false;body.swimming=false;body.support=null;
    }else if(code==='Space'&&body.boostReady&&!immersed){
      body.vy=Math.min(8.6,Math.max(6.4,body.vy+4.2));
      body.boostReady=false;boosted=true;
    }
  }
  for(let i=0;i<steps;i++){
    // Ground traction accelerates and brakes; releasing input in the air preserves momentum.
    const response=body.grounded?(magnitude>0?12:18):immersed?(magnitude>0?4.5:2.2):magnitude>0?2.5:0;
    const blend=1-Math.exp(-response*h);body.vx+=(targetX-body.vx)*blend;body.vz+=(targetZ-body.vz)*blend;
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
    const floatHeight=floating?level-.95:-Infinity;
    if(body.grounded&&!floating&&Math.abs(body.y-floor)<.35){body.y=floor;body.vy=0;body.support=surface.support;body.swimming=false;continue;}
    // Damped buoyancy keeps the suit afloat without snapping to a fixed plane.
    // The swimming state stays stable while buoyancy settles.
    if(floating&&body.y<level-.45){
      if(!body.swimming)body.vy=Math.max(-2.5,body.vy);
      body.vy+=((floatHeight-body.y)*36-body.vy*12)*h;
      body.y+=body.vy*h;body.grounded=false;body.support=null;body.swimming=true;
    }else{body.vy-=gravity*h;body.y+=body.vy*h;body.swimming=false;}
    if(floating&&body.swimming){body.y=Math.max(floor,body.y);}
    else if(body.y<=floor){if(!body.grounded){landed=true;landingSpeed=Math.max(landingSpeed,-body.vy);}body.y=floor;body.vy=0;body.grounded=true;body.support=surface.support;body.swimming=false;}
    else{body.grounded=false;body.support=null;body.swimming=false;}
  }
  const finalWater=waterAt(body.x,body.z);body.wading=Number.isFinite(finalWater)&&body.grounded&&body.y<finalWater-.1;
  const distance=Math.hypot(body.x-startX,body.z-startZ);
  if(body.grounded||body.swimming)body.boostReady=false;
  return {moving:distance>.0001,running,blocked,distance,speed:dt?distance/dt:0,landed,landingSpeed,boosted,fastSwimming:fastSwimming&&body.swimming===true,swimStamina:body.swimStamina,swimming:body.swimming===true,wading:body.wading===true};
}
