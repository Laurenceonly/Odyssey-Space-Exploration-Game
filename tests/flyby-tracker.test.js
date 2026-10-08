import test from 'node:test';
import assert from 'node:assert/strict';
import {createFlybyTracker} from '../src/flyby-tracker.js';

const center={x:0,y:0,z:0};
const ship=(x,z=0)=>({x,y:0,z});

test('records each completed pass of the same world with its own closest distance',()=>{
  const tracker=createFlybyTracker();
  const travel=points=>points.map(x=>tracker.update('mars',ship(x),center,8,14)).filter(Boolean);
  assert.deepEqual(travel([-50,-40,-25,-10,0,10,25,40,50]),[
    {worldId:'mars',distance:0,passKind:'flyby'},
  ]);
  assert.deepEqual(travel([50,40,30,20,30,40,50]),[
    {worldId:'mars',distance:12,passKind:'approach'},
  ]);
});

test('a stopped ship does not create a pass until it has entered and left the zone',()=>{
  const tracker=createFlybyTracker();
  assert.equal(tracker.update('earth',ship(30),center,16,0),null);
  assert.equal(tracker.update('earth',ship(40),center,16,0),null);
  assert.equal(tracker.update('earth',ship(30),center,16,10),null);
  assert.equal(tracker.update('earth',ship(30),center,16,0),null);
  assert.deepEqual(tracker.update('earth',ship(60),center,16,10),{
    worldId:'earth',distance:14,passKind:'approach',
  });
});

test('nearby worlds are tracked independently',()=>{
  const tracker=createFlybyTracker();
  tracker.update('earth',ship(-40),center,16,12);
  tracker.update('moon',ship(-40),center,5,12);
  tracker.update('earth',ship(0),center,16,12);
  tracker.update('moon',ship(0),center,5,12);
  assert.deepEqual(tracker.update('moon',ship(50),center,5,12),{
    worldId:'moon',distance:0,passKind:'flyby',
  });
  assert.deepEqual(tracker.update('earth',ship(60),center,16,12),{
    worldId:'earth',distance:0,passKind:'flyby',
  });
});

test('clearing an interrupted encounter prevents a false flyby',()=>{
  const tracker=createFlybyTracker();
  tracker.update('venus',ship(-30),center,15,12);
  tracker.clear();
  assert.equal(tracker.update('venus',ship(60),center,15,12),null);
});
