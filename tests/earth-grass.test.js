import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createEarthGrass} from '../src/earth-grass.js';
import {terrainHeight,waterLevelAt} from '../src/earth-physics.js';
import {earthPathDistance,earthTrailWidth} from '../src/earth-layout.js';
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
      assert.ok(earthPathDistance(point.x,point.z)>=earthTrailWidth(point.x,point.z)+1.69,'spread-out grass roots leave broad walking corridors');
      assert.ok(Math.hypot(point.x,point.z-4)>5.99,'landing ground remains clear');
      assert.ok(Math.abs(point.y-(terrainHeight(point.x,point.z)-.08))<.001,'roots follow actual terrain');
      if(Math.hypot(point.x-centerX,point.z-centerZ)<20)near++;
    }
    assert.ok(total>15000&&total<=53900,'bounded tall grass field');assert.ok(near>500,'tussocks grow near the explorer throughout Fernlilt');
  };
  inspect(6,7);
  const origins=new Set();
  for(const tile of grass.children)if(tile.isInstancedMesh)for(let i=0;i<tile.count;i++){
    tile.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);origins.add(point.x+','+point.z);
  }
  let shared=0;
  const far=grass.getObjectByName('distant-meadow').children.find(m=>m.userData.tileX===0&&m.userData.tileZ===0);
  for(let i=0;i<far.count;i++){
    far.getMatrixAt(i,matrix);point.setFromMatrixPosition(matrix);
    assert.ok(origins.has(point.x+','+point.z),'distant grass keeps the same placement as nearby detail');shared++;
  }
  assert.ok(shared>1000,'a stable underlayer covers the arrival surroundings');
  inspect(400,0);inspect(-350,120);
  assert.deepEqual(grass.children,allocation,'tile buffers are reused');
  grass.userData.update(400,0,8,true);assert.equal(grass.userData.windTime.value,0);
  const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});

test('graphics presets reduce geometry while preserving the distant field and tile buffers',()=>{
  const grass=createEarthGrass(new THREE.Scene(),getVisitSite('earth'),terrainHeight,random);
  const allocation=grass.children.slice(),near=grass.children.filter(o=>o.isInstancedMesh),far=grass.getObjectByName('distant-meadow').children;
  const budget=()=>{let triangles=0;grass.traverse(o=>{if(o.isInstancedMesh&&o.visible)triangles+=o.count*o.geometry.drawRange.count/3;});return triangles;};
  const budgets=[];
  for(const quality of ['low','medium','high']){
    grass.userData.setQuality(quality);budgets.push(budget());
    assert.ok(far.some(o=>o.visible&&Math.hypot(o.userData.tileX,o.userData.tileZ)>300),'far field remains visible');
    assert.deepEqual(grass.children,allocation,'switching presets reuses existing tiles');
    assert.ok(near.some(o=>o.visible),'nearby grass stays present');
  }
  assert.ok(budgets[0]<budgets[1]&&budgets[1]<budgets[2],'each preset has a different geometry budget');
  assert.ok(budgets[0]<budgets[2]*.5,'Low submits under half of High grass triangles');
  grass.userData.setQuality('auto',1);assert.equal(grass.userData.quality,'medium');
  grass.userData.setQuality('auto',.7);assert.equal(grass.userData.quality,'low');
  const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});
