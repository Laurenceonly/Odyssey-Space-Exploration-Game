import test from 'node:test';
import assert from 'node:assert/strict';
import {createFrameRateMeter} from '../src/frame-rate.js';
test('FPS measures actual frame intervals at multiple rendering rates',()=>{
  for(const rate of [15,30,60,120]){const meter=createFrameRateMeter();let reading=null;for(let i=0;i<rate*3;i++){const next=meter.tick(i*1000/rate);if(next!==null)reading=next;}assert.equal(reading,rate);}
});
test('background tabs and long pauses do not produce a false low-FPS reading',()=>{
  const meter=createFrameRateMeter();meter.tick(0);assert.equal(meter.tick(1000/60),60);assert.equal(meter.tick(5000,true),null);assert.equal(meter.tick(6000),null);assert.equal(meter.tick(6000+1000/30),30);assert.equal(meter.tick(15000),null);
});
