import {earthPathDistance,earthWoodland} from './earth-layout.js';
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {LAKE} from './earth-physics.js';

export function createEarthFlowers(scene,terrainHeight,random){
  const capacity=160;
  const stemGeometry=new THREE.CylinderGeometry(.014,.022,1,6,4);
  stemGeometry.translate(0,.5,0);
  const vertices=stemGeometry.attributes.position;
  for(let i=0;i<vertices.count;i++){
    const t=vertices.getY(i);
    vertices.setX(i,vertices.getX(i)+.08*t*t);
    vertices.setZ(i,vertices.getZ(i)+.025*Math.sin(t*Math.PI));
  }
  stemGeometry.computeVertexNormals();
  const leafParts=[];
  for(const [side,height] of [[-1,.32],[1,.55]]){
    const leaf=new THREE.BufferGeometry();
    const base=.08*height*height;
    leaf.setAttribute('position',new THREE.Float32BufferAttribute([
      base,height,0,base+side*.16,height+.13,.065,
      base+side*.34,height+.27,0,base+side*.16,height+.13,-.065,
      base+side*.16,height+.17,0,
    ],3));
    leaf.setIndex([0,1,4,1,2,4,2,3,4,3,0,4]);leaf.computeVertexNormals();leafParts.push(leaf);
  }
  const leafGeometry=mergeGeometries(leafParts);leafParts.forEach(g=>g.dispose());
  const petalParts=[];
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    const petal=new THREE.SphereGeometry(1,8,5);
    petal.scale(.145,.035,.075);petal.rotateY(-angle);
    petal.translate(.08+Math.cos(angle)*.17,1.01,Math.sin(angle)*.17);
    petalParts.push(petal);
  }
  const petalGeometry=mergeGeometries(petalParts);petalParts.forEach(g=>g.dispose());
  const centerGeometry=new THREE.SphereGeometry(1,10,6);
  centerGeometry.scale(.085,.055,.085);centerGeometry.translate(.08,1.035,0);
  const make=(name,geometry,color,side=THREE.FrontSide)=>{
    const mesh=new THREE.InstancedMesh(geometry,new THREE.MeshStandardMaterial({color,roughness:.95,side}),capacity);
    mesh.name=name;mesh.receiveShadow=true;mesh.castShadow=false;scene.add(mesh);return mesh;
  };
  const stems=make('flower-stems',stemGeometry,0x526934);
  const leaves=make('flower-leaves',leafGeometry,0x667f3b,THREE.DoubleSide);
  const petals=make('flower-petals',petalGeometry,0xffffff);
  const centers=make('flower-centers',centerGeometry,0xd6aa49);
  const meshes=[stems,leaves,petals,centers],dummy=new THREE.Object3D(),color=new THREE.Color();
  let count=0;
  for(let i=0;i<250&&count<capacity;i++){
    const x=(random(i,40)-.5)*110,z=(random(i,41)-.5)*110,y=terrainHeight(x,z);
    if(y<LAKE.level+.8||Math.hypot(x,z)<10||earthPathDistance(x,z)<1.1||earthWoodland(x,z)>.45)continue;
    // Bury the root slightly so triangulated ground cannot expose the stem base.
    dummy.position.set(x,y-.05,z);dummy.rotation.set(0,random(i,42)*Math.PI*2,0);
    dummy.scale.setScalar(.30+random(i,43)*.20);dummy.updateMatrix();
    for(const mesh of meshes)mesh.setMatrixAt(count,dummy.matrix);
    petals.setColorAt(count,color.set(i%3?0xeee5cf:0xc4b2d9));
    count++;
  }
  for(const mesh of meshes){mesh.count=count;mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();}
  petals.instanceColor.needsUpdate=true;
  return meshes;
}
