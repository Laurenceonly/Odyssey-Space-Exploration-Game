import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from 'three';
import {orbitalSafeHeight,clearOrbitalSweep,clearBodyOverlap} from '../src/body-clearance.js';

test('an old Earth launch save is clear of every future Moon phase on restore',()=>{
  const earth=new Vector3(100,0,20),ship=earth.clone().add(new Vector3(10,4,18));
  assert.equal(clearOrbitalSweep(ship,earth,25,5),true);
  for(let step=0;step<=720;step++){
    const angle=step*Math.PI/360;
    const moon=earth.clone().add(new Vector3(Math.cos(angle)*25,0,Math.sin(angle)*25));
    assert.ok(ship.distanceTo(moon)>6.4+2);
  }
  assert.equal(clearOrbitalSweep(ship,earth,25,5),false);
});

test('orbit recovery preserves safe flights and keeps flights below Earth below it',()=>{
  const earth=new Vector3(100,0,20),safe=earth.clone().add(new Vector3(60,0,0));
  assert.equal(clearOrbitalSweep(safe,earth,25,5),false);
  assert.deepEqual(safe.toArray(),[160,0,20]);
  const below=earth.clone().add(new Vector3(25,-4,0));
  assert.equal(clearOrbitalSweep(below,earth,25,5),true);
  assert.equal(below.y,-orbitalSafeHeight(5));
});

test('Exploration launch remains clear of the Moon over every orbital phase',()=>{
  const height=orbitalSafeHeight(5),flightRadius=Math.hypot(10,18);
  // Also include the lowest point of the intro's small vertical drift.
  for(let step=0;step<=720;step++){
    const angle=step*Math.PI/360;
    const ship=new Vector3(flightRadius, height-.35,0);
    const moon=new Vector3(Math.cos(angle)*25,0,Math.sin(angle)*25);
    assert.ok(ship.distanceTo(moon)>5+1.4+2);
  }
});

test('a moving Moon cannot trap a stationary ship already inside its collider',()=>{
  const center=new Vector3(25,0,0),position=new Vector3(24,4,0),velocity=new Vector3();
  assert.equal(clearBodyOverlap(position,velocity,center,6.4),true);
  assert.ok(position.distanceTo(center)>6.4);
  assert.equal(clearBodyOverlap(position,velocity,center,6.4),false);
  assert.equal(velocity.length(),0);
});

test('overlap recovery removes inward velocity and preserves escape movement',()=>{
  const center=new Vector3(),position=new Vector3(0,2,0),velocity=new Vector3(3,-4,0);
  clearBodyOverlap(position,velocity,center,6.4);
  assert.deepEqual(velocity.toArray(),[3,0,0]);
  const escaping=new Vector3(0,4,0);
  clearBodyOverlap(new Vector3(0,2,0),escaping,center,6.4);
  assert.equal(escaping.y,4);
});

test('an exact-center overlap gets a finite exit position',()=>{
  const center=new Vector3(100,0,20),position=center.clone();
  clearBodyOverlap(position,new Vector3(),center,6.4);
  assert.ok(position.toArray().every(Number.isFinite));
  assert.ok(position.distanceTo(center)>6.4);
});
