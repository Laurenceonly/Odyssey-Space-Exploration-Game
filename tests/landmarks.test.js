import test from 'node:test';
import assert from 'node:assert/strict';
import {surfaceLandmarkAt} from '../src/landmarks.js';

test('surface landmark targets stay confined to the intended planet and texture region',()=>{
  assert.equal(surfaceLandmarkAt('mars',.127,.60)?.id,'olympus-mons');
  assert.equal(surfaceLandmarkAt('jupiter',.365,.39)?.id,'great-red-spot');
  assert.equal(surfaceLandmarkAt('jupiter',.34,.56),null);
  assert.equal(surfaceLandmarkAt('mars',.7,.39),null);
});
