import test from 'node:test';
import assert from 'node:assert/strict';
import {createRenderScale} from '../src/render-scale.js';
test('sustained low FPS reduces resolution within a readable lower bound',()=>{
 const scale=createRenderScale();for(let i=0;i<1600;i++)scale.tick(i*25);
 assert.equal(scale.value,.7);
});
test('60 FPS, paused menus, and isolated long stalls preserve resolution',()=>{
 const scale=createRenderScale();for(let i=0;i<1200;i++)scale.tick(i*1000/60);
 assert.equal(scale.value,1);
 for(let i=0;i<400;i++)scale.tick(21000+i*33,false);
 scale.tick(60000);assert.equal(scale.value,1);
});

test('fixed quality presets hold their scale under load, and Auto can resume adaptation',()=>{
 const scale=createRenderScale('high');
 for(const [quality,expected] of [['low',.7],['medium',.85],['high',1]]){
  scale.setQuality(quality);for(let i=0;i<500;i++)scale.tick(i*33);
  assert.equal(scale.quality,quality);assert.equal(scale.value,expected);
 }
 scale.setQuality('auto');for(let i=0;i<400;i++)scale.tick(i*25);
 assert.ok(scale.value<1);
 scale.setQuality('invalid');assert.equal(scale.quality,'auto');assert.equal(scale.value,1);
 assert.equal(createRenderScale('medium').value,.85);
 assert.equal(createRenderScale('invalid').quality,'auto');
});
