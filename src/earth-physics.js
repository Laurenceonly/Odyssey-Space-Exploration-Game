export const EARTH_GRAVITY = 9.81;
export const LAKE = { x: 34, z: -30, radius: 23, level: -0.45 };
export const SITE_RADIUS = 104;

export function terrainHeight(x, z) {
  const distance = Math.hypot(x, z);
  const clearing = Math.min(1, Math.max(0, (distance - 13) / 28));
  const hills = (Math.sin(x * .038) * Math.cos(z * .043) * 5 + Math.sin((x + z) * .072) * 1.5) * clearing;
  const lakeDistance = Math.hypot(x - LAKE.x, z - LAKE.z);
  const basin = Math.max(0, 1 - lakeDistance / (LAKE.radius + 8));
  return hills - basin * basin * 12;
}

export function walkableAt(x, z, obstacles = []) {
  if (Math.hypot(x, z) > SITE_RADIUS) return 'boundary';
  if (Math.hypot(x - LAKE.x, z - LAKE.z) < 32 && terrainHeight(x, z) < LAKE.level + .2) return 'water';
  if (obstacles.some(o => Math.hypot(x - o.x, z - o.z) < o.radius + .35)) return 'obstacle';
  return null;
}

// Substeps keep gravity, acceleration, and collision response stable across frame rates.
export function stepAstronaut(body, input, dt, obstacles = []) {
  dt = Math.min(Math.max(dt, 0), .1);
  body.vx ??= 0; body.vz ??= 0;
  const startX=body.x,startZ=body.z;
  let blocked=null,landed=false,landingSpeed=0;
  const magnitude=Math.hypot(input.x,input.z),speed=input.run?5.6:2.8;
  const targetX=input.x/Math.max(1,magnitude)*speed,targetZ=input.z/Math.max(1,magnitude)*speed;
  const steps=Math.max(1,Math.ceil(dt*120)),h=dt/steps;
  if(input.jump&&body.grounded){body.vy=4.4;body.grounded=false;}
  for(let i=0;i<steps;i++){
    const response=body.grounded?(magnitude>0?12:18):4;
    const blend=1-Math.exp(-response*h);
    body.vx+=(targetX-body.vx)*blend;body.vz+=(targetZ-body.vz)*blend;
    const dx=body.vx*h,dz=body.vz*h;
    const attempt=(x,z)=>{
      const reason=walkableAt(x,z,obstacles);
      const rise=terrainHeight(x,z)-terrainHeight(body.x,body.z);
      return reason||(rise>Math.hypot(x-body.x,z-body.z)*.85+.015?'slope':null);
    };
    const reason=attempt(body.x+dx,body.z+dz);
    if(!reason){body.x+=dx;body.z+=dz;}
    else{
      blocked=reason;
      // Slide along scenery instead of sticking when only one axis is blocked.
      if(!attempt(body.x+dx,body.z))body.x+=dx;else body.vx=0;
      if(!attempt(body.x,body.z+dz))body.z+=dz;else body.vz=0;
    }
    const floor=terrainHeight(body.x,body.z);
    if(body.grounded&&Math.abs(body.y-floor)<.35){body.y=floor;body.vy=0;continue;}
    body.vy-=EARTH_GRAVITY*h;body.y+=body.vy*h;
    if(body.y<=floor){
      if(!body.grounded){landed=true;landingSpeed=Math.max(landingSpeed,-body.vy);}
      body.y=floor;body.vy=0;body.grounded=true;
    }else body.grounded=false;
  }
  const distance=Math.hypot(body.x-startX,body.z-startZ);
  return {moving:distance>.0001,blocked,distance,speed:dt?distance/dt:0,landed,landingSpeed};
}
