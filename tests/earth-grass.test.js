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
  assert.ok(budgets[0]<budgets[2]*.8,'Low remains lighter than optimized High');
  const visible=near.filter(o=>o.visible),uniform=visible.reduce((sum,o)=>sum+o.count*28*3,0),tiered=visible.reduce((sum,o)=>sum+o.count*o.geometry.drawRange.count/3,0);
  assert.ok(tiered<uniform*.65,'High avoids over a third of the old near-detail triangle work');
  assert.ok(visible.some(o=>o.geometry.drawRange.count===28*9),'High retains full detail near the camera');
  assert.ok(visible.some(o=>o.geometry.drawRange.count===6*9),'outer tiles skip already faded extra blades');
  const tierShader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <color_fragment>'};near[0].material.onBeforeCompile(tierShader);assert.match(tierShader.fragmentShader,/smoothstep\(meadowTierFade/,'extra detail fades before tile draw budgets change');
  assert.equal(grass.userData.geometries.length,3,'all reusable detail buffers remain available for surface disposal');
  grass.userData.setQuality('auto',1);assert.equal(grass.userData.quality,'medium');
  grass.userData.setQuality('auto',.7);assert.equal(grass.userData.quality,'low');
  const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});


test('landing and takeoff retain distant coverage even without crossing a grass tile boundary',()=>{
 const grass=createEarthGrass(new THREE.Scene(),getVisitSite('earth'),terrainHeight,random),far=grass.getObjectByName('distant-meadow').children;
 grass.userData.setQuality('low');grass.userData.update(6,7,1,false,2);const ground=far.filter(m=>m.visible).length;
 grass.userData.update(6,7,2,false,75);assert.equal(grass.userData.aerialView.value,1);assert.ok(far.filter(m=>m.visible).length>ground,'elevated views retain the whole distant field');
 assert.ok(far[0].material.map.isDataTexture,'the full canopy is projected from the existing blade mesh');assert.equal(far[0].geometry.drawRange.count,18,'Low retains three full-canopy projections for volume');
 grass.userData.update(6,7,3,false,2);assert.equal(grass.userData.aerialView.value,0);assert.equal(far.filter(m=>m.visible).length,ground);
 const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});
});


test('grass has no camera-clearance shrinking or fading',()=>{
 const grass=createEarthGrass(new THREE.Scene(),getVisitSite('earth'),terrainHeight,random),material=grass.children.find(o=>o.isInstancedMesh).material;
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <color_fragment>'};material.onBeforeCompile(shader);
 assert.ok(!shader.vertexShader.includes('transformed.y*='),'approaching the camera must not shrink grass into the ground');assert.ok(!shader.vertexShader.includes('cameraClear')&&!shader.vertexShader.includes('meadowCameraClear'));assert.ok(!shader.fragmentShader.includes('meadowCameraClear'));assert.match(shader.fragmentShader,/diffuseColor.a\*=coverage;/);
 const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});
});


test('the established distant canopy stays rooted when approaching it instead of clearing a hole',()=>{
 const grass=createEarthGrass(new THREE.Scene(),getVisitSite('earth'),terrainHeight,random),far=grass.getObjectByName('distant-meadow').children.find(m=>m.count>0);
 const vertices=far.geometry.attributes.position.array.slice(),matrix=new THREE.Matrix4();far.getMatrixAt(0,matrix);const originalMatrix=matrix.clone();
 const shader={uniforms:{},vertexShader:'#include <begin_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <color_fragment>'};far.material.onBeforeCompile(shader);
 assert.ok(!shader.fragmentShader.includes('smoothstep(24.,36.'),'the meadow body must not disappear as the camera approaches');assert.ok(far.material.map.isDataTexture);
 const near=grass.children.find(o=>o.isInstancedMesh),position=near.geometry.attributes.position;let tip=0;for(let i=0;i<position.count;i++)tip=Math.max(tip,position.getY(i));assert.ok(Math.abs(grass.userData.canopyProfile.height/1.02-tip)<.00001,'close and distant grass use the exact same canopy height');
 const texture=far.material.map.image;for(let view=0;view<4;view++){let pixels=0;for(let y=0;y<texture.height;y++)for(let x=view*128;x<(view+1)*128;x++)if(texture.data[(y*texture.width+x)*4+3]>0)pixels++;assert.ok(pixels>300,'each canopy view retains the full blade volume');}assert.equal(far.material.alphaTest,0,'MSAA preserves filtered blade coverage without a hard alpha cutoff');assert.ok(far.material.alphaToCoverage);assert.ok(shader.vertexShader.includes('meadowBacklight=pow('),'distant backlighting runs per vertex');assert.ok(!shader.fragmentShader.includes('float backlight=pow('),'distant backlighting does not repeat for every fragment');assert.match(shader.fragmentShader,/if\(diffuseColor.a<=.001\)discard;/);
 grass.userData.update(96,40,5);grass.userData.update(30,10,8);far.getMatrixAt(0,matrix);assert.deepEqual(matrix.elements,originalMatrix.elements);assert.deepEqual(far.geometry.attributes.position.array,vertices,'detail streaming must not resize the established grass blades');
 const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
});


test('walking streams spare grass tiles gradually without exposing unfinished tiles nearby',()=>{
 const grass=createEarthGrass(new THREE.Scene(),getVisitSite('earth'),terrainHeight,random);grass.userData.setQuality('low');grass.userData.update(20,7,1);assert.ok(grass.userData.pendingTiles>0,'walking refill is spread across frames');
 for(const mesh of grass.children.filter(o=>o.isInstancedMesh&&o.visible))assert.ok(mesh.count>0);
 for(let i=0;i<100;i++)grass.userData.update(20,7,1+i/60);assert.equal(grass.userData.pendingTiles,0);
 const geometries=new Set(),materials=new Set();grass.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);if(o.isInstancedMesh)o.dispose();});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});
});
