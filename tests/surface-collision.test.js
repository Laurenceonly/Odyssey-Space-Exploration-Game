import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSurfaceCollider,supportAt} from '../src/surface-collision.js';
import {stepAstronaut} from '../src/earth-physics.js';
const environment={terrainHeight:()=>0,walkableAt:()=>null,waterLevelAt:()=>null,gravity:9.81};
const body=()=>({x:0,z:0,y:0,vy:0,grounded:true});
function rock(height=.8){return createSurfaceCollider(new THREE.BoxGeometry(1,height,1),new THREE.Matrix4().makeTranslation(1.5,height/2,0));}
test('support uses transformed visible triangles instead of an infinite cylinder',()=>{
  const collider=rock();assert.ok(Math.abs(collider.topAt(1.5,0)-.8)<1e-6);assert.equal(collider.topAt(3,0),null);
  const surface=supportAt(1.5,0,1,[collider],()=>0);assert.equal(surface.support,collider);assert.ok(Math.abs(surface.height-.8)<1e-6);
});
test('walking hits a rock side; jumping lands on its top and can stay there',()=>{
  const collider=rock(),walker=body();for(let i=0;i<120;i++)stepAstronaut(walker,{x:1,z:0},1/60,[collider],environment);assert.ok(walker.x<.72);assert.equal(walker.y,0);
  const jumper=body();let stood=false;for(let i=0;i<240;i++){stepAstronaut(jumper,{x:jumper.x<1.4?1:0,z:0,jump:i===0},1/60,[collider],environment);stood ||=jumper.support===collider;}
  assert.ok(stood);assert.equal(jumper.grounded,true);assert.ok(Math.abs(jumper.y-.8)<1e-6);assert.equal(jumper.support,collider);
});
test('walking off a rock falls back to the terrain without getting stuck',()=>{
  const collider=rock(),jumper={...body(),x:1.5,y:.8,support:collider};for(let i=0;i<120;i++)stepAstronaut(jumper,{x:1,z:0},1/60,[collider],environment);assert.ok(jumper.x>3);assert.equal(jumper.y,0);assert.equal(jumper.support,null);
});
test('high rocks still block a jump that does not clear their sides',()=>{
  const collider=rock(2),jumper=body();for(let i=0;i<120;i++)stepAstronaut(jumper,{x:1,z:0,jump:i===0},1/60,[collider],environment);assert.ok(jumper.x<.72);assert.equal(jumper.y,0);
});
test('raised arches can be walked under instead of becoming invisible walls',()=>{
  const overhead=createSurfaceCollider(new THREE.BoxGeometry(2,.5,2),new THREE.Matrix4().makeTranslation(2,3,0));const walker=body();for(let i=0;i<120;i++)stepAstronaut(walker,{x:1,z:0},1/60,[overhead],environment);assert.ok(walker.x>4);assert.equal(walker.y,0);
});
test('rock landings are stable at 30, 60, and 120 fps',()=>{
  for(const fps of [30,60,120]){const collider=rock(),jumper=body();for(let i=0;i<fps*4;i++)stepAstronaut(jumper,{x:jumper.x<1.4?1:0,z:0,jump:i===0},1/fps,[collider],environment);assert.ok(Math.abs(jumper.y-.8)<1e-6);assert.equal(jumper.grounded,true);}
});

test('curved rock edges can be left in every direction at 30, 60, and 120 fps',()=>{
  for(const fps of [30,60,120])for(let direction=0;direction<16;direction++){
    const geometry=new THREE.IcosahedronGeometry(1,1);
    const matrix=new THREE.Matrix4().compose(new THREE.Vector3(0,.35,0),new THREE.Quaternion().setFromEuler(new THREE.Euler(.3,.7,.4)),new THREE.Vector3(1.8,1.4,1.3));
    const collider=createSurfaceCollider(geometry,matrix),walker={...body(),y:collider.topAt(0,0),support:collider};
    const angle=direction*Math.PI/8;
    for(let i=0;i<fps*3;i++)stepAstronaut(walker,{x:Math.cos(angle),z:Math.sin(angle)},1/fps,[collider],environment);
    assert.ok(Math.hypot(walker.x,walker.z)>4,'must clear the sloped edge: '+fps+' fps, direction '+direction);assert.equal(walker.y,0);assert.equal(walker.support,null);
    geometry.dispose();
  }
});
test('an astronaut already overlapping a sloped rock can escape downhill',()=>{
  const collider=createSurfaceCollider(new THREE.IcosahedronGeometry(1,1),new THREE.Matrix4().makeTranslation(0,.4,0));
  const walker={...body(),x:.6,y:0};for(let i=0;i<120;i++)stepAstronaut(walker,{x:1,z:0},1/60,[collider],environment);
  assert.ok(walker.x>4);assert.equal(walker.y,0);
});
