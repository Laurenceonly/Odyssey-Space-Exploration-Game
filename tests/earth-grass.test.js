import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createEarthGrass} from '../src/earth-grass.js';
import {terrainHeight,waterLevelAt} from '../src/earth-physics.js';
import {getVisitSite} from '../src/visit-sites.js';
const random=(n,seed=0)=>{const v=Math.sin(n*127.1+seed*311.7)*43758.5453;return v-Math.floor(v);};
test('grass follows exploration across Fernlilt without entering water or the ship pad',()=>{
  const scene=new THREE.Scene(),grass=createEarthGrass(scene,getVisitSite('earth'),terrainHeight,random),matrix=new THREE.Matrix4(),point=new THREE.Vector3();
  const allocation=grass.children.slice();
  const inspect=(centerX,centerZ)=>{
    grass.userData.update(centerX,centerZ,5,false);let near=0,total=0;
    for(const tile of grass.children)for(let i=0;i<tile.count;i++){
      tile.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);total++;
      assert.equal(waterLevelAt(point.x,point.z),null);
      assert.ok(Math.hypot(point.x,point.z-4)>5.99,'landing ground remains clear');
      assert.ok(Math.abs(point.y-(terrainHeight(point.x,point.z)-.08))<.001,'roots follow actual terrain');
      if(Math.hypot(point.x-centerX,point.z-centerZ)<20)near++;
    }
    assert.ok(total>20000&&total<=45000,'bounded dense field');assert.ok(near>1000,'grass grows near the explorer throughout Fernlilt');
  };
  inspect(6,7);inspect(400,0);inspect(-350,120);
  assert.deepEqual(grass.children,allocation,'tile buffers are reused');
  grass.userData.update(400,0,8,true);assert.equal(grass.userData.windTime.value,0);
  const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});
