import {createSurfaceCollider} from './surface-collision.js';
import * as THREE from 'three';
import {getEarthRegion,earthRegionExits,earthRouteDistance} from './earth-regions.js';
import {earthRegionWater} from './earth-region-terrain.js';

export function buildEarthRegionEnvironment({scene,regionId,terrainHeight,mesh,material,obstacles}){
 const region=getEarthRegion(regionId),color=new THREE.Color(),base=new THREE.Color(region.ground),dummy=new THREE.Object3D();
 const seed=regionId.split('').reduce((v,c)=>v+c.charCodeAt(0),0);
 const random=(i,s=0)=>{const n=Math.sin(i*127.1+s*311.7+seed)*43758.5453;return n-Math.floor(n);};
 const ground=new THREE.PlaneGeometry(1280,1280,256,256);ground.rotateX(-Math.PI/2);
 const vertices=ground.attributes.position,colors=[];
 for(let i=0;i<vertices.count;i++){
  const x=vertices.getX(i),z=vertices.getZ(i),y=terrainHeight(x,z);vertices.setY(i,y);
  color.copy(base).multiplyScalar(.89+.12*Math.sin(x*.14)*Math.cos(z*.17));
  if(earthRouteDistance(regionId,x,z)<4)color.lerp(new THREE.Color(regionId==='hyskrum'?0xc0cbd0:regionId==='nacreloom'?0x959c9c:0xb2a383),.35);
  if(regionId==='keltrond')color.lerp(new THREE.Color(0xe8eeed),THREE.MathUtils.smoothstep(y,115,140));
  if(regionId==='evrathen'||regionId==='teshora'||regionId==='uloqai')color.lerp(new THREE.Color(0xdacba4),1-THREE.MathUtils.smoothstep(y,1,5));
  colors.push(color.r,color.g,color.b);
 }
 ground.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));ground.computeVertexNormals();
 const land=mesh(ground,material(0xffffff,{vertexColors:true}));land.name=regionId+'-terrain';land.castShadow=false;
 const forest=regionId==='rainselve'||regionId==='ossamber',sparse=regionId==='evrathen'||regionId==='keltrond'||regionId==='hyskrum';
 if(forest||sparse){
  const jungle=regionId==='ossamber',count=forest?800:100;
  const trunks=new THREE.InstancedMesh(new THREE.CylinderGeometry(.38,.75,1,7),material(jungle?0x514d36:0x5c5145),count);
  const canopies=new THREE.InstancedMesh(jungle?new THREE.SphereGeometry(1,8,5):new THREE.ConeGeometry(1,1,8),material(regionId==='hyskrum'?0xa1b5b2:jungle?0x356447:0x425f44),count*3);
  let n=0;
  for(let i=0;i<count*5&&n<count;i++){
   const x=(random(i,1)-.5)*1100,z=(random(i,2)-.5)*1100;
   if(Math.hypot(x,z)>550||Math.hypot(x-6,z-7)<18||earthRouteDistance(regionId,x,z)<12||earthRegionWater(regionId,x,z)!==null)continue;
   if(regionId==='keltrond'&&terrainHeight(x,z)>75)continue;
   const height=forest?14+random(i,3)*13:7+random(i,3)*8,y=terrainHeight(x,z);
   dummy.position.set(x,y+height/2,z);dummy.rotation.set(0,0,0);dummy.scale.set(1,height,1);dummy.updateMatrix();trunks.setMatrixAt(n,dummy.matrix);
   obstacles.push({x,z,radius:.8});
   for(let j=0;j<3;j++){
    dummy.position.set(x+(jungle?Math.sin(j*2.4)*3:0),y+height-j*2,z+(jungle?Math.cos(j*2.4)*3:0));dummy.scale.set(jungle?7:5,jungle?3.5:8,jungle?6:5);dummy.updateMatrix();canopies.setMatrixAt(n*3+j,dummy.matrix);
   }n++;
  }
  trunks.count=n;canopies.count=n*3;trunks.name=regionId+'-trunks';canopies.name=regionId+'-canopy';trunks.castShadow=canopies.castShadow=true;scene.add(trunks,canopies);
  if(forest){
   const leaves=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,3),material(jungle?0x4a7d43:0x5a7848),2200);let n=0;
   for(let i=0;i<4000&&n<2200;i++){
    const x=(random(i,5)-.5)*1100,z=(random(i,6)-.5)*1100;if(Math.hypot(x,z)>550||earthRouteDistance(regionId,x,z)<6)continue;
    dummy.position.set(x,terrainHeight(x,z)+.5,z);dummy.rotation.set(.2,random(i,7)*6.28,.3);dummy.scale.set(1.6,.9,1.6);dummy.updateMatrix();leaves.setMatrixAt(n++,dummy.matrix);
   }leaves.count=n;leaves.name=regionId+'-understory';scene.add(leaves);
  }
 }
 const cave=regionId==='nacreloom',desert=regionId==='ashqarin',snow=regionId==='hyskrum';
 const rockGeometry=cave?new THREE.ConeGeometry(1,1,7):new THREE.IcosahedronGeometry(1,1);
 const rockMaterial=material(cave?0xa3b8bd:desert?0xa56e50:snow?0xb5cbd3:0x777b76,cave?{emissive:0x305763,emissiveIntensity:.2}:{});
 const rocks=new THREE.InstancedMesh(rockGeometry,rockMaterial,cave?300:180);let rockCount=0;
 for(let i=0;i<1500&&rockCount<rocks.instanceMatrix.count;i++){
  const x=(random(i,10)-.5)*1080,z=(random(i,11)-.5)*1080;
  if(Math.hypot(x,z)>550||earthRouteDistance(regionId,x,z)<10||earthRegionWater(regionId,x,z)!==null)continue;
  const size=cave?2+random(i,12)*5:desert?4+random(i,12)*8:1+random(i,12)*4;
  if(earthRouteDistance(regionId,x,z)<size+7)continue;
  dummy.position.set(x,terrainHeight(x,z)+size*(cave?.5:.25),z);dummy.rotation.set(0,random(i,13)*6.28,0);dummy.scale.set(size,cave?size*2:desert?size*.65:size*.8,size);dummy.updateMatrix();rocks.setMatrixAt(rockCount++,dummy.matrix);
  obstacles.push(createSurfaceCollider(rockGeometry,dummy.matrix,{radius:size}));
 }
 rocks.count=rockCount;rocks.name=regionId+'-formations';rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
 if(cave){
  const ceiling=new THREE.PlaneGeometry(1280,1280,80,80);ceiling.rotateX(Math.PI/2);const p=ceiling.attributes.position;
  for(let i=0;i<p.count;i++)p.setY(i,2+Math.sin(p.getX(i)*.013)*4+Math.cos(p.getZ(i)*.015)*3);ceiling.computeVertexNormals();
  const roof=mesh(ceiling,material(0x414d54));roof.name='nacreloom-underground-ceiling';roof.castShadow=false;
  const points=new THREE.InstancedMesh(new THREE.ConeGeometry(1,1,6),rockMaterial,90);
  for(let i=0;i<90;i++){const x=(random(i,15)-.5)*1000,z=(random(i,16)-.5)*1000,h=5+random(i,17)*14;dummy.position.set(x,-h/2,z);dummy.rotation.set(Math.PI,0,0);dummy.scale.set(2,h,2);dummy.updateMatrix();points.setMatrixAt(i,dummy.matrix);}points.name='nacreloom-stalactites';scene.add(points);
  scene.add(new THREE.HemisphereLight(0x9fbecb,0x3f5154,1.25));
 }
 if(['evrathen','teshora','uloqai','nacreloom'].includes(regionId)){
  const level=cave?-36.5:0;
  const water=mesh(new THREE.PlaneGeometry(6000,6000),new THREE.MeshStandardMaterial({color:cave?0x356b77:regionId==='uloqai'?0x329caa:0x477f91,roughness:.35,metalness:.15,transparent:true,opacity:.88}),[0,level,0]);water.rotation.x=-Math.PI/2;water.name=regionId+'-water';water.castShadow=water.receiveShadow=false;
 }
 if(regionId==='hyskrum'){
  const iceGeometry=new THREE.CircleGeometry(64,64);iceGeometry.rotateX(-Math.PI/2);const p=iceGeometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i)-130,z=p.getZ(i)+70;p.setXYZ(i,x,terrainHeight(x,z)+.02,z);}iceGeometry.computeVertexNormals();const ice=mesh(iceGeometry,material(0x97becd,{roughness:.2,metalness:.25}));ice.name='hyskrum-frozen-basin';ice.castShadow=false;
 }
 return {update(){}};
}

export function buildEarthExitSigns(scene,regionId,terrainHeight){
 const group=new THREE.Group();group.name='earth-region-routes';
 for(const exit of earthRegionExits(regionId)){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#18211ef2';ctx.fillRect(0,0,768,128);ctx.strokeStyle='#e2e6db';ctx.lineWidth=3;ctx.strokeRect(5,5,758,118);
  ctx.fillStyle='#f4f4eb';ctx.font='500 38px sans-serif';ctx.textAlign='center';ctx.fillText(exit.name,384,57);ctx.font='24px sans-serif';ctx.fillText('Approach and press E',384,99);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const sign=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:true}));sign.position.set(exit.x,terrainHeight(exit.x,exit.z)+4.5,exit.z);sign.scale.set(18,3,1);sign.name='route-to-'+exit.to;group.add(sign);
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,3.5,6),new THREE.MeshLambertMaterial({color:0x77664e}));post.position.set(exit.x,terrainHeight(exit.x,exit.z)+1.75,exit.z);post.castShadow=true;group.add(post);
 }
 scene.add(group);return group;
}
