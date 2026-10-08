import test from 'node:test';
import assert from 'node:assert/strict';
import {cometPosition} from '../src/space-events.js';

test('the comet returns to the same place each orbit and grows active near the Sun',()=>{
  const first=cometPosition(0);
  const next=cometPosition(1000);
  assert.ok(Math.hypot(first.x-next.x,first.y-next.y,first.z-next.z)<.001);
  const samples=Array.from({length:101},(_,i)=>cometPosition(i*10));
  const nearest=samples.reduce((a,b)=>Math.hypot(a.x,a.y,a.z)<Math.hypot(b.x,b.y,b.z)?a:b);
  const farthest=samples.reduce((a,b)=>Math.hypot(a.x,a.y,a.z)>Math.hypot(b.x,b.y,b.z)?a:b);
  assert.ok(nearest.activity>farthest.activity);
});
