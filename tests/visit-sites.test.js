import test from 'node:test';
import assert from 'node:assert/strict';
import { getVisitSite,visitSites,visitTerrainHeight,visitRadius,visitFeaturePosition,canStartVisit } from '../src/visit-sites.js';
import { stepAstronaut } from '../src/earth-physics.js';
import {terrainHeight as earthHeight,walkableAt as earthWalkable} from '../src/earth-physics.js';

test('all eight planets and the Moon have visits; the Sun and comet do not',()=>{
  assert.deepEqual(Object.keys(visitSites).sort(),['mercury','venus','earth','moon','mars','jupiter','saturn','uranus','neptune'].sort());
  assert.equal(getVisitSite('sun'),null);assert.equal(getVisitSite('comet'),null);
});
test('giant planets are unique imagined landscapes, with real science explicitly separated',()=>{
  const ids=['jupiter','saturn','uranus','neptune'];
  assert.equal(new Set(ids.map(id=>getVisitSite(id).landmark)).size,4);
  assert.equal(new Set(ids.map(id=>getVisitSite(id).gravity)).size,4);
  for(const id of ids){const site=getVisitSite(id);assert.equal(site.kind,'imagined');assert.match(site.fiction,/fictional/);assert.match(site.fact,/no (true )?solid surface|no solid surface|no .*surface/);}
  for(const [id,g] of [['moon',1.62],['mercury',3.70],['venus',8.87],['mars',3.71],['earth',9.81]])assert.equal(getVisitSite(id).gravity,g);
  assert.match(getVisitSite('venus').fiction,/Real spacesuits could not protect/);
});
test('each world has a distinct feature and all generated terrain signatures differ',()=>{
  assert.equal(new Set(Object.values(visitSites).map(s=>s.landmark)).size,9);
  const signatures=Object.keys(visitSites).filter(id=>id!=='earth').map(id=>[[31,-20],[48,17],[-35,48]].map(([x,z])=>visitTerrainHeight(getVisitSite(id),x,z).toFixed(4)).join(','));
  assert.equal(new Set(signatures).size,8);
});
test('visits require discovery and a real nearby approach; previews alone never grant clearance',()=>{
  const state={site:getVisitSite('mars'),locked:false,intro:false,autopilot:false,distance:12,parkedId:null,manualReady:false};
  assert.equal(canStartVisit(state),false);
  assert.equal(canStartVisit({...state,manualReady:true}),true);
  assert.equal(canStartVisit({...state,parkedId:'mars'}),true);
  for(const changes of [{locked:true},{intro:true},{autopilot:true},{distance:100},{distance:-2},{distance:NaN},{site:null}])assert.equal(canStartVisit({...state,parkedId:'mars',...changes}),false);
  assert.equal(canStartVisit({...state,site:getVisitSite('saturn'),distance:55,parkedId:'saturn',maxDistance:63}),true);
});
test('lunar jumps stay aloft longer and rise higher than Earth under the same launch impulse',()=>{
  const simulate=gravity=>{const body={x:0,z:0,y:0,vy:0,grounded:true};let apex=0,airtime=0;
    for(let i=0;i<1200;i++){stepAstronaut(body,{x:0,z:0,jump:i===0},1/120,[],{gravity,terrainHeight:()=>0,walkableAt:()=>null});apex=Math.max(apex,body.y);if(!body.grounded)airtime+=1/120;}
    assert.equal(body.y,0);return {apex,airtime};};
  const earth=simulate(9.81),moon=simulate(1.62),mars=simulate(3.71);
  assert.ok(moon.apex>earth.apex*5.9);assert.ok(moon.airtime>earth.airtime*5.9);assert.ok(mars.apex>earth.apex*2.5&&mars.apex<moon.apex);
});
test('landing pads and disembark points are level, and every beacon has an accessible walking route',()=>{
  for(const id of Object.keys(visitSites).filter(id=>id!=='earth')){
    const site=getVisitSite(id),height=(x,z)=>visitTerrainHeight(site,x,z),target=visitFeaturePosition(site);
    assert.equal(height(0,4),0);assert.equal(height(6,7),0);
    const body={x:6,z:7,y:height(6,7),vy:0,grounded:true};
    const walkableAt=(x,z)=>Math.hypot(x,z)>visitRadius(site)?'boundary':null;
    for(let i=0;i<1800&&Math.hypot(body.x-target.x,body.z-target.z)>2;i++){
      const dx=target.x-body.x,dz=target.z-body.z,len=Math.hypot(dx,dz);
      stepAstronaut(body,{x:dx/len,z:dz/len},1/60,[{x:0,z:4,radius:4}],{gravity:site.gravity,terrainHeight:height,walkableAt});
    }
    assert.ok(Math.hypot(body.x-target.x,body.z-target.z)<2,id+' beacon is reachable');
    assert.ok(Number.isFinite(body.y));
  }
});

test('Earth survey route remains on dry land and clear of the parked hull',()=>{
  const site=getVisitSite('earth'),target=visitFeaturePosition(site),body={x:6,z:7,y:earthHeight(6,7),vy:0,grounded:true};
  for(let i=0;i<1800&&Math.hypot(body.x-target.x,body.z-target.z)>2;i++){
    const dx=target.x-body.x,dz=target.z-body.z,len=Math.hypot(dx,dz);
    const motion=stepAstronaut(body,{x:dx/len,z:dz/len},1/60,[{x:0,z:4,radius:4}]);
    assert.notEqual(motion.blocked,'water');
  }
  assert.ok(Math.hypot(body.x-target.x,body.z-target.z)<2);assert.equal(earthWalkable(target.x,target.z),null);
});

test('Earth fallen wood rests against the terrain at both ends',async()=>{
  const THREE=await import('three'),{buildSurveyBeacon}=await import('../src/planet-environment.js');const scene=new THREE.Scene();
  const mesh=(geometry,mat,position,scale,parent=scene)=>{const m=new THREE.Mesh(geometry,mat);if(position)m.position.set(...position);if(scale)m.scale.set(...scale);parent.add(m);return m;};
  const group=buildSurveyBeacon({scene,site:getVisitSite('earth'),terrainHeight:earthHeight,mesh,material:color=>new THREE.MeshStandardMaterial({color}),obstacles:[]});scene.updateMatrixWorld(true);
  for(const name of ['fallen-log','fallen-twig']){const wood=group.getObjectByName(name),vertices=wood.geometry.attributes.position,half=wood.geometry.parameters.height/2;for(const sign of [-1,1]){let minimum=Infinity;for(let i=0;i<vertices.count;i++){if(Math.abs(vertices.getY(i)-sign*half)>.0001)continue;const p=new THREE.Vector3().fromBufferAttribute(vertices,i).applyMatrix4(wood.matrixWorld);minimum=Math.min(minimum,p.y-earthHeight(p.x,p.z));}assert.ok(minimum<=.08&&minimum>=-.16,name+' endpoint must rest at ground level; clearance '+minimum);}}
  scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});
});
