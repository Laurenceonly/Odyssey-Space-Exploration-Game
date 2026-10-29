import {SITE_RADIUS} from '../src/earth-physics.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_REGIONS,MAP_GRID,createEarthMapState,earthMapStorageKey} from '../src/earth-map-state.js';

test('all 13 names represent separate destinations with distinct initial letters',()=>{
  assert.equal(EARTH_REGIONS.length,13);
  assert.equal(new Set(EARTH_REGIONS.map(r=>r.id)).size,13);
  assert.equal(new Set(EARTH_REGIONS.map(r=>r.name.replace(/^(Mount|Lake) /,'')[0])).size,13);
  assert.equal(new Set(EARTH_REGIONS.map(r=>r.name[0])).size,13);
  assert.equal(EARTH_REGIONS.filter(r=>r.available).length,11);
  assert.ok(EARTH_REGIONS.filter(r=>['cirelune','dorynth'].includes(r.id)).every(r=>!r.available),'new destination interiors remain unbuilt');
});
test('visiting local scenery reveals nearby ground without discovering other destinations',()=>{
  const state=createEarthMapState();assert.equal(state.explored.size,0);assert.equal(state.visited.size,0);
  assert.equal(state.visit(6,7),true);assert.equal(state.isExplored(6,7),true);assert.equal(state.isExplored(-70,-40),false);
  const before=state.explored.size;assert.equal(state.visit(6,7),false);assert.equal(state.explored.size,before);
  for(const [x,z]of [[-16,-37],[34,-30],[-67,-9]])state.visit(x,z);
  assert.deepEqual([...state.visited],['fernlilt']);assert.ok(state.explored.size>before);
});
test('fog progress survives serialization and ignores corrupt or unknown discoveries',()=>{
  const state=createEarthMapState();state.visit(6,7);state.visit(-20,-35);
  const restored=createEarthMapState(JSON.parse(JSON.stringify(state.snapshot())));
  assert.deepEqual(restored.snapshot(),state.snapshot());
  const corrupt=createEarthMapState({visited:['fernlilt','evrathen','unknown',{},null],explored:[-1,0,1.5,NaN,'4',MAP_GRID*MAP_GRID,5]});
  assert.deepEqual([...corrupt.visited],['fernlilt','evrathen']);assert.deepEqual([...corrupt.explored],[0,5]);
  for(const saved of [null,[],{},'bad',{visited:'bad',explored:{}}])assert.doesNotThrow(()=>createEarthMapState(saved));
});
test('positions and waypoints reject invalid coordinates and the landing boundary',()=>{
  const state=createEarthMapState();
  for(const [x,z]of [[SITE_RADIUS+1,0],[SITE_RADIUS,SITE_RADIUS],[NaN,0],[Infinity,0],[null,0]]){
    assert.equal(state.visit(x,z),false);assert.equal(state.setWaypoint(x,z),false);
  }
  assert.equal(state.setWaypoint(34,-30),true);assert.deepEqual(state.waypoint,{x:34,z:-30});
  assert.equal(state.setWaypoint(SITE_RADIUS+1,0),false);assert.deepEqual(state.waypoint,{x:34,z:-30});
  state.clearWaypoint();assert.equal(state.waypoint,null);
});
test('Discovery and Exploration keep separate map progress',()=>{
  assert.notEqual(earthMapStorageKey('discovery'),earthMapStorageKey('exploration'));
  assert.equal(earthMapStorageKey('invalid'),earthMapStorageKey('discovery'));
});

test('expanded Fernlilt retains fog progress from the original small map',()=>{
  const oldId=Math.floor((7+112)/4)*56+Math.floor((6+112)/4);
  const state=createEarthMapState({version:1,visited:['fernlilt'],explored:[oldId]});
  assert.equal(state.isExplored(6,7),true);assert.equal(state.isExplored(400,0),false);
  assert.equal(state.snapshot().version,3);
  assert.equal(state.visit(400,0),true);assert.equal(state.setWaypoint(450,0),true);
});


test('regions keep fog and local waypoints separate, retain visited destinations, and migrate old saves',()=>{
 const state=createEarthMapState({version:2,visited:['fernlilt'],explored:[0,5]});assert.deepEqual([...state.explored],[0,5]);state.visit(6,7);state.setWaypoint(45,30);
 assert.equal(state.setRegion('rainselve'),true);assert.equal(state.isExplored(6,7),false);assert.equal(state.waypoint,null);state.visit(6,7);state.setWaypoint(-100,20);
 assert.equal(state.setRegion('fernlilt'),true);assert.deepEqual(state.waypoint,{x:45,z:30});assert.equal(state.visited.size,2);
 const restored=createEarthMapState(JSON.parse(JSON.stringify(state.snapshot())));restored.setRegion('rainselve');assert.equal(restored.isExplored(6,7),true);assert.equal(restored.waypoint,null,'waypoints stay session-local');assert.equal(restored.setRegion('unknown'),false);
});
