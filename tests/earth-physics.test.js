import test from 'node:test';
import assert from 'node:assert/strict';
import { EARTH_GRAVITY, LAKE, SITE_RADIUS, terrainHeight, walkableAt, stepAstronaut } from '../src/earth-physics.js';

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
  assert.ok(body.vx>2.7&&body.vx<=2.8);
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
