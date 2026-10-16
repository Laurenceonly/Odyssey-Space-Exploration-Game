import {earthPathDistance,earthMeadowCover} from './earth-layout.js';
import * as THREE from 'three';
import {LAKE,SITE_RADIUS,waterLevelAt} from './earth-physics.js';
import {surveyRouteDistance} from './visit-sites.js';

export function createEarthGrass(scene,site,terrainHeight,random){
  // Continuous short grass grows on dry ground; taller swathes vary its height.
  const points=[],indices=[],shades=[],segments=3;
  for(let blade=0;blade<7;blade++){
    const angle=blade*2.4,c=Math.cos(angle),s=Math.sin(angle),base=points.length/3;
    const height=[1.02,1.25,.88,1.12,.78,.96,1.18][blade],width=[.026,.031,.024,.028,.023,.027,.030][blade],lean=[.28,.38,.22,.32,.20,.26,.35][blade];
    for(let j=0;j<=segments;j++){
      const t=j/segments,edge=width*(1-t)*(1+.8*t);
      const x=c*(.04+lean*t*t),z=s*(.04+lean*t*t),y=height*t;
      points.push(x-s*edge,y,z+c*edge,x+s*edge,y,z-c*edge);
      const shade=.65+.35*t;shades.push(shade,shade,shade,shade,shade,shade);
      if(j<segments){const a=base+j*2,b=a+1,d=a+2,e=a+3;indices.push(a,b,d);if(j<segments-1)indices.push(b,e,d);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const windTime={value:0};
  const material=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide});
  material.onBeforeCompile=shader=>{
    shader.uniforms.meadowTime=windTime;
    shader.vertexShader='uniform float meadowTime;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvec3 meadowWorld=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;\nfloat tip=clamp(position.y/1.3,0.,1.);\nfloat breeze=sin(meadowWorld.x*.075+meadowWorld.z*.045-meadowTime*.85)*.7+sin(meadowWorld.z*.19+meadowTime*1.2)*.3;\ntransformed.x+=breeze*.16*tip*tip;transformed.z+=breeze*.08*tip*tip;\nfloat meadowFade=1.-smoothstep(48.,64.,length(cameraPosition.xz-meadowWorld.xz));transformed.y*=meadowFade;');
  };
  material.customProgramCacheKey=()=> 'odyssey-meadow-wind-v1';
  const root=new THREE.Group();root.name='meadow-grass';scene.add(root);
  const dummy=new THREE.Object3D(),color=new THREE.Color(),tileSize=32,capacity=1800;
  const tiles=Array.from({length:25},()=>{
    const mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.name='meadow-tile';mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh);
    return {mesh,x:Infinity,z:Infinity};
  });
  // Lower-density, wider blades carry the meadow well beyond the detailed tiles.
  const distant=new THREE.Group();distant.name='distant-meadow';root.add(distant);
  const farPoints=[],farColors=[],farIndices=[];
  for(let blade=0;blade<3;blade++){
    const angle=blade*2.4,c=Math.cos(angle),s=Math.sin(angle),base=farPoints.length/3;
    for(let j=0;j<=2;j++){
      const t=j/2,width=.03*(1-t),lean=.19*t*t,height=(.85+blade*.13)*t;
      farPoints.push(c*lean-s*width,height,s*lean+c*width,c*lean+s*width,height,s*lean-c*width);
      const shade=.72+.28*t;farColors.push(shade,shade,shade,shade,shade,shade);
    }
    farIndices.push(base,base+1,base+2,base+1,base+3,base+2,base+2,base+3,base+4);
  }
  const farGeometry=new THREE.BufferGeometry();farGeometry.setAttribute('position',new THREE.Float32BufferAttribute(farPoints,3));farGeometry.setAttribute('color',new THREE.Float32BufferAttribute(farColors,3));farGeometry.setIndex(farIndices);farGeometry.setDrawRange(0,18);farGeometry.computeVertexNormals();
  const farMaterial=material.clone();
  farMaterial.onBeforeCompile=shader=>{
    material.onBeforeCompile(shader);
    shader.vertexShader=shader.vertexShader.replace('float meadowFade=1.-smoothstep(48.,64.,length(cameraPosition.xz-meadowWorld.xz));',
      'float meadowDistance=length(cameraPosition.xz-meadowWorld.xz);float meadowFade=smoothstep(36.,54.,meadowDistance)*(1.-smoothstep(380.,480.,meadowDistance));');
  };
  farMaterial.customProgramCacheKey=()=> 'odyssey-distant-meadow-v1';
  for(let cx=-4;cx<=4;cx++)for(let cz=-4;cz<=4;cz++){
    const farMesh=new THREE.InstancedMesh(farGeometry,farMaterial,6000);farMesh.name='distant-meadow-tile';farMesh.userData.tileX=cx*160;farMesh.userData.tileZ=cz*160;farMesh.receiveShadow=false;farMesh.castShadow=false;
    const seed=cx*1999+cz*8101;let count=0;
    for(let i=0;i<6000;i++){
      const x=(cx+random(i+seed,90)-.5)*160,z=(cz+random(i+seed,91)-.5)*160;
      if(Math.hypot(x,z)>790||waterLevelAt(x,z)!==null||Math.hypot(x,z-4)<6)continue;
      const y=terrainHeight(x,z);if(Math.hypot(x-LAKE.x,z-LAKE.z)<32&&y<LAKE.level+.45)continue;
      dummy.position.set(x,y-.09,z);dummy.rotation.set(0,random(i+seed,92)*Math.PI*2,0);
      dummy.scale.set(1.1+random(i+seed,93)*.4,.75+random(i+seed,94)*.45,1.1+random(i+seed,95)*.4);dummy.updateMatrix();farMesh.setMatrixAt(count,dummy.matrix);
      color.setHSL(.31+random(i+seed,96)*.025,.51,.25+random(i+seed,97)*.035);farMesh.setColorAt(count++,color);
    }
    farMesh.count=count;farMesh.instanceMatrix.needsUpdate=true;if(farMesh.instanceColor)farMesh.instanceColor.needsUpdate=true;
    if(count)farMesh.computeBoundingSphere();else farMesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx*160,0,cz*160),0);
    distant.add(farMesh);
  }
  let lastX=Infinity,lastZ=Infinity;
  function fill(tile,cx,cz){
    tile.x=cx;tile.z=cz;const mesh=tile.mesh,seed=cx*1931+cz*7919;let count=0;
    for(let i=0;i<capacity;i++){
      const x=(cx+random(i+seed,30)-.5)*tileSize,z=(cz+random(i+seed,31)-.5)*tileSize;
      if(Math.hypot(x,z)>SITE_RADIUS)continue;
      const y=terrainHeight(x,z),lakeshore=Math.hypot(x-LAKE.x,z-LAKE.z)<32&&y<LAKE.level+.45;
      if(waterLevelAt(x,z)!==null||lakeshore||Math.hypot(x,z-4)<6||Math.min(surveyRouteDistance(site,x,z),earthPathDistance(x,z))<.85+random(i+seed,36)*.5)continue;
      const cover=earthMeadowCover(x,z);
      const rollingMeadow=.5+.5*Math.sin(x*.017+Math.sin(z*.012))*Math.cos(z*.019);
      const shelter=THREE.MathUtils.clamp(1.08-Math.max(0,y-2)*.025,.62,1.08);
      const height=(.46+Math.max(cover,rollingMeadow*.75)*.43+random(i+seed,33)*.28)*shelter;
      dummy.position.set(x,y-.08,z);dummy.rotation.set(0,random(i+seed,32)*Math.PI*2,0);
      dummy.scale.set(.9+random(i+seed,37)*.3,height,.9+random(i+seed,38)*.3);dummy.updateMatrix();mesh.setMatrixAt(count,dummy.matrix);
      color.setHSL(.305+random(i+seed,34)*.035,.53+random(i+seed,35)*.13,.235+random(i+seed,39)*.055);mesh.setColorAt(count++,color);
    }
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    if(count){mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.3;}else mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx*tileSize,0,cz*tileSize),0);
  }
  root.userData.windTime=windTime;
  root.userData.update=(x,z,time,reduced=false)=>{
    // Tiles beyond the blade fade still cost vertices unless explicitly culled.
    for(const tile of tiles)tile.mesh.visible=Math.hypot(tile.x*tileSize-x,tile.z*tileSize-z)<88;
    windTime.value=reduced?0:time;
    const cx=Math.floor((x+tileSize/2)/tileSize),cz=Math.floor((z+tileSize/2)/tileSize);
    if(cx===lastX&&cz===lastZ)return;
    lastX=cx;lastZ=cz;
    for(const mesh of distant.children)mesh.visible=Math.hypot(mesh.userData.tileX-x,mesh.userData.tileZ-z)<625;
    const wanted=[];for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++)wanted.push({x:cx+dx,z:cz+dz});
    const reusable=tiles.filter(tile=>!wanted.some(p=>p.x===tile.x&&p.z===tile.z));
    for(const point of wanted){if(tiles.some(tile=>tile.x===point.x&&tile.z===point.z))continue;const tile=reusable.pop();fill(tile,point.x,point.z);tile.mesh.visible=Math.hypot(tile.x*tileSize-x,tile.z*tileSize-z)<88;}
  };
  root.userData.update(6,7,0,true);
  return root;
}
