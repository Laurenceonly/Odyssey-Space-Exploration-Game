import test from 'node:test';
import assert from 'node:assert/strict';
import {cometPosition,cometPeriod} from '../src/space-events.js';
import {Vector3} from 'three';
import {cometTailCount,cometTailShape,writeCometTail} from '../src/comet-tail.js';

test('the comet returns to the same place each orbit and grows active near the Sun',()=>{
  const first=cometPosition(0);
  const next=cometPosition(cometPeriod);
  assert.ok(Math.hypot(first.x-next.x,first.y-next.y,first.z-next.z)<.001);
  const samples=Array.from({length:101},(_,i)=>cometPosition(i*cometPeriod/100));
  const nearest=samples.reduce((a,b)=>Math.hypot(a.x,a.y,a.z)<Math.hypot(b.x,b.y,b.z)?a:b);
  const farthest=samples.reduce((a,b)=>Math.hypot(a.x,a.y,a.z)>Math.hypot(b.x,b.y,b.z)?a:b);
  assert.ok(nearest.activity>farthest.activity);
  assert.ok(Math.hypot(nearest.x,nearest.y,nearest.z)<130);
  assert.ok(Math.hypot(farthest.x,farthest.y,farthest.z)<900);
});

test('the comet moves visibly even near the slow end of its orbit',()=>{
  const samples=Array.from({length:cometPeriod},(_,i)=>cometPosition(i));
  const slowestTenSeconds=Math.min(...samples.map((position,i)=>{
    const later=cometPosition(i+10);
    return Math.hypot(position.x-later.x,position.y-later.y,position.z-later.z);
  }));
  assert.ok(slowestTenSeconds>30);
});

test('the outer-orbit comet retains a visible tail streaming away from the Sun',()=>{
  const positions=new Float32Array(cometTailCount*3);
  const colors=new Float32Array(cometTailCount*3);
  const center=new Vector3(-1200,0,0);
  const shape=writeCometTail(positions,colors,0,0,center);
  assert.ok(shape.opacity>.4);
  assert.ok(Math.min(...positions.filter((_,i)=>i%3===0))<-60);
  assert.ok(positions.every(Number.isFinite));
  assert.ok(colors.some(value=>value>.05));
  for(let i=0;i<cometTailCount;i++)assert.ok(positions[i*3]<0);
  const before=positions.slice();
  writeCometTail(positions,colors,.1,0,center);
  assert.ok(positions.some((value,i)=>Math.abs(value-before[i])>.1));
  assert.ok(cometTailShape(1).length>shape.length);
});

test('dust curves behind orbital motion while ions remain sun-opposed',()=>{
  const positions=new Float32Array(cometTailCount*3),colors=new Float32Array(cometTailCount*3);
  writeCometTail(positions,colors,5,1,new Vector3(500,0,0),new Vector3(0,0,10));
  let dustZ=0,ionZ=0;
  for(let i=0;i<cometTailCount;i++){
    assert.ok(positions[i*3]>0);
    if(i<800)dustZ+=positions[i*3+2];else ionZ+=positions[i*3+2];
  }
  assert.ok(dustZ/800<-5);
  assert.ok(Math.abs(ionZ/400)<1);
});

test('tail buffers stay finite at zero distance and negative simulation times',()=>{
  const positions=new Float32Array(cometTailCount*3),colors=new Float32Array(cometTailCount*3);
  writeCometTail(positions,colors,-100,0,new Vector3());
  assert.ok(positions.every(Number.isFinite));
  assert.ok(colors.every(Number.isFinite));
});
