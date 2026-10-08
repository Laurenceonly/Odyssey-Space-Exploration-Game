import * as THREE from 'three';
import './style.css';

const canvas = document.querySelector('#universe');
const speedCanvas = document.querySelector('#speedFx');
const speedContext = speedCanvas.getContext('2d');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.4;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030813);
scene.fog = new THREE.FogExp2(0x030813, 0.00017);
const camera = new THREE.PerspectiveCamera(67, 1, 0.1, 5000);
camera.rotation.order = 'YXZ';
const clock = new THREE.Clock();
const shipPosition = new THREE.Vector3();
const shipRotation = new THREE.Euler(0, 0, 0, 'YXZ');
let shipMesh;
let sunMesh;
const engineGlows = [];
const boostPlumes = [];
let boostAmount = 0;
let cameraMode = 'cockpit';
let previewTarget = null;
let cameraTransition = null;
const direction = new THREE.Vector3();
const levelDirection = new THREE.Vector3();
const desiredVelocity = new THREE.Vector3();
const velocity = new THREE.Vector3();
const temp = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2();
const keys = new Set();
const bodies = [];
const clickableMeshes = [];
let selectedId = 'earth';
let yaw = 0;
let pitch = 0;
let targetYaw = 0;
let targetPitch = 0;
let manualPitchActive = false;
let bank = 0;
let autopilotTarget = null;
let autopilotMessage = 'Manual flight';
let autopilotWaypoint = null;
let lastHudUpdate = 0;
let shipName = 'Odyssey';
let pilotName = 'Explorer';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const maxManualPitch = THREE.MathUtils.degToRad(28);

const planets = [
  { id:'mercury', name:'Mercury', index:'01', symbol:'☿', type:'ROCKY WORLD', distance:'0.39 AU', diameter:'4,879 km', description:'A cratered little world racing closest to the Sun.', orbit:34, radius:1.5, angle:1.45, speed:.00013, color:'#999b9a', base:[143,143,139], style:'rock', gradient:'radial-gradient(circle at 29% 24%,#c6c6bf,#727879 57%,#252c32 92%)' },
  { id:'venus', name:'Venus', index:'02', symbol:'♀', type:'CLOUD WORLD', distance:'0.72 AU', diameter:'12,104 km', description:'A brilliant globe hidden beneath thick golden clouds.', orbit:47, radius:3.8, angle:-.75, speed:.00009, color:'#d8ad7e', base:[201,157,109], style:'cloud', gradient:'radial-gradient(circle at 28% 20%,#f7d4a2,#c28c60 60%,#3a2c2b 95%)' },
  { id:'earth', name:'Earth', index:'03', symbol:'♁', type:'TERRESTRIAL', distance:'1.00 AU', diameter:'12,742 km', description:'Our pale blue home, wrapped in a thin, living atmosphere.', orbit:65, radius:4.1, angle:.58, speed:.00007, color:'#4b9ac9', base:[42,98,166], style:'earth', gradient:'radial-gradient(circle at 27% 23%,#85c6d3,#3488b7 44%,#174c78 70%,#071a32 95%)' },
  { id:'mars', name:'Mars', index:'04', symbol:'♂', type:'ROCKY WORLD', distance:'1.52 AU', diameter:'6,779 km', description:'Rust-red deserts, giant volcanoes, and ancient riverbeds.', orbit:84, radius:2.2, angle:2.6, speed:.00005, color:'#c97759', base:[174,83,59], style:'rock', gradient:'radial-gradient(circle at 29% 22%,#e2a379,#a94d38 62%,#331f23 96%)' },
  { id:'jupiter', name:'Jupiter', index:'05', symbol:'♃', type:'GAS GIANT', distance:'5.20 AU', diameter:'139,820 km', description:'A vast storm-wrapped giant with bands of amber and cream.', orbit:123, radius:11.4, angle:-2.45, speed:.000028, color:'#d0a685', base:[190,151,123], style:'gas', gradient:'repeating-linear-gradient(175deg,#ead5b6 0 11px,#c29170 12px 20px,#a66f5b 21px 27px,#dfba99 28px 38px)' },
  { id:'saturn', name:'Saturn', index:'06', symbol:'♄', type:'RINGED GIANT', distance:'9.58 AU', diameter:'116,460 km', description:'A luminous world encircled by a broad field of icy rings.', orbit:164, radius:9.2, angle:1.95, speed:.00002, color:'#d8c39b', base:[194,174,129], style:'gas', gradient:'repeating-linear-gradient(175deg,#e7d8b5 0 14px,#c6ae83 15px 23px,#ab946e 24px 29px,#decda7 30px 41px)' },
  { id:'uranus', name:'Uranus', index:'07', symbol:'♅', type:'ICE GIANT', distance:'19.2 AU', diameter:'50,724 km', description:'A quiet cyan giant turning on its side in the outer dark.', orbit:204, radius:6.6, angle:-1.48, speed:.000013, color:'#98d7db', base:[131,192,195], style:'ice', gradient:'radial-gradient(circle at 28% 22%,#c7efeb,#75b8c4 67%,#254e67 95%)' },
  { id:'neptune', name:'Neptune', index:'08', symbol:'♆', type:'ICE GIANT', distance:'30.1 AU', diameter:'49,244 km', description:'Deep blue, windswept, and far beyond the familiar worlds.', orbit:243, radius:6.3, angle:2.95, speed:.000009, color:'#5279ce', base:[49,83,164], style:'ice', gradient:'radial-gradient(circle at 27% 22%,#789bdc,#3452a6 68%,#152454 96%)' },
];
const moonData = {id:'moon',name:'Moon',index:'03A',seed:9,symbol:'☾',type:'EARTH SATELLITE',distance:'1.00 AU',diameter:'3,474 km',description:'Earth’s cratered companion, with ancient highlands and quiet maria.',radius:1.25,color:'#aeb9c0',base:[151,157,159],style:'rock',gradient:'radial-gradient(circle at 28% 24%,#d3d5d0,#8a9499 58%,#343b42 96%)'};
const destinations=[...planets.slice(0,3),moonData,...planets.slice(3)];
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
  surface.width = 512;
  surface.height = 256;
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
      }
      const p=(y*surface.width+x)*4;
      frame.data[p]=r;
      frame.data[p+1]=g;
      frame.data[p+2]=b;
      frame.data[p+3]=255;
    }
  }
  ctx.putImageData(frame,0,0);
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
  const orbit=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0x70a5ac,transparent:true,opacity:.11,depthWrite:false}));
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

function createSolarSystem() {
  createStars();
  scene.add(new THREE.AmbientLight(0xb5d0e8, .78));
  const sunlight=new THREE.PointLight(0xffe6bc,2300,0,1.05);
  sunlight.position.set(0,0,0);scene.add(sunlight);
  sunMesh=new THREE.Mesh(new THREE.SphereGeometry(12,64,40),new THREE.MeshBasicMaterial({map:surfaceTexture({id:'sun',index:'00',style:'sun',base:[255,171,72]}),toneMapped:false}));
  sunMesh.userData.name='Sun';sunMesh.userData.radius=12;
  scene.add(sunMesh);clickableMeshes.push(sunMesh);
  scene.add(makeGlow('255,151,59',88,.4));
  scene.add(makeGlow('255,207,112',40,.48));
  const asteroidPositions=[];
  for(let i=0;i<650;i++) {
    const angle=hash(i,5)*Math.PI*2;
    const radius=98+hash(i,6)*14;
    asteroidPositions.push(Math.cos(angle)*radius,(hash(i,7)-.5)*3,Math.sin(angle)*radius);
  }
  const asteroidGeo=new THREE.BufferGeometry();asteroidGeo.setAttribute('position',new THREE.Float32BufferAttribute(asteroidPositions,3));
  scene.add(new THREE.Points(asteroidGeo,new THREE.PointsMaterial({color:0x8b958f,size:.4,transparent:true,opacity:.6})));
  planets.forEach((planet)=>{
    makeOrbit(planet.orbit);
    const group=new THREE.Group();
    const mesh=new THREE.Mesh(new THREE.SphereGeometry(planet.radius,64,40),new THREE.MeshStandardMaterial({map:surfaceTexture(planet),roughness:1,metalness:0,emissive:new THREE.Color(planet.color),emissiveIntensity:.035}));
    mesh.rotation.z=planet.id==='uranus'?1.65:.1;
    mesh.userData.name=planet.name;
    mesh.userData.id=planet.id;
    mesh.userData.radius=planet.radius;
    group.add(mesh);
    if(planet.id==='earth') {
      const air=new THREE.Mesh(new THREE.SphereGeometry(planet.radius*1.055,36,24),new THREE.MeshBasicMaterial({color:0x83cef7,transparent:true,opacity:.095,side:THREE.BackSide,depthWrite:false}));
      group.add(air);
      group.add(makeGlow('66,147,231',18,.17));
      const lunarOrbit=new THREE.Mesh(new THREE.RingGeometry(9.98,10.02,128),new THREE.MeshBasicMaterial({color:0x76909b,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false}));
      lunarOrbit.rotation.x=-Math.PI/2;group.add(lunarOrbit);
    }
    if(planet.id==='saturn') makeRings(group,planet.radius*1.24,planet.radius*2.15);
    if(planet.id==='uranus') makeRings(group,planet.radius*1.35,planet.radius*1.75);
    group.position.set(Math.cos(planet.angle)*planet.orbit,0,Math.sin(planet.angle)*planet.orbit);
    scene.add(group);
    bodies.push({data:planet,group,mesh});
    clickableMeshes.push(mesh);
    if(planet.id==='earth') {
      const moonGroup=new THREE.Group();
      const moonMesh=new THREE.Mesh(new THREE.SphereGeometry(moonData.radius,40,28),new THREE.MeshStandardMaterial({map:surfaceTexture(moonData),roughness:1}));
      moonMesh.userData.name='Moon';moonMesh.userData.id='moon';moonMesh.userData.radius=moonData.radius;
      moonGroup.add(moonMesh);
      moonGroup.position.copy(group.position).add(new THREE.Vector3(10,0,0));
      scene.add(moonGroup);
      moonBody={data:moonData,group:moonGroup,mesh:moonMesh};
      bodies.push(moonBody);
      clickableMeshes.push(moonMesh);
    }
  });
}

function lookAtPoint(point) {
  direction.copy(point).sub(shipPosition).normalize();
  yaw=Math.atan2(-direction.x,-direction.z);
  pitch=Math.asin(THREE.MathUtils.clamp(direction.y,-1,1));
  targetYaw=yaw;
  targetPitch=pitch;
  manualPitchActive=false;
}

function setupStart() {
  const earth=bodies.find(b=>b.data.id==='earth');
  shipPosition.copy(earth.group.position).add(new THREE.Vector3(10,4,18));
  lookAtPoint(earth.group.position);
  updateCamera(0,true);
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
  if(t===1)cameraTransition=null;
}

function updateCamera(dt,instant=false) {
  const targetFov=previewTarget?53:67+(reducedMotion.matches?0:boostAmount*5);
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
  shipMesh.visible=cameraMode!=='cockpit';
  if(previewTarget) {
    const center=previewTarget.group.position;
    const radius=previewTarget.data.radius;
    const sunward=previewTarget.data.id==='moon'
      ?center.clone().sub(bodies.find(body=>body.data.id==='earth').group.position).normalize()
      :center.clone().multiplyScalar(-1).normalize();
    const viewPosition=center.clone().addScaledVector(sunward,radius*2.8+6).add(new THREE.Vector3(0,radius*.55+2,0));
    camera.position.copy(viewPosition);
    camera.lookAt(center);
    applyCameraTransition(dt);
    return;
  }
  if(cameraMode==='cockpit') {
    camera.position.copy(shipPosition);
    camera.rotation.set(pitch,yaw,reducedMotion.matches?0:bank*.28,'YXZ');
    applyCameraTransition(dt);
    return;
  }
  const targetPosition=shipPosition.clone();
  levelDirection.set(-Math.sin(yaw),0,-Math.cos(yaw));
  if(cameraMode==='chase') {
    targetPosition.addScaledVector(levelDirection,-9).y+=2.8;
  } else {
    targetPosition.addScaledVector(levelDirection,8).y+=2;
  }
  if(instant || cameraTransition || camera.position.distanceToSquared(targetPosition)>2500)camera.position.copy(targetPosition);
  else camera.position.lerp(targetPosition,1-Math.exp(-9*dt));
  if(cameraMode==='chase')camera.lookAt(temp.copy(shipPosition).addScaledVector(levelDirection,3));
  else camera.lookAt(shipPosition);
  if(!reducedMotion.matches)camera.rotateZ(cameraMode==='chase'?bank*.13:-bank*.08);
  applyCameraTransition(dt);
}

function setCameraMode(mode) {
  if(!['cockpit','chase','front'].includes(mode))return;
  exitPreview();
  cameraMode=mode;
  document.querySelector('#app').classList.toggle('camera-front',mode==='front');
  document.querySelector('#app').classList.toggle('camera-chase',mode==='chase');
  document.querySelectorAll('[data-camera]').forEach(button=>button.setAttribute('aria-pressed',button.dataset.camera===mode?'true':'false'));
  updateCamera(0,true);
}

function buildPlanetList() {
  const list=document.querySelector('#planetList');
  destinations.forEach(planet=>{
    const button=document.createElement('button');
    button.type='button';button.className='planet-row';button.dataset.id=planet.id;
    button.style.setProperty('--planet-color',planet.color);
    button.setAttribute('aria-label',`Select ${planet.name}`);
    button.innerHTML=`<span class="planet-mini ${planet.id==='saturn'?'saturn':''}"></span><span class="planet-row-name">${planet.name}</span><span class="planet-row-index">${planet.index}</span>`;
    button.addEventListener('click',()=>selectPlanet(planet.id,true));
    list.append(button);
  });
}

function selectPlanet(id,preview=false) {
  const planet=destinations.find(p=>p.id===id);
  if(!planet)return;
  if(autopilotTarget&&autopilotTarget.data.id!==id)stopAutopilot('Course changed. Manual flight.');
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
  art.classList.toggle('saturn-art',id==='saturn');
  art.style.setProperty('--art-gradient',planet.gradient);
  art.style.setProperty('--art-glow',planet.color);
  if(!autopilotTarget)document.querySelector('#autopilotButton').innerHTML=`Fly to ${planet.name} <span class="button-arrow">↗</span>`;
  if(preview) {
    beginCameraTransition(1.35);
    previewTarget=bodies.find(body=>body.data.id===id);
    document.querySelector('#previewName').textContent=`${planet.name.toUpperCase()} / PREVIEW`;
    document.querySelector('#previewBanner').hidden=false;
    document.querySelector('#app').classList.add('destination-preview');
    updateCamera(0,true);
  }
}

function exitPreview() {
  if(!previewTarget)return;
  beginCameraTransition(1.05);
  previewTarget=null;
  document.querySelector('#previewBanner').hidden=true;
  document.querySelector('#app').classList.remove('destination-preview');
  updateCamera(0,true);
}

function updateAutopilotUI() {
  const button=document.querySelector('#autopilotButton');
  button.setAttribute('aria-pressed',autopilotTarget?'true':'false');
  button.innerHTML=autopilotTarget?`Cancel flight <span class="button-arrow">×</span>`:`Fly to ${destinations.find(p=>p.id===selectedId).name} <span class="button-arrow">↗</span>`;
  document.querySelector('#autopilotStatus').textContent=autopilotMessage;
  document.querySelector('#app').classList.toggle('autopilot-active',Boolean(autopilotTarget));
}

function stopAutopilot(message='Manual flight') {
  autopilotTarget=null;
  autopilotWaypoint=null;
  autopilotMessage=message;
  updateAutopilotUI();
}

function toggleAutopilot() {
  if(autopilotTarget){stopAutopilot();return;}
  exitPreview();
  autopilotTarget=bodies.find(body=>body.data.id===selectedId);
  autopilotWaypoint=null;
  autopilotMessage=`Course set for ${autopilotTarget.data.name}`;
  keys.clear();
  manualPitchActive=false;
  updateAutopilotUI();
}

function setupControls() {
  const prevent=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
  const manualCodes=new Set(['KeyW','KeyS','KeyA','KeyD','KeyQ','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight']);
  document.addEventListener('keydown',event=>{
    if(event.code==='Escape') {closeHelp();closeSettings();exitPreview();return;}
    if(event.target instanceof HTMLInputElement || !document.querySelector('#helpOverlay').hidden || !document.querySelector('#settingsOverlay').hidden)return;
    if(prevent.has(event.code))event.preventDefault();
    if(event.code==='KeyC' && !event.repeat) {
      const modes=['cockpit','chase','front'];
      setCameraMode(modes[(modes.indexOf(cameraMode)+1)%modes.length]);
    }
    if(event.code==='KeyP' && !event.repeat){toggleAutopilot();return;}
    if(previewTarget&&manualCodes.has(event.code))exitPreview();
    if(autopilotTarget&&manualCodes.has(event.code))stopAutopilot('Manual control restored');
    keys.add(event.code);
  });
  document.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>keys.clear());
  document.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',()=>setCameraMode(button.dataset.camera)));
  document.querySelector('#autopilotButton').addEventListener('click',toggleAutopilot);
  document.querySelector('#returnToShip').addEventListener('click',exitPreview);
  document.querySelector('#helpButton').addEventListener('click',openHelp);
  document.querySelector('#closeHelp').addEventListener('click',closeHelp);
  document.querySelector('#startExploring').addEventListener('click',closeHelp);
  document.querySelector('#helpOverlay').addEventListener('click',event=>{if(event.target.id==='helpOverlay')closeHelp();});
  document.querySelector('#settingsButton').addEventListener('click',openSettings);
  document.querySelector('#closeSettings').addEventListener('click',closeSettings);
  document.querySelector('#settingsOverlay').addEventListener('click',event=>{if(event.target.id==='settingsOverlay')closeSettings();});
  document.querySelector('#settingsForm').addEventListener('submit',event=>{
    event.preventDefault();
    shipName=document.querySelector('#shipNameInput').value.trim().slice(0,20)||'Odyssey';
    pilotName=document.querySelector('#pilotNameInput').value.trim().slice(0,20)||'Explorer';
    updateNameReadout();
    try{localStorage.setItem('odyssey-names',JSON.stringify({shipName,pilotName}));}catch{}
    closeSettings();
  });
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
  if(surfaceDistance<=10.5) {
    velocity.set(0,0,0);
    lookAtPoint(target);
    stopAutopilot(`Arrived near ${body.data.name}`);
    return null;
  }
  if(autopilotWaypoint&&shipPosition.distanceTo(autopilotWaypoint)<4)autopilotWaypoint=null;
  if(!autopilotWaypoint) {
    const route=target.clone().sub(shipPosition);
    const routeLength=route.length();
    const forward=route.clone().normalize();
    for(const obstacle of [{position:new THREE.Vector3(),radius:14},...bodies.filter(other=>other!==body).map(other=>({position:other.group.position,radius:other.data.radius+1.4}))]) {
      const along=obstacle.position.clone().sub(shipPosition).dot(forward);
      if(along<0||along>routeLength)continue;
      const closest=shipPosition.clone().addScaledVector(forward,along);
      if(closest.distanceTo(obstacle.position)>obstacle.radius+6)continue;
      const lateral=new THREE.Vector3(-forward.z,0,forward.x).normalize();
      if(lateral.dot(shipPosition.clone().sub(obstacle.position))<0)lateral.negate();
      autopilotWaypoint=obstacle.position.clone().addScaledVector(lateral,obstacle.radius+11).addScaledVector(forward,-obstacle.radius-5);
      autopilotWaypoint.y=Math.max(shipPosition.y,7);
      break;
    }
  }
  const aim=autopilotWaypoint||target;
  const toward=aim.clone().sub(shipPosition).normalize();
  const desiredYaw=Math.atan2(-toward.x,-toward.z);
  targetYaw=yaw+Math.atan2(Math.sin(desiredYaw-yaw),Math.cos(desiredYaw-yaw));
  targetPitch=THREE.MathUtils.clamp(Math.asin(THREE.MathUtils.clamp(toward.y,-1,1)),-Math.PI/3,Math.PI/3);
  const remaining=autopilotWaypoint?shipPosition.distanceTo(autopilotWaypoint):surfaceDistance-10;
  const speed=THREE.MathUtils.clamp(remaining*1.2,0,18);
  return {toward,speed};
}

function moveShip(dt) {
  if(!document.querySelector('#helpOverlay').hidden || !document.querySelector('#settingsOverlay').hidden){velocity.multiplyScalar(Math.exp(-6*dt));bank*=Math.exp(-7*dt);boostAmount=THREE.MathUtils.damp(boostAmount,0,5,dt);return;}
  const guidance=autopilotTarget?autopilotGuidance():null;
  if(!autopilotTarget) {
    if(keys.has('KeyA')||keys.has('ArrowLeft'))targetYaw+=dt*1.35;
    if(keys.has('KeyD')||keys.has('ArrowRight'))targetYaw-=dt*1.35;
    const pitchInput=Number(keys.has('KeyQ')||keys.has('ArrowUp'))-Number(keys.has('KeyE')||keys.has('ArrowDown'));
    if(pitchInput){targetPitch=THREE.MathUtils.clamp(targetPitch+pitchInput*dt*1.1,-maxManualPitch,maxManualPitch);manualPitchActive=true;}
    else if(manualPitchActive){
      targetPitch=THREE.MathUtils.damp(targetPitch,0,.7,dt);
      if(Math.abs(targetPitch)<.002){targetPitch=0;manualPitchActive=false;}
    }
  }
  const previousYaw=yaw;
  yaw=THREE.MathUtils.damp(yaw,targetYaw,reducedMotion.matches?22:12,dt);
  pitch=THREE.MathUtils.damp(pitch,targetPitch,reducedMotion.matches?22:7,dt);
  const turnRate=dt>0?(yaw-previousYaw)/dt:0;
  const desiredBank=reducedMotion.matches?0:THREE.MathUtils.clamp(turnRate*.13,-.22,.22);
  bank=THREE.MathUtils.damp(bank,desiredBank,6,dt);
  shipRotation.set(pitch,yaw,bank,'YXZ');
  direction.set(0,0,-1).applyEuler(shipRotation);
  desiredVelocity.set(0,0,0);
  if(autopilotTarget&&guidance) {
    const alignment=direction.dot(guidance.toward);
    desiredVelocity.copy(direction).multiplyScalar(guidance.speed*THREE.MathUtils.clamp((alignment-.4)/.6,0,1));
    boostAmount=THREE.MathUtils.damp(boostAmount,guidance.speed>12?.25:0,2,dt);
  } else {
    if(keys.has('KeyW'))desiredVelocity.add(direction);
    if(keys.has('KeyS'))desiredVelocity.sub(direction);
    const boostPressed=(keys.has('ShiftLeft')||keys.has('ShiftRight'))&&desiredVelocity.lengthSq()>0;
    boostAmount=THREE.MathUtils.damp(boostAmount,boostPressed?1:0,boostPressed?3.2:2.1,dt);
    if(desiredVelocity.lengthSq()>0)desiredVelocity.normalize().multiplyScalar(14+boostAmount*29);
  }
  velocity.lerp(desiredVelocity,1-Math.exp(-4.6*dt));
  const next=shipPosition.clone().addScaledVector(velocity,dt);
  const obstacles=[{position:new THREE.Vector3(),radius:14},...bodies.map(b=>({position:b.group.position,radius:b.data.radius+1.4}))];
  const hit=obstacles.some(o=>next.distanceToSquared(o.position)<o.radius*o.radius);
  if(hit){velocity.set(0,0,0);if(autopilotTarget)stopAutopilot('Course blocked. Manual control restored.');}
  else shipPosition.copy(next);
}

function updateBodies(elapsed,dt) {
  sunMesh.rotation.y+=dt*.025;
  bodies.forEach(({data,group,mesh})=>{
    if(data.id==='moon')return;
    data.angle+=dt*data.speed;
    group.position.set(Math.cos(data.angle)*data.orbit,0,Math.sin(data.angle)*data.orbit);
    mesh.rotation.y+=dt*.08;
  });
  const earth=bodies.find(body=>body.data.id==='earth');
  moonBody.group.position.copy(earth.group.position).add(new THREE.Vector3(Math.cos(elapsed*.14)*10,0,Math.sin(elapsed*.14)*10));
  moonBody.mesh.rotation.y+=dt*.04;
}

function updateHud(elapsed) {
  if(elapsed-lastHudUpdate<.08)return;
  lastHudUpdate=elapsed;
  const nearest=bodies.reduce((best,body)=>{
    const distance=Math.max(0,shipPosition.distanceTo(body.group.position)-body.data.radius);
    return distance<best.distance?{body,distance}:best;
  },{body:null,distance:Infinity});
  document.querySelector('#speedReadout').textContent=Math.round(velocity.length()).toString();
  document.querySelector('#nearestReadout').textContent=nearest.body.data.name;
  document.querySelector('#distanceReadout').textContent=`${Math.round(nearest.distance)} units away`;
  if(autopilotTarget)document.querySelector('#autopilotStatus').textContent=`Flying to ${autopilotTarget.data.name} · ${Math.max(0,Math.round(shipPosition.distanceTo(autopilotTarget.group.position)-autopilotTarget.data.radius))} units`;
  let degrees=((THREE.MathUtils.radToDeg(yaw)%360)+360)%360;
  document.querySelector('#bearingReadout').textContent=`N ${String(Math.round(degrees)).padStart(3,'0')}°`;
  const bankDegrees=Math.round(Math.abs(THREE.MathUtils.radToDeg(bank)));
  const pitchDegrees=Math.round(Math.abs(THREE.MathUtils.radToDeg(pitch)));
  document.querySelector('#bankReadout').textContent=bankDegrees>2?`BANK ${bank>0?'LEFT':'RIGHT'} ${bankDegrees}°`:pitchDegrees>2?`NOSE ${pitch>0?'UP':'DOWN'} ${pitchDegrees}°`:'FREE FLIGHT';
  if(boostAmount>.45)document.querySelector('#bankReadout').textContent='BOOST ENGAGED';
  if(autopilotTarget)document.querySelector('#bankReadout').textContent='AUTOPILOT';
  document.querySelector('.hud-arc').style.transform=`rotate(${THREE.MathUtils.radToDeg(bank)*.7}deg)`;
  const reticle=document.querySelector('.crosshair').getBoundingClientRect();
  center.set((reticle.left+reticle.width/2)/window.innerWidth*2-1,1-(reticle.top+reticle.height/2)/window.innerHeight*2);
  raycaster.setFromCamera(center,camera);
  const hits=raycaster.intersectObjects(clickableMeshes,false);
  const hit=hits.find(item=>item.distance<2000);
  document.querySelector('#objectLabel').textContent=hit?`${hit.object.userData.name}  ·  ${Math.round(hit.distance)} units`:'';
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
    speedContext.strokeStyle=`rgba(151,223,244,${intensity*(.045+phase*.13)})`;
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
  moveShip(dt);
  updateCamera(dt);
  drawBoostStreaks(elapsed);
  updateHud(elapsed);
  renderer.render(scene,camera);
}

createSolarSystem();
createShip();
setupStart();
buildPlanetList();
selectPlanet('earth');
loadNames();
setupControls();
resize();
window.addEventListener('resize',resize);
animate();
