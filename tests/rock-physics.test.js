import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {rockContact,resolveRockImpact} from '../src/rock-physics.js';

const normal=new Vector3(-1,0,0);
test('gentle contacts preserve rocks and ice of every size',()=>{
  for(const size of [.2,.5,1,2,4])for(const speed of [.1,2,5])for(const ice of [false,true]){
    const impact=resolveRockImpact(new Vector3(speed,0,0),new Vector3(),normal,size,ice);
    assert.equal(impact.broken,false);
    assert.ok(impact.rockVelocity.x>0);
    assert.ok(impact.shipVelocity.x<speed);
  }
});
test('fracture depends on closing speed, material, and size',()=>{
  assert.equal(resolveRockImpact(new Vector3(26,0,0),new Vector3(),normal,1).broken,true);
  assert.equal(resolveRockImpact(new Vector3(16,0,0),new Vector3(),normal,3).broken,false);
  assert.equal(resolveRockImpact(new Vector3(17,0,0),new Vector3(),normal,1,true).broken,true);
  assert.equal(resolveRockImpact(new Vector3(.1,43,0),new Vector3(),normal,1).broken,false);
});

test('normal flight fractures small stones, but preserves large rocks and glancing contacts',()=>{
  for(const size of [.2,.35,.7,1,1.45]){
    assert.equal(resolveRockImpact(new Vector3(14,0,0),new Vector3(),normal,size).broken,true);
  }
  assert.equal(resolveRockImpact(new Vector3(14,0,0),new Vector3(),normal,3).broken,false);
  assert.equal(resolveRockImpact(new Vector3(4,42,0),new Vector3(),normal,.35).broken,false);
  assert.equal(resolveRockImpact(new Vector3(14,0,0),new Vector3(10,0,0),normal,.35).broken,false);
});

test('moving rocks crossing the flight path are swept relative to the ship',()=>{
  const hit=rockContact(new Vector3(),new Vector3(),new Vector3(-10,0,0),1,new Vector3(10,0,0));
  assert.ok(hit);
  assert.ok(Math.abs(hit.fraction-.45)<1e-10);
  assert.equal(hit.normal.x,1);
  assert.equal(rockContact(new Vector3(),new Vector3(),new Vector3(-10,2,0),1,new Vector3(10,2,0)),null);
});
test('solid contacts conserve momentum and dissipate energy',()=>{
  const ship=new Vector3(12,3,0),rock=new Vector3(-1,0,0);
  const result=resolveRockImpact(ship,rock,normal,2);
  const before=ship.clone().multiplyScalar(result.shipMass).addScaledVector(rock,result.rockMass);
  const after=result.shipVelocity.clone().multiplyScalar(result.shipMass).addScaledVector(result.rockVelocity,result.rockMass);
  assert.ok(before.distanceTo(after)<1e-10);
  assert.ok(result.shipMass*result.shipVelocity.lengthSq()+result.rockMass*result.rockVelocity.lengthSq()<result.shipMass*ship.lengthSq()+result.rockMass*rock.lengthSq());
  assert.equal(resolveRockImpact(new Vector3(-4,0,0),new Vector3(),normal,2).impulse,0);
});
test('swept contacts catch tunneling and reject a near miss',()=>{
  const hit=rockContact(new Vector3(-10,0,0),new Vector3(10,0,0),new Vector3(),1);
  assert.ok(hit);
  assert.ok(Math.abs(hit.point.x+1)<1e-10);
  assert.equal(rockContact(new Vector3(-10,2,0),new Vector3(10,2,0),new Vector3(),1),null);
});
