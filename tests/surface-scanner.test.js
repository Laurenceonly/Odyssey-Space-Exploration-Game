import test from 'node:test';import assert from 'node:assert/strict';import {createSurfaceScanner} from '../src/surface-scanner.js';
const valid={inRange:true,holding:true};
test('a survey scan takes a continuous hold and completes only once',()=>{const scan=createSurfaceScanner();let completed=0;for(let i=0;i<180;i++)if(scan.update(1/60,valid).complete)completed++;assert.equal(completed,1);assert.equal(scan.update(1/60,valid).progress,1);});
test('release, distance, and menus reset an unfinished scan',()=>{for(const interruption of [{holding:false},{inRange:false},{blocked:true}]){const scan=createSurfaceScanner();for(let i=0;i<100;i++)scan.update(1/60,valid);assert.equal(scan.update(1/60,{...valid,...interruption}).progress,0);assert.ok(scan.update(1/60,valid).progress<.01);}});
test('paused and invalid time cannot finish a scan or age its progress',()=>{const scan=createSurfaceScanner();for(const dt of [0,-1,NaN,Infinity])assert.equal(scan.update(dt,valid).progress,0);assert.ok(scan.update(30,valid).progress<.05);scan.reset();assert.equal(scan.update(0,valid).progress,0);});

test('nearby hold completes without camera aiming information',()=>{const scan=createSurfaceScanner();let complete=false;for(let i=0;i<150;i++)complete ||= scan.update(1/60,{inRange:true,holding:true}).complete;assert.equal(complete,true);});
