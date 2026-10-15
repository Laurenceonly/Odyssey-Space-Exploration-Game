import * as THREE from 'three';
import { createSurfaceCollider } from './surface-collision.js';
import { visitFeaturePosition, surveyRouteDistance } from './visit-sites.js';

// Each zone is authored around a different landform. Giant-planet ground is openly fictional.
export function buildPlanetEnvironment({scene,site,terrainHeight,mesh,material,obstacles}) {
  const seed=['mercury','venus','moon','mars','jupiter','saturn','uranus','neptune'].indexOf(site.id)+1;
  const random=(i,s=0)=>{const n=Math.sin(i*127.1+s*311.7+seed*53.7)*43758.5453;return n-Math.floor(n);};
  const ground=new THREE.Color(site.ground),color=new THREE.Color(),animations=[];
  const geometry=new THREE.PlaneGeometry(440,440,200,200);geometry.rotateX(-Math.PI/2);
  const pos=geometry.attributes.position,colors=[];
  for(let i=0;i<pos.count;i++){
    const x=pos.getX(i),z=pos.getZ(i),y=terrainHeight(x,z);pos.setY(i,y);
    color.copy(ground);
    if(site.id==='jupiter')color.lerp(new THREE.Color(0xe6cba8),.5+.4*Math.sin(z*.085+Math.sin(x*.018)*2));
    if(site.id==='saturn')color.lerp(new THREE.Color(0xe0e5e3),.35+.25*Math.sin(x*.04+z*.06));
    if(site.id==='uranus')color.lerp(new THREE.Color(0x5b969f),.3+.2*Math.sin(x*.09+z*.018));
    if(site.id==='neptune')color.lerp(new THREE.Color(0x90b7cb),Math.max(0,y)*.035);
    if(site.id==='moon')color.multiplyScalar(.84+.16*Math.sin(x*.012+z*.016));
    color.multiplyScalar(.88+random(i,7)*.2+y*.009);colors.push(color.r,color.g,color.b);
  }
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  mesh(geometry,material(0xffffff,{vertexColors:true,roughness:site.id==='saturn'?.65:.94}));
  const crystals=['saturn','uranus','neptune'].includes(site.id);
  const rockGeometry=site.id==='neptune'?new THREE.BoxGeometry(1,2,.32):site.id==='uranus'?new THREE.CylinderGeometry(.25,1,2,5):crystals?new THREE.ConeGeometry(1,2,5):new THREE.IcosahedronGeometry(1,site.id==='jupiter'?2:1);
  const rockColor={mercury:0x69655e,venus:0x494235,moon:0x898783,mars:0x814e37,jupiter:0xd4b38f,saturn:0xc1d0d4,uranus:0x78b4bc,neptune:0x7295b0}[site.id];
  const rockMaterial=material(rockColor,{roughness:crystals?.3:.9,metalness:crystals?.12:0});
  const rocks=new THREE.InstancedMesh(rockGeometry,rockMaterial,210),dummy=new THREE.Object3D(),feature=visitFeaturePosition(site);let count=0;
  for(let i=0;i<400&&count<210;i++){
    const x=(random(i,8)-.5)*290,z=(random(i,9)-.5)*290;
    if(Math.hypot(x,z-4)<13||Math.hypot(x-feature.x,z-feature.z)<8||surveyRouteDistance(site,x,z)<4)continue;
    const size=.3+random(i,10)**3*(crystals?2.6:3.1);
    dummy.position.set(x,terrainHeight(x,z)+size*(crystals?.8:.24),z);
    dummy.scale.set(size,size*(crystals?1.8:site.id==='venus'?1.15:.55),size*.85);
    dummy.rotation.set(crystals?0:random(i,13),random(i,14)*6.28,site.id==='uranus'?-.4:random(i,15)*.2);dummy.updateMatrix();rocks.setMatrixAt(count++,dummy.matrix);
    obstacles.push(createSurfaceCollider(rockGeometry,dummy.matrix,{radius:size*.9}));
  }
  rocks.count=count;rocks.castShadow=rocks.receiveShadow=true;scene.add(rocks);
  // Silhouettes vary: low crater rims, mesas, cloudstone bluffs, ice peaks, and tilted canyon walls.
  for(let i=0;i<24;i++){
    const a=i/24*Math.PI*2,r=230+random(i,20)*30,x=Math.sin(a)*r,z=Math.cos(a)*r;
    let shape,height=15+random(i,21)*24,scale;
    if(site.id==='mars'){shape=new THREE.CylinderGeometry(10+random(i,23)*9,25,1,9);height=12+random(i,22)*23;scale=[1,height,1];}
    else if(site.id==='neptune'){shape=new THREE.IcosahedronGeometry(1,0);height=15+random(i,22)*30;scale=[28,height,8];}
    else if(crystals){shape=new THREE.ConeGeometry(1,1,5);height=22+random(i,22)*40;scale=[18,height,22];}
    else {shape=new THREE.SphereGeometry(1,24,12);height=site.id==='mercury'?4+random(i,22)*8:site.id==='moon'?6+random(i,22)*10:height;scale=[site.id==='mercury'||site.id==='moon'?55:40,height,40];}
    const shapePosition=shape.attributes.position;
    for(let j=0;j<shapePosition.count;j++){const px=shapePosition.getX(j),py=shapePosition.getY(j),pz=shapePosition.getZ(j);const rough=1+.12*Math.sin(px*.37+i*1.7)*Math.cos(pz*.31+i);shapePosition.setXYZ(j,px*rough,py*(1+.08*Math.sin(px*.3+pz*.4+i)),pz*rough);}
    shape.computeVertexNormals();
    const hill=mesh(shape,material(site.ground),[x,site.id==='mars'?height/2-8:-4,z],scale);hill.castShadow=false;if(site.id==='uranus')hill.rotation.z=-.4;
  }
  if(site.id==='mercury'){
    const solarDisc=mesh(new THREE.SphereGeometry(3.2,24,16),new THREE.MeshBasicMaterial({color:0xfff3d3}),[-95,25,-180]);solarDisc.castShadow=false;
    for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=36+Math.sin(a)*16,z=-25+Math.cos(a)*16;mesh(new THREE.IcosahedronGeometry(1,1),material(0x77736b),[x,terrainHeight(x,z)+.45,z],[1.4,.7,1.2]);}
  }
  if(site.id==='moon'){
    const globe=mesh(new THREE.SphereGeometry(9,32,20),new THREE.MeshStandardMaterial({color:0xffffff,map:new THREE.TextureLoader().load('/planet-textures/2k_earth_daymap.jpg',t=>{t.colorSpace=THREE.SRGBColorSpace;})}),[-80,32,-240]);globe.castShadow=false;
    // Small secondary craters distinguish this basin from Mercury's single raised impact rim.
    for(const [x,z,r] of [[-45,-30,11],[58,38,8],[-36,52,6]]){
      const rim=mesh(new THREE.TorusGeometry(r,.6,6,56),material(0x7e7d79),[x,terrainHeight(x,z),z]);rim.rotation.x=Math.PI/2;rim.scale.z=.5;
    }
  }
  if(site.id==='venus'){
    for(let i=0;i<32;i++){
      const x=-38+random(i,30)*16,z=-55+random(i,31)*55,h=3+random(i,32)*9;
      const column=mesh(new THREE.CylinderGeometry(1.1,1.3,h,6),material(i%3?0x484236:0x6c5a40),[x,terrainHeight(x,z)+h/2,z]);column.updateMatrixWorld(true);obstacles.push(createSurfaceCollider(column.geometry,column.matrixWorld));
    }
  }
  if(site.id==='mars'){
    // Exposed, horizontal beds beside the channel tell a different geological story from an impact crater.
    for(let i=0;i<5;i++)mesh(new THREE.CylinderGeometry(9-i*.7,12-i*.6,1.6,9),material(i%2?0xb78255:0x8f563a),[53,terrainHeight(53,-34)+i*1.6+.8,-34]);
  }
  if(site.id==='jupiter'){
    const cyclone=new THREE.Group();cyclone.position.set(-35,terrainHeight(-35,-90),-90);cyclone.name='storm-vortex';
    const points=[];for(let i=0;i<=20;i++){const y=i*3;points.push(new THREE.Vector2(3+i*1.25+Math.sin(i*.8),y));}
    const veil=new THREE.MeshBasicMaterial({color:0xc18e63,transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false});
    mesh(new THREE.LatheGeometry(points,56),veil,null,null,cyclone);
    for(let i=0;i<10;i++){const band=mesh(new THREE.TorusGeometry(5+i*2.4,.55,5,56),new THREE.MeshBasicMaterial({color:i%2?0xc8a17b:0xdcc4a2,transparent:true,opacity:.22,depthWrite:false}),[Math.sin(i)*2,i*5+4,0],null,cyclone);band.rotation.x=Math.PI/2;band.scale.z=.4;}
    scene.add(cyclone);animations.push(dt=>{cyclone.rotation.y+=dt*.18;});
  }
  if(site.id==='saturn'){
    const rings=new THREE.Group();rings.position.set(0,130,-230);rings.rotation.set(.7,0,.55);rings.name='ringlit-sky';
    for(const [inner,outer,c] of [[190,211,0xcac4af],[215,245,0xe5ddc3],[250,264,0xaaa38f]]){
      const ring=mesh(new THREE.RingGeometry(inner,outer,160),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide,transparent:true,opacity:.8}),null,null,rings);ring.castShadow=false;
    }scene.add(rings);
  }
  if(site.id==='uranus'){
    for(let i=0;i<15;i++)for(const side of [-1,1]){
      const z=-100+i*13,x=side*(56+Math.sin(i*.7)*5),h=9+random(i,42)*13;
      const wall=mesh(new THREE.CylinderGeometry(3.2,5.5,h,5),material(i%3?0x6ba3ac:0x9acbd0,{roughness:.35}),[x,terrainHeight(x,z)+h/2-2,z]);wall.rotation.z=-.4;wall.rotation.y=i*.31;wall.scale.z=1.4;wall.updateMatrixWorld(true);obstacles.push(createSurfaceCollider(wall.geometry,wall.matrixWorld));
    }
  }
  if(['mars','jupiter','neptune'].includes(site.id)){
    const amount=site.id==='neptune'?280:120,p=new Float32Array(amount*3),speeds=[];
    for(let i=0;i<amount;i++){p[i*3]=(random(i,50)-.5)*230;p[i*3+1]=2+random(i,51)*28;p[i*3+2]=(random(i,52)-.5)*230;speeds.push(3+random(i,53)*5);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(p,3));
    const stream=new THREE.Points(g,new THREE.PointsMaterial({color:site.id==='neptune'?0xc0d9e4:0xd7b492,size:site.id==='neptune'?.45:.18,transparent:true,opacity:.48,depthWrite:false}));stream.name='wind-streamers';scene.add(stream);
    animations.push(dt=>{for(let i=0;i<amount;i++){p[i*3]+=dt*speeds[i]*(site.id==='neptune'?4:1);if(p[i*3]>115)p[i*3]=-115;}g.attributes.position.needsUpdate=true;});
  }
  return {update:dt=>{for(const animate of animations)animate(dt);}};
}

export function buildSurveyBeacon({scene,site,terrainHeight,mesh,material,obstacles}) {
  const {x,z}=visitFeaturePosition(site),y=terrainHeight(x,z),group=new THREE.Group();group.position.set(x,y,z);group.name='landmark-'+site.landmark;scene.add(group);
  const metal=material(0xb6b9b5,{metalness:.55,roughness:.5});
  // Each landmark occupies its own natural setting; a readable survey flag gives a consistent wayfinding cue.
  const pole=mesh(new THREE.CylinderGeometry(.085,.095,5,10),metal,[-2,2.5,0],null,group);pole.name='survey-flag-pole';
  const flag=mesh(new THREE.BoxGeometry(2.4,1.35,.055),material(0xe6d0a0,{emissive:0x655029,emissiveIntensity:.12}),[-.79,4.17,0],null,group);flag.name='survey-flag';
  if(site.id==='mercury'){
    for(let i=0;i<4;i++){const ledge=mesh(new THREE.BoxGeometry(5-i*.6,.5,2.6-i*.25),material(i%2?0x91897d:0x625f59),[4,.25+i*.5,-2],null,group);ledge.rotation.y=.25;}
  } else if(site.id==='venus'){
    for(let i=0;i<7;i++)mesh(new THREE.CylinderGeometry(.65,.75,1+i%3*.6,6),material(i%2?0x534839:0x34302c),[4+Math.sin(i*2.4)*1.7,.5+i%3*.3,Math.cos(i*2.4)*1.7],null,group);
  } else if(site.id==='earth'){
    // Set both ends on the terrain, rather than tilting a floating cylinder.
    const bark=material(0x63503d,{roughness:1});
    function fallenWood(name,ax,az,bx,bz,radiusA,radiusB){
      const a=new THREE.Vector3(ax,terrainHeight(x+ax,z+az)-y+radiusA*.9,az);
      const b=new THREE.Vector3(bx,terrainHeight(x+bx,z+bz)-y+radiusB*.9,bz);
      const axis=b.clone().sub(a),mid=a.clone().add(b).multiplyScalar(.5);
      const wood=mesh(new THREE.CylinderGeometry(radiusB,radiusA,axis.length(),9),bark,mid.toArray(),null,group);
      wood.name=name;wood.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),axis.normalize());return wood;
    }
    fallenWood('fallen-log',-5,-1.6,-1.6,-.7,.3,.22);
    fallenWood('fallen-twig',-3.5,-1.2,-3,-2.3,.11,.055);
    const moss=mesh(new THREE.SphereGeometry(.28,10,8),material(0x6c813f),[-4.1,terrainHeight(x-4.1,z-1.2)-y+.48,-1.2],[1.6,.35,.7],group);moss.name='log-moss';
  } else if(site.id==='moon'){
    const plate=mesh(new THREE.BoxGeometry(1.4,.12,1),material(0xc5a364,{metalness:.7}),[1.8,.6,-1],null,group);plate.rotation.x=-.35;
    for(const side of [-1,1])mesh(new THREE.BoxGeometry(.09,.6,.09),metal,[1.8+side*.45,.3,-1],null,group);
    for(let i=0;i<9;i++)mesh(new THREE.CylinderGeometry(.13,.13,.08,6),material(0xe8d9b7,{metalness:.8,roughness:.2}),[1.35+i%3*.4,.72,-1.3+Math.floor(i/3)*.3],null,group);
  } else if(site.id==='mars'){
    for(let i=0;i<5;i++)mesh(new THREE.BoxGeometry(4-i*.4,.32,2),material(i%2?0xc79768:0x955d3e),[4,.16+i*.32,-2],null,group);
    for(let i=0;i<14;i++)mesh(new THREE.SphereGeometry(.12+i%3*.05,8,6),material(0x66534a),[2+(i%7)*.45,.12,2+Math.floor(i/7)*.35],null,group);
  } else if(site.id==='jupiter'){
    const swirl=new THREE.RingGeometry(1.7,4.2,72,5);swirl.rotateX(-Math.PI/2);const vertices=swirl.attributes.position;for(let i=0;i<vertices.count;i++){const px=vertices.getX(i),pz=vertices.getZ(i);vertices.setY(i,terrainHeight(x+px,z+pz)-y+.03);}swirl.computeVertexNormals();mesh(swirl,material(0xb48a64),null,null,group);
  } else if(site.id==='saturn'){
    for(let i=0;i<9;i++){const a=i/9*Math.PI*2;const crystal=mesh(new THREE.ConeGeometry(.7,4+i%3*1.4,5),material(i%2?0xc4e0e1:0xf0e9d5,{roughness:.2,metalness:.15}),[Math.sin(a)*6,2+i%3*.7,Math.cos(a)*6],null,group);crystal.rotation.z=Math.sin(a)*.2;}
  } else if(site.id==='uranus'){
    for(let i=0;i<4;i++){const ice=mesh(new THREE.BoxGeometry(1.6,5+i*2,1.5),material(i%2?0x8ec8cc:0x5c9fab,{roughness:.3}),[5+i*.8,2.5+i,-3+i*.9],null,group);ice.rotation.z=-.65;}
  } else if(site.id==='neptune'){
    const archGeometry=new THREE.TorusGeometry(6,1.15,6,32,Math.PI),v=archGeometry.attributes.position;for(let i=0;i<v.count;i++){const px=v.getX(i),py=v.getY(i),pz=v.getZ(i),rough=1+.12*Math.sin(px*.8+py*.6);v.setXYZ(i,px*rough,py*(1+.05*Math.sin(px)),pz*rough);}archGeometry.computeVertexNormals();const arch=mesh(archGeometry,material(0x5b819e,{roughness:.88,flatShading:true}),[3,0,-7],null,group);arch.rotation.y=.2;
    for(let i=0;i<4;i++){const fin=mesh(new THREE.ConeGeometry(.9,6,4),material(0x7b9db4),[-5-i*1.3,2+i*.3,-6],null,group);fin.rotation.z=-.3;}
  }
  group.updateMatrixWorld(true);
  for(const object of group.children.slice(2)){if(object.isMesh){const collider=createSurfaceCollider(object.geometry,object.matrixWorld);if(collider.topY-y>.12)obstacles.push(collider);}}
  return group;
}
