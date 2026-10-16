import test from 'node:test';
import assert from 'node:assert/strict';
import { EARTH_GRAVITY, LAKE, SITE_RADIUS, terrainHeight, walkableAt, stepAstronaut, waterCameraHeight, FAST_SWIM_SECONDS, SWIM_RECOVERY_SECONDS, RUN_SECONDS } from '../src/earth-physics.js';

const bodyAt=(x=0,z=0)=>({x,z,y:terrainHeight(x,z),vy:0,grounded:true});
test('Earth jump rises, falls, and lands without sinking into the ground',()=>{
  const body=bodyAt();let apex=0;
  assert.equal(EARTH_GRAVITY,9.81);
  for(let i=0;i<180;i++){
    stepAstronaut(body,{x:0,z:0,jump:i===0},1/120);
    apex=Math.max(apex,body.y);
  }
  assert.ok(apex>.9&&apex<1.05);
  assert.equal(body.y,terrainHeight(body.x,body.z));
  assert.equal(body.vy,0);assert.equal(body.grounded,true);
});
test('jump input cannot jump again in midair',()=>{
  const body=bodyAt();
  stepAstronaut(body,{x:0,z:0,jump:true},.1);
  const velocity=body.vy;
  stepAstronaut(body,{x:0,z:0,jump:true},.1);
  assert.ok(body.vy<velocity);
});
test('diagonal walking has the same speed as forward walking',()=>{
  const forward=bodyAt(),diagonal=bodyAt();
  for(let i=0;i<60;i++){
    stepAstronaut(forward,{x:1,z:0},1/60);
    stepAstronaut(diagonal,{x:1,z:1},1/60);
  }
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-forward.x)<.001);
});
test('rocks and the ship stop movement even across a slow frame',()=>{
  const body=bodyAt(),obstacles=[{x:2,z:0,radius:.5}];
  for(let i=0;i<20;i++)stepAstronaut(body,{x:1,z:0},.1,obstacles);
  assert.ok(body.x<1.16);
  assert.equal(walkableAt(body.x,body.z,obstacles),null);
});
test('the lake permits wading, buoyant swimming, and returning to dry land',()=>{
  assert.equal(walkableAt(LAKE.x,LAKE.z),null);
  const body=bodyAt(LAKE.x-29,LAKE.z);let swam=false,waded=false;
  for(let i=0;i<60*42;i++){const result=stepAstronaut(body,{x:1,z:0,run:true},1/60);swam ||=result.swimming;waded ||=result.wading;if(body.swimming){assert.ok(body.y+1.7>LAKE.level+.4);assert.equal(body.grounded,false);}}
  assert.ok(swam,'crosses the deep lake');assert.ok(waded,'uses the shallow shore');assert.ok(body.x>LAKE.x+32);assert.equal(body.swimming,false);assert.equal(body.grounded,true);assert.ok(Math.abs(body.y-terrainHeight(body.x,body.z))<1e-8);
});
test('the landing area has a physical boundary',()=>{
  assert.equal(walkableAt(SITE_RADIUS+1,0),'boundary');
  const body=bodyAt(0,SITE_RADIUS-.1);
  stepAstronaut(body,{x:0,z:1},.1);
  assert.ok(Math.hypot(body.x,body.z)<=SITE_RADIUS);
});

test('walking accelerates progressively and brakes within a short stopping distance',()=>{
  const body=bodyAt();
  stepAstronaut(body,{x:1,z:0},1/60);
  assert.ok(body.vx>0&&body.vx<1);
  for(let i=0;i<90;i++)stepAstronaut(body,{x:1,z:0},1/60);
  assert.ok(body.vx>2.3&&body.vx<=2.4);
  const stopX=body.x;
  for(let i=0;i<60;i++)stepAstronaut(body,{x:0,z:0},1/60);
  assert.ok(body.x-stopX<.2);
  assert.ok(Math.abs(body.vx)<.001);
});
test('movement and jump timing remain consistent at 30, 60 and 120 fps',()=>{
  const results=[30,60,120].map(fps=>{
    const body=bodyAt();
    for(let i=0;i<fps;i++)stepAstronaut(body,{x:1,z:0,jump:i===0},1/fps);
    return body;
  });
  for(const body of results){
    assert.ok(Math.abs(body.x-results[0].x)<.015);
    assert.equal(body.grounded,true);
    assert.equal(body.y,terrainHeight(body.x,body.z));
  }
});

test('airborne momentum is retained without movement input, including in lunar gravity',()=>{
  for(const gravity of [9.81,1.62]){
    const body={x:0,z:0,y:10,vy:0,vx:3,vz:-1,grounded:false};
    for(let i=0;i<30;i++)stepAstronaut(body,{x:0,z:0},1/60,[],{gravity,terrainHeight:()=>0,walkableAt:()=>null});
    assert.ok(Math.abs(body.vx-3)<1e-10&&Math.abs(body.vz+1)<1e-10,'no invisible midair braking');
    assert.ok(Math.abs(body.x-1.5)<1e-10);assert.equal(body.grounded,false);
  }
});

const flatWorld={terrainHeight:()=>0,walkableAt:()=>null,waterLevelAt:()=>null};
test('second Space boosts once per jump, including two taps queued in one frame',()=>{
  const body=bodyAt();
  const first=stepAstronaut(body,{x:0,z:0,jumpPresses:['Space','Space']},1/60,[],flatWorld);
  assert.equal(first.boosted,true);assert.ok(body.vy>8);assert.equal(body.boostReady,false);
  const velocity=body.vy;
  assert.equal(stepAstronaut(body,{x:0,z:0,jumpPresses:['Space']},1/60,[],flatWorld).boosted,false);
  assert.ok(body.vy<velocity);
  for(let i=0;i<240;i++)stepAstronaut(body,{x:0,z:0},1/60,[],flatWorld);
  assert.equal(body.grounded,true);
  stepAstronaut(body,{x:0,z:0,jumpPresses:['Space']},1/60,[],flatWorld);
  assert.equal(body.boostReady,true);
});
test('J, falling from a ledge, and swimming cannot trigger an airborne boost',()=>{
  for(const body of [{...bodyAt(),grounded:false,y:4},{...bodyAt(),grounded:false,swimming:true,y:-1.5}]){
    const env=body.swimming?{...flatWorld,terrainHeight:()=>-5,waterLevelAt:()=>0}:flatWorld;
    stepAstronaut(body,{x:0,z:0,jumpPresses:['Space']},1/60,[],env);
    assert.equal(stepAstronaut(body,{x:0,z:0,jumpPresses:['Space']},1/60,[],env).boosted,false);
  }
  const body=bodyAt();stepAstronaut(body,{x:0,z:0,jumpPresses:['KeyJ']},1/60,[],flatWorld);
  const velocity=body.vy;
  assert.equal(stepAstronaut(body,{x:0,z:0,jumpPresses:['KeyJ']},1/60,[],flatWorld).boosted,false);
  assert.ok(body.vy<velocity);
});
test('boosted jumps return safely to ground across gravity and frame rates',()=>{
  for(const gravity of [1.62,3.71,9.81,24.79])for(const fps of [30,60,120]){
    const body=bodyAt();let apex=0,bursts=0;
    for(let i=0;i<fps*13;i++){
      const motion=stepAstronaut(body,{x:0,z:0,jumpPresses:i===0?['Space']:i===Math.round(fps*.1)?['Space']:[]},1/fps,[],{...flatWorld,gravity});
      apex=Math.max(apex,body.y);bursts+=Number(motion.boosted);assert.ok(body.y>=0);
    }
    assert.equal(bursts,1);assert.ok(apex>1);assert.equal(body.grounded,true);assert.equal(body.boostReady,false);
  }
});

const pool={terrainHeight:()=>-5,walkableAt:()=>null,waterLevelAt:()=>0};
test('Space, double-Space and J cannot jump, kick or boost while swimming',()=>{
  for(const fps of [30,60,120])for(const run of [false,true]){
    const pressed={x:0,z:0,y:-.95,vy:0,grounded:false,swimming:true};
    const control={...pressed};
    for(let i=0;i<fps*2;i++){
      const motion=stepAstronaut(pressed,{x:1,z:0,run,jump:true,jumpPresses:['Space','Space','KeyJ']},1/fps,[],pool);
      stepAstronaut(control,{x:1,z:0,run},1/fps,[],pool);
      assert.equal(motion.swimming,true);assert.equal(motion.boosted,false);
      assert.equal(pressed.y,control.y);assert.equal(pressed.vy,control.vy);
      assert.equal(pressed.boostReady,false);
    }
  }
});
test('swimming glides briefly then stops, with frame-independent travel',()=>{
  const results=[];
  for(const fps of [30,60,120]){
    const body={x:0,z:0,y:-.95,vy:0,grounded:false,swimming:true};
    for(let i=0;i<fps*2;i++)stepAstronaut(body,{x:1,z:0,run:true},1/fps,[],pool);
    assert.ok(body.vx>2.69&&body.vx<=2.7);
    const release=body.x;
    stepAstronaut(body,{x:0,z:0},1/fps,[],pool);
    assert.ok(body.vx>2.4,'release preserves a short glide');
    for(let i=1;i<fps*4;i++)stepAstronaut(body,{x:0,z:0},1/fps,[],pool);
    assert.ok(body.vx<.001);assert.ok(body.x-release>1&&body.x-release<1.3);
    results.push(body.x);
  }
  for(const x of results)assert.ok(Math.abs(x-results[0])<.02);
});
test('falling into deep water slows the descent and recovers to a stable swim',()=>{
  const body={x:0,z:0,y:4,vy:-8,grounded:false};let entered=false;
  for(let i=0;i<300;i++){
    const result=stepAstronaut(body,{x:0,z:0},1/60,[],pool);
    if(result.swimming){entered=true;assert.ok(body.y> -1.15,'water cushions the fall');}
  }
  assert.ok(entered);assert.equal(body.swimming,true);assert.ok(Math.abs(body.y+.95)<.001);
});

test('the lake mesh edge is buried beneath a continuous dry bank, including terrain grid interpolation',()=>{
  const spacing=1280/512;
  for(let degrees=0;degrees<360;degrees++){
    const angle=degrees*Math.PI/180,x=LAKE.x+Math.cos(angle)*32,z=LAKE.z+Math.sin(angle)*32;
    assert.ok(terrainHeight(x,z)>LAKE.level+.5,'lake perimeter must not hang above low ground');
    const x0=Math.floor((x+640)/spacing)*spacing-640,z0=Math.floor((z+640)/spacing)*spacing-640;
    for(const dx of [0,spacing])for(const dz of [0,spacing]){
      assert.ok(terrainHeight(x0+dx,z0+dz)>LAKE.level+.2,'rendered terrain cell must cover the disc edge too');
    }
  }
});
test('water camera clearance protects first-person, chase and blended viewpoints while leaving dry land unchanged',()=>{
  for(const y of [-10,-1,-.45,-.3,0,2,12]){
    assert.ok(waterCameraHeight(LAKE.x,LAKE.z,y)>=LAKE.level+.3);
    assert.equal(waterCameraHeight(0,0,y),y);
  }
  for(let t=0;t<=1;t+=.01){
    const y=-3*(1-t)+2*t;
    assert.ok(waterCameraHeight(LAKE.x+8*t,LAKE.z,y)>=LAKE.level+.3,'view blends cannot cross below the lake surface');
  }
});
test('the enclosed lake still allows swimming back onto the bank in every direction',()=>{
  for(let i=0;i<32;i++){
    const angle=i*Math.PI*2/32,dx=Math.cos(angle),dz=Math.sin(angle);
    const body={x:LAKE.x,z:LAKE.z,y:LAKE.level-.95,vy:0,grounded:false,swimming:true};
    for(let j=0;j<2400;j++){
      stepAstronaut(body,{x:dx,z:dz},1/60);
      if(body.grounded&&Math.hypot(body.x-LAKE.x,body.z-LAKE.z)>30)break;
    }
    assert.ok(body.grounded&&Math.hypot(body.x-LAKE.x,body.z-LAKE.z)>30,'shore exit '+i+' must remain accessible');
  }
});

test('fast swimming respects its extended stamina budget and falls back to normal without rapid retriggering',()=>{
  for(const fps of [30,60,120]){
    const body={x:0,z:0,y:-.95,vy:0,grounded:false,swimming:true};let fastTime=0;
    for(let i=0;i<fps*(FAST_SWIM_SECONDS+7);i++){
      const motion=stepAstronaut(body,{x:1,z:0,run:true},1/fps,[],pool);
      if(motion.fastSwimming)fastTime+=1/fps;
      assert.ok(body.swimStamina>=0&&body.swimStamina<=1);
    }
    assert.ok(Math.abs(fastTime-FAST_SWIM_SECONDS)<.05);
    assert.equal(body.fastSwimming,false);assert.equal(body.swimExhausted,true);assert.ok(body.vx<1.91);
    stepAstronaut(body,{x:1,z:0,run:false},1/fps,[],pool);
    assert.equal(body.swimExhausted,false,'releasing Shift rearms once enough stamina has returned');
    assert.equal(stepAstronaut(body,{x:1,z:0,run:true},1/fps,[],pool).fastSwimming,true);
  }
});
test('normal swimming and rest recharge stamina without consuming it while Shift is idle',()=>{
  const body={x:0,z:0,y:-.95,vy:0,grounded:false,swimming:true,swimStamina:0,swimExhausted:true};
  for(let i=0;i<60*SWIM_RECOVERY_SECONDS;i++){
    const motion=stepAstronaut(body,{x:0,z:0,run:true},1/60,[],pool);
    assert.equal(motion.fastSwimming,false);
  }
  assert.ok(body.swimStamina>.999);
  for(let i=0;i<120;i++){
    const motion=stepAstronaut(body,{x:1,z:0,run:false},1/60,[],pool);
    assert.equal(motion.fastSwimming,false);assert.equal(body.swimStamina,1);
  }
});

test('running exhausts its extended stamina budget and slows to a walk until Shift is released',()=>{
  for(const fps of [30,60,120]){
    const body=bodyAt();let runningTime=0;
    for(let i=0;i<fps*(RUN_SECONDS+3);i++){
      const motion=stepAstronaut(body,{x:1,z:0,run:true},1/fps,[],flatWorld);
      if(motion.running)runningTime+=1/fps;
    }
    assert.ok(Math.abs(runningTime-RUN_SECONDS)<.05);assert.equal(body.running,false);
    assert.equal(body.swimExhausted,true);assert.ok(body.vx<=2.401,'exhaustion falls back to walking');
    stepAstronaut(body,{x:1,z:0,run:false},1/fps,[],flatWorld);
    assert.equal(body.swimExhausted,false);
    assert.equal(stepAstronaut(body,{x:1,z:0,run:true},1/fps,[],flatWorld).running,true);
  }
});
test('running and fast swimming share stamina, while idle Shift and paused time do not consume it',()=>{
  const body=bodyAt();
  for(let i=0;i<60;i++)stepAstronaut(body,{x:1,z:0,run:true},1/60,[],flatWorld);
  assert.ok(Math.abs(body.swimStamina-(1-1/RUN_SECONDS))<1e-10);
  body.y=-.95;body.grounded=false;body.swimming=true;
  for(let i=0;i<60;i++)stepAstronaut(body,{x:1,z:0,run:true},1/60,[],pool);
  assert.ok(Math.abs(body.swimStamina-(1-1/RUN_SECONDS-1/FAST_SWIM_SECONDS))<1e-10);
  const before=body.swimStamina;
  stepAstronaut(body,{x:1,z:0,run:true},0,[],pool);assert.equal(body.swimStamina,before);
  body.y=0;body.swimming=false;body.grounded=true;
  for(let i=0;i<60;i++){
    const motion=stepAstronaut(body,{x:0,z:0,run:true},1/60,[],flatWorld);assert.equal(motion.running,false);
  }
  assert.ok(Math.abs(body.swimStamina-before-1/SWIM_RECOVERY_SECONDS)<1e-10);
});
