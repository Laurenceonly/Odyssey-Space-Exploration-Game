import test from 'node:test';
import assert from 'node:assert/strict';
import { cabinLayout, cabinPositionClear, moveCabinWalker, nearCabinCockpit, windowRenderSize } from '../src/cabin-physics.js';

test('interior walking stays inside both rooms during long frames and rotated movement', () => {
  for (let heading = 0; heading < Math.PI * 2; heading += .2) {
    const p = { x: 0, z: 0 };
    for (let i = 0; i < 500; i++) moveCabinWalker(p, 1, 1, heading, 1, 2.3);
    assert.ok(cabinPositionClear(p.x, p.z));
    assert.ok(p.z >= cabinLayout.cockpit.front + cabinLayout.playerRadius);
    assert.ok(p.z <= cabinLayout.halfDepth - cabinLayout.playerRadius);
  }
});

test('walking diagonally does not increase speed and heading turns the movement axes', () => {
  const forward = { x: 0, z: 0 }, diagonal = { x: 0, z: 0 }, turned = { x: 0, z: 0 };
  moveCabinWalker(forward, 1, 0, 0, .05); moveCabinWalker(diagonal, 1, 1, 0, .05); moveCabinWalker(turned, 1, 0, Math.PI / 2, .05);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.z) - Math.abs(forward.z)) < 1e-10);
  assert.ok(turned.x < 0 && Math.abs(turned.z) < 1e-10);
});

test('the bench and equipment locker block movement but allow sliding along their edges', () => {
  for (const side of [-1, 1]) {
    const p = { x: 0, z: 1 };
    for (let i = 0; i < 120; i++) moveCabinWalker(p, 0, side, 0, .05);
    const x = p.x; assert.ok(Math.abs(x) < 2.05);
    for (let i = 0; i < 16; i++) moveCabinWalker(p, 1, side, 0, .05);
    assert.ok(p.z < .2); assert.ok(Math.abs(p.x) >= Math.abs(x) - .01);
  }
});

test('the open doorway connects the cabin to the cockpit without crossing the bulkhead', () => {
  const centre = { x: 0, z: -2.5 }, side = { x: 1.6, z: -2.5 };
  for (let i = 0; i < 30; i++) { moveCabinWalker(centre, 1, 0, 0, .05); moveCabinWalker(side, 1, 0, 0, .05); }
  assert.ok(centre.z < -3.5); assert.ok(side.z > -2.87);
  for (let i = 0; i < 30; i++) moveCabinWalker(centre, -1, 0, 0, .05);
  assert.ok(centre.z > -2.6, 'can walk back into cabin');
});

test('the cockpit has reachable aisles beside the chair and solid consoles and hull walls', () => {
  const aisle = { x: 1, z: -3.6 }, chair = { x: 0, z: -3.6 };
  for (let i = 0; i < 60; i++) { moveCabinWalker(aisle, 1, 0, 0, .05); moveCabinWalker(chair, 1, 0, 0, .05); }
  assert.ok(aisle.z < -6 && aisle.z > -6.44); assert.ok(chair.z > -4.44);
  assert.ok(cabinPositionClear(aisle.x, aisle.z)); assert.equal(cabinPositionClear(2.3, -5.2), false);
});

test('taking flight controls is available near the seat, not at the doorway or elsewhere in cabin', () => {
  assert.equal(nearCabinCockpit({ x: 0, z: 1.3 }), false);
  assert.equal(nearCabinCockpit({ x: 0, z: -3.6 }), false);
  assert.equal(nearCabinCockpit({ x: 0, z: -4.3 }), true);
  assert.equal(nearCabinCockpit({ x: 1, z: -5.3 }), true);
  assert.equal(nearCabinCockpit({ x: 2, z: -5.3 }), false);
});

test('window rendering matches canvas pixels at normal and dense desktop sizes',()=>{
  assert.deepEqual(windowRenderSize(1440,900),{width:1440,height:900});
  assert.deepEqual(windowRenderSize(2592,1620),{width:2592,height:1620});
});

test('oversized window renders retain aspect ratio within GPU and pixel limits',()=>{
  for(const [w,h,limit] of [[7680,4320,4096],[6000,6000,4096],[3840,2160,2048]]){
    const result=windowRenderSize(w,h,limit);
    assert.ok(result.width<=limit&&result.height<=limit);
    assert.ok(result.width*result.height<=3840*2160);
    assert.ok(Math.abs(result.width/result.height-w/h)<.003);
  }
});

test('hidden or empty canvas dimensions remain finite for the window target',()=>{
  assert.deepEqual(windowRenderSize(0,0),{width:1,height:1});
});
