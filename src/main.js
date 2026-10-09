import * as THREE from 'three';
import { createShipAudio } from './audio.js';
import { discovery } from './discovery.js';
import { planetPhotos } from './planet-photos.js';
import { createFlybyTracker } from './flyby-tracker.js';
import { cometPosition } from './space-events.js';
import { landmarks, surfaceLandmarkAt } from './landmarks.js';

const canvas = document.querySelector('#universe');
const speedCanvas = document.querySelector('#speedFx');
const speedContext = speedCanvas.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000104);
scene.fog = new THREE.FogExp2(0x000104, 0.0001);
const camera = new THREE.PerspectiveCamera(67, 1, 0.1, 5000);
camera.rotation.order = 'YXZ';
const clock = new THREE.Clock();
const shipAudio = createShipAudio();
const shipPosition = new THREE.Vector3();
const shipRotation = new THREE.Euler(0, 0, 0, 'YXZ');
const worldUp = new THREE.Vector3(0,1,0);
let shipMesh;
let sunMesh;
let cometBody;
let cometTail;
let cometTailPositions;
let cometComa;
let saturnRingPlane;
let saturnShardMesh;
let saturnRingDust;
const saturnShards=[];
const saturnRingBands=[];
const landmarkMeshes=[];
const scannedLandmarks=new Set();
const engineGlows = [];
const boostPlumes = [];
const attitudeJets = [];
const asteroidFields = [];
const asteroidRocks = [];
const asteroidFragments = [];
let asteroidFragmentMesh;
let boostAmount = 0;
let idleMotion = 0;
let cameraMode = 'chase';
let previewTarget = null;
let previewOrbitAngle = 0;
let previewOrbitTargetAngle = 0;
let arrivalPreview = false;
let parkedTarget = null;
const parkedOffset = new THREE.Vector3();
let cameraTransition = null;
let launchTransition = null;
let introActive = true;
let introDive = false;
let introHideTimer = null;
let returningToIntro = false;
let discoveryLaunchPending = false;
let discoveryDrift = false;
const discoveryStartPosition = new THREE.Vector3(0,90,1500);
const introOrbitAngle = Math.atan2(18,10);
const introOrbitRadius = Math.hypot(10,18);
const direction = new THREE.Vector3();
const levelDirection = new THREE.Vector3();
const desiredVelocity = new THREE.Vector3();
const velocity = new THREE.Vector3();
const temp = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const reticlePosition = new THREE.Vector2();
const keys = new Set();
const bodies = [];
const asteroidObstacles = [];
const scannedBodies = new Set();
let captainLog = [];
let pendingLogSnapshots = [];
let photos = [];
let photoPending = false;
let photoFeedbackTimer = null;
let lastPhotoTrigger = null;
const maxPhotos = 24;
const flybyTracker = createFlybyTracker();
const suppressedFlybyWorlds = new Set();
const maxCaptainLogEntries = 250;
const clickableMeshes = [];
const planetSurfaces = new Map();
let selectedId = 'earth';
let gameMode = 'discovery';
let yaw = 0;
let pitch = 0;
let targetYaw = 0;
let targetPitch = 0;
let bank = 0;
let autopilotTarget = null;
let autopilotMessage = 'Manual flight';
let autopilotWaypoint = null;
let lastHudUpdate = 0;
let lastFlightSave = 0;
let scanTargetId = null;
let scanSeconds = 0;
let scanResultUntil = 0;
let unlockCinematicActive = false;
let unlockCinematicTimer = null;
let unlockHideTimer = null;
let unlockLens = 0;
let shipName = 'Odyssey';
let pilotName = 'Explorer';
let exitFromSettings = false;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const maxManualPitch = THREE.MathUtils.degToRad(75);
const maxAutopilotPitch = THREE.MathUtils.degToRad(89);
const worldScale = 3.2;
const sunRadius = 40;
const moonOrbitRadius = 25;

const planets = [
  { id:'mercury', name:'Mercury', index:'01', symbol:'☿', type:'ROCKY WORLD', distance:'0.39 AU', diameter:'4,879 km', description:'A cratered little world racing closest to the Sun.', orbit:34, radius:6, angle:1.45, speed:.00013, color:'#999b9a', base:[143,143,139], style:'rock', gradient:'radial-gradient(circle at 29% 24%,#c6c6bf,#727879 57%,#252c32 92%)' },
  { id:'venus', name:'Venus', index:'02', symbol:'♀', type:'CLOUD WORLD', distance:'0.72 AU', diameter:'12,104 km', description:'A brilliant globe hidden beneath thick golden clouds.', orbit:47, radius:15.2, angle:-.75, speed:.00009, color:'#d8ad7e', base:[201,157,109], style:'cloud', gradient:'radial-gradient(circle at 28% 20%,#f7d4a2,#c28c60 60%,#3a2c2b 95%)' },
  { id:'earth', name:'Earth', index:'03', symbol:'♁', type:'TERRESTRIAL', distance:'1.00 AU', diameter:'12,742 km', description:'Our pale blue home, wrapped in a thin, living atmosphere.', orbit:65, radius:16.4, angle:.58, speed:.00007, color:'#4b9ac9', base:[42,98,166], style:'earth', gradient:'radial-gradient(circle at 27% 23%,#85c6d3,#3488b7 44%,#174c78 70%,#071a32 95%)' },
  { id:'mars', name:'Mars', index:'04', symbol:'♂', type:'ROCKY WORLD', distance:'1.52 AU', diameter:'6,779 km', description:'Rust-red deserts, giant volcanoes, and ancient riverbeds.', orbit:84, radius:8.8, angle:2.6, speed:.00005, color:'#c97759', base:[174,83,59], style:'rock', gradient:'radial-gradient(circle at 29% 22%,#e2a379,#a94d38 62%,#331f23 96%)' },
  { id:'jupiter', name:'Jupiter', index:'05', symbol:'♃', type:'GAS GIANT', distance:'5.20 AU', diameter:'139,820 km', description:'A vast storm-wrapped giant with bands of amber and cream.', orbit:123, radius:45.6, angle:-2.45, speed:.000028, color:'#d0a685', base:[190,151,123], style:'gas', gradient:'repeating-linear-gradient(175deg,#ead5b6 0 11px,#c29170 12px 20px,#a66f5b 21px 27px,#dfba99 28px 38px)' },
  { id:'saturn', name:'Saturn', index:'06', symbol:'♄', type:'RINGED GIANT', distance:'9.58 AU', diameter:'116,460 km', description:'A luminous world encircled by a broad field of icy rings.', orbit:164, radius:36.8, angle:1.95, speed:.00002, color:'#d8c39b', base:[194,174,129], style:'gas', gradient:'repeating-linear-gradient(175deg,#e7d8b5 0 14px,#c6ae83 15px 23px,#ab946e 24px 29px,#decda7 30px 41px)' },
  { id:'uranus', name:'Uranus', index:'07', symbol:'♅', type:'ICE GIANT', distance:'19.2 AU', diameter:'50,724 km', description:'A quiet cyan giant turning on its side in the outer dark.', orbit:204, radius:26.4, angle:-1.48, speed:.000013, color:'#98d7db', base:[131,192,195], style:'ice', gradient:'radial-gradient(circle at 28% 22%,#c7efeb,#75b8c4 67%,#254e67 95%)' },
  { id:'neptune', name:'Neptune', index:'08', symbol:'♆', type:'ICE GIANT', distance:'30.1 AU', diameter:'49,244 km', description:'Deep blue, windswept, and far beyond the familiar worlds.', orbit:243, radius:25.2, angle:2.95, speed:.000009, color:'#5279ce', base:[49,83,164], style:'ice', gradient:'radial-gradient(circle at 27% 22%,#789bdc,#3452a6 68%,#152454 96%)' },
];
const moonData = {id:'moon',name:'Moon',index:'03A',seed:9,symbol:'☾',type:'EARTH SATELLITE',distance:'1.00 AU',diameter:'3,474 km',description:'Earth’s cratered companion, with ancient highlands and quiet maria.',radius:5,color:'#aeb9c0',base:[151,157,159],style:'rock',gradient:'radial-gradient(circle at 28% 24%,#d3d5d0,#8a9499 58%,#343b42 96%)'};
const sunData={id:'sun',name:'Sun',index:'00',symbol:'☼',type:'YELLOW DWARF STAR',distance:'0 AU',diameter:'1.4 million km',description:'The star at the center of our solar system, powered by nuclear fusion.',radius:sunRadius,color:'#ffae45',base:[255,171,72],style:'sun'};
const cometData={id:'comet',name:'Comet',index:'C1',seed:41,symbol:'☄',type:'ICY VISITOR',distance:'Changing',diameter:'Simulated nucleus',description:'A dark icy nucleus follows a long orbit. Its dust and gas brighten near the Sun.',radius:3.8,color:'#b7c4c4',base:[83,91,92],style:'rock',gradient:'radial-gradient(circle at 27% 24%,#aeb9b9,#626d70 60%,#252c30 95%)'};
const destinations=[sunData,...planets.slice(0,3),moonData,...planets.slice(3),cometData];
const voyages=[
  {id:'inner',name:'Inner Worlds',stops:['mercury','venus','earth','moon','mars']},
  {id:'giants',name:'Giant Planets',stops:['jupiter','saturn','uranus','neptune']},
  {id:'outer',name:'Outer Dark',stops:['saturn','uranus','neptune']},
];
let voyageState=null;
let moonBody;

function hash(x, y, seed = 0) {
  let n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function noiseField(width,height,seed) {
  const values=new Float32Array(width*height);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++)values[y*width+x]=hash(x,y,seed);
  return {width,height,values};
}

function sampleNoise(field,u,v) {
  const gx=u*field.width;
  const gy=v*(field.height-1);
  const x0=Math.floor(gx)%field.width;
  const x1=(x0+1)%field.width;
  const y0=Math.min(field.height-1,Math.floor(gy));
  const y1=Math.min(field.height-1,y0+1);
  const fx=(gx-Math.floor(gx))**2*(3-2*(gx-Math.floor(gx)));
  const fy=(gy-y0)**2*(3-2*(gy-y0));
  const a=THREE.MathUtils.lerp(field.values[y0*field.width+x0],field.values[y0*field.width+x1],fx);
  const b=THREE.MathUtils.lerp(field.values[y1*field.width+x0],field.values[y1*field.width+x1],fx);
  return THREE.MathUtils.lerp(a,b,fy);
}

function surfaceTexture(planet) {
  const surface = document.createElement('canvas');
  surface.width = 768;
  surface.height = 384;
  const ctx = surface.getContext('2d');
  const frame = ctx.createImageData(surface.width, surface.height);
  const [r0,g0,b0] = planet.base;
  const seed=Number(planet.seed??planet.index);
  const fields=[noiseField(6,4,seed),noiseField(14,8,seed+11),noiseField(32,16,seed+23),noiseField(70,34,seed+37)];
  const cloudFields=[noiseField(10,5,seed+91),noiseField(34,16,seed+103)];
  for (let y=0;y<surface.height;y++) {
    const lat = y / surface.height;
    for (let x=0;x<surface.width;x++) {
      const lon = x / surface.width;
      const n0=sampleNoise(fields[0],lon,lat);
      const n1=sampleNoise(fields[1],lon,lat);
      const n2=sampleNoise(fields[2],lon,lat);
      const n3=sampleNoise(fields[3],lon,lat);
      const terrain=n0*.5+n1*.27+n2*.15+n3*.08;
      let r=r0, g=g0, b=b0;
      if (planet.style === 'earth') {
        const continent=terrain+.055*Math.sin(lon*13+Math.sin(lat*11)*2)-Math.abs(lat-.5)*.035;
        if(continent>.525) {
          const green=n2*.65+n3*.35;
          const desert=Math.abs(lat-.5)>.12 && Math.abs(lat-.5)<.31 && green>.54;
          if(desert){r=151+green*25;g=132+green*20;b=82+green*13;}
          else {r=45+green*48;g=91+green*65;b=59+green*33;}
        } else {
          const coast=THREE.MathUtils.clamp((continent-.45)*8,0,1);
          r=15+coast*25;g=51+coast*56;b=105+coast*59;
        }
        const polar=Math.abs(lat-.5)>.44+(n1-.5)*.04;
        if(polar){r=193;g=218;b=225;}
        const clouds=sampleNoise(cloudFields[0],lon,lat)*.65+sampleNoise(cloudFields[1],lon,lat)*.35;
        const cloudAmount=THREE.MathUtils.clamp((clouds-.59)*3.5,0,.5);
        r=THREE.MathUtils.lerp(r,225,cloudAmount);g=THREE.MathUtils.lerp(g,238,cloudAmount);b=THREE.MathUtils.lerp(b,239,cloudAmount);
      } else if (planet.style === 'gas' || planet.style === 'ice') {
        const warp=(n0-.5)*6+(n1-.5)*2;
        const stripes=Math.sin(lat*(planet.id==='jupiter'?84:67)+warp)*.65+Math.sin(lat*149+warp*1.5)*.25;
        const contrast=planet.style==='ice'?11:29;
        r+=(stripes+(terrain-.5)*.6)*contrast;
        g+=(stripes+(terrain-.5)*.5)*contrast*.8;
        b+=(stripes+(terrain-.5)*.4)*contrast*.65;
        if(planet.id==='jupiter'){
          const dx=Math.min(Math.abs(lon-.73),1-Math.abs(lon-.73))/.105;
          const dy=(lat-.61)/.055;
          const spot=THREE.MathUtils.clamp(1-(dx*dx+dy*dy),0,1);
          r+=spot*43;g-=spot*25;b-=spot*27;
        }
      } else if (planet.style === 'cloud') {
        const sweep=Math.sin(lat*65+terrain*11)*10;
        r+=(terrain-.5)*48+sweep;g+=(terrain-.5)*38+sweep*.8;b+=(terrain-.5)*23+sweep*.5;
      } else if (planet.style === 'sun') {
        const plasma=Math.sin(lat*91+terrain*17)*11+(terrain-.5)*90;
        r=245+plasma*.15;g=146+plasma;b=51+plasma*.63;
      } else {
        const relief=(terrain-.5)*96+(n3-.5)*20;
        r+=relief;g+=relief*.8;b+=relief*.68;
        if(planet.id==='mars'&&Math.abs(lat-.5)>.445+(n1-.5)*.025){r=205;g=195;b=180;}
      }
      const p=(y*surface.width+x)*4;
      frame.data[p]=r;
      frame.data[p+1]=g;
      frame.data[p+2]=b;
      frame.data[p+3]=255;
    }
  }
  ctx.putImageData(frame,0,0);
  if(planet.id==='mars'){
    const x=surface.width*.34,y=surface.height*.44;
    const glow=ctx.createRadialGradient(x,y,3,x,y,39);
    glow.addColorStop(0,'rgba(218,167,128,.65)');
    glow.addColorStop(.55,'rgba(150,88,69,.28)');
    glow.addColorStop(1,'rgba(89,51,46,0)');
    ctx.fillStyle=glow;ctx.beginPath();ctx.ellipse(x,y,43,26,-.2,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(83,49,43,.3)';ctx.lineWidth=3;
    ctx.beginPath();ctx.ellipse(x,y,11,7,-.2,0,Math.PI*2);ctx.stroke();
  }
  if (planet.style==='rock') {
    for(let i=0;i<165;i++) {
      const x=hash(i,3,seed)*surface.width;
      const y=hash(i,8,seed)*surface.height;
      const size=1+hash(i,12,seed)*7;
      ctx.fillStyle='rgba(24,21,23,.1)';
      ctx.beginPath();ctx.ellipse(x,y,size,size*.67,0,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(239,207,174,.14)';ctx.lineWidth=1;
      ctx.beginPath();ctx.ellipse(x-1,y-1,size,size*.67,0,0,Math.PI*2);ctx.stroke();
    }
  }
  const texture = new THREE.CanvasTexture(surface);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(),8);
  return texture;
}

function earthCloudTexture() {
  const surface=document.createElement('canvas');
  surface.width=768;surface.height=384;
  const ctx=surface.getContext('2d');
  const image=ctx.createImageData(surface.width,surface.height);
  const broad=noiseField(22,12,271);
  const fine=noiseField(88,44,283);
  for(let y=0;y<surface.height;y++)for(let x=0;x<surface.width;x++){
    const u=x/surface.width,v=y/surface.height;
    const cloud=sampleNoise(broad,u,v)*.7+sampleNoise(fine,u,v)*.3;
    const swirl=Math.sin(v*55+u*19+cloud*9)*.035;
    const alpha=THREE.MathUtils.clamp((cloud+swirl-.53)*4.5,0,.72);
    const p=(y*surface.width+x)*4;
    image.data[p]=239;image.data[p+1]=245;image.data[p+2]=247;
    image.data[p+3]=Math.round(alpha*255);
  }
  ctx.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(surface);
  texture.colorSpace=THREE.SRGBColorSpace;
  return texture;
}

function makeGlow(color, size, opacity) {
  const c=document.createElement('canvas');c.width=c.height=128;
  const cx=c.getContext('2d');
  const g=cx.createRadialGradient(64,64,6,64,64,64);
  g.addColorStop(0,`rgba(${color},${opacity})`);
  g.addColorStop(.25,`rgba(${color},${opacity*.42})`);
  g.addColorStop(1,`rgba(${color},0)`);
  cx.fillStyle=g;cx.fillRect(0,0,128,128);
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  sprite.scale.set(size,size,1);
  return sprite;
}

function makeOrbit(radius) {
  const points=[];
  for(let i=0;i<=192;i++) {
    const a=i/192*Math.PI*2;
    points.push(new THREE.Vector3(Math.cos(a)*radius,0,Math.sin(a)*radius));
  }
  const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.11,depthWrite:false}));
  scene.add(orbit);
}

function makeRings(parent, inner, outer) {
  const count=8;
  for(let i=0;i<count;i++) {
    const start=inner+(outer-inner)*i/count;
    const geometry=new THREE.RingGeometry(start,start+(outer-inner)/count*.76,128);
    const material=new THREE.MeshBasicMaterial({color:i%3===0?0x9f8d71:0xd0b995,transparent:true,opacity:.34+(i%3)*.08,side:THREE.DoubleSide,depthWrite:false});
    const ring=new THREE.Mesh(geometry,material);
    ring.rotation.x=Math.PI/2.6;
    parent.add(ring);
  }
}

function makeSaturnRings(parent,radius) {
  const inner=radius*1.24,gapInner=radius*1.73,gapOuter=radius*1.79,outer=radius*2.15;
  saturnRingPlane=new THREE.Group();
  saturnRingPlane.rotation.x=Math.PI/2.6;
  parent.add(saturnRingPlane);
  for(const [from,to,count] of [[inner,gapInner,6],[gapOuter,outer,5]])for(let i=0;i<count;i++){
    const start=from+(to-from)*i/count;
    const end=start+(to-from)/count*.88;
    const opacity=.31+(i%3)*.07;
    const ring=new THREE.Mesh(new THREE.RingGeometry(start,end,128),new THREE.MeshBasicMaterial({color:i%3===0?0x9f8d71:0xd5c4a5,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false}));
    ring.userData.baseOpacity=opacity;
    saturnRingPlane.add(ring);
    saturnRingBands.push(ring);
  }
  const gapTarget=new THREE.Mesh(new THREE.RingGeometry(gapInner,gapOuter,128),new THREE.MeshBasicMaterial({transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
  gapTarget.userData.landmarkId='cassini-division';
  saturnRingPlane.add(gapTarget);
  landmarkMeshes.push(gapTarget);
  const positions=new Float32Array(15000*3),colors=new Float32Array(15000*3);
  const palette=[new THREE.Color(0xe4ddd0),new THREE.Color(0xb9afa0),new THREE.Color(0xf0e8db)];
  for(let i=0;i<15000;i++){
    const band=hash(i,201)<.57?[inner,gapInner]:[gapOuter,outer];
    const r=Math.sqrt(THREE.MathUtils.lerp(band[0]**2,band[1]**2,hash(i,202)));
    const angle=hash(i,203)*Math.PI*2,offset=i*3;
    positions[offset]=Math.cos(angle)*r;
    positions[offset+1]=Math.sin(angle)*r;
    positions[offset+2]=(hash(i,204)-.5)*.45;
    const color=palette[i%palette.length];
    colors[offset]=color.r;colors[offset+1]=color.g;colors[offset+2]=color.b;
  }
  const particles=new THREE.BufferGeometry();
  particles.setAttribute('position',new THREE.BufferAttribute(positions,3));
  particles.setAttribute('color',new THREE.BufferAttribute(colors,3));
  saturnRingDust=new THREE.Points(particles,new THREE.PointsMaterial({size:.55,sizeAttenuation:true,vertexColors:true,transparent:true,opacity:.82,depthWrite:false}));
  saturnRingPlane.add(saturnRingDust);
  saturnShardMesh=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,0),new THREE.MeshStandardMaterial({color:0xd7d0c0,roughness:1,flatShading:true}),260);
  saturnShardMesh.frustumCulled=false;
  saturnRingPlane.add(saturnShardMesh);
  for(let i=0;i<260;i++){
    const band=hash(i,211)<.57?[inner,gapInner]:[gapOuter,outer];
    saturnShards.push({id:10000+i,origin:'ring',angle:hash(i,212)*Math.PI*2,orbitRadius:THREE.MathUtils.lerp(band[0],band[1],hash(i,213)),height:(hash(i,214)-.5)*.7,size:.2+hash(i,215)*.95,radius:.7+hash(i,215)*.95,position:new THREE.Vector3(),velocity:new THREE.Vector3(),spin:new THREE.Vector3(),alive:true});
  }
}

const saturnShardDummy=new THREE.Object3D();
function updateSaturnRings(elapsed) {
  if(!saturnRingPlane)return;
  saturnRingPlane.updateWorldMatrix(true,false);
  saturnRingDust.rotation.z=elapsed*.004;
  const distance=shipPosition.distanceTo(saturnRingPlane.parent.position);
  const solidity=THREE.MathUtils.clamp((distance-105)/140,0,1);
  for(const band of saturnRingBands)band.material.opacity=band.userData.baseOpacity*(.08+.92*solidity);
  saturnShards.forEach((shard,index)=>{
    if(!shard.alive){saturnShardDummy.scale.setScalar(0);saturnShardDummy.updateMatrix();saturnShardMesh.setMatrixAt(index,saturnShardDummy.matrix);return;}
    const angle=shard.angle+elapsed*.015*(58/shard.orbitRadius)**1.5;
    saturnShardDummy.position.set(Math.cos(angle)*shard.orbitRadius,Math.sin(angle)*shard.orbitRadius,shard.height);
    saturnShardDummy.rotation.set(elapsed*.03+index,index*.4+elapsed*.02,index*.17);
    saturnShardDummy.scale.setScalar(shard.size);
    saturnShardDummy.updateMatrix();
    saturnShardMesh.setMatrixAt(index,saturnShardDummy.matrix);
    shard.position.copy(saturnShardDummy.position);
    saturnRingPlane.localToWorld(shard.position);
  });
  saturnShardMesh.instanceMatrix.needsUpdate=true;
}

function fuselageGeometry() {
  const sections=[[-3.05,.035,.045],[-2.25,.29,.17],[-.9,.55,.31],[.3,.66,.37],[1.45,.53,.31],[2.05,.36,.23]];
  const sides=10;
  const positions=[];
  const indices=[];
  for(const [z,width,height] of sections)for(let side=0;side<sides;side++){
    const angle=side/sides*Math.PI*2;
    positions.push(Math.cos(angle)*width,Math.sin(angle)*height,z);
  }
  for(let row=0;row<sections.length-1;row++)for(let side=0;side<sides;side++){
    const a=row*sides+side,b=row*sides+(side+1)%sides;
    const c=(row+1)*sides+side,d=(row+1)*sides+(side+1)%sides;
    indices.push(a,b,c,b,d,c);
  }
  for(let side=1;side<sides-1;side++){
    indices.push(0,side+1,side);
    const base=(sections.length-1)*sides;
    indices.push(base,base+side,base+side+1);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function wingGeometry(side) {
  const outline=[[.48,-.86],[2.45,.75],[2.22,1.28],[.52,1.65]];
  const positions=[];
  for(const y of [-.04,-.18])for(const [x,z] of outline)positions.push(side*x,y,z);
  const indices=[0,1,2,0,2,3,4,6,5,4,7,6];
  for(let i=0;i<4;i++){
    const j=(i+1)%4;
    indices.push(i,j,4+i,j,4+j,4+i);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function deckPanel(points,y) {
  const geometry=new THREE.BufferGeometry();
  const positions=[];
  points.forEach(([x,z])=>positions.push(x,y,z));
  const indices=[];
  for(let i=1;i<points.length-1;i++)indices.push(0,i,i+1);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createShip() {
  const hull = new THREE.MeshStandardMaterial({color:0x8199a1,metalness:.62,roughness:.31,side:THREE.DoubleSide});
  const wingMaterial = new THREE.MeshStandardMaterial({color:0x294a58,metalness:.55,roughness:.39,side:THREE.DoubleSide});
  const deckMaterial = new THREE.MeshStandardMaterial({color:0x597984,metalness:.57,roughness:.35,side:THREE.DoubleSide});
  const darkMetal = new THREE.MeshStandardMaterial({color:0x183342,metalness:.5,roughness:.45});
  const glass = new THREE.MeshStandardMaterial({color:0x10384f,metalness:.58,roughness:.17,emissive:0x0a344a,emissiveIntensity:.4});
  const engineMaterial = new THREE.MeshBasicMaterial({color:0x6ddbd7});
  shipMesh = new THREE.Group();
  shipMesh.add(new THREE.Mesh(fuselageGeometry(),hull));
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(.54,18,12),glass);
  canopy.scale.set(1,.49,1.47);canopy.position.set(0,.39,-.63);shipMesh.add(canopy);
  const canopyBase=new THREE.Mesh(new THREE.BoxGeometry(1.06,.08,1.65),darkMetal);
  canopyBase.position.set(0,.36,-.62);shipMesh.add(canopyBase);
  const cockpitFrame=new THREE.Mesh(new THREE.TorusGeometry(.43,.022,6,28,Math.PI),darkMetal);
  cockpitFrame.rotation.x=Math.PI/2;cockpitFrame.position.set(0,.61,-.65);shipMesh.add(cockpitFrame);
  for(const side of [-1,1]) {
    shipMesh.add(new THREE.Mesh(wingGeometry(side),wingMaterial));
    shipMesh.add(new THREE.Mesh(deckPanel([[side*.72,-.49],[side*1.93,.47],[side*1.89,.78],[side*.7,.7]],-.025),deckMaterial));
    shipMesh.add(new THREE.Mesh(deckPanel([[side*.85,.83],[side*1.95,.91],[side*1.81,1.06],[side*.8,1.02]],-.02),darkMetal));
    const wingMark=new THREE.Mesh(new THREE.BoxGeometry(.38,.018,.055),new THREE.MeshBasicMaterial({color:0x80e6e2}));
    wingMark.position.set(side*1.5,-.005,.55);wingMark.rotation.y=side*.62;shipMesh.add(wingMark);
    const leadingEdge=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(side*.48,-.015,-.86),new THREE.Vector3(side*2.45,-.015,.75)]),new THREE.LineBasicMaterial({color:0x8cb7bd,transparent:true,opacity:.75}));
    shipMesh.add(leadingEdge);
    const finGeometry=new THREE.BufferGeometry();
    finGeometry.setAttribute('position',new THREE.Float32BufferAttribute([side*.51,.22,.7,side*.51,1.12,1.55,side*.51,.22,1.73],3));
    finGeometry.computeVertexNormals();
    shipMesh.add(new THREE.Mesh(finGeometry,wingMaterial));
    const engine=new THREE.Mesh(new THREE.CylinderGeometry(.23,.27,.92,16),darkMetal);
    engine.rotation.x=Math.PI/2;engine.position.set(side*.45,-.1,1.7);shipMesh.add(engine);
    const nacelle=new THREE.Mesh(new THREE.CylinderGeometry(.32,.34,1.12,16),deckMaterial);
    nacelle.rotation.x=Math.PI/2;nacelle.position.set(side*.45,-.1,1.55);shipMesh.add(nacelle);
    const intake=new THREE.Mesh(new THREE.TorusGeometry(.3,.035,8,24),darkMetal);
    intake.position.set(side*.45,-.1,.99);shipMesh.add(intake);
    const engineRing=new THREE.Mesh(new THREE.TorusGeometry(.23,.04,8,24),engineMaterial);
    engineRing.position.set(side*.45,-.1,2.17);shipMesh.add(engineRing);
    const exhaust=new THREE.Mesh(new THREE.CircleGeometry(.19,16),engineMaterial);
    exhaust.position.set(side*.45,-.1,2.18);shipMesh.add(exhaust);
    const engineGlow=makeGlow('106,245,237',1.25,.55);
    engineGlow.position.set(side*.45,-.1,2.23);shipMesh.add(engineGlow);
    engineGlows.push(engineGlow);
    const plume=new THREE.Mesh(
      new THREE.ConeGeometry(.16,1.25,16,1,true),
      new THREE.MeshBasicMaterial({color:0x64dfff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending})
    );
    plume.rotation.x=Math.PI/2;
    plume.position.set(side*.45,-.1,2.8);
    shipMesh.add(plume);
    boostPlumes.push(plume);
    const markerColor=side<0?0xff715e:0x8bf4cf;
    const marker=new THREE.Mesh(new THREE.SphereGeometry(.085,12,8),new THREE.MeshBasicMaterial({color:markerColor}));
    marker.position.set(side*2.34,.02,.92);shipMesh.add(marker);
    const markerGlow=makeGlow(side<0?'255,92,74':'93,245,190',.9,.65);
    markerGlow.position.copy(marker.position);shipMesh.add(markerGlow);
    const attitudeJet=makeGlow('180,225,235',.48,.5);
    attitudeJet.position.set(side*2.35,-.08,1.18);
    attitudeJet.material.opacity=0;
    shipMesh.add(attitudeJet);
    attitudeJets.push({sprite:attitudeJet,side});
  }
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.075,.03,1.5),new THREE.MeshBasicMaterial({color:0x8cf9ef}));
  stripe.position.set(0,.38,.85);shipMesh.add(stripe);
  for(const side of [-1,1]) {
    const nosePanel=new THREE.Mesh(deckPanel([[side*.12,-2.34],[side*.27,-1.94],[side*.38,-1.14],[side*.24,-1.28]],.19),deckMaterial);
    shipMesh.add(nosePanel);
  }
  const hullLight=new THREE.PointLight(0xa3e9e8,18,9,2);
  hullLight.position.set(0,.95,-.55);shipMesh.add(hullLight);
  for(const side of [-1,1]) {
    const headlamp=new THREE.Mesh(new THREE.SphereGeometry(.1,12,8),new THREE.MeshBasicMaterial({color:0xe1fbf3}));
    headlamp.position.set(side*.28,-.1,-2.48);shipMesh.add(headlamp);
    const lampGlow=makeGlow('216,255,243',1.1,.6);
    lampGlow.position.copy(headlamp.position);shipMesh.add(lampGlow);
  }
  shipMesh.scale.setScalar(1.05);
  scene.add(shipMesh);
}

function createStars() {
  const count=3000;
  const coords=new Float32Array(count*3);
  const colors=new Float32Array(count*3);
  for(let i=0;i<count;i++) {
    const z=hash(i,1)*2-1;
    const a=hash(i,2)*Math.PI*2;
    const radius=850+hash(i,3)*950;
    const k=Math.sqrt(1-z*z);
    coords[i*3]=Math.cos(a)*k*radius;
    coords[i*3+1]=z*radius;
    coords[i*3+2]=Math.sin(a)*k*radius;
    const tint=hash(i,4);
    colors[i*3]=tint>.82?1:.57+tint*.35;
    colors[i*3+1]=tint>.82?.73:.72+tint*.2;
    colors[i*3+2]=1;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(coords,3));
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));
  const material=new THREE.PointsMaterial({size:1.8,vertexColors:true,sizeAttenuation:false,transparent:true,opacity:.9,depthWrite:false});
  scene.add(new THREE.Points(geometry,material));
}

function createAsteroidBelt() {
  const variants=3;
  const countPerVariant=100;
  const dummy=new THREE.Object3D();
  const palette=[new THREE.Color(0x8b8176),new THREE.Color(0x6f7675),new THREE.Color(0xa0927e)];
  for(let variant=0;variant<variants;variant++) {
    const geometry=new THREE.DodecahedronGeometry(1,0);
    const positions=geometry.getAttribute('position');
    for(let vertex=0;vertex<positions.count;vertex++) {
      const x=positions.getX(vertex),y=positions.getY(vertex),z=positions.getZ(vertex);
      const roughness=.78+hash(Math.round(x*100),Math.round(y*100+z*100),variant+41)*.38;
      positions.setXYZ(vertex,x*roughness,y*roughness,z*roughness);
    }
    geometry.computeVertexNormals();
    const material=new THREE.MeshStandardMaterial({color:0xffffff,roughness:1,metalness:0,flatShading:true});
    const mesh=new THREE.InstancedMesh(geometry,material,countPerVariant);
    mesh.frustumCulled=false;
    const rocks=[];
    for(let i=0;i<countPerVariant;i++) {
      const index=variant*countPerVariant+i;
      const angle=hash(index,51)*Math.PI*2;
      const radius=(94+hash(index,52)*10)*worldScale;
      const altitude=(hash(index,53)-.5)*17;
      const size=index%9===0?2.1+hash(index,54)*1.7:.35+hash(index,54)*1.1;
      dummy.position.set(Math.cos(angle)*radius,altitude,Math.sin(angle)*radius);
      dummy.rotation.set(hash(index,55)*Math.PI,hash(index,56)*Math.PI*2,hash(index,57)*Math.PI);
      dummy.scale.set(size*(.75+hash(index,58)*.55),size*(.65+hash(index,59)*.6),size*(.72+hash(index,60)*.5));
      dummy.updateMatrix();
      mesh.setMatrixAt(i,dummy.matrix);
      mesh.setColorAt(i,palette[(index+variant)%palette.length]);
      const rock={
        id:index,
        position:dummy.position.clone(),
        rotation:dummy.rotation.clone(),
        scale:dummy.scale.clone(),
        spin:new THREE.Vector3((hash(index,61)-.5)*.09,(hash(index,62)-.5)*.12,(hash(index,63)-.5)*.08),
        velocity:new THREE.Vector3(),
        radius:Math.max(dummy.scale.x,dummy.scale.y,dummy.scale.z)*1.16+1.5,
        size,
        alive:true,
      };
      rocks.push(rock);
      asteroidRocks.push(rock);
      if(index%9===0)asteroidObstacles.push(rock);
    }
    mesh.instanceMatrix.needsUpdate=true;
    mesh.instanceColor.needsUpdate=true;
    scene.add(mesh);
    asteroidFields.push({mesh,rocks});
  }
  asteroidFragmentMesh=new THREE.InstancedMesh(
    new THREE.DodecahedronGeometry(1,0),
    new THREE.MeshStandardMaterial({color:0x9a9083,roughness:1,flatShading:true}),
    96,
  );
  asteroidFragmentMesh.count=0;
  asteroidFragmentMesh.frustumCulled=false;
  scene.add(asteroidFragmentMesh);
}

const asteroidDummy=new THREE.Object3D();
function updateAsteroids(dt) {
  for(const {mesh,rocks} of asteroidFields) {
    rocks.forEach((rock,index)=>{
      if(!rock.alive){asteroidDummy.scale.setScalar(0);asteroidDummy.updateMatrix();mesh.setMatrixAt(index,asteroidDummy.matrix);return;}
      rock.position.addScaledVector(rock.velocity,dt);
      if(!reducedMotion.matches){
        rock.rotation.x+=rock.spin.x*dt;
        rock.rotation.y+=rock.spin.y*dt;
        rock.rotation.z+=rock.spin.z*dt;
      }
      asteroidDummy.position.copy(rock.position);
      asteroidDummy.rotation.copy(rock.rotation);
      asteroidDummy.scale.copy(rock.scale);
      asteroidDummy.updateMatrix();
      mesh.setMatrixAt(index,asteroidDummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate=true;
  }
  for(let index=asteroidFragments.length-1;index>=0;index--){
    const fragment=asteroidFragments[index];
    fragment.life-=dt;
    if(fragment.life<=0){asteroidFragments.splice(index,1);continue;}
    fragment.position.addScaledVector(fragment.velocity,dt);
    fragment.rotation.addScaledVector(fragment.spin,dt);
  }
  asteroidFragments.forEach((fragment,index)=>{
    asteroidDummy.position.copy(fragment.position);
    asteroidDummy.rotation.set(fragment.rotation.x,fragment.rotation.y,fragment.rotation.z);
    asteroidDummy.scale.setScalar(fragment.size*Math.min(1,fragment.life/.5));
    asteroidDummy.updateMatrix();
    asteroidFragmentMesh.setMatrixAt(index,asteroidDummy.matrix);
  });
  asteroidFragmentMesh.count=asteroidFragments.length;
  asteroidFragmentMesh.instanceMatrix.needsUpdate=true;
}

function breakAsteroid(rock,impactSpeed) {
  rock.alive=false;
  for(let piece=0;piece<7;piece++) {
    const azimuth=hash(rock.id,piece+72)*Math.PI*2;
    const rise=hash(rock.id,piece+84)*2-1;
    const spread=Math.sqrt(1-rise*rise);
    const outward=new THREE.Vector3(Math.cos(azimuth)*spread,rise,Math.sin(azimuth)*spread);
    asteroidFragments.push({
      position:rock.position.clone(),
      velocity:outward.multiplyScalar(2+impactSpeed*.16).addScaledVector(velocity,.22),
      rotation:new THREE.Vector3(),
      spin:new THREE.Vector3((hash(rock.id,piece+96)-.5)*3,(hash(rock.id,piece+108)-.5)*3,(hash(rock.id,piece+120)-.5)*3),
      size:rock.size*(.12+hash(rock.id,piece+132)*.15),
      life:1.8+hash(rock.id,piece+144)*1.1,
    });
  }
  if(asteroidFragments.length>96)asteroidFragments.splice(0,asteroidFragments.length-96);
}

function hitAsteroid(rock,next) {
  const normal=next.clone().sub(rock.position).normalize();
  if(normal.lengthSq()===0)normal.copy(velocity).negate().normalize();
  const impactSpeed=Math.max(0,-velocity.clone().sub(rock.velocity).dot(normal));
  if(impactSpeed<.2)return false;
  if(rock.size<1.6 || (rock.size<3 && impactSpeed>28)){
    breakAsteroid(rock,impactSpeed);
    shipAudio.asteroidImpact(true,impactSpeed,rock.size);
    logAsteroidEncounter(rock,true,impactSpeed);
    velocity.multiplyScalar(.8);
    return false;
  }
  shipAudio.asteroidImpact(false,impactSpeed);
  logAsteroidEncounter(rock,false,impactSpeed);
  rock.velocity.addScaledVector(normal,-Math.min(impactSpeed*.24,10));
  rock.spin.add(new THREE.Vector3(normal.z,-normal.x,normal.y).multiplyScalar(Math.min(impactSpeed*.018,.55)));
  rock.position.addScaledVector(normal,-Math.max(.2,rock.radius-shipPosition.distanceTo(rock.position)+.2));
  velocity.addScaledVector(normal,-1.35*velocity.dot(normal)).multiplyScalar(.45);
  if(autopilotTarget)stopAutopilot('Asteroid impact. Manual control restored.');
  return true;
}

function logAsteroidEncounter(rock,broken,speed) {
  if(introActive||speed<2||clock.elapsedTime-(rock.lastLoggedImpactAt??-Infinity)<1.2)return;
  rock.lastLoggedImpactAt=clock.elapsedTime;
  recordLog('impact',null,{broken,speed:Math.round(speed),source:rock.origin||'belt'});
}

function updateIdleShip(elapsed,dt) {
  const idle=!introActive&&!introDive&&!returningToIntro&&!previewTarget&&!autopilotTarget&&velocity.lengthSq()<.04&&keys.size===0;
  idleMotion=THREE.MathUtils.damp(idleMotion,idle&&!reducedMotion.matches?1:0,2.3,dt);
  const cycle=Math.floor(elapsed/6);
  const phase=elapsed-cycle*6;
  const pulseAt=1+hash(cycle,65)*3;
  const pulse=Math.exp(-(((phase-pulseAt)/.16)**2))*idleMotion;
  const activeSide=hash(cycle,66)>.5?1:-1;
  if(idleMotion>.001){
    const idleRoll=(Math.sin(elapsed*.58)*.012+Math.sin(elapsed*.23)*.006+activeSide*pulse*.004)*idleMotion;
    const idlePitch=Math.sin(elapsed*.43+.7)*.006*idleMotion;
    shipMesh.rotation.z+=idleRoll;
    shipMesh.rotation.x+=idlePitch;
    if(cameraMode==='first-person'&&!previewTarget){
      camera.rotateZ(idleRoll*.4);
      camera.rotateX(idlePitch*.4);
    }
  }
  attitudeJets.forEach(({sprite,side})=>{
    sprite.material.opacity=side===activeSide?pulse*.65:0;
  });
}

function createSolarSystem() {
  createStars();
  scene.add(new THREE.AmbientLight(0xb5d0e8, .42));
  const sunlight=new THREE.PointLight(0xffe6bc,2300,0,1.05);
  sunlight.position.set(0,0,0);scene.add(sunlight);
  const sunSurface=surfaceTexture(sunData);
  planetSurfaces.set('sun',sunSurface.image);
  sunMesh=new THREE.Mesh(new THREE.SphereGeometry(sunRadius,64,40),new THREE.MeshBasicMaterial({map:sunSurface,toneMapped:false}));
  sunMesh.userData.id='sun';sunMesh.userData.name='Sun';sunMesh.userData.radius=sunRadius;
  scene.add(sunMesh);clickableMeshes.push(sunMesh);
  scene.add(makeGlow('255,151,59',175,.4));
  scene.add(makeGlow('255,207,112',90,.48));
  const asteroidPositions=[];
  for(let i=0;i<650;i++) {
    const angle=hash(i,5)*Math.PI*2;
    const radius=(94+hash(i,6)*10)*worldScale;
    asteroidPositions.push(Math.cos(angle)*radius,(hash(i,7)-.5)*3,Math.sin(angle)*radius);
  }
  const asteroidGeo=new THREE.BufferGeometry();asteroidGeo.setAttribute('position',new THREE.Float32BufferAttribute(asteroidPositions,3));
  scene.add(new THREE.Points(asteroidGeo,new THREE.PointsMaterial({color:0x8b958f,size:.4,transparent:true,opacity:.6})));
  createAsteroidBelt();
  planets.forEach((planet)=>{
    makeOrbit(planet.orbit*worldScale);
    const group=new THREE.Group();
    const surface=surfaceTexture(planet);
    planetSurfaces.set(planet.id,surface.image);
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(planet.radius,80,56),new THREE.MeshStandardMaterial({map:surface,bumpMap:['mercury','venus','earth','mars'].includes(planet.id)?surface:null,bumpScale:planet.radius*.025,roughness:1,metalness:0,emissive:new THREE.Color(planet.color),emissiveIntensity:.018}));
    mesh.rotation.z=planet.id==='uranus'?1.65:.1;
    mesh.userData.name=planet.name;
    mesh.userData.id=planet.id;
    mesh.userData.radius=planet.radius;
    group.add(mesh);
    let clouds=null;
    if(planet.id==='earth') {
      clouds=new THREE.Mesh(new THREE.SphereGeometry(planet.radius*1.018,80,56),new THREE.MeshStandardMaterial({map:earthCloudTexture(),transparent:true,depthWrite:false,roughness:1,opacity:.86}));
      group.add(clouds);
      const air=new THREE.Mesh(new THREE.SphereGeometry(planet.radius*1.065,48,32),new THREE.MeshBasicMaterial({color:0x83cef7,transparent:true,opacity:.07,side:THREE.BackSide,depthWrite:false}));
      group.add(air);
      group.add(makeGlow('66,147,231',planet.radius*4.5,.17));
      const lunarOrbit=new THREE.Mesh(new THREE.RingGeometry(moonOrbitRadius-.02,moonOrbitRadius+.02,128),new THREE.MeshBasicMaterial({color:0x76909b,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));
      lunarOrbit.rotation.x=-Math.PI/2;group.add(lunarOrbit);
    }
    if(planet.id==='saturn') makeSaturnRings(group,planet.radius);
    if(planet.id==='uranus') makeRings(group,planet.radius*1.35,planet.radius*1.75);
    group.position.set(Math.cos(planet.angle)*planet.orbit*worldScale,0,Math.sin(planet.angle)*planet.orbit*worldScale);
    scene.add(group);
    bodies.push({data:planet,group,mesh,clouds});
    clickableMeshes.push(mesh);
    if(planet.id==='earth') {
      const moonGroup=new THREE.Group();
      const moonSurface=surfaceTexture(moonData);
      planetSurfaces.set(moonData.id,moonSurface.image);
      const moonMesh=new THREE.Mesh(new THREE.SphereGeometry(moonData.radius,40,28),new THREE.MeshStandardMaterial({map:moonSurface,roughness:1}));
      moonMesh.userData.name='Moon';moonMesh.userData.id='moon';moonMesh.userData.radius=moonData.radius;
      moonGroup.add(moonMesh);
      moonGroup.position.copy(group.position).add(new THREE.Vector3(moonOrbitRadius,0,0));
      scene.add(moonGroup);
      moonBody={data:moonData,group:moonGroup,mesh:moonMesh};
      bodies.push(moonBody);
      clickableMeshes.push(moonMesh);
    }
  });
  const cometGroup=new THREE.Group();
  const cometSurface=surfaceTexture(cometData);
  planetSurfaces.set('comet',cometSurface.image);
  const nucleusGeometry=new THREE.IcosahedronGeometry(cometData.radius,2);
  const vertices=nucleusGeometry.getAttribute('position');
  for(let i=0;i<vertices.count;i++){
    const x=vertices.getX(i),y=vertices.getY(i),z=vertices.getZ(i);
    const relief=1+.14*Math.sin(x*2.7+y*1.9+z*.8)*Math.cos(z*2.2-x*1.3);
    vertices.setXYZ(i,x*relief,y*relief,z*relief);
  }
  nucleusGeometry.computeVertexNormals();
  const nucleus=new THREE.Mesh(nucleusGeometry,new THREE.MeshStandardMaterial({map:cometSurface,bumpMap:cometSurface,bumpScale:.13,roughness:1}));
  cometGroup.add(nucleus);
  cometComa=makeGlow('205,224,229',21,.38);
  cometGroup.add(cometComa);
  const hit=new THREE.Mesh(new THREE.SphereGeometry(10,16,12),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));
  hit.userData={id:'comet',name:'Comet',radius:cometData.radius};
  cometGroup.add(hit);clickableMeshes.push(hit);
  const tailGeometry=new THREE.BufferGeometry();
  cometTailPositions=new Float32Array(210*3);
  tailGeometry.setAttribute('position',new THREE.BufferAttribute(cometTailPositions,3));
  cometTail=new THREE.Points(tailGeometry,new THREE.PointsMaterial({color:0xd7e3e5,size:2.1,sizeAttenuation:false,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending}));
  cometGroup.add(cometTail);
  scene.add(cometGroup);
  cometBody={data:cometData,group:cometGroup,mesh:nucleus};
  bodies.push(cometBody);
  updateComet(0);
}

function updateComet(dt) {
  if(!cometBody)return;
  const orbit=cometPosition(Date.now()/1000);
  cometBody.group.position.set(orbit.x,orbit.y,orbit.z);
  cometBody.mesh.rotation.y+=dt*.16;
  cometComa.material.opacity=.12+orbit.activity*.72;
  cometComa.scale.setScalar(11+orbit.activity*25);
  cometTail.material.opacity=orbit.activity*.68;
  const outward=cometBody.group.position.clone().normalize();
  const across=new THREE.Vector3().crossVectors(outward,worldUp).normalize();
  const above=new THREE.Vector3().crossVectors(outward,across).normalize();
  for(let i=0;i<210;i++){
    const phase=hash(i,57),distance=(5+phase*135)*orbit.activity;
    const spread=(.3+phase*8)*Math.sqrt(orbit.activity);
    const angle=hash(i,58)*Math.PI*2;
    const offset=i*3;
    cometTailPositions[offset]=outward.x*distance+across.x*Math.cos(angle)*spread+above.x*Math.sin(angle)*spread;
    cometTailPositions[offset+1]=outward.y*distance+across.y*Math.cos(angle)*spread+above.y*Math.sin(angle)*spread;
    cometTailPositions[offset+2]=outward.z*distance+across.z*Math.cos(angle)*spread+above.z*Math.sin(angle)*spread;
  }
  cometTail.geometry.attributes.position.needsUpdate=true;
  cometTail.geometry.computeBoundingSphere();
}

function lookAtPoint(point) {
  direction.copy(point).sub(shipPosition).normalize();
  yaw=Math.atan2(-direction.x,-direction.z);
  pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));
  targetYaw=yaw;
  targetPitch=pitch;
}

function setupStart() {
  const earth=bodies.find(b=>b.data.id==='earth');
  shipPosition.copy(earth.group.position).add(new THREE.Vector3(10,4,18));
  lookAtPoint(earth.group.position);
  updateCamera(0,true);
  camera.fov=52;
  camera.updateProjectionMatrix();
}

function introShot(elapsed) {
  const earth=bodies.find(body=>body.data.id==='earth').group.position;
  const angle=introOrbitAngle+elapsed*.055;
  const shipPosition=new THREE.Vector3(earth.x+Math.cos(angle)*introOrbitRadius,earth.y+4+Math.sin(elapsed*.35)*.35,earth.z+Math.sin(angle)*introOrbitRadius);
  const shipQuaternion=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.sin(elapsed*.32)*.025,Math.PI-angle,Math.sin(elapsed*.48)*.04,'YXZ'));
  const cameraPosition=earth.clone().add(new THREE.Vector3(22+Math.sin(elapsed*.14)*1.5,13+Math.sin(elapsed*.2)*.6,38+Math.cos(elapsed*.14)*1.5));
  const cameraTarget=earth.clone().lerp(shipPosition,.64);
  return {shipPosition,shipQuaternion,cameraPosition,cameraTarget};
}

function updateIntroFlight() {
  const shot=introShot(clock.elapsedTime);
  shipMesh.position.copy(shot.shipPosition);
  shipMesh.quaternion.copy(shot.shipQuaternion);
  shipMesh.visible=true;
  camera.position.copy(shot.cameraPosition);
  camera.lookAt(shot.cameraTarget);
}

function startGame(discoveryStart=false) {
  if(!introActive||discoveryLaunchPending)return;
  const overlay=document.querySelector('#introOverlay');
  if(discoveryStart){
    discoveryLaunchPending=true;
    const curtain=document.querySelector('#sceneCurtain');
    curtain.classList.add('covered');
    introHideTimer=window.setTimeout(()=>{
      introHideTimer=null;
      shipPosition.copy(discoveryStartPosition);
      yaw=targetYaw=0;
      pitch=targetPitch=bank=0;
      velocity.set(0,0,0);
      boostAmount=0;
      discoveryDrift=!reducedMotion.matches;
      cameraMode='chase';
      introActive=false;
      discoveryLaunchPending=false;
      introDive=false;
      launchTransition=null;
      cameraTransition=null;
      keys.clear();
      try{sessionStorage.setItem('odyssey-flight-active','yes');}catch{}
      overlay.hidden=true;
      document.querySelector('#app').classList.remove('intro-mode','launching');
      updateCamera(0,true);
      saveFlightState();
      shipAudio.start();
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        curtain.classList.remove('covered');
        canvas.focus({preventScroll:true});
      }));
    },reducedMotion.matches?80:250);
    return;
  }
  discoveryDrift=false;
  shipPosition.copy(shipMesh.position);
  yaw=targetYaw=shipMesh.rotation.y;
  pitch=shipMesh.rotation.x;
  targetPitch=0;
  bank=shipMesh.rotation.z;
  introDive=!reducedMotion.matches;
  if(introDive){
    launchTransition={
      startOffset:camera.position.clone().sub(shipPosition),
      startFocus:introShot(clock.elapsedTime).cameraTarget,
      startFov:camera.fov,
      elapsed:0,
      duration:1.9,
    };
  }
  introActive=false;
  try{sessionStorage.setItem('odyssey-flight-active','yes');}catch{}
  saveFlightState();
  keys.clear();
  shipAudio.start();
  document.querySelector('#app').classList.remove('intro-mode');
  document.querySelector('#app').classList.toggle('launching',introDive);
  overlay.classList.add('leaving');
  updateCamera(0,reducedMotion.matches);
  introHideTimer=window.setTimeout(()=>{overlay.hidden=true;canvas.focus({preventScroll:true});introHideTimer=null;},reducedMotion.matches?0:850);
}

function returnToIntro() {
  if(returningToIntro)return;
  flybyTracker.clear();
  suppressedFlybyWorlds.clear();
  endUnlockCinematic(true);
  saveFlightState();
  returningToIntro=true;
  keys.clear();
  const curtain=document.querySelector('#sceneCurtain');
  curtain.classList.add('covered');
  window.setTimeout(()=>{
    try{sessionStorage.removeItem('odyssey-flight-active');sessionStorage.removeItem('odyssey-flight-state');}catch{}
    if(introHideTimer!==null){window.clearTimeout(introHideTimer);introHideTimer=null;}
    document.querySelector('#exitOverlay').hidden=true;
    document.querySelector('#settingsOverlay').hidden=true;
    document.querySelector('#helpOverlay').hidden=true;
    document.querySelector('#logOverlay').hidden=true;
    document.querySelector('#voyageOverlay').hidden=true;
    document.querySelector('#photoViewer').hidden=true;
    document.querySelector('#photoFeedback').hidden=true;
    photoPending=false;
    document.querySelector('#previewBanner').hidden=true;
    const app=document.querySelector('#app');
    app.classList.remove('destination-preview','autopilot-active','launching');
    app.classList.add('intro-mode','camera-chase');
    const overlay=document.querySelector('#introOverlay');
    overlay.classList.remove('leaving');
    overlay.hidden=false;
    introActive=true;
    introDive=false;
    discoveryLaunchPending=false;
    discoveryDrift=false;
    cameraTransition=null;
    launchTransition=null;
    previewTarget=null;
    previewOrbitAngle=previewOrbitTargetAngle=0;
    arrivalPreview=false;
    parkedTarget=null;
    autopilotTarget=null;
    autopilotWaypoint=null;
    autopilotMessage='Manual flight';
    velocity.set(0,0,0);
    boostAmount=0;
    bank=0;
    cameraMode='chase';
    document.querySelectorAll('[data-camera]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.camera==='chase'?'true':'false'));
    setDiscoveryOpen(false);
    setGuideHidden(true);
    selectPlanet('earth');
    updateDiscoveryChoice();
    updateAutopilotUI();
    camera.fov=52;
    camera.updateProjectionMatrix();
    updateIntroFlight();
    exitFromSettings=false;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      curtain.classList.remove('covered');
      returningToIntro=false;
      (gameMode==='discovery'&&!document.querySelector('#resumeGameButton').disabled
        ?document.querySelector('#resumeGameButton')
        :gameMode==='discovery'?document.querySelector('#newGameButton'):document.querySelector('#playButton')).focus({preventScroll:true});
    }));
  },reducedMotion.matches?80:250);
}

function saveFlightState() {
  if(introActive)return;
  try {
    if(sessionStorage.getItem('odyssey-flight-active')!=='yes')return;
    const state=JSON.stringify({
      position:shipPosition.toArray(),yaw,pitch,cameraMode,selectedId,discoveryDrift,
      autopilotId:autopilotTarget?.data.id??null,
      parkedPreviewId:arrivalPreview?previewTarget?.data.id??null:null,
      parkedOffset:arrivalPreview?parkedOffset.toArray():null,
      previewOrbitAngle:arrivalPreview?previewOrbitTargetAngle:0,
      discoveryOpen:!document.querySelector('#discoveryPanel').hidden,
      guideOpen:!guideHidden,
    });
    sessionStorage.setItem('odyssey-flight-state',state);
    if(gameMode==='discovery')localStorage.setItem('odyssey-discovery-flight',state);
  } catch {}
}

function restoreFlightState(savedState=null) {
  try {
    const state=savedState??JSON.parse(sessionStorage.getItem('odyssey-flight-state')||'null');
    if(!state||!Array.isArray(state.position)||state.position.length!==3||!state.position.every(Number.isFinite)||!Number.isFinite(state.yaw)||!Number.isFinite(state.pitch))return false;
    shipPosition.fromArray(state.position);
    yaw=targetYaw=state.yaw;
    pitch=targetPitch=THREE.MathUtils.clamp(state.pitch,-maxAutopilotPitch,maxAutopilotPitch);
    bank=0;
    velocity.set(0,0,0);
    discoveryDrift=gameMode==='discovery'&&state.discoveryDrift===true&&!reducedMotion.matches;
    cameraMode=state.cameraMode==='first-person'?'first-person':'chase';
    document.querySelector('#app').classList.toggle('camera-chase',cameraMode==='chase');
    document.querySelectorAll('[data-camera]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.camera===cameraMode?'true':'false'));
    if(destinations.some(planet=>planet.id===state.selectedId))selectPlanet(state.selectedId);
    if(state.autopilotId&&state.autopilotId!=='sun'&&!isWorldLocked(state.autopilotId)&&destinations.some(planet=>planet.id===state.autopilotId)){
      autopilotTarget=bodies.find(body=>body.data.id===state.autopilotId);
      if(autopilotTarget){
        autopilotWaypoint=null;
        autopilotMessage=`Course set for ${autopilotTarget.data.name}`;
        updateAutopilotUI();
      }
    }
    if(state.parkedPreviewId&&Array.isArray(state.parkedOffset)&&state.parkedOffset.length===3&&state.parkedOffset.every(Number.isFinite)){
      const body=bodies.find(item=>item.data.id===state.parkedPreviewId);
      if(body&&!isWorldLocked(body.data.id)){
        arrivalPreview=true;
        parkedTarget=body;
        suppressedFlybyWorlds.add(body.data.id);
        parkedOffset.fromArray(state.parkedOffset);
        shipPosition.copy(body.group.position).add(parkedOffset);
        previewTarget=body;
        previewOrbitAngle=previewOrbitTargetAngle=Number.isFinite(state.previewOrbitAngle)?state.previewOrbitAngle:0;
        document.querySelector('#previewName').textContent=`${body.data.name.toUpperCase()} / PREVIEW`;
        document.querySelector('#previewBanner').hidden=false;
        document.querySelector('#app').classList.add('destination-preview');
      }
    }
    if(state.discoveryOpen)setDiscoveryOpen(true);
    if(state.guideOpen)showGuide();
    return true;
  } catch {return false;}
}

function savedDiscoveryFlight() {
  try {
    const state=JSON.parse(localStorage.getItem('odyssey-discovery-flight')||'null');
    return state&&Array.isArray(state.position)&&state.position.length===3&&state.position.every(Number.isFinite)&&Number.isFinite(state.yaw)&&Number.isFinite(state.pitch)?state:null;
  } catch {return null;}
}

function updateDiscoveryChoice() {
  const discoveryMode=gameMode==='discovery';
  document.querySelector('#playButton').hidden=discoveryMode;
  document.querySelector('#discoveryChoice').hidden=!discoveryMode;
  const hasSave=Boolean(savedDiscoveryFlight())||scannedBodies.size>0;
  document.querySelector('#resumeGameButton').disabled=!hasSave;
  document.querySelector('#discoverySaveStatus').textContent=hasSave
    ?`${scannedBodies.size} of ${destinations.length} discoveries recorded. Resume your voyage or start again.`
    :'No saved voyage yet. Start a new game to begin scanning.';
}

function startNewDiscoveryGame() {
  scannedBodies.clear();
  scannedLandmarks.clear();
  captainLog=[];
  pendingLogSnapshots=[];
  photos=[];
  photoPending=false;
  flybyTracker.clear();
  suppressedFlybyWorlds.clear();
  asteroidRocks.forEach(rock=>{delete rock.lastLoggedImpactAt;});
  renderCaptainLog();
  renderPhotoGallery();
  scanSeconds=0;scanTargetId=null;scanResultUntil=0;
  document.querySelector('#scanFeedback').hidden=true;
  try {
    localStorage.removeItem('odyssey-scanned-worlds');
    localStorage.removeItem('odyssey-discovery-flight');
    localStorage.removeItem('odyssey-discovery-log');
    localStorage.removeItem('odyssey-discovery-landmarks');
    localStorage.removeItem('odyssey-discovery-photos');
    sessionStorage.removeItem('odyssey-flight-state');
  } catch {}
  setDiscoveryOpen(false);
  setGuideHidden(true);
  refreshDiscoveryUI();
  startGame(true);
}

function resumeDiscoveryGame() {
  if(!introActive)return;
  const saved=savedDiscoveryFlight();
  if(!saved){startGame(true);return;}
  const curtain=document.querySelector('#sceneCurtain');
  curtain.classList.add('covered');
  window.setTimeout(()=>{
    if(!introActive)return;
    if(!restoreFlightState(saved)){
      curtain.classList.remove('covered');
      updateDiscoveryChoice();
      return;
    }
    introActive=false;
    introDive=false;
    launchTransition=null;
    cameraTransition=null;
    keys.clear();
    try{sessionStorage.setItem('odyssey-flight-active','yes');}catch{}
    shipAudio.start();
    document.querySelector('#introOverlay').hidden=true;
    document.querySelector('#app').classList.remove('intro-mode','launching');
    updateCamera(0,true);
    saveFlightState();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      curtain.classList.remove('covered');
      canvas.focus({preventScroll:true});
    }));
  },reducedMotion.matches?80:250);
}

function setupIntro() {
  document.querySelector('#playButton').addEventListener('click',()=>startGame());
  document.querySelector('#newGameButton').addEventListener('click',startNewDiscoveryGame);
  document.querySelector('#resumeGameButton').addEventListener('click',resumeDiscoveryGame);
  try {
    if(sessionStorage.getItem('odyssey-flight-active')==='yes'&&restoreFlightState()) {
      introActive=false;
      document.querySelector('#introOverlay').hidden=true;
      document.querySelector('#app').classList.remove('intro-mode');
      updateCamera(0,true);
      return;
    }
  } catch {}
}

function isWorldLocked(id) {
  return gameMode==='discovery'&&!scannedBodies.has(id);
}

function setGameMode(mode,save=true) {
  gameMode=mode==='exploration'?'exploration':'discovery';
  document.querySelector('#app').classList.toggle('exploration-mode',gameMode==='exploration');
  loadCaptainLog();
  loadPhotos();
  loadLandmarks();
  renderVoyages();
  document.querySelectorAll('[data-mode]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.mode===gameMode?'true':'false'));
  refreshDiscoveryUI();
  if(isWorldLocked(selectedId)){
    setDiscoveryOpen(false);
    setGuideHidden(true);
  }
  updateAutopilotUI();
  updateDiscoveryChoice();
  if(save)try{localStorage.setItem('odyssey-flight-mode',gameMode);}catch{}
}

function setupGameModes() {
  let saved='discovery';
  try{saved=localStorage.getItem('odyssey-flight-mode')==='exploration'?'exploration':'discovery';}catch{}
  document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setGameMode(button.dataset.mode)));
  setGameMode(saved,false);
}

function setupDestinationToggle() {
  const button=document.querySelector('#destinationsToggle');
  const close=document.querySelector('#destinationsClose');
  const panel=document.querySelector('.destination-panel');
  let hidden=false;
  try{hidden=localStorage.getItem('odyssey-hide-destinations')==='yes';}catch{}
  function applyHidden() {
    const hadFocus=panel.contains(document.activeElement);
    document.querySelector('#app').classList.toggle('destinations-hidden',hidden);
    panel.inert=hidden;
    panel.setAttribute('aria-hidden',hidden?'true':'false');
    button.setAttribute('aria-expanded',hidden?'false':'true');
    button.hidden=!hidden;
    if(hidden&&hadFocus)button.focus({preventScroll:true});
    try{localStorage.setItem('odyssey-hide-destinations',hidden?'yes':'no');}catch{}
  }
  button.addEventListener('click',()=>{hidden=false;applyHidden();});
  close.addEventListener('click',()=>{hidden=true;applyHidden();});
  applyHidden();
}

let guideHidden=true;

function setGuideHidden(hidden) {
  guideHidden=hidden;
  const panel=document.querySelector('#fieldGuide');
  const hadFocus=panel.contains(document.activeElement);
  document.querySelector('#app').classList.toggle('guide-hidden',hidden);
  panel.inert=hidden;
  panel.setAttribute('aria-hidden',hidden?'true':'false');
  if(hidden&&hadFocus)document.querySelector('#settingsButton').focus({preventScroll:true});
}

function showGuide() {
  if(isWorldLocked(selectedId))return;
  setGuideHidden(false);
}

function setupGuideToggle() {
  setGuideHidden(true);
  document.querySelector('#guideClose').addEventListener('click',()=>setGuideHidden(true));
}

function pointedPlanet() {
  if(previewTarget)return null;
  const reticle=document.querySelector('#crosshair').getBoundingClientRect();
  const bounds=canvas.getBoundingClientRect();
  reticlePosition.set((reticle.left+reticle.width/2-bounds.left)/bounds.width*2-1,1-(reticle.top+reticle.height/2-bounds.top)/bounds.height*2);
  raycaster.setFromCamera(reticlePosition,camera);
  const hit=raycaster.intersectObjects(clickableMeshes,false).find(item=>item.distance<2000);
  return destinations.some(planet=>planet.id===hit?.object.userData.id)?hit:null;
}

function pointedLandmark(worldHit=pointedPlanet()) {
  if(previewTarget)return null;
  const surfaceId=worldHit?.object.userData.id;
  if(surfaceId&&worldHit.uv){
    const landmark=surfaceLandmarkAt(surfaceId,worldHit.uv.x,worldHit.uv.y);
    if(landmark&&!isWorldLocked(landmark.worldId))return {landmark,hit:worldHit};
  }
  const ringHit=raycaster.intersectObjects(landmarkMeshes,false).find(hit=>hit.distance<2000&&(!worldHit||hit.distance<worldHit.distance));
  const landmark=landmarks.find(item=>item.id===ringHit?.object.userData.landmarkId);
  return landmark&&!isWorldLocked(landmark.worldId)?{landmark,hit:ringHit}:null;
}

function beginCameraTransition(duration=1.2) {
  if(reducedMotion.matches){cameraTransition=null;return;}
  cameraTransition={position:camera.position.clone(),quaternion:camera.quaternion.clone(),elapsed:0,duration};
}

function applyCameraTransition(dt) {
  if(!cameraTransition)return;
  cameraTransition.elapsed=Math.min(cameraTransition.duration,cameraTransition.elapsed+dt);
  const t=cameraTransition.elapsed/cameraTransition.duration;
  const eased=t*t*(3-2*t);
  const destinationPosition=camera.position.clone();
  const destinationQuaternion=camera.quaternion.clone();
  camera.position.lerpVectors(cameraTransition.position,destinationPosition,eased);
  camera.quaternion.slerpQuaternions(cameraTransition.quaternion,destinationQuaternion,eased);
  if(t===1){cameraTransition=null;introDive=false;document.querySelector('#app').classList.remove('launching');}
}

function updateCamera(dt,instant=false) {
  if(introActive){updateIntroFlight();return;}
  if(launchTransition){
    const transition=launchTransition;
    transition.elapsed=Math.min(transition.duration,transition.elapsed+dt);
    const t=transition.elapsed/transition.duration;
    const eased=t*t*(3-2*t);
    const endDirection=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
    const endPosition=shipPosition.clone().addScaledVector(endDirection,-8.5);
    endPosition.y+=3.2;
    const startDirection=transition.startOffset.clone().normalize();
    const finalOffset=endPosition.clone().sub(shipPosition);
    const arc=new THREE.Quaternion().setFromUnitVectors(startDirection,finalOffset.clone().normalize());
    const turn=new THREE.Quaternion().identity().slerp(arc,eased);
    const distance=THREE.MathUtils.lerp(transition.startOffset.length(),finalOffset.length(),eased);
    camera.position.copy(shipPosition).add(startDirection.applyQuaternion(turn).multiplyScalar(distance));
    const endFocus=shipPosition.clone().addScaledVector(endDirection,3);
    camera.lookAt(transition.startFocus.clone().lerp(endFocus,eased));
    camera.fov=THREE.MathUtils.lerp(transition.startFov,64,eased);
    camera.updateProjectionMatrix();
    shipMesh.visible=true;
    if(t===1){
      launchTransition=null;
      introDive=false;
      document.querySelector('#app').classList.remove('launching');
    }
    return;
  }
  unlockLens=THREE.MathUtils.damp(unlockLens,unlockCinematicActive&&!reducedMotion.matches?1:0,unlockCinematicActive?2.5:4,dt);
  const targetFov=(previewTarget?53:cameraMode==='first-person'?72+(reducedMotion.matches?0:boostAmount*3):64+(reducedMotion.matches?0:boostAmount*4))-unlockLens*5;
  const nextFov=instant?targetFov:THREE.MathUtils.damp(camera.fov,targetFov,5,dt);
  if(Math.abs(camera.fov-nextFov)>.005){camera.fov=nextFov;camera.updateProjectionMatrix();}
  engineGlows.forEach(glow=>{
    const size=1.25+boostAmount*1.1;
    glow.scale.set(size,size,1);
    glow.material.opacity=.75+boostAmount*.25;
  });
  boostPlumes.forEach(plume=>{
    plume.material.opacity=boostAmount*.7;
    plume.scale.setScalar(.7+boostAmount*.55);
  });
  shipRotation.set(pitch,yaw,bank,'YXZ');
  direction.set(0,0,-1).applyEuler(shipRotation);
  shipMesh.position.copy(shipPosition);
  shipMesh.rotation.copy(shipRotation);
  const cameraDistance=camera.position.distanceTo(shipPosition);
  shipMesh.visible=cameraTransition?cameraDistance>5:cameraMode!=='first-person';
  if(previewTarget) {
    const center=previewTarget.group.position;
    const radius=previewTarget.data.radius;
    previewOrbitAngle=reducedMotion.matches?previewOrbitTargetAngle:THREE.MathUtils.damp(previewOrbitAngle,previewOrbitTargetAngle,5,dt);
    const sunward=previewTarget.data.id==='sun'
      ?shipPosition.clone().normalize()
      :previewTarget.data.id==='moon'
        ?center.clone().sub(bodies.find(body=>body.data.id==='earth').group.position).normalize()
        :center.clone().multiplyScalar(-1).normalize();
    sunward.applyAxisAngle(worldUp,previewOrbitAngle);
    const viewPosition=center.clone().addScaledVector(sunward,radius*2.8+6).add(new THREE.Vector3(0,radius*.55+2,0));
    camera.position.copy(viewPosition);
    camera.lookAt(center);
    applyCameraTransition(dt);
    return;
  }
  if(cameraMode==='first-person') {
    camera.position.copy(shipPosition);
    camera.rotation.set(pitch,yaw,reducedMotion.matches?0:bank*.28,'YXZ');
    applyCameraTransition(dt);
    return;
  }
  const targetPosition=shipPosition.clone();
  levelDirection.set(-Math.sin(yaw),0,-Math.cos(yaw));
  targetPosition.addScaledVector(levelDirection,-8.5).y+=3.2;
  if(instant || cameraTransition || camera.position.distanceToSquared(targetPosition)>2500)camera.position.copy(targetPosition);
  else camera.position.lerp(targetPosition,1-Math.exp(-9*dt));
  camera.lookAt(temp.copy(shipPosition).addScaledVector(levelDirection,3));
  if(!reducedMotion.matches)camera.rotateZ(bank*.13);
  applyCameraTransition(dt);
}

function setCameraMode(mode) {
  if(!['first-person','chase'].includes(mode))return;
  exitPreview();
  beginCameraTransition(.95);
  cameraMode=mode;
  document.querySelector('#app').classList.toggle('camera-chase',mode==='chase');
  document.querySelectorAll('[data-camera]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.camera===mode?'true':'false'));
  updateCamera(0);
}

function createPlanetIcon(planet) {
  const icon=document.createElement('canvas');
  icon.className='planet-mini';
  icon.width=96;icon.height=72;
  icon.setAttribute('aria-hidden','true');
  const ctx=icon.getContext('2d');
  const source=planetSurfaces.get(planet.id);
  if(!source)return icon;
  const sourceCtx=source.getContext('2d');
  const pixels=sourceCtx.getImageData(0,0,source.width,source.height).data;
  const cx=48,cy=36,radius=28;
  const ringed=planet.id==='saturn'||planet.id==='uranus';
  const ringAngle=planet.id==='uranus'?-1.2:-.32;
  const drawRings=(front)=>{
    const bands=planet.id==='saturn'
      ? [[44,10.5,3.5,'#e7d7ad'],[38,8.4,2,'#aa9271'],[33,6.8,1.2,'#f2e5c8']]
      : [[39,9,2.6,'#bad4cf'],[34,7.8,1.2,'#789fa8']];
    for(const [rx,ry,width,color] of bands){
      ctx.beginPath();
      ctx.ellipse(cx,cy,rx,ry,ringAngle,front?0:Math.PI,front?Math.PI:Math.PI*2);
      ctx.strokeStyle=color;ctx.globalAlpha=front?.85:.58;ctx.lineWidth=width;ctx.stroke();
    }
    ctx.globalAlpha=1;
  };
  const discCanvas=document.createElement('canvas');
  discCanvas.width=icon.width;discCanvas.height=icon.height;
  const discCtx=discCanvas.getContext('2d');
  const disc=discCtx.createImageData(icon.width,icon.height);
  for(let y=cy-radius-1;y<=cy+radius+1;y++)for(let x=cx-radius-1;x<=cx+radius+1;x++){
    const nx=(x+.5-cx)/radius,ny=(y+.5-cy)/radius;
    const distance=nx*nx+ny*ny;
    if(distance>=1.07)continue;
    const nz=Math.sqrt(Math.max(0,1-Math.min(distance,1)));
    const u=(.5+Math.atan2(nx,nz)/(Math.PI*2)+1)%1;
    const v=Math.acos(Math.max(-1,Math.min(1,-ny)))/Math.PI;
    const sx=Math.min(source.width-1,Math.floor(u*source.width));
    const sy=Math.min(source.height-1,Math.floor(v*source.height));
    const sourceIndex=(sy*source.width+sx)*4;
    const destIndex=(y*icon.width+x)*4;
    const light=Math.max(0,nx*-.38+ny*-.42+nz*.82);
    const shade=.31+.69*light;
    disc.data[destIndex]=pixels[sourceIndex]*shade;
    disc.data[destIndex+1]=pixels[sourceIndex+1]*shade;
    disc.data[destIndex+2]=pixels[sourceIndex+2]*shade;
    disc.data[destIndex+3]=Math.round(Math.max(0,Math.min(1,(1.015-Math.sqrt(distance))*radius))*255);
  }
  discCtx.putImageData(disc,0,0);
  if(ringed)drawRings(false);
  ctx.drawImage(discCanvas,0,0);
  if(ringed)drawRings(true);
  return icon;
}

function buildPlanetList() {
  const list=document.querySelector('#planetList');
  destinations.forEach(planet=>{
    const button=document.createElement('button');
    button.type='button';button.className='planet-row';button.dataset.id=planet.id;
    button.setAttribute('aria-label',`Select ${planet.name}`);
    button.innerHTML=`<span class="planet-row-name">${planet.name}</span><span class="planet-row-index">${planet.index}</span>`;
    button.prepend(createPlanetIcon(planet));
    button.addEventListener('click',()=>selectPlanet(planet.id,true));
    list.append(button);
  });
  refreshDiscoveryUI();
}

function loadDiscoveries() {
  try {
    const saved=JSON.parse(localStorage.getItem('odyssey-scanned-worlds')||'[]');
    if(Array.isArray(saved))for(const id of saved){
      if(destinations.some(planet=>planet.id===id))scannedBodies.add(id);
    }
  } catch {}
}

function loadLandmarks() {
  scannedLandmarks.clear();
  try{
    const saved=JSON.parse(localStorage.getItem(`odyssey-${gameMode}-landmarks`)||'[]');
    if(Array.isArray(saved))for(const id of saved)if(landmarks.some(item=>item.id===id))scannedLandmarks.add(id);
  }catch{}
  renderLandmarkList();
}

function renderLandmarkList() {
  const list=document.querySelector('#landmarkList');
  if(!list)return;
  list.replaceChildren();
  const local=landmarks.filter(item=>item.worldId===selectedId);
  list.hidden=!local.length||isWorldLocked(selectedId);
  if(list.hidden)return;
  const heading=document.createElement('h4');heading.textContent=`LANDMARKS · ${local.filter(item=>scannedLandmarks.has(item.id)).length}/${local.length}`;
  list.append(heading);
  for(const landmark of local){
    const item=document.createElement('div');item.className='landmark-item';
    const name=document.createElement('strong');name.textContent=scannedLandmarks.has(landmark.id)?landmark.name:'Undiscovered feature';
    const description=document.createElement('p');description.textContent=scannedLandmarks.has(landmark.id)?landmark.fact:`${landmark.hint} Aim nearby and hold R to scan.`;
    item.append(name,description);
    if(scannedLandmarks.has(landmark.id)){
      const source=document.createElement('a');source.href=landmark.source;source.target='_blank';source.rel='noopener noreferrer';source.textContent='NASA source';item.append(source);
    }
    list.append(item);
  }
}

function refreshDiscoveryUI() {
  document.querySelector('#discoveryCount').textContent=gameMode==='discovery'?`${scannedBodies.size} / ${destinations.length} SCANNED`:'FREE EXPLORATION';
  document.querySelectorAll('.planet-row').forEach(row=>{
    const planet=destinations.find(item=>item.id===row.dataset.id);
    const scanned=scannedBodies.has(row.dataset.id);
    const locked=isWorldLocked(row.dataset.id);
    row.disabled=locked;
    row.classList.toggle('locked',locked);
    row.classList.toggle('active',!locked&&row.dataset.id===selectedId);
    row.setAttribute('aria-current',!locked&&row.dataset.id===selectedId?'true':'false');
    row.querySelector('.planet-row-name').textContent=locked?(planet.id==='comet'?'Unknown object':'Unknown world'):planet.name;
    row.querySelector('.planet-row-index').textContent=locked?'LOCKED':scanned?'✓':planet.index;
    row.setAttribute('aria-label',locked?`${planet.id==='comet'?'Unknown object':'Unknown destination'}. Scan it to unlock.`:`Select ${planet.name}${scanned?', scanned':''}`);
  });
  document.querySelector('#discoveryToggle').hidden=isWorldLocked(selectedId);
}

function scanRangeFor(id) {
  const planet=destinations.find(item=>item.id===id);
  const center=id==='sun'?sunMesh.position:bodies.find(body=>body.data.id===id)?.group.position;
  if(!planet||!center)return false;
  return shipPosition.distanceTo(center)-planet.radius<=(id==='comet'?90:Math.max(24,planet.radius*.7));
}

function endUnlockCinematic(immediate=false) {
  if(unlockCinematicTimer!==null){window.clearTimeout(unlockCinematicTimer);unlockCinematicTimer=null;}
  if(unlockHideTimer!==null){window.clearTimeout(unlockHideTimer);unlockHideTimer=null;}
  unlockCinematicActive=false;
  const overlay=document.querySelector('#unlockCinematic');
  overlay.classList.remove('active');
  document.querySelector('#app').classList.remove('unlock-active');
  if(immediate){overlay.hidden=true;unlockLens=0;}
  else unlockHideTimer=window.setTimeout(()=>{overlay.hidden=true;unlockHideTimer=null;},350);
}

function showUnlockCinematic(planet,fact) {
  endUnlockCinematic(true);
  const overlay=document.querySelector('#unlockCinematic');
  document.querySelector('#unlockKickerText').textContent=planet.id==='comet'?'OBJECT DISCOVERED':'WORLD DISCOVERED';
  document.querySelector('#unlockName').textContent=planet.name;
  document.querySelector('#unlockCount').textContent=`${scannedBodies.size} / ${destinations.length}`;
  document.querySelector('#unlockFact').textContent=fact;
  overlay.hidden=false;
  unlockCinematicActive=true;
  requestAnimationFrame(()=>{
    if(!unlockCinematicActive)return;
    overlay.classList.add('active');
    document.querySelector('#app').classList.add('unlock-active');
  });
  unlockCinematicTimer=window.setTimeout(()=>endUnlockCinematic(),reducedMotion.matches?1600:3100);
}

function updateScanner(dt,elapsed) {
  const feedback=document.querySelector('#scanFeedback');
  const blocked=introActive||introDive||returningToIntro||previewTarget||unlockCinematicActive||
    !document.querySelector('#helpOverlay').hidden||
    !document.querySelector('#logOverlay').hidden||
    !document.querySelector('#voyageOverlay').hidden||
    !document.querySelector('#settingsOverlay').hidden||
    !document.querySelector('#exitOverlay').hidden;
  if(blocked){feedback.hidden=true;scanSeconds=0;scanTargetId=null;return;}
  const worldHit=pointedPlanet();
  const aimed=pointedLandmark(worldHit);
  if(keys.has('KeyR')&&aimed&&!scannedLandmarks.has(aimed.landmark.id)){
    const {landmark,hit}=aimed;
    feedback.hidden=false;
    feedback.classList.remove('complete');
    document.querySelector('#scanFact').hidden=true;
    if(shipPosition.distanceTo(hit.point)>landmark.range){
      document.querySelector('#scanTitle').textContent='Move closer to scan this feature';
      document.querySelector('#scanFill').style.width='0%';
      document.querySelector('#scanMeter').setAttribute('aria-valuenow','0');
      scanSeconds=0;scanTargetId=null;
      return;
    }
    if(scanTargetId!==landmark.id){scanTargetId=landmark.id;scanSeconds=0;}
    scanSeconds=Math.min(2.2,scanSeconds+dt);
    document.querySelector('#scanTitle').textContent=`Scanning feature · ${Math.round(scanSeconds/2.2*100)}%`;
    document.querySelector('#scanFill').style.width=`${scanSeconds/2.2*100}%`;
    document.querySelector('#scanMeter').setAttribute('aria-valuenow',String(Math.round(scanSeconds/2.2*100)));
    if(scanSeconds>=2.2){
      scannedLandmarks.add(landmark.id);
      try{localStorage.setItem(`odyssey-${gameMode}-landmarks`,JSON.stringify([...scannedLandmarks]));}catch{}
      recordLog('landmark',landmark.worldId,{landmarkId:landmark.id});
      renderLandmarkList();
      const fact=document.querySelector('#scanFact');fact.textContent=landmark.fact;fact.hidden=false;
      document.querySelector('#scanTitle').textContent=`${landmark.name} discovered`;
      feedback.classList.add('complete');
      scanResultUntil=elapsed+5;
      scanSeconds=0;scanTargetId=null;
      shipAudio.cue('discovery');
    }
    return;
  }
  const id=worldHit?.object.userData.id;
  if(gameMode==='discovery'&&keys.has('KeyR')&&id&&!scannedBodies.has(id)){
    const planet=destinations.find(item=>item.id===id);
    const targetKind=id==='comet'?'object':'world';
    feedback.hidden=false;
    feedback.classList.remove('complete');
    document.querySelector('#scanFact').hidden=true;
    if(!scanRangeFor(id)){
      document.querySelector('#scanTitle').textContent=`Move closer to scan unknown ${targetKind}`;
      document.querySelector('#scanFill').style.width='0%';
      document.querySelector('#scanMeter').setAttribute('aria-valuenow','0');
      scanSeconds=0;scanTargetId=null;
      return;
    }
    if(scanTargetId!==id){scanTargetId=id;scanSeconds=0;}
    scanSeconds=Math.min(2.4,scanSeconds+dt);
    document.querySelector('#scanTitle').textContent=`Scanning unknown ${targetKind} · ${Math.round(scanSeconds/2.4*100)}%`;
    document.querySelector('#scanFill').style.width=`${scanSeconds/2.4*100}%`;
    document.querySelector('#scanMeter').setAttribute('aria-valuenow',String(Math.round(scanSeconds/2.4*100)));
    if(scanSeconds>=2.4){
      scannedBodies.add(id);
      recordLog('scan',id,{});
      try{localStorage.setItem('odyssey-scanned-worlds',JSON.stringify([...scannedBodies]));}catch{}
      refreshDiscoveryUI();
      updateAutopilotUI();
      const [title,description]=discovery[id].notes.find(([note])=>!landmarks.some(item=>item.worldId===id&&item.name===note))||['Discovery',discovery[id].lead];
      document.querySelector('#scanTitle').textContent=`${planet.name} discovered · ${scannedBodies.size}/${destinations.length}`;
      const fact=document.querySelector('#scanFact');
      fact.textContent=`${title}: ${description}`;
      fact.hidden=false;
      feedback.classList.add('complete');
      scanResultUntil=elapsed+5;
      scanSeconds=0;scanTargetId=null;
      showUnlockCinematic(planet,`${title}: ${description}`);
      feedback.hidden=true;
      shipAudio.cue('discovery');
    }
    return;
  }
  scanSeconds=0;scanTargetId=null;
  feedback.hidden=elapsed>=scanResultUntil;
}

function setDiscoveryOpen(open) {
  if(open&&isWorldLocked(selectedId))return;
  const planet=destinations.find(item=>item.id===selectedId);
  const facts=discovery[planet.id];
  const panel=document.querySelector('#fieldGuide');
  const details=document.querySelector('#discoveryPanel');
  const toggle=document.querySelector('#discoveryToggle');
  panel.classList.toggle('discovery-open',open);
  details.hidden=!open;
  toggle.setAttribute('aria-expanded',open?'true':'false');
  toggle.textContent=open?'Hide extra facts':'Explore more facts';
  if(!open)return;
  document.querySelector('#discoveryKicker').textContent='FIELD NOTES';
  document.querySelector('#discoveryHeading').textContent=`${planet.name} up close`;
  document.querySelector('#discoveryLead').textContent=facts.lead;
  const stats=document.querySelector('#discoveryStats');
  stats.replaceChildren();
  for(const [label,value] of [['ROTATION',facts.rotation],['ORBIT',facts.orbit],['ATMOSPHERE',facts.atmosphere]]){
    const item=document.createElement('div');
    const term=document.createElement('span');term.textContent=label;
    const detail=document.createElement('strong');detail.textContent=value;
    item.append(term,detail);stats.append(item);
  }
  const notes=document.querySelector('#discoveryNotes');
  notes.replaceChildren();
  for(const [title,description] of facts.notes){
    if(landmarks.some(item=>item.worldId===planet.id&&item.name===title))continue;
    const item=document.createElement('div');
    const heading=document.createElement('h4');heading.textContent=title;
    const copy=document.createElement('p');copy.textContent=description;
    item.append(heading,copy);notes.append(item);
  }
  document.querySelector('#discoverySource').href=facts.source;
  renderLandmarkList();
  document.querySelector('#discoveryInspect').textContent=planet.id==='sun'?'View Sun from a distance':`View ${planet.name} up close`;
  requestAnimationFrame(()=>{
    if(!details.hidden){
      const top=details.getBoundingClientRect().top-panel.getBoundingClientRect().top+panel.scrollTop-14;
      panel.scrollTo({top,behavior:reducedMotion.matches?'auto':'smooth'});
    }
  });
}

function selectPlanet(id,preview=false) {
  const planet=destinations.find(p=>p.id===id);
  if(!planet||isWorldLocked(id))return;
  if(selectedId!==id)setDiscoveryOpen(false);
  if(autopilotTarget&&autopilotTarget.data.id!==id)stopAutopilot('Course changed. Manual flight.');
  if(selectedId!==id&&!autopilotTarget)autopilotMessage='Manual flight';
  selectedId=id;
  document.querySelectorAll('.planet-row').forEach(row=>{
    const active=row.dataset.id===id;row.classList.toggle('active',active);row.setAttribute('aria-current',active?'true':'false');
  });
  document.querySelector('#guideNumber').textContent=planet.index;
  document.querySelector('#planetType').textContent=planet.type;
  document.querySelector('#planetName').textContent=planet.name;
  document.querySelector('#planetSymbol').textContent=planet.symbol;
  document.querySelector('#planetDescription').textContent=planet.description;
  document.querySelector('#planetDistance').textContent=planet.distance;
  document.querySelector('#planetDiameter').textContent=planet.diameter;
  const art=document.querySelector('#planetArt');
  art.hidden=id==='comet';
  art.classList.toggle('saturn-art',id==='saturn');
  art.classList.toggle('moon-art',id==='moon');
  if(id!=='comet'){
    const photo=planetPhotos[id];
    const image=document.querySelector('#planetPhoto');
    image.src=`${import.meta.env.BASE_URL}planet-photos/${photo.file}`;
    image.alt=`NASA image of ${planet.name}`;
    const credit=document.querySelector('#planetPhotoCredit');
    credit.textContent=photo.credit;
    credit.href=photo.source;
  }
  updateAutopilotUI();
  if(preview) {
    discoveryDrift=false;
    arrivalPreview=false;
    parkedTarget=null;
    previewOrbitAngle=previewOrbitTargetAngle=0;
    showGuide();
    beginCameraTransition(1.35);
    previewTarget=id==='sun'?{data:sunData,group:sunMesh}:bodies.find(body=>body.data.id===id);
    document.querySelector('#previewName').textContent=`${planet.name.toUpperCase()} / PREVIEW`;
    document.querySelector('#previewBanner').hidden=false;
    document.querySelector('#app').classList.add('destination-preview');
    updateCamera(0);
  }
}

function showArrivalPreview(body) {
  endUnlockCinematic(true);
  completeVoyageStop(body.data.id);
  suppressedFlybyWorlds.add(body.data.id);
  recordLog('station',body.data.id,{
    distance:Math.max(0,Math.round(shipPosition.distanceTo(body.group.position)-body.data.radius)),
  });
  setDiscoveryOpen(false);
  showGuide();
  arrivalPreview=true;
  parkedTarget=body;
  parkedOffset.copy(shipPosition).sub(body.group.position);
  previewOrbitAngle=previewOrbitTargetAngle=0;
  beginCameraTransition(1.35);
  previewTarget=body;
  document.querySelector('#previewName').textContent=`${body.data.name.toUpperCase()} / PREVIEW`;
  document.querySelector('#previewBanner').hidden=false;
  document.querySelector('#app').classList.add('destination-preview');
  updateCamera(0);
}

function rotatePreview(direction) {
  if(!previewTarget)return;
  previewOrbitTargetAngle+=direction*Math.PI/4;
}

function exitPreview() {
  if(!previewTarget)return;
  beginCameraTransition(1.05);
  previewTarget=null;
  previewOrbitAngle=previewOrbitTargetAngle=0;
  arrivalPreview=false;
  parkedTarget=null;
  document.querySelector('#previewBanner').hidden=true;
  document.querySelector('#app').classList.remove('destination-preview');
  updateCamera(0);
}

function updateAutopilotUI() {
  const button=document.querySelector('#autopilotButton');
  button.hidden=isWorldLocked(selectedId)||(selectedId==='sun'&&!autopilotTarget);
  button.setAttribute('aria-pressed',autopilotTarget?'true':'false');
  button.textContent=autopilotTarget?'Cancel flight':`Fly to ${destinations.find(p=>p.id===selectedId).name}`;
  document.querySelector('#autopilotStatus').textContent=selectedId==='sun'&&!autopilotTarget?'Observe from a safe distance.':autopilotMessage;
  document.querySelector('#app').classList.toggle('autopilot-active',Boolean(autopilotTarget));
}

function stopAutopilot(message='Manual flight') {
  if(message.startsWith('Arrived'))shipAudio.cue('arrival');
  autopilotTarget=null;
  autopilotWaypoint=null;
  autopilotMessage=message;
  updateAutopilotUI();
}

function toggleAutopilot() {
  shipAudio.start();
  if(arrivalPreview){exitPreview();return;}
  if(autopilotTarget){stopAutopilot();return;}
  if(selectedId==='sun'||isWorldLocked(selectedId))return;
  exitPreview();
  autopilotTarget=bodies.find(body=>body.data.id===selectedId);
  if(!autopilotTarget)return;
  discoveryDrift=false;
  autopilotWaypoint=null;
  autopilotMessage=`Course set for ${autopilotTarget.data.name}`;
  keys.clear();
  updateAutopilotUI();
  shipAudio.cue('engage');
}

function setupAudioControls() {
  const button=document.querySelector('#soundButton');
  const volume=document.querySelector('#musicVolume');
  const volumeValue=document.querySelector('#musicVolumeValue');
  const track=document.querySelector('#musicTrack');
  const nowPlaying=document.querySelector('#musicNowPlaying');
  const showControls=document.querySelector('#showControlsInput');
  try{showControls.checked=localStorage.getItem('odyssey-show-controls')!=='no';}catch{}
  document.querySelector('#app').classList.toggle('hide-control-hints',!showControls.checked);
  showControls.addEventListener('change',()=>{
    document.querySelector('#app').classList.toggle('hide-control-hints',!showControls.checked);
    try{localStorage.setItem('odyssey-show-controls',showControls.checked?'yes':'no');}catch{}
  });
  volume.value=String(shipAudio.getMusicVolume());
  volumeValue.value=`${shipAudio.getMusicVolume()}%`;
  volume.addEventListener('input',()=>{volumeValue.value=`${shipAudio.setMusicVolume(volume.value)}%`;});
  track.value=shipAudio.getMusicSelection();
  const refreshTrack=()=>{nowPlaying.textContent=`Now playing: ${shipAudio.getActiveTrackName()}`;};
  track.addEventListener('change',()=>{shipAudio.setMusicSelection(track.value);refreshTrack();});
  refreshTrack();
  function refresh() {
    const enabled=shipAudio.isEnabled()&&shipAudio.isSupported();
    button.setAttribute('aria-pressed',enabled?'true':'false');
    button.setAttribute('aria-label',enabled?'Mute sound':'Enable sound');
    document.querySelector('#soundLabel').textContent=enabled?'Sound on':'Sound off';
    button.querySelector('span').textContent=enabled?'♫':'♩';
    button.disabled=!shipAudio.isSupported();
  }
  button.addEventListener('click',()=>{shipAudio.setEnabled(!shipAudio.isEnabled());refresh();});
  function unlock() {
    shipAudio.start();
    document.removeEventListener('pointerdown',unlock);
    document.removeEventListener('keydown',unlock);
  }
  document.addEventListener('pointerdown',unlock);
  document.addEventListener('keydown',unlock);
  refresh();
  shipAudio.start();
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)shipAudio.start();});
}

function captainLogKey() {
  return gameMode==='discovery'?'odyssey-discovery-log':'odyssey-exploration-log';
}

function photoKey() {
  return gameMode==='discovery'?'odyssey-discovery-photos':'odyssey-exploration-photos';
}

function loadPhotos() {
  photoPending=false;
  try {
    const saved=JSON.parse(localStorage.getItem(photoKey())||'[]');
    photos=Array.isArray(saved)?saved.filter(photo=>
      photo&&typeof photo.id==='string'&&Number.isFinite(photo.at)&&Math.abs(photo.at)<=8.64e15&&
      (photo.worldId===null||destinations.some(world=>world.id===photo.worldId))&&
      typeof photo.image==='string'&&/^data:image\/jpeg;base64,/.test(photo.image)
    ).slice(0,maxPhotos):[];
  }catch{photos=[];}
  renderPhotoGallery();
}

function photoFeedback(message) {
  const feedback=document.querySelector('#photoFeedback');
  feedback.textContent=message;
  feedback.hidden=false;
  if(photoFeedbackTimer!==null)window.clearTimeout(photoFeedbackTimer);
  photoFeedbackTimer=window.setTimeout(()=>{feedback.hidden=true;photoFeedbackTimer=null;},3600);
}

function requestPhoto() {
  if(introActive||introDive||launchTransition||returningToIntro||photoPending||unlockCinematicActive||
    ['helpOverlay','logOverlay','voyageOverlay','settingsOverlay','exitOverlay'].some(id=>!document.getElementById(id).hidden))return;
  if(photos.length>=maxPhotos){photoFeedback('Gallery full · delete a photo in Captain’s log');return;}
  photoPending=true;
}

function capturePhoto() {
  if(!photoPending)return;
  photoPending=false;
  const target=previewTarget?.data.id||pointedPlanet()?.object.userData.id||null;
  const at=Date.now();
  const id=`${at}-${Math.random().toString(36).slice(2,7)}`;
  for(const [width,quality] of [[960,.76],[640,.65]]){
    try {
      const frame=document.createElement('canvas');
      frame.width=Math.min(width,canvas.width);
      frame.height=Math.max(1,Math.round(frame.width*canvas.height/canvas.width));
      frame.getContext('2d').drawImage(canvas,0,0,frame.width,frame.height);
      const image=frame.toDataURL('image/jpeg',quality);
      const next=[{id,at,worldId:target,image},...photos];
      localStorage.setItem(photoKey(),JSON.stringify(next));
      photos=next;
      renderPhotoGallery();
      photoFeedback('Photo saved · L → Photo gallery');
      return;
    }catch{}
  }
  photoFeedback('Could not save photo · browser storage may be full');
}

function loadCaptainLog() {
  try {
    const saved=JSON.parse(localStorage.getItem(captainLogKey())||'[]');
    captainLog=Array.isArray(saved)?saved.filter(entry=>
      entry&&['scan','landmark','flyby','station','impact'].includes(entry.type)&&Number.isFinite(entry.at)&&Math.abs(entry.at)<=8.64e15&&
      (entry.worldId===null||destinations.some(world=>world.id===entry.worldId))&&
      (entry.image===undefined||typeof entry.image==='string'&&/^data:image\/(jpeg|webp);base64,/.test(entry.image))
    ).slice(0,maxCaptainLogEntries):[];
  } catch {captainLog=[];}
  pendingLogSnapshots=[];
  flybyTracker.clear();
  renderCaptainLog();
}

function saveCaptainLog() {
  try{localStorage.setItem(captainLogKey(),JSON.stringify(captainLog));}
  catch {
    // Keep the written record when browser storage is tight; older photos go first.
    for(let index=captainLog.length-1;index>=0;index--){
      if(!captainLog[index].image)continue;
      delete captainLog[index].image;
      try{localStorage.setItem(captainLogKey(),JSON.stringify(captainLog));return;}catch{}
    }
  }
}

function recordLog(type,worldId,details) {
  const entry={id:`${Date.now()}-${Math.random().toString(36).slice(2,7)}`,type,worldId,at:Date.now(),...details};
  captainLog.unshift(entry);
  captainLog.length=Math.min(captainLog.length,maxCaptainLogEntries);
  if(!entry.image)pendingLogSnapshots.push(entry.id);
  saveCaptainLog();
  if(!document.querySelector('#logOverlay').hidden)renderCaptainLog();
}

function captureLogSnapshots() {
  if(!pendingLogSnapshots.length)return;
  const ids=new Set(pendingLogSnapshots);
  pendingLogSnapshots=[];
  try {
    const thumbnail=document.createElement('canvas');
    thumbnail.width=320;thumbnail.height=180;
    thumbnail.getContext('2d').drawImage(canvas,0,0,thumbnail.width,thumbnail.height);
    const image=thumbnail.toDataURL('image/jpeg',.62);
    captainLog.forEach(entry=>{if(ids.has(entry.id))entry.image=image;});
    let images=0;
    for(const entry of captainLog)if(entry.image&&++images>32)delete entry.image;
    saveCaptainLog();
    if(!document.querySelector('#logOverlay').hidden)renderCaptainLog();
  } catch {}
}

function updateFlybyLog() {
  if(introActive||introDive||returningToIntro||previewTarget||autopilotTarget){flybyTracker.clear();return;}
  if(!document.querySelector('#logOverlay').hidden||!document.querySelector('#voyageOverlay').hidden||!document.querySelector('#helpOverlay').hidden||
    !document.querySelector('#settingsOverlay').hidden||!document.querySelector('#exitOverlay').hidden)return;
  for(const body of [{data:sunData,group:sunMesh},...bodies]){
    if(suppressedFlybyWorlds.has(body.data.id)){
      const distance=shipPosition.distanceTo(body.group.position)-body.data.radius;
      if(distance>Math.max(35,body.data.radius*1.3))suppressedFlybyWorlds.delete(body.data.id);
      continue;
    }
    const encounter=flybyTracker.update(body.data.id,shipPosition,body.group.position,body.data.radius,velocity.length());
    if(encounter)recordLog('flyby',encounter.worldId,{distance:encounter.distance,passKind:encounter.passKind});
  }
}

function saveVoyage() {
  try{
    if(voyageState)localStorage.setItem('odyssey-exploration-voyage',JSON.stringify(voyageState));
    else localStorage.removeItem('odyssey-exploration-voyage');
  }catch{}
}

function renderVoyages() {
  const list=document.querySelector('#voyageRoutes');
  if(!list)return;
  list.replaceChildren();
  for(const route of voyages){
    const button=document.createElement('button');button.type='button';button.className='voyage-route';
    button.setAttribute('aria-pressed',String(voyageState?.id===route.id));
    const title=document.createElement('strong');title.textContent=route.name;
    const stops=document.createElement('span');stops.textContent=route.stops.map(id=>destinations.find(item=>item.id===id).name).join(' · ');
    const action=document.createElement('small');action.textContent=voyageState?.id===route.id?'RESTART ROUTE':'CHOOSE ROUTE';
    button.append(title,stops,action);
    button.addEventListener('click',()=>{
      voyageState={id:route.id,index:0};saveVoyage();renderVoyages();
      document.querySelector('#voyageNext').focus({preventScroll:true});
    });
    list.append(button);
  }
  const progress=document.querySelector('#voyageProgress');
  const current=voyages.find(route=>route.id===voyageState?.id);
  progress.hidden=!current;
  const label=current?`Voyages ${voyageState.index}/${current.stops.length}`:'Voyages';
  document.querySelector('#voyageButton').textContent=label;
  document.querySelector('#voyagePanelButton').textContent=label;
  if(!current)return;
  const done=voyageState.index>=current.stops.length;
  const next=done?null:destinations.find(item=>item.id===current.stops[voyageState.index]);
  document.querySelector('#voyageStatus').textContent=done
    ?`${current.name} complete · ${current.stops.length} stops visited`
    :`${current.name} · ${voyageState.index+1} of ${current.stops.length} · next: ${next.name}`;
  const stopList=document.querySelector('#voyageStops');stopList.replaceChildren();
  current.stops.forEach((id,index)=>{
    const item=document.createElement('span');item.textContent=destinations.find(body=>body.id===id).name;
    if(index<voyageState.index)item.className='done';
    else if(index===voyageState.index)item.className='current';
    stopList.append(item);
  });
  const nextButton=document.querySelector('#voyageNext');
  nextButton.disabled=done;
  nextButton.textContent=done?'Route complete':`Fly to ${next.name}`;
}

function completeVoyageStop(id) {
  if(gameMode!=='exploration'||!voyageState)return;
  const route=voyages.find(item=>item.id===voyageState.id);
  if(!route||route.stops[voyageState.index]!==id)return;
  voyageState.index++;
  saveVoyage();renderVoyages();
}

function updateVoyageProgress() {
  if(gameMode!=='exploration'||!voyageState||introActive||introDive||returningToIntro||previewTarget||autopilotTarget||!document.querySelector('#voyageOverlay').hidden)return;
  const route=voyages.find(item=>item.id===voyageState.id);
  const id=route?.stops[voyageState.index];
  if(!id)return;
  const body=bodies.find(item=>item.data.id===id);
  if(body&&shipPosition.distanceTo(body.group.position)-body.data.radius<=Math.max(24,body.data.radius*.7))completeVoyageStop(id);
}

function openVoyages() {
  if(introActive||returningToIntro||gameMode!=='exploration')return;
  keys.clear();renderVoyages();
  document.querySelector('#voyageOverlay').hidden=false;
  document.querySelector('#closeVoyages').focus({preventScroll:true});
}

function closeVoyages() {
  if(document.querySelector('#voyageOverlay').hidden)return;
  document.querySelector('#voyageOverlay').hidden=true;
  const trigger=document.querySelector('#app').classList.contains('destinations-hidden')
    ?document.querySelector('#voyageButton'):document.querySelector('#voyagePanelButton');
  trigger.focus({preventScroll:true});
}

function setupVoyages() {
  try{
    const saved=JSON.parse(localStorage.getItem('odyssey-exploration-voyage')||'null');
    const route=voyages.find(item=>item.id===saved?.id);
    if(route&&Number.isInteger(saved.index)&&saved.index>=0&&saved.index<=route.stops.length)voyageState={id:route.id,index:saved.index};
  }catch{}
  document.querySelector('#voyageButton').addEventListener('click',openVoyages);
  document.querySelector('#voyagePanelButton').addEventListener('click',openVoyages);
  document.querySelector('#closeVoyages').addEventListener('click',closeVoyages);
  document.querySelector('#voyageOverlay').addEventListener('click',event=>{if(event.target.id==='voyageOverlay')closeVoyages();});
  document.querySelector('#voyageEnd').addEventListener('click',()=>{voyageState=null;saveVoyage();renderVoyages();});
  document.querySelector('#voyageNext').addEventListener('click',()=>{
    const route=voyages.find(item=>item.id===voyageState?.id);
    const id=route?.stops[voyageState.index];
    if(!id)return;
    closeVoyages();
    exitPreview();
    if(autopilotTarget)stopAutopilot('Route changed');
    selectPlanet(id);
    toggleAutopilot();
  });
  renderVoyages();
}

function renderCaptainLog() {
  const list=document.querySelector('#logEntries');
  if(!list)return;
  list.replaceChildren();
  document.querySelector('#logTitle').textContent=`Captain ${pilotName}'s Log`;
  if(document.querySelector('#logTab').getAttribute('aria-selected')==='true')setLogTab('log');
  if(!captainLog.length){
    const empty=document.createElement('p');empty.className='log-empty';
    empty.textContent='Your flight story begins with a scan, a close approach, or an encounter.';
    list.append(empty);return;
  }
  for(const entry of captainLog){
    const article=document.createElement('article');article.className='log-entry';
    if(entry.image){
      const imageButton=document.createElement('button');imageButton.type='button';imageButton.className='log-entry-image-button';
      imageButton.setAttribute('aria-label','Expand flight snapshot');imageButton.setAttribute('aria-expanded','false');
      const image=document.createElement('img');image.className='log-entry-image';image.src=entry.image;image.alt='View captured during this flight event';
      imageButton.append(image);
      imageButton.addEventListener('click',()=>{
        const expanded=article.classList.toggle('expanded');
        imageButton.setAttribute('aria-expanded',String(expanded));
        imageButton.setAttribute('aria-label',expanded?'Shrink flight snapshot':'Expand flight snapshot');
      });
      article.append(imageButton);
    }else{
      const fallback=document.createElement('div');fallback.className='log-entry-image log-entry-image-fallback';fallback.textContent='NO IMAGE';article.append(fallback);
    }
    const content=document.createElement('div');
    const meta=document.createElement('div');meta.className='log-entry-meta';
    const kind=document.createElement('span');kind.textContent=entry.type==='scan'?'DISCOVERY':entry.type==='landmark'?'LANDMARK':entry.type==='flyby'?(entry.passKind==='approach'?'CLOSE APPROACH':'FLYBY'):entry.type==='station'?'STATION KEEPING':'ENCOUNTER';
    const date=document.createElement('time');date.dateTime=new Date(entry.at).toISOString();date.textContent=new Date(entry.at).toLocaleString();
    meta.append(kind,date);
    const heading=document.createElement('h3');
    const detail=document.createElement('p');
    const world=destinations.find(item=>item.id===entry.worldId);
    const name=world&&(gameMode!=='discovery'||scannedBodies.has(world.id)||entry.type==='scan')?world.name:entry.worldId==='comet'?'Unknown object':'Unknown world';
    if(entry.type==='scan'){
      heading.textContent=`${name} discovered`;
      detail.textContent=`Scan complete. This ${entry.worldId==='comet'?'object':'world'} is now available in Destinations and the Field Guide.`;
    }else if(entry.type==='landmark'){
      const landmark=landmarks.find(item=>item.id===entry.landmarkId);
      heading.textContent=landmark?`${landmark.name} discovered`:`${name} landmark discovered`;
      detail.textContent=landmark?.fact||'A close-range feature was recorded.';
    }else if(entry.type==='flyby'){
      heading.textContent=`${name} · ${entry.passKind==='approach'?'close approach':'flyby'}`;
      detail.textContent=`Closest approach: ${Math.max(0,Math.round(entry.distance||0))} units above the surface.`;
    }else if(entry.type==='station'){
      heading.textContent=`Holding position near ${name}`;
      detail.textContent=`Autopilot arrival · ${Math.max(0,Math.round(entry.distance||0))} units above the surface.`;
    }else{
      heading.textContent=entry.source==='ring'?(entry.broken?'Ring particle fractured':'Ring particle impact'):entry.broken?'Asteroid fractured':'Asteroid impact';
      detail.textContent=entry.broken
        ?`The ${entry.source==='ring'?'ice particle':'rock'} broke into drifting fragments at ${Math.max(0,Math.round(entry.speed||0))} units/s.`
        :`The ship deflected a larger rock at ${Math.max(0,Math.round(entry.speed||0))} units/s.`;
    }
    content.append(meta,heading,detail);article.append(content);list.append(article);
  }
}

function renderPhotoGallery() {
  const gallery=document.querySelector('#photoEntries');
  if(!gallery)return;
  gallery.replaceChildren();
  document.querySelector('#photosTab').textContent=`Photo gallery (${photos.length})`;
  if(!photos.length){
    const empty=document.createElement('p');
    empty.className='log-empty';
    empty.textContent='Frame a view and press T, or use Take photo during flight.';
    gallery.append(empty);
    return;
  }
  for(const photo of photos){
    const card=document.createElement('article');card.className='photo-card';
    const imageButton=document.createElement('button');imageButton.type='button';imageButton.className='photo-card-image-button';imageButton.setAttribute('aria-label','View photo');
    const image=document.createElement('img');image.src=photo.image;image.alt='Photo taken during space flight';
    imageButton.append(image);
    imageButton.addEventListener('click',()=>openPhotoViewer(photo,imageButton));
    const details=document.createElement('div');details.className='photo-details';
    const world=destinations.find(item=>item.id===photo.worldId);
    const title=document.createElement('strong');
    title.textContent=world?(isWorldLocked(world.id)?'Unidentified object':world.name):'Open space';
    const date=document.createElement('time');date.dateTime=new Date(photo.at).toISOString();date.textContent=new Date(photo.at).toLocaleString();
    const actions=document.createElement('div');actions.className='photo-actions';
    const download=document.createElement('a');download.href=photo.image;download.download=`odyssey-${photo.at}.jpg`;download.textContent='Download';
    const remove=document.createElement('button');remove.type='button';remove.textContent='Delete';remove.setAttribute('aria-label',`Delete photo from ${date.textContent}`);
    remove.addEventListener('click',()=>{
      const next=photos.filter(item=>item.id!==photo.id);
      try{localStorage.setItem(photoKey(),JSON.stringify(next));photos=next;renderPhotoGallery();setLogTab('photos');}
      catch{photoFeedback('Could not update the gallery');}
    });
    actions.append(download,remove);
    details.append(title,date,actions);
    card.append(imageButton,details);gallery.append(card);
  }
}

function openPhotoViewer(photo,trigger) {
  lastPhotoTrigger=trigger;
  const world=destinations.find(item=>item.id===photo.worldId);
  document.querySelector('#photoViewerTitle').textContent=world?(isWorldLocked(world.id)?'Unidentified object':world.name):'Open space';
  document.querySelector('#photoViewerDate').textContent=new Date(photo.at).toLocaleString();
  document.querySelector('#photoViewerImage').src=photo.image;
  const download=document.querySelector('#photoViewerDownload');
  download.href=photo.image;
  download.download=`odyssey-${photo.at}.jpg`;
  document.querySelector('#photoViewer').hidden=false;
  document.querySelector('#closePhotoViewer').focus({preventScroll:true});
}

function closePhotoViewer() {
  const viewer=document.querySelector('#photoViewer');
  if(viewer.hidden)return;
  viewer.hidden=true;
  document.querySelector('#photoViewerImage').removeAttribute('src');
  lastPhotoTrigger?.focus({preventScroll:true});
  lastPhotoTrigger=null;
}

function setLogTab(tab) {
  const showPhotos=tab==='photos';
  document.querySelector('#logTab').setAttribute('aria-selected',String(!showPhotos));
  document.querySelector('#photosTab').setAttribute('aria-selected',String(showPhotos));
  document.querySelector('#logEntries').hidden=showPhotos;
  document.querySelector('#photoEntries').hidden=!showPhotos;
  document.querySelector('#logCount').textContent=showPhotos
    ?`${photos.length} ${photos.length===1?'PHOTO':'PHOTOS'}`
    :`${captainLog.length} ${captainLog.length===1?'ENTRY':'ENTRIES'}`;
  document.querySelector('#logSummary').textContent=showPhotos
    ?`${gameMode==='discovery'?'Discovery':'Exploration'} photo collection`
    :gameMode==='discovery'?`${scannedBodies.size} of ${destinations.length} discoveries scanned · Discovery voyage`:'Free exploration voyage';
}

function openLog() {
  if(introActive||returningToIntro)return;
  keys.clear();
  renderCaptainLog();
  renderPhotoGallery();
  setLogTab('log');
  document.querySelector('#logOverlay').hidden=false;
  document.querySelector('#closeLog').focus({preventScroll:true});
}

function closeLog() {
  if(document.querySelector('#logOverlay').hidden)return;
  document.querySelector('#logOverlay').hidden=true;
  const trigger=document.querySelector('#app').classList.contains('destinations-hidden')
    ?document.querySelector('#logButton'):document.querySelector('#logPanelButton');
  trigger.focus({preventScroll:true});
}

function setupControls() {
  const prevent=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
  const manualCodes=new Set(['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
  document.addEventListener('keydown',event=>{
    if(event.code==='Escape') {
      if(unlockCinematicActive){endUnlockCinematic(true);return;}
      if(!document.querySelector('#photoViewer').hidden)closePhotoViewer();
      else if(!document.querySelector('#exitOverlay').hidden)closeExit();
      else if(!document.querySelector('#logOverlay').hidden)closeLog();
      else if(!document.querySelector('#voyageOverlay').hidden)closeVoyages();
      else if(!document.querySelector('#helpOverlay').hidden)closeHelp();
      else if(!document.querySelector('#settingsOverlay').hidden)closeSettings();
      else if(previewTarget)exitPreview();
      else if(!introActive)openExit();
      return;
    }
    if(introActive)return;
    if(event.target instanceof HTMLInputElement || !document.querySelector('#helpOverlay').hidden || !document.querySelector('#logOverlay').hidden || !document.querySelector('#voyageOverlay').hidden || !document.querySelector('#settingsOverlay').hidden || !document.querySelector('#exitOverlay').hidden)return;
    if(event.code==='KeyL'&&!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.altKey){openLog();return;}
    if(event.code==='KeyT'&&!event.repeat&&!event.ctrlKey&&!event.metaKey&&!event.altKey){requestPhoto();return;}
    if(unlockCinematicActive&&event.code!=='KeyR')endUnlockCinematic(true);
    if(previewTarget&&!event.ctrlKey&&!event.metaKey&&!event.altKey&&(event.code==='Comma'||event.code==='Period')){
      event.preventDefault();
      if(!event.repeat)rotatePreview(event.code==='Comma'?-1:1);
      return;
    }
    if(prevent.has(event.code))event.preventDefault();
    if(event.code==='KeyC' && !event.repeat) {
      const modes=['first-person','chase'];
      setCameraMode(modes[(modes.indexOf(cameraMode)+1)%modes.length]);
    }
    if(event.code==='KeyP' && !event.repeat){toggleAutopilot();return;}
    if(event.code==='KeyR'&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();keys.add('KeyR');return;}
    if(event.code==='KeyF' && !event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey){
      const hit=pointedPlanet();
      const id=hit?.object.userData.id;
      if(!guideHidden&&(!id||id===selectedId))setGuideHidden(true);
      else if(id&&isWorldLocked(id))setGuideHidden(true);
      else if(id){
        selectPlanet(id);
        showGuide();
      }
      return;
    }
    if(discoveryDrift&&manualCodes.has(event.code))discoveryDrift=false;
    if(previewTarget&&manualCodes.has(event.code))exitPreview();
    if(autopilotTarget&&manualCodes.has(event.code))stopAutopilot('Manual control restored');
    else if(autopilotMessage.startsWith('Arrived')&&manualCodes.has(event.code)){autopilotMessage='Manual flight';updateAutopilotUI();}
    keys.add(event.code);
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  document.querySelector('#app').addEventListener('pointerdown',()=>{if(unlockCinematicActive)endUnlockCinematic(true);});
  window.addEventListener('blur',()=>keys.clear());
  document.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',()=>setCameraMode(button.dataset.camera)));
  document.querySelector('#autopilotButton').addEventListener('click',toggleAutopilot);
  document.querySelector('#discoveryToggle').addEventListener('click',()=>{
    setDiscoveryOpen(document.querySelector('#discoveryPanel').hidden);
  });
  document.querySelector('#discoveryInspect').addEventListener('click',()=>selectPlanet(selectedId,true));
  document.querySelector('#returnToShip').addEventListener('click',exitPreview);
  document.querySelector('#previewOrbitLeft').addEventListener('click',()=>rotatePreview(-1));
  document.querySelector('#previewOrbitRight').addEventListener('click',()=>rotatePreview(1));
  document.querySelector('#helpButton').addEventListener('click',openHelp);
  document.querySelector('#logButton').addEventListener('click',openLog);
  document.querySelector('#logPanelButton').addEventListener('click',openLog);
  document.querySelector('#takePhoto').addEventListener('click',requestPhoto);
  document.querySelector('#logTab').addEventListener('click',()=>setLogTab('log'));
  document.querySelector('#photosTab').addEventListener('click',()=>setLogTab('photos'));
  document.querySelector('#closePhotoViewer').addEventListener('click',closePhotoViewer);
  document.querySelector('#photoViewer').addEventListener('click',event=>{if(event.target.id==='photoViewer')closePhotoViewer();});
  document.querySelector('#closeLog').addEventListener('click',closeLog);
  document.querySelector('#logOverlay').addEventListener('click',event=>{if(event.target.id==='logOverlay')closeLog();});
  document.querySelector('#closeHelp').addEventListener('click',closeHelp);
  document.querySelector('#startExploring').addEventListener('click',closeHelp);
  document.querySelector('#helpOverlay').addEventListener('click',event=>{if(event.target.id==='helpOverlay')closeHelp();});
  document.querySelector('#settingsButton').addEventListener('click',openSettings);
  document.querySelector('#closeSettings').addEventListener('click',closeSettings);
  document.querySelector('#settingsOverlay').addEventListener('click',event=>{if(event.target.id==='settingsOverlay')closeSettings();});
  document.querySelector('#settingsExitButton').addEventListener('click',openExit);
  document.querySelector('#cancelExit').addEventListener('click',closeExit);
  document.querySelector('#confirmExit').addEventListener('click',returnToIntro);
  document.querySelector('#exitOverlay').addEventListener('click',event=>{if(event.target.id==='exitOverlay')closeExit();});
  document.querySelector('#settingsForm').addEventListener('submit',event=>{
    event.preventDefault();
    shipName=document.querySelector('#shipNameInput').value.trim().slice(0,20)||'Odyssey';
    pilotName=document.querySelector('#pilotNameInput').value.trim().slice(0,20)||'Explorer';
    updateNameReadout();
    try{localStorage.setItem('odyssey-names',JSON.stringify({shipName,pilotName}));}catch{}
    closeSettings();
  });
}

function openExit() {
  if(introActive||returningToIntro)return;
  exitFromSettings=!document.querySelector('#settingsOverlay').hidden;
  closeHelp(false);
  closeSettings(false);
  keys.clear();
  document.querySelector('#exitOverlay').hidden=false;
  document.querySelector('.exit-card').focus({preventScroll:true});
}

function closeExit() {
  if(document.querySelector('#exitOverlay').hidden)return;
  document.querySelector('#exitOverlay').hidden=true;
  if(exitFromSettings)openSettings();
  else canvas.focus({preventScroll:true});
  exitFromSettings=false;
}

function openHelp() {
  closeSettings(false);
  keys.clear();
  document.querySelector('#helpOverlay').hidden=false;
  document.querySelector('#closeHelp').focus();
}
function closeHelp(restoreFocus=true) {
  if(document.querySelector('#helpOverlay').hidden)return;
  document.querySelector('#helpOverlay').hidden=true;
  if(restoreFocus)document.querySelector('#helpButton').focus({preventScroll:true});
}

function updateNameReadout() {
  document.querySelector('#shipNameReadout').textContent=shipName;
  document.querySelector('#pilotNameReadout').textContent=pilotName;
  document.querySelector('#logTitle').textContent=`Captain ${pilotName}'s Log`;
  document.querySelector('#shipNameInput').value=shipName;
  document.querySelector('#pilotNameInput').value=pilotName;
}

function loadNames() {
  try {
    const saved=JSON.parse(localStorage.getItem('odyssey-names')||'{}');
    if(typeof saved.shipName==='string')shipName=saved.shipName.trim().slice(0,20)||'Odyssey';
    if(typeof saved.pilotName==='string')pilotName=saved.pilotName.trim().slice(0,20)||'Explorer';
  } catch {}
  updateNameReadout();
}

function openSettings() {
  closeHelp(false);
  keys.clear();
  updateNameReadout();
  document.querySelector('#settingsOverlay').hidden=false;
  document.querySelector('#shipNameInput').focus();
}

function closeSettings(restoreFocus=true) {
  if(document.querySelector('#settingsOverlay').hidden)return;
  document.querySelector('#settingsOverlay').hidden=true;
  if(restoreFocus)document.querySelector('#settingsButton').focus({preventScroll:true});
}

function autopilotGuidance() {
  const body=autopilotTarget;
  const target=body.group.position;
  const surfaceDistance=shipPosition.distanceTo(target)-body.data.radius;
  const viewingDistance=body.data.id==='saturn'?body.data.radius*1.5:Math.max(10.5,body.data.radius*.45);
  if(surfaceDistance<=viewingDistance+.5) {
    velocity.set(0,0,0);
    stopAutopilot(`Arrived near ${body.data.name}`);
    showArrivalPreview(body);
    return null;
  }
  if(autopilotWaypoint&&shipPosition.distanceTo(autopilotWaypoint)<4)autopilotWaypoint=null;
  if(!autopilotWaypoint) {
    const route=target.clone().sub(shipPosition);
    const routeLength=route.length();
    const forward=route.clone().normalize();
    let blocking=null;
    let nearestAlong=Infinity;
    for(const obstacle of [{position:new THREE.Vector3(),radius:sunRadius+2},...bodies.filter(other=>other!==body).map(other=>({position:other.group.position,radius:other.data.radius+1.4})),...asteroidObstacles]) {
      if(obstacle.alive===false)continue;
      const along=obstacle.position.clone().sub(shipPosition).dot(forward);
      if(along<0||along>routeLength||along>=nearestAlong)continue;
      const closest=shipPosition.clone().addScaledVector(forward,along);
      if(closest.distanceTo(obstacle.position)>obstacle.radius+6)continue;
      blocking=obstacle;
      nearestAlong=along;
    }
    if(blocking){
      const lateral=new THREE.Vector3(-forward.z,0,forward.x);
      if(lateral.lengthSq()<1e-4)lateral.set(Math.cos(yaw),0,-Math.sin(yaw));
      lateral.normalize();
      if(lateral.dot(shipPosition.clone().sub(blocking.position))<0)lateral.negate();
      autopilotWaypoint=blocking.position.clone().addScaledVector(lateral,blocking.radius+11).addScaledVector(forward,-blocking.radius-5);
      autopilotWaypoint.y=Math.max(shipPosition.y,7);
    }
  }
  const aim=autopilotWaypoint||target;
  const toward=aim.clone().sub(shipPosition).normalize();
  const horizontalDistance=Math.hypot(aim.x-shipPosition.x,aim.z-shipPosition.z);
  const verticalDistance=Math.abs(aim.y-shipPosition.y);
  if(horizontalDistance>Math.max(8,verticalDistance*.12)){
    const desiredYaw=Math.atan2(-toward.x,-toward.z);
    targetYaw=yaw+Math.atan2(Math.sin(desiredYaw-yaw),Math.cos(desiredYaw-yaw));
  }else targetYaw=yaw;
  targetPitch=THREE.MathUtils.clamp(Math.atan2(aim.y-shipPosition.y,horizontalDistance),-maxAutopilotPitch,maxAutopilotPitch);
  const remaining=autopilotWaypoint?shipPosition.distanceTo(autopilotWaypoint):surfaceDistance-viewingDistance;
  const speed=THREE.MathUtils.clamp(remaining*.65,0,48);
  return {toward,speed};
}

function moveShip(dt) {
  if(returningToIntro){velocity.set(0,0,0);boostAmount=0;return;}
  if(introDive){velocity.set(0,0,0);boostAmount=0;return;}
  if(introActive){velocity.set(0,0,0);boostAmount=0;return;}
  if(parkedTarget){
    shipPosition.copy(parkedTarget.group.position).add(parkedOffset);
    velocity.set(0,0,0);
    boostAmount=THREE.MathUtils.damp(boostAmount,0,5,dt);
    targetPitch=0;
    pitch=THREE.MathUtils.damp(pitch,0,3,dt);
    bank=THREE.MathUtils.damp(bank,0,5,dt);
    return;
  }
  if(!document.querySelector('#helpOverlay').hidden || !document.querySelector('#logOverlay').hidden || !document.querySelector('#voyageOverlay').hidden || !document.querySelector('#settingsOverlay').hidden || !document.querySelector('#exitOverlay').hidden){velocity.multiplyScalar(Math.exp(-6*dt));bank*=Math.exp(-7*dt);boostAmount=THREE.MathUtils.damp(boostAmount,0,5,dt);return;}
  const guidance=autopilotTarget?autopilotGuidance():null;
  if(!autopilotTarget) {
    const reverseSteering=keys.has('KeyS')&&!keys.has('KeyW')?-1:1;
    if(keys.has('KeyA')||keys.has('ArrowLeft'))targetYaw+=dt*1.35*reverseSteering;
    if(keys.has('KeyD')||keys.has('ArrowRight'))targetYaw-=dt*1.35*reverseSteering;
    const pitchInput=Number(keys.has('KeyQ')||keys.has('ArrowUp'))-Number(keys.has('KeyE')||keys.has('ArrowDown'));
    if(pitchInput)targetPitch=THREE.MathUtils.clamp(targetPitch+pitchInput*dt*1.1,-maxManualPitch,maxManualPitch);
    else {
      targetPitch=THREE.MathUtils.damp(targetPitch,0,1.6,dt);
      if(Math.abs(targetPitch)<.002)targetPitch=0;
    }
  }
  const previousYaw=yaw;
  if(autopilotTarget){
    const yawError=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));
    const pitchError=targetPitch-pitch;
    yaw+=THREE.MathUtils.clamp(yawError*(1-Math.exp(-3*dt)),-1.1*dt,1.1*dt);
    pitch+=THREE.MathUtils.clamp(pitchError*(1-Math.exp(-3*dt)),-.85*dt,.85*dt);
  }else{
    yaw=THREE.MathUtils.damp(yaw,targetYaw,reducedMotion.matches?22:12,dt);
    pitch=THREE.MathUtils.damp(pitch,targetPitch,reducedMotion.matches?22:7,dt);
  }
  const turnRate=dt>0?(yaw-previousYaw)/dt:0;
  const desiredBank=reducedMotion.matches?0:THREE.MathUtils.clamp(turnRate*.13,-.22,.22);
  bank=THREE.MathUtils.damp(bank,desiredBank,6,dt);
  shipRotation.set(pitch,yaw,bank,'YXZ');
  direction.set(0,0,-1).applyEuler(shipRotation);
  desiredVelocity.set(0,0,0);
  if(autopilotTarget&&guidance) {
    const alignment=direction.dot(guidance.toward);
    desiredVelocity.copy(direction).multiplyScalar(guidance.speed*THREE.MathUtils.clamp((alignment-.7)/.3,0,1));
    const boostTarget=THREE.MathUtils.clamp((desiredVelocity.length()-10)/38,0,1);
    boostAmount=THREE.MathUtils.damp(boostAmount,boostTarget,3.2,dt);
  } else if(discoveryDrift) {
    const nearestSurface=Math.min(...bodies.map(body=>shipPosition.distanceTo(body.group.position)-body.data.radius));
    const coastSpeed=THREE.MathUtils.clamp((nearestSurface-100)*.1,0,22);
    desiredVelocity.copy(direction).multiplyScalar(coastSpeed);
    if(coastSpeed===0)discoveryDrift=false;
  } else {
    if(keys.has('KeyW'))desiredVelocity.add(direction);
    if(keys.has('KeyS'))desiredVelocity.sub(direction);
    const forwardOnly=keys.has('KeyW')&&!keys.has('KeyS');
    const boostPressed=forwardOnly&&(keys.has('ShiftLeft')||keys.has('ShiftRight'));
    boostAmount=keys.has('KeyS')?0:THREE.MathUtils.damp(boostAmount,boostPressed?1:0,boostPressed?3.2:2.1,dt);
    if(desiredVelocity.lengthSq()>0)desiredVelocity.normalize().multiplyScalar(forwardOnly?14+boostAmount*29:14);
  }
  velocity.lerp(desiredVelocity,1-Math.exp(-4.6*dt));
  const next=shipPosition.clone().addScaledVector(velocity,dt);
  const solidBodies=[{position:new THREE.Vector3(),radius:sunRadius+2},...bodies.map(b=>({position:b.group.position,radius:b.data.radius+1.4}))];
  if(solidBodies.some(o=>next.distanceToSquared(o.position)<o.radius*o.radius)){
    velocity.set(0,0,0);
    discoveryDrift=false;
    if(autopilotTarget)stopAutopilot('Course blocked. Manual control restored.');
    return;
  }
  for(const rock of asteroidRocks){
    if(!rock.alive||next.distanceToSquared(rock.position)>=rock.radius*rock.radius)continue;
    if(hitAsteroid(rock,next))return;
  }
  if(!autopilotTarget){
    const saturn=bodies.find(body=>body.data.id==='saturn');
    if(saturn&&next.distanceToSquared(saturn.group.position)<125*125)for(const shard of saturnShards){
      if(!shard.alive||next.distanceToSquared(shard.position)>=shard.radius*shard.radius)continue;
      if(hitAsteroid(shard,next))return;
    }
  }
  shipPosition.copy(next);
}

function updateBodies(elapsed,dt) {
  sunMesh.rotation.y+=dt*.025;
  bodies.forEach(({data,group,mesh,clouds})=>{
    if(data.id==='moon')return;
    if(data.id==='comet'){updateComet(dt);return;}
    data.angle+=dt*data.speed;
    group.position.set(Math.cos(data.angle)*data.orbit*worldScale,0,Math.sin(data.angle)*data.orbit*worldScale);
    mesh.rotation.y+=dt*.08;
    if(clouds)clouds.rotation.y+=dt*.09;
  });
  const earth=bodies.find(body=>body.data.id==='earth');
  moonBody.group.position.copy(earth.group.position).add(new THREE.Vector3(Math.cos(elapsed*.14)*moonOrbitRadius,0,Math.sin(elapsed*.14)*moonOrbitRadius));
  moonBody.mesh.rotation.y+=dt*.04;
  updateSaturnRings(elapsed);
}

function updateHud(elapsed) {
  if(elapsed-lastHudUpdate<.08)return;
  lastHudUpdate=elapsed;
  if(!document.querySelector('#settingsOverlay').hidden)document.querySelector('#musicNowPlaying').textContent=`Now playing: ${shipAudio.getActiveTrackName()}`;
  const nearest=bodies.reduce((best,body)=>{
    const distance=Math.max(0,shipPosition.distanceTo(body.group.position)-body.data.radius);
    return distance<best.distance?{body,distance}:best;
  },{body:null,distance:Infinity});
  document.querySelector('#speedReadout').textContent=Math.round(velocity.length()).toString();
  document.querySelector('#nearestReadout').textContent=isWorldLocked(nearest.body.data.id)?'Unknown':nearest.body.data.name;
  document.querySelector('#distanceReadout').textContent=`${Math.round(nearest.distance)} units away`;
  if(autopilotTarget)document.querySelector('#autopilotStatus').textContent=`Flying to ${autopilotTarget.data.name} · ${Math.max(0,Math.round(shipPosition.distanceTo(autopilotTarget.group.position)-autopilotTarget.data.radius))} units`;
  let degrees=((THREE.MathUtils.radToDeg(yaw)%360)+360)%360;
  document.querySelector('#bearingReadout').textContent=`N ${String(Math.round(degrees)).padStart(3,'0')}°`;
  const bankDegrees=Math.round(Math.abs(THREE.MathUtils.radToDeg(bank)));
  const pitchDegrees=Math.round(Math.abs(THREE.MathUtils.radToDeg(pitch)));
  document.querySelector('#bankReadout').textContent=bankDegrees>2?`BANK ${bank>0?'LEFT':'RIGHT'} ${bankDegrees}°`:pitchDegrees>2?`NOSE ${pitch>0?'UP':'DOWN'} ${pitchDegrees}°`:'FREE FLIGHT';
  if(discoveryDrift)document.querySelector('#bankReadout').textContent='COASTING';
  if(boostAmount>.45)document.querySelector('#bankReadout').textContent='BOOST ENGAGED';
  if(autopilotTarget)document.querySelector('#bankReadout').textContent='AUTOPILOT';
  updateSignal();
  document.querySelector('.hud-arc').style.transform=`rotate(${THREE.MathUtils.radToDeg(bank)*.7}deg)`;
  const hit=pointedPlanet();
  const landmarkTarget=pointedLandmark(hit);
  const label=document.querySelector('#objectLabel');
  if(landmarkTarget){
    const {landmark,hit:featureHit}=landmarkTarget;
    const name=scannedLandmarks.has(landmark.id)?landmark.name:'Unidentified landmark';
    label.textContent=scannedLandmarks.has(landmark.id)?name:`${name} · ${shipPosition.distanceTo(featureHit.point)<=landmark.range?'Hold R to scan':'move closer to scan'}`;
  }else if(hit){
    const id=hit.object.userData.id;
    if(isWorldLocked(id)){
      label.textContent=`Unknown ${id==='comet'?'object':'world'} · ${scanRangeFor(id)?'Hold R to scan':'move closer to scan'}`;
    }else{
      const scanHint=gameMode==='discovery'?' · Scanned':'';
      label.textContent=`${hit.object.userData.name} · F ${!guideHidden&&selectedId===id?'close':'info'}${scanHint}`;
    }
  }else label.textContent='';
}

function updateSignal() {
  const readout=document.querySelector('#signalReadout');
  if(gameMode!=='discovery'||introActive||introDive||returningToIntro||previewTarget||unlockCinematicActive||
    !document.querySelector('#helpOverlay').hidden||!document.querySelector('#logOverlay').hidden||!document.querySelector('#voyageOverlay').hidden||!document.querySelector('#settingsOverlay').hidden||!document.querySelector('#exitOverlay').hidden){
    readout.hidden=true;
    return;
  }
  const unknown=[{data:sunData,position:sunMesh.position},...bodies.map(body=>({data:body.data,position:body.group.position}))]
    .filter(body=>!scannedBodies.has(body.data.id));
  const target=unknown.reduce((best,body)=>{
    const distance=shipPosition.distanceTo(body.position)-body.data.radius;
    return distance<best.distance?{body,distance}:best;
  },{body:null,distance:Infinity});
  if(!target.body||target.distance>1500){readout.hidden=true;return;}
  const offset=temp.copy(target.body.position).sub(shipPosition);
  const targetYaw=Math.atan2(-offset.x,-offset.z);
  const angle=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));
  const degrees=Math.round(Math.abs(THREE.MathUtils.radToDeg(angle)));
  const bearing=degrees>155?'BEHIND':degrees<8?'AHEAD':`${degrees}° ${angle>0?'LEFT':'RIGHT'}`;
  const elevation=Math.atan2(offset.y,Math.hypot(offset.x,offset.z))-pitch;
  const vertical=Math.abs(elevation)>.3?` · ${elevation>0?'ABOVE':'BELOW'}`:'';
  const strength=THREE.MathUtils.clamp(1-target.distance/1500,0,1);
  const quality=strength>.68?'STRONG':strength>.3?'DETECTED':'FAINT';
  document.querySelector('#signalText').textContent=`UNIDENTIFIED SIGNAL · ${bearing}${vertical} · ${quality}`;
  readout.hidden=false;
  shipAudio.signalPulse(strength,Math.sin(angle));
}

function resize() {
  const width=window.innerWidth,height=window.innerHeight;
  renderer.setSize(width,height,false);
  const pixelRatio=Math.min(window.devicePixelRatio||1,1.8);
  speedCanvas.width=Math.round(width*pixelRatio);
  speedCanvas.height=Math.round(height*pixelRatio);
  speedContext.setTransform(pixelRatio,0,0,pixelRatio,0,0);
  camera.aspect=width/height;camera.updateProjectionMatrix();
}

function drawBoostStreaks(elapsed) {
  const width=window.innerWidth,height=window.innerHeight;
  speedContext.clearRect(0,0,width,height);
  if(reducedMotion.matches||boostAmount<.08)return;
  const reach=Math.hypot(width,height)*.52;
  const intensity=boostAmount*boostAmount;
  speedContext.lineWidth=1;
  for(let i=0;i<48;i++) {
    const angle=hash(i,19)*Math.PI*2;
    const phase=(hash(i,23)+elapsed*(.22+hash(i,29)*.1))%1;
    const radius=(.12+phase*.8)*reach;
    const length=(12+phase*40)*intensity;
    const dx=Math.cos(angle),dy=Math.sin(angle);
    speedContext.strokeStyle=`rgba(255,255,255,${intensity*(.045+phase*.13)})`;
    speedContext.beginPath();
    speedContext.moveTo(width/2+dx*radius,height/2+dy*radius);
    speedContext.lineTo(width/2+dx*(radius+length),height/2+dy*(radius+length));
    speedContext.stroke();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  const elapsed=clock.elapsedTime;
  updateBodies(elapsed,dt);
  updateAsteroids(dt);
  moveShip(dt);
  updateVoyageProgress();
  updateFlybyLog();
  const thrust=!introActive&&!introDive&&!returningToIntro&&(Boolean(autopilotTarget)||keys.has('KeyW')||keys.has('KeyS'));
  shipAudio.update(velocity.length(),boostAmount,Boolean(previewTarget),thrust);
  updateCamera(dt);
  updateIdleShip(elapsed,dt);
  updateScanner(dt,elapsed);
  drawBoostStreaks(elapsed);
  updateHud(elapsed);
  if(!introActive&&elapsed-lastFlightSave>.5){saveFlightState();lastFlightSave=elapsed;}
  renderer.render(scene,camera);
  capturePhoto();
  captureLogSnapshots();
  if(!firstFrameRendered){
    firstFrameRendered=true;
    requestAnimationFrame(()=>document.querySelector('#sceneCurtain').classList.remove('covered'));
  }
}

let firstFrameRendered=false;
createSolarSystem();
createShip();
setupStart();
loadDiscoveries();
buildPlanetList();
selectPlanet('earth');
loadNames();
setupControls();
setupAudioControls();
setupDestinationToggle();
setupGuideToggle();
setupGameModes();
setupVoyages();
// Apply the saved mode after the discovery gate is active. This populates the
// guide in free exploration while keeping unscanned worlds masked in Discovery.
selectPlanet(selectedId);
setupIntro();
resize();
window.addEventListener('resize',resize);
window.addEventListener('pagehide',saveFlightState);
animate();
