import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {EARTH_REGIONS,earthRegionExits} from '../src/earth-regions.js';
import {createEarthPortal,updateEarthPortalSigns} from '../src/earth-portals.js';
import {buildEarthExitSigns} from '../src/earth-region-environment.js';

test('Fernlilt has a closed, destination-themed portal for every other planned region',()=>{
 const exits=earthRegionExits('fernlilt');assert.equal(exits.length,EARTH_REGIONS.length-1);
 assert.deepEqual(new Set(exits.map(exit=>exit.to)),new Set(EARTH_REGIONS.filter(r=>r.id!=='fernlilt').map(r=>r.id)));
 const forms=new Set(),colors=new Set();for(const exit of exits){const portal=createEarthPortal(exit.to);assert.equal(portal.userData.destination,exit.to);assert.equal(portal.userData.available,false);forms.add(portal.userData.form);const surface=portal.children.find(child=>child.material?.isShaderMaterial);assert.ok(surface,'each portal has an animated surface');colors.add(surface.material.uniforms.portalColor.value.getHex());}
 assert.equal(forms.size,12,'each destination has its own landmark design');
 assert.equal(colors.size,12,'each destination has its own portal color');
});

test('portals create closed markers and block movement through the opening',()=>{
 const old=globalThis.document;globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({fillRect(){},strokeRect(){},fillText(){}})})};
 try{const scene=new THREE.Scene(),obstacles=[],routes=buildEarthExitSigns(scene,'fernlilt',()=>0,obstacles);
  assert.equal(routes.children.filter(c=>c.name.startsWith('portal-to-')).length,12);
  assert.equal(obstacles.length,12);for(const obstacle of obstacles)assert.ok(obstacle.radius>=8.2);
  for(const portal of routes.children){assert.equal(portal.scale.x,2.4,'portals are massive landmarks');const sign=portal.getObjectByName('portal-sign-'+portal.userData.destination);assert.ok(sign,'each portal has its own sign');assert.equal(sign.material.depthTest,true,'scenery can occlude distant signs');}
  updateEarthPortalSigns(routes,0,0);assert.ok(routes.children.every(p=>!p.getObjectByName('portal-sign-'+p.userData.destination).visible));
  const target=routes.children[0];updateEarthPortalSigns(routes,target.position.x,target.position.z);
  assert.deepEqual(routes.children.filter(p=>p.getObjectByName('portal-sign-'+p.userData.destination).visible),[target],'only the nearby entrance sign is shown');
 }finally{globalThis.document=old;}
});
