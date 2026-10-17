import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {EARTH_REGIONS,EARTH_REGION_RADIUS,earthNeighbours,earthRegionExits,earthRegionArrival,earthNextRegion,earthExitNear,earthRouteDistance} from '../src/earth-regions.js';
import {earthRegionHeight,earthRegionWater,earthRegionWalkable,earthRegionResume} from '../src/earth-region-terrain.js';
import {stepAstronaut} from '../src/earth-physics.js';
import {buildEarthRegionEnvironment} from '../src/earth-region-environment.js';

test('all eleven substantial regions have reciprocal exits and a route back to Fernlilt',()=>{
 assert.equal(EARTH_REGIONS.length,11);assert.ok(EARTH_REGION_RADIUS>=560);
 for(const region of EARTH_REGIONS){
  for(const exit of earthRegionExits(region.id)){
   assert.ok(earthNeighbours(exit.to).includes(region.id));assert.ok(Math.hypot(exit.x,exit.z)<EARTH_REGION_RADIUS-30);assert.equal(earthExitNear(region.id,exit.x,exit.z)?.to,exit.to);
   const arrival=earthRegionArrival(exit.to,region.id);assert.ok(arrival);assert.equal(earthExitNear(exit.to,arrival.x,arrival.z),null,'arrivals stand clear of the return trigger');
  }
  let current=region.id;for(let n=0;current!=='fernlilt'&&n<11;n++)current=earthNextRegion(current);assert.equal(current,'fernlilt');
 }
 assert.equal(earthRegionArrival('hyskrum','ashqarin'),null);assert.equal(earthNextRegion('unknown'),null);
});

test('every region connection is traversable without a forced swim or jump, in both directions',()=>{
 for(const region of EARTH_REGIONS)for(const exit of earthRegionExits(region.id))for(let j=1;j<exit.path.length;j++){
  const [ax,az]=exit.path[j-1],[bx,bz]=exit.path[j],distance=Math.hypot(bx-ax,bz-az),steps=Math.ceil(distance);
  let previous=earthRegionHeight(region.id,ax,az);
  for(let i=1;i<=steps;i++){
   const x=ax+(bx-ax)*i/steps,z=az+(bz-az)*i/steps,y=earthRegionHeight(region.id,x,z),water=earthRegionWater(region.id,x,z);
   assert.ok(Number.isFinite(y));assert.equal(earthRegionWalkable(region.id,x,z),null);
   assert.ok(water===null||water-y<1.05,region.id+' route must not require swimming');assert.ok(Math.abs(y-previous)/(distance/steps)<.85,region.id+' route must have a walkable grade');previous=y;
  }
 }
});

test('region arrival saves restore on dry terrain, preserve view and stamina, and keep the real world id',()=>{
 for(const region of EARTH_REGIONS)for(const from of earthNeighbours(region.id)){
  const arrival=earthRegionArrival(region.id,from),resume=earthRegionResume(region.id,from,arrival,{viewMode:'first-person',position:{swimStamina:.4}});
  assert.equal(resume.worldId,'earth');assert.equal(resume.regionId,region.id);assert.equal(resume.position.y,earthRegionHeight(region.id,arrival.x,arrival.z));assert.equal(resume.viewMode,'first-person');assert.equal(resume.position.swimStamina,.4);assert.equal(resume.position.grounded,true);
 }
});

test('ordinary walking remains frame-independent on the new region routes',()=>{
 for(const region of EARTH_REGIONS.filter(r=>r.id!=='fernlilt')){
  const exit=earthRegionExits(region.id)[0],dx=exit.x,dz=exit.z,length=Math.hypot(dx,dz),results=[];
  for(const fps of [30,60]){
   const x=dx*.45,z=dz*.45,body={x,z,y:earthRegionHeight(region.id,x,z),vy:0,grounded:true};
   for(let i=0;i<fps*10;i++)stepAstronaut(body,{x:dx/length,z:dz/length,run:false},1/fps,[],{terrainHeight:(x,z)=>earthRegionHeight(region.id,x,z),waterLevelAt:(x,z)=>earthRegionWater(region.id,x,z),walkableAt:(x,z)=>earthRegionWalkable(region.id,x,z)});
   assert.ok(Math.hypot(body.x-x,body.z-z)>20,region.id+' walking advances');assert.ok(!body.swimming);results.push(body);
  }
  assert.ok(Math.hypot(results[0].x-results[1].x,results[0].z-results[1].z)<.1);
 }
});

test('new region geometry is finite, leaves travel routes clear, and includes an underground cavern roof',()=>{
 for(const region of EARTH_REGIONS.filter(r=>r.id!=='fernlilt')){
  const scene=new THREE.Scene(),obstacles=[],terrainHeight=(x,z)=>earthRegionHeight(region.id,x,z);
  const mesh=(geometry,material,position,scale)=>{const object=new THREE.Mesh(geometry,material);if(position)object.position.set(...position);if(scale)object.scale.set(...scale);scene.add(object);return object;};
  buildEarthRegionEnvironment({scene,regionId:region.id,terrainHeight,mesh,material:(color,extra={})=>new THREE.MeshStandardMaterial({color,...extra}),obstacles});
  assert.ok(scene.getObjectByName(region.id+'-terrain'));
  if(region.id==='nacreloom')assert.ok(scene.getObjectByName('nacreloom-underground-ceiling'));
  for(const obstacle of obstacles)assert.ok(earthRouteDistance(region.id,obstacle.x,obstacle.z)>obstacle.radius+5);
  const geometries=new Set(),materials=new Set();scene.traverse(object=>{if(object.geometry){geometries.add(object.geometry);for(const value of object.geometry.attributes.position.array)assert.ok(Number.isFinite(value));}if(object.material)materials.add(object.material);if(object.isInstancedMesh)object.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
 }
});
