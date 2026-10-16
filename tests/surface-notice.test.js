import test from 'node:test';
import assert from 'node:assert/strict';
import {createSurfaceNotice} from '../src/surface-notice.js';
test('surface messages expire despite repeated frame updates and appear again on a new event',()=>{
 const notice=createSurfaceNotice();assert.equal(notice.update(0,'swim','Swimming'),'Swimming');
 assert.equal(notice.update(2,'swim','Swimming'),'Swimming');assert.equal(notice.update(4,'swim','Swimming'),'');
 notice.update(5,'walk','');assert.equal(notice.update(6,'swim','Swimming'),'Swimming');
 notice.reset();assert.equal(notice.update(0,'swim','Swimming'),'Swimming');
});
