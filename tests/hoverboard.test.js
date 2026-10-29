import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createHoverboard} from '../src/hoverboard.js';
import {createBoostSmoke} from '../src/boost-smoke.js';

test('boost puffs originate underneath the moving hoverboard',()=>{
  const previous=globalThis.document;
  globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({createRadialGradient:()=>({addColorStop(){}}),fillRect(){}})})};
  try{
    const scene=new THREE.Scene(),rider=new THREE.Group(),board=createHoverboard();
    scene.add(rider);rider.add(board);rider.position.set(4,3,8);board.rotation.y=-Math.PI/2;scene.updateMatrixWorld(true);
    const nozzles=board.children.filter(child=>child.name==='hoverboard-boost-nozzle');assert.equal(nozzles.length,2);
    const smoke=createBoostSmoke(scene);smoke.trigger();smoke.update(1/60,nozzles,{vx:0,vz:0});
    const puffs=scene.getObjectByName('suit-boost-smoke').children.filter(child=>child.visible);
    assert.ok(puffs.length>=2);
    for(let i=0;i<2;i++){
      const origin=nozzles[i].getWorldPosition(new THREE.Vector3());
      assert.ok(Math.abs(puffs[i].position.x-origin.x)<.01&&Math.abs(puffs[i].position.z-origin.z)<.01);
      assert.ok(puffs[i].position.y<origin.y,'exhaust points below the board');
    }
  }finally{globalThis.document=previous;}
});
