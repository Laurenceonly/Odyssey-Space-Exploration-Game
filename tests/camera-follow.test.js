import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {followChaseCamera} from '../src/camera-follow.js';

test('forward flight preserves camera framing across uneven frame durations',()=>{
  const ship=new Vector3(),offset=new Vector3(0,.64,1.7),camera=offset.clone();
  for(const dt of [1/60,1/60,1/30,.05,1/120,.04,1/60]){
    const displacement=new Vector3(0,0,-43*dt);
    ship.add(displacement);
    followChaseCamera(camera,ship.clone().add(offset),displacement,dt);
    assert.ok(camera.clone().sub(ship).distanceTo(offset)<1e-10);
  }
});

test('turn easing depends on relative rig offset, not distance travelled',()=>{
  const dt=1/60,oldOffset=new Vector3(0,.64,1.7),newOffset=new Vector3(1.7,.64,0);
  const stationary=oldOffset.clone();
  followChaseCamera(stationary,newOffset,new Vector3(),dt);
  const displacement=new Vector3(1000,500,-300),moving=oldOffset.clone();
  followChaseCamera(moving,displacement.clone().add(newOffset),displacement,dt);
  assert.ok(moving.sub(displacement).distanceTo(stationary)<1e-10);
});
