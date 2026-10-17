import {getEarthRegion,earthRegionExits,earthExitNear,earthNextRegion} from './earth-regions.js';
import {earthRegionHeight,earthRegionWater,earthRegionWalkable} from './earth-region-terrain.js';
import {buildEarthRegionEnvironment,buildEarthExitSigns} from './earth-region-environment.js';
import {createSurfaceNotice} from './surface-notice.js';
import {earthPathDistance,earthTrailWidth,earthWoodland,earthMeadowCover,earthRegionAt,clearEarthResumePosition,EARTH_SUMMIT,EARTH_STREAM,earthStreamAt,earthGrassDryness,earthGrassDensity} from './earth-layout.js';
import * as THREE from 'three';
import { LAKE, terrainHeight as earthHeight, stepAstronaut as stepBody, walkableAt as earthWalkable, waterLevelAt as earthWater, waterCameraHeight } from './earth-physics.js';
import { createSurfaceCollider, supportAt } from './surface-collision.js';
import { createAstronaut } from './astronaut.js';
import { createBoostSmoke } from './boost-smoke.js';
import { createSwimWake } from './swim-wake.js';
import { createEarthFlowers } from './earth-flowers.js';
import { createEarthGrass } from './earth-grass.js';
import { createLandingGear } from './landing-gear.js';
import { createSurfaceScanner } from './surface-scanner.js';

import { getVisitSite, visitFeaturePosition, visitRadius, visitTerrainHeight, surveyRouteDistance } from './visit-sites.js';
import { buildPlanetEnvironment, buildSurveyBeacon } from './planet-environment.js';

export function createEarthSurface({ ship, keys, onExit, onEvent, getPilotName, reducedMotion, site=getVisitSite('earth'), hasObservation=()=>false,regionId='fernlilt',onRegionTravel=()=>{} }) {
  const isEarth=site.id==='earth',region=getEarthRegion(regionId),isFernlilt=isEarth&&region.id==='fernlilt';
  const surfaceWater=(x,z)=>isEarth?earthRegionWater(region.id,x,z):null;
  const regionCameraHeight=(x,z,y)=>{const water=surfaceWater(x,z);return water===null?y:Math.max(y,water+.3);};
  const notes={mercury:'Illustrative terrain; extreme-temperature suit protection is fictional.',venus:'Fictional shielding makes this walk possible. Real spacesuits could not protect you here.',earth:'Wind-swept grasses, sheltered groves, and a winding stream beneath an open sky.',moon:'Illustrative lunar terrain and equipment, with the Moon’s low gravity.',mars:'A reconstructed landscape inspired by ancient Martian waterways.'};
  const terrainHeight=isEarth?(x,z)=>earthRegionHeight(region.id,x,z):(x,z)=>visitTerrainHeight(site,x,z);
  const walkableAt=isEarth?(x,z)=>earthRegionWalkable(region.id,x,z):(x,z,obstacles=[])=>Math.hypot(x,z)>visitRadius(site)?'boundary':obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+.35)?'obstacle':null;
  const stepAstronaut=(body,input,dt,obstacles)=>stepBody(body,input,dt,obstacles,{terrainHeight,walkableAt,gravity:site.gravity,waterLevelAt:surfaceWater});
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(isEarth?region.sky:site.sky);
  scene.fog = isEarth?new THREE.FogExp2(region.sky,region.id==='nacreloom'?.003:region.id==='rainselve'||region.id==='ossamber'?.0018:.0007):site.fog?new THREE.FogExp2(site.sky,site.fog):null;
  const camera = new THREE.PerspectiveCamera(58, 1, .1, isEarth?5000:650);
  scene.add(new THREE.HemisphereLight(isEarth?0xd6e6fa:0xc4d2dc,isEarth?0x8b7858:0x393230,isEarth?1.55:site.kind==='imagined'?1.5:.85));
  const sun = new THREE.DirectionalLight(isEarth?0xffe3b5:site.id==='venus'?0xffcf89:0xfff4e4,isEarth?2.8:site.light??2.2);
  sun.position.set(...(site.id==='mercury'?[-95,25,-180]:site.id==='moon'?[-85,40,-60]:site.id==='uranus'?[100,25,-70]:site.id==='neptune'?[-65,35,-90]:isEarth?[-200,95,-110]:[-65,100,-48]));
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -65;
  sun.shadow.camera.right = sun.shadow.camera.top = 65;
  sun.shadow.camera.far = isEarth?420:240;
  sun.shadow.normalBias = .08;
  scene.add(sun);
  const earthSunOffset=sun.position.clone();if(isEarth)scene.add(sun.target);
  const random = (n, seed = 0) => { const v = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return v - Math.floor(v); };
  const dummy = new THREE.Object3D(), color = new THREE.Color(), obstacles = [];
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: .92, ...extra });
  function mesh(geometry, mat, position, scale, parent = scene) {
    const object = new THREE.Mesh(geometry, mat);
    if (position) object.position.set(...position);
    if (scale) object.scale.set(...scale);
    object.castShadow = object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  let environment=null,earthGrass=null,meadowGroundTime={value:0};
  if(isFernlilt) {
  const skyMaterial=new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,
    uniforms:{sunDirection:{value:sun.position.clone().normalize()}},
    vertexShader:'varying vec3 skyDirection;void main(){skyDirection=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader:[
      'varying vec3 skyDirection;uniform vec3 sunDirection;',
      'void main(){vec3 d=normalize(skyDirection);float h=pow(max(0.,d.y),.8);',
      'float sunward=pow(max(0.,dot(normalize(vec3(d.x,.08,d.z)),normalize(vec3(sunDirection.x,.08,sunDirection.z)))),5.);',
      'vec3 horizon=mix(vec3(.77,.85,.91),vec3(.95,.87,.72),sunward*.25);',
      'vec3 sky=mix(horizon,vec3(.19,.43,.69),h);',
      'float a=max(0.,dot(d,sunDirection));float halo=pow(a,380.);sky+=vec3(.11,.10,.07)*halo;',
      'float disk=smoothstep(cos(.018),cos(.015),a);vec3 sunColor=mix(vec3(1.,.95,.77),vec3(1.,.99,.91),smoothstep(cos(.016),cos(.006),a));',
      'sky=mix(sky,sunColor,disk);gl_FragColor=vec4(sky,1.);}',
    ].join('\n'),
    toneMapped:false,
  });
  const sky=mesh(new THREE.SphereGeometry(3800,48,24),skyMaterial);sky.name='grassland-daylight-sky';sky.castShadow=sky.receiveShadow=false;
  const groundGeometry = new THREE.PlaneGeometry(1280,1280,256,256);
  groundGeometry.rotateX(-Math.PI / 2);
  const positions = groundGeometry.attributes.position, colors = [];
  const straw=new THREE.Color(0xb6a170),green = new THREE.Color(0xa49362),meadowGreen=new THREE.Color(0xaf9c64),woodlandGreen=new THREE.Color(0x5d6444),ridgeGreen=new THREE.Color(0x637450),trailSoil=new THREE.Color(0x827655);
  function terrainColor(x,z,y){
    const shore=Math.hypot(x-LAKE.x,z-LAKE.z)<32?THREE.MathUtils.smoothstep(y,LAKE.level+.1,LAKE.level+1.25):1;
    color.set(0xa89c79).lerp(green,shore).lerp(meadowGreen,earthMeadowCover(x,z)*shore*.45)
      .lerp(straw,earthGrassDryness(x,z)*.65).lerp(new THREE.Color(0x827158),(1-earthGrassDensity(x,z))*.24).lerp(woodlandGreen,earthWoodland(x,z)*.5);
    const creek=earthStreamAt(x,z);
    if(creek)color.lerp(new THREE.Color(0x8b8767),(1-THREE.MathUtils.smoothstep(creek.distance,creek.width,creek.width+5))*creek.envelope*.65);
    const trailDistance=Math.min(surveyRouteDistance(site,x,z),earthPathDistance(x,z));
    const width=earthTrailWidth(x,z);
    const trail=1-THREE.MathUtils.smoothstep(trailDistance,width*.65,width+1.2);
    color.lerp(trailSoil,trail*.43).multiplyScalar(.96+random(x*.47+z*.13,8)*.08);
  }
  for(let i=0;i<positions.count;i++){
    const x=positions.getX(i),z=positions.getZ(i),y=terrainHeight(x,z);positions.setY(i,y);terrainColor(x,z,y);colors.push(color.r,color.g,color.b);
  }
  // Reserve fine triangles for the pond and its bank, where geometry matters.
  const groundIndices=[];
  for(let i=0;i<groundGeometry.index.count;i+=3){
    const a=groundGeometry.index.getX(i),b=groundGeometry.index.getX(i+1),c=groundGeometry.index.getX(i+2);
    const x=(positions.getX(a)+positions.getX(b)+positions.getX(c))/3,z=(positions.getZ(a)+positions.getZ(b)+positions.getZ(c))/3;
    if((x<=-60||x>=120||z<=-120||z>=60)&&(x<=100||x>=260||z<=-280||z>=280))groundIndices.push(a,b,c);
  }
  groundGeometry.setIndex(groundIndices);groundGeometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));groundGeometry.computeVertexNormals();
  const pondGroundGeometry=new THREE.PlaneGeometry(180,180,72,72);pondGroundGeometry.rotateX(-Math.PI/2);pondGroundGeometry.translate(30,0,-30);
  const pondPositions=pondGroundGeometry.attributes.position,pondColors=[],pondUv=pondGroundGeometry.attributes.uv;
  for(let i=0;i<pondPositions.count;i++){
    const x=pondPositions.getX(i),z=pondPositions.getZ(i),y=terrainHeight(x,z);pondPositions.setY(i,y);terrainColor(x,z,y);pondColors.push(color.r,color.g,color.b);pondUv.setXY(i,(x+640)/1280,(640-z)/1280);
  }
  const pondIndices=[];
  for(let i=0;i<pondGroundGeometry.index.count;i+=3){
    const ids=[0,1,2].map(j=>pondGroundGeometry.index.getX(i+j));
    if(ids.reduce((s,j)=>s+pondPositions.getX(j),0)/3<100)pondIndices.push(...ids);
  }
  pondGroundGeometry.setIndex(pondIndices);
  pondGroundGeometry.setAttribute('color',new THREE.Float32BufferAttribute(pondColors,3));pondGroundGeometry.computeVertexNormals();
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureCanvas.height = 256;
  const ctx = textureCanvas.getContext('2d');
  ctx.fillStyle='#ddd8c6';ctx.fillRect(0,0,256,256);
  // Fine interwoven strokes give distant ground a continuous grassy grain.
  // Neutral tones retain the green/sand/trail colors of the terrain vertices.
  for(let i=0;i<20000;i++){
    const x=random(i,3)*256,y=random(i,4)*256,length=1.5+random(i,5)*5;
    ctx.strokeStyle=i%3?'rgba(90,86,58,.11)':'rgba(255,255,230,.28)';
    ctx.lineWidth=.45+random(i,6)*.45;ctx.beginPath();ctx.moveTo(x,y);
    ctx.quadraticCurveTo(x+length*.35,y-length*.4,x+length*.65,y-length);ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(320,320);
  const groundMaterial=material(0xffffff,{vertexColors:true,map:texture});
  groundMaterial.onBeforeCompile=shader=>{
    shader.uniforms.meadowGroundTime=meadowGroundTime;
    shader.vertexShader='varying vec3 meadowGroundWorld;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nmeadowGroundWorld=(modelMatrix*vec4(position,1.)).xyz;');
    shader.fragmentShader='varying vec3 meadowGroundWorld;uniform float meadowGroundTime;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',
      '#include <color_fragment>\nfloat meadowGrain=sin(meadowGroundWorld.x*3.1+sin(meadowGroundWorld.z*4.7))*sin(meadowGroundWorld.z*2.8);\nfloat meadowWave=sin(meadowGroundWorld.x*.032+meadowGroundWorld.z*.018-meadowGroundTime*.65);float cloudShade=.94+.06*smoothstep(-.4,.7,sin(meadowGroundWorld.x*.008+meadowGroundTime*.022)+.6*sin(meadowGroundWorld.z*.011-meadowGroundTime*.016));\nfloat distantMeadow=smoothstep(35.,140.,length(cameraPosition-meadowGroundWorld));\ndiffuseColor.rgb*=cloudShade*mix(1.,.96+.055*meadowGrain+.045*meadowWave,distantMeadow);');
  };
  groundMaterial.customProgramCacheKey=()=> 'odyssey-continuous-meadow-ground-v1';

  const ground=mesh(groundGeometry,groundMaterial);ground.castShadow=false;ground.name='fernlilt-ground';
  const pondGround=mesh(pondGroundGeometry,groundMaterial);pondGround.castShadow=false;pondGround.name='pond-bank-ground';
  // Fine channel banks agree with the water and walking surface.
  const creekGroundGeometry=new THREE.PlaneGeometry(160,560,80,280);
  creekGroundGeometry.rotateX(-Math.PI/2);creekGroundGeometry.translate(180,0,0);
  const creekVertices=creekGroundGeometry.attributes.position,creekColors=[],creekUv=creekGroundGeometry.attributes.uv;
  for(let i=0;i<creekVertices.count;i++){
    const x=creekVertices.getX(i),z=creekVertices.getZ(i),y=terrainHeight(x,z);
    creekVertices.setY(i,y);terrainColor(x,z,y);creekColors.push(color.r,color.g,color.b);
    creekUv.setXY(i,(x+640)/1280,(640-z)/1280);
  }
  creekGroundGeometry.setAttribute('color',new THREE.Float32BufferAttribute(creekColors,3));creekGroundGeometry.computeVertexNormals();
  const creekGround=mesh(creekGroundGeometry,groundMaterial);creekGround.name='stream-bank-ground';creekGround.castShadow=false;
  // A coarse outer ring carries the landscape to the atmospheric horizon.
  const horizonGeometry=new THREE.PlaneGeometry(6000,6000,300,300);horizonGeometry.rotateX(-Math.PI/2);
  const horizonPosition=horizonGeometry.attributes.position,horizonColors=[],horizonIndices=[];
  for(let i=0;i<horizonPosition.count;i++){
    const x=horizonPosition.getX(i),z=horizonPosition.getZ(i);horizonPosition.setY(i,terrainHeight(x,z));
    color.copy(green).lerp(meadowGreen,earthMeadowCover(x,z)*.4).lerp(straw,earthGrassDryness(x,z)*.65);horizonColors.push(color.r,color.g,color.b);
  }
  for(let i=0;i<horizonGeometry.index.count;i+=3){
    const indices=[0,1,2].map(j=>horizonGeometry.index.getX(i+j));
    const x=indices.reduce((sum,j)=>sum+horizonPosition.getX(j),0)/3,z=indices.reduce((sum,j)=>sum+horizonPosition.getZ(j),0)/3;
    if(Math.abs(x)>=640||Math.abs(z)>=640)horizonIndices.push(...indices);
  }
  horizonGeometry.setIndex(horizonIndices);horizonGeometry.setAttribute('color',new THREE.Float32BufferAttribute(horizonColors,3));horizonGeometry.computeVertexNormals();
  const horizon=mesh(horizonGeometry,groundMaterial);horizon.name='grassland-horizon';horizon.castShadow=false;

  const waterMaterial = new THREE.ShaderMaterial({
    uniforms: { time: { value: 0 } },
    vertexShader: 'varying vec3 world; void main(){world=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(world,1.);}',
    fragmentShader: [
      'varying vec3 world; uniform float time;',
      'void main(){vec2 p=world.xz;',
      'float wave=sin(p.x*1.8+time*.8)*sin(p.y*2.3-time*.65)+sin(p.x*.55+p.y*.9+time*.4);',
      'vec3 normal=normalize(vec3(.06*cos(p.x*1.8+time*.8),1.,.08*cos(p.y*2.3-time*.65)));',
      'vec3 view=normalize(cameraPosition-world);',
      'float fresnel=pow(1.-max(0.,dot(view,normal)),3.);',
      'float shine=pow(max(0.,dot(reflect(-normalize(vec3(-.5,1.,-.4)),normal),view)),160.);',
      'vec3 c=mix(vec3(.035,.15,.16),vec3(.28,.45,.53),fresnel*.85);',
      'c+=wave*.012+shine*.35;',
      'float mist=1.-exp(-length(cameraPosition-world)*.0009);',
      'gl_FragColor=vec4(mix(c,vec3(.77,.84,.88),mist),1.);',
      '#include <tonemapping_fragment>',
      '#include <colorspace_fragment>',
      '}',
    ].join('\n'),
    side: THREE.FrontSide,transparent:false,depthTest:true,depthWrite:true,
  });
  const water = mesh(new THREE.CircleGeometry(32, 96), waterMaterial, [LAKE.x, LAKE.level, LAKE.z]);
  water.rotation.x = -Math.PI / 2; water.castShadow = water.receiveShadow = false;

  const creekPoints=[],creekIndices=[];
  for(let i=0;i<=270;i++){
    const z=EARTH_STREAM.start+i*2,s=earthStreamAt(0,z);
    creekPoints.push(s.center-s.width-8,s.level,z,s.center+s.width+8,s.level,z);
    if(i<270){const a=i*2;creekIndices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const creekGeometry=new THREE.BufferGeometry();creekGeometry.setAttribute('position',new THREE.Float32BufferAttribute(creekPoints,3));creekGeometry.setIndex(creekIndices);creekGeometry.computeVertexNormals();
  const creek=mesh(creekGeometry,waterMaterial);creek.name='fernlilt-stream';creek.castShadow=creek.receiveShadow=false;

  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.24, .48, 1, 7), material(0x665141), 64);
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), material(0x53703b), 320);
  let treeCount = 0, leafCount = 0;
  for (let i = 0; i < 9000 && treeCount < 64; i++) {
    const x = (random(i, 10) - .5) * 1120, z = (random(i, 11) - .5) * 1120, y = terrainHeight(x, z);
    const lakeRange=Math.hypot(x-LAKE.x,z-LAKE.z);
    if (Math.hypot(x,z)<19||earthWater(x,z)!==null||lakeRange<34||surveyRouteDistance(site,x,z)<3||earthPathDistance(x,z)<earthTrailWidth(x,z)+1||Math.hypot(x-visitFeaturePosition(site).x,z-visitFeaturePosition(site).z)<6)continue;
    const forest=earthWoodland(x,z);
    if(random(i,18)>(forest>.18?.36*forest:.0007)||x< -45&&Math.abs(z+9)<36)continue;
    const height = 6 + random(i,12)*5 + earthWoodland(x,z)*3;
    dummy.position.set(x, y + height / 2, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, height, 1); dummy.updateMatrix();
    trunks.setMatrixAt(treeCount++, dummy.matrix); obstacles.push({ x, z, radius: .55 });
    for (let j = 0; j < 5; j++) {
      const angle = j * 2.4;
      dummy.position.set(x + Math.sin(angle) * 1.5, y + height - j * .45, z + Math.cos(angle) * 1.5);
      dummy.rotation.set(random(i + j, 1), angle, .2); dummy.scale.set(2 + random(i + j, 13), 2.3 + random(i + j, 14), 2.2);
      dummy.updateMatrix(); leaves.setMatrixAt(leafCount, dummy.matrix);
      color.setHSL(.23 + random(i, 15) * .07, .25 + random(j, 16) * .13, .16 + random(i + j, 17) * .08);
      leaves.setColorAt(leafCount++, color);
    }
  }
  trunks.count = treeCount; leaves.count = leafCount; trunks.castShadow = leaves.castShadow = true;
  scene.add(trunks, leaves);

  const stoneGeometry = new THREE.IcosahedronGeometry(1, 1), stonePosition = stoneGeometry.attributes.position;
  for (let i = 0; i < stonePosition.count; i++) {
    const x = stonePosition.getX(i), y = stonePosition.getY(i), z = stonePosition.getZ(i);
    const scale = .85 + random(x * 8 + y * 19 + z * 31, 9) * .3;
    stonePosition.setXYZ(i, x * scale, y * scale, z * scale);
  }
  stoneGeometry.computeVertexNormals();
  const rocks = new THREE.InstancedMesh(stoneGeometry, material(0x898677), 64);
  let rockCount = 0;
  for (let i = 0; i < 1600 && rockCount < 64; i++) {
    const groups=[[-65,-28],[-235,-145],[285,-240],[110,150],[340,90],[-300,240]];
    const [cx,cz]=groups[i%groups.length];
    const x=cx+(random(i,20)-.5)*48,z=cz+(random(i,21)-.5)*40,y=terrainHeight(x,z);
    if(Math.hypot(x,z)<13||earthWater(x,z)!==null||surveyRouteDistance(site,x,z)<3||earthPathDistance(x,z)<earthTrailWidth(x,z)+3.2||Math.hypot(x-visitFeaturePosition(site).x,z-visitFeaturePosition(site).z)<6)continue;
    if(random(i,27)>.42)continue;
    const size = .35 + Math.pow(random(i,22),2)*2.6;
    dummy.position.set(x, y + size * .28, z); dummy.rotation.set(random(i, 24), random(i, 23) * 6, random(i, 25));
    dummy.scale.set(size, size * .7, size * .85); dummy.updateMatrix(); rocks.setMatrixAt(rockCount, dummy.matrix);
    rocks.setColorAt(rockCount++, color.setHSL(.12, .05, .26 + random(i, 26) * .17));
    obstacles.push(createSurfaceCollider(stoneGeometry,dummy.matrix,{radius:size*.85}));
  }
  rocks.count = rockCount; rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);

  earthGrass=createEarthGrass(scene,site,terrainHeight,random);
  createEarthFlowers(scene,terrainHeight,random);

  // A connected northern massif replaces the repetitive ring of cone mountains.
  // Its feet are below the rendered terrain; only its distant skyline is visible.
  const massifGeometry=new THREE.PlaneGeometry(1400,700,140,70);
  massifGeometry.rotateX(-Math.PI/2);
  const massifPositions=massifGeometry.attributes.position,massifColors=[];
  for(let i=0;i<massifPositions.count;i++){
    const x=massifPositions.getX(i)+EARTH_SUMMIT.x,z=massifPositions.getZ(i)+EARTH_SUMMIT.z;
    const peak=(px,pz,h,width,depth)=>h*Math.exp(-(((x-px)/width)**2+((z-pz)/depth)**2));
    const height=peak(EARTH_SUMMIT.x,EARTH_SUMMIT.z,EARTH_SUMMIT.height,180,175)
      +peak(EARTH_SUMMIT.x-350,EARTH_SUMMIT.z-45,210,170,160)+peak(EARTH_SUMMIT.x+360,EARTH_SUMMIT.z-60,230,180,170);
    const rough=Math.sin(x*.13+z*.065)*Math.sin(z*.11)*Math.min(5,height*.08);
    const y=-45+height+rough;
    massifPositions.setXYZ(i,x,y,z);
    color.set(0x697c77).lerp(new THREE.Color(0xd9e4df),THREE.MathUtils.smoothstep(y,78,115));
    massifColors.push(color.r,color.g,color.b);
  }
  massifGeometry.setAttribute('color',new THREE.Float32BufferAttribute(massifColors,3));massifGeometry.computeVertexNormals();
  const massif=mesh(massifGeometry,material(0xffffff,{vertexColors:true}));massif.name='keltrond-distant-massif';massif.castShadow=false;
  // Two offset ridge lines create depth without enclosing the meadow in a wall.
  const ridgeMaterial=material(0xffffff,{vertexColors:true});
  for(let layer=0;layer<2;layer++){
    const ridgeGeometry=new THREE.PlaneGeometry(3000,520,150,26);ridgeGeometry.rotateX(-Math.PI/2);
    const p=ridgeGeometry.attributes.position,shades=[];
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),localZ=p.getZ(i),z=localZ-850-layer*850;
      const backbone=45+35*Math.sin(x*.003+layer)+22*Math.sin(x*.008-layer*.7)+12*Math.sin(x*.017+layer);
      const shoulder=Math.exp(-((localZ/145)**2));
      const y=terrainHeight(x,z)-18+Math.max(18,backbone)*shoulder;
      p.setXYZ(i,x,y,z);
      color.set(layer?0x81949a:0x697d70).multiplyScalar(.94+.06*Math.sin(x*.013));shades.push(color.r,color.g,color.b);
    }
    ridgeGeometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));ridgeGeometry.computeVertexNormals();
    const ridge=mesh(ridgeGeometry,ridgeMaterial);ridge.name='grassland-distant-ridge-'+layer;ridge.castShadow=false;
  }
  const cloudMaterial = new THREE.MeshBasicMaterial({color:0xf6f7f1,transparent:true,opacity:.42,depthWrite:false});
  for (let i = 0; i < 12; i++) {
    const group = new THREE.Group();
    group.position.set((random(i,60)-.5)*1500,140+random(i,61)*80,(random(i,62)-.5)*1500);
    for (let j=0;j<4;j++) {const cloud=mesh(new THREE.SphereGeometry(1,12,8),cloudMaterial,[j*14,Math.sin(j)*2,0],[26+random(i+j,63)*20,2.5+random(i+j,64)*3,13],group);cloud.castShadow=cloud.receiveShadow=false;}
    scene.add(group);
  }

  } else if(isEarth)environment=buildEarthRegionEnvironment({scene,regionId:region.id,terrainHeight,mesh,material,obstacles});
  else environment=buildPlanetEnvironment({scene,site,terrainHeight,mesh,material,obstacles});
  if(isEarth)buildEarthExitSigns(scene,region.id,terrainHeight);
  if(!isEarth||isFernlilt)buildSurveyBeacon({scene,site,terrainHeight,mesh,material,obstacles});
  const surfaceScanner=createSurfaceScanner();
  const scanUI=document.getElementById('surfaceScanner'),scanTitle=document.getElementById('surfaceScanTitle');
  const scanMeter=document.getElementById('surfaceScanMeter'),scanFill=document.getElementById('surfaceScanFill');
  let animatedWater=null; if(isEarth)scene.traverse(o=>{if(o.material?.uniforms?.time)animatedWater=o.material;});
  const wake=isEarth?createSwimWake(scene,surfaceWater):null;
  const landedShip=ship.clone(true);
  landedShip.name='landed-ship';
  landedShip.rotation.set(0,0,0);landedShip.scale.setScalar(1.8);
  // Surface metres keep the original astronaut-sized hull and lighting.
  const hullLight=landedShip.getObjectByName('ship-hull-light');
  if(hullLight){hullLight.intensity=18;hullLight.distance=9;}
  landedShip.visible=false;
  landedShip.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});
  scene.add(landedShip);
  const landingGear=createLandingGear();landedShip.add(landingGear.root);
  const restingHeight=terrainHeight(0,4)+landingGear.groundOffset*landedShip.scale.y;
  let touchdownAt=-Infinity;
  if(!isEarth||isFernlilt)obstacles.push({x:0,z:4,radius:3.5},{x:-3.1,z:5,radius:1.2},{x:3.1,z:5,radius:1.2});
  const rig=createAstronaut(),astronaut=rig.root;scene.add(astronaut);
  const scanFeet=['left-foot','right-foot'].map(name=>astronaut.getObjectByName(name));
  const body={x:6,y:0,z:7,vx:0,vz:0,vy:0,grounded:true};
  let mode='closed',viewMode='chase',transitionTime=0,elapsed=0;
  let orbitYaw=.55,targetYaw=.55,orbitPitch=.18,targetPitch=.18;
  let messageUntil=0,message='',welcomeUntil=0,cameraBlend=null,firstCameraFrame=true;
  let sessionExplored=false,jumpPresses=[],welcomeIsRegion=false;
  const boostSmoke=createBoostSmoke(scene),boostNozzles=[];
  for(const x of [-.13,.13]){
    const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.045,.035,.07,10),new THREE.MeshStandardMaterial({color:0x29343b,roughness:.6}));
    nozzle.position.set(x,.075,.29);astronaut.getObjectByName('torso').add(nozzle);
    boostNozzles.push(nozzle);
  }
  const hud=document.getElementById('surfaceHud'),status=document.getElementById('surfaceStatus');
  const surfaceNotice=createSurfaceNotice();
  const swimStamina=document.getElementById('surfaceSwimStamina'),swimMeter=document.getElementById('surfaceSwimMeter'),swimPercent=document.getElementById('surfaceSwimPercent');
  const primary=document.getElementById('surfacePrimary'),secondary=document.getElementById('surfaceSecondary');
  const shipLocator=document.getElementById('surfaceShipLocator'),shipArrow=document.getElementById('surfaceShipArrow'),shipDistance=document.getElementById('surfaceShipDistance');
  const shipWaypoint=document.getElementById('surfaceShipWaypoint'),shipWaypointText=document.getElementById('surfaceShipWaypointText');
  function locateShip(){
    if(mode!=='walking')return;
    if(!factPanel.hidden)closeFact();
    keys.clear();
    const homeExit=isEarth&&!isFernlilt?earthRegionExits(region.id).find(exit=>exit.to===earthNextRegion(region.id)):null;
    const bearing=Math.atan2(body.x-(homeExit?.x??0),body.z-(homeExit?.z??4));
    targetYaw=orbitYaw+Math.atan2(Math.sin(bearing-orbitYaw),Math.cos(bearing-orbitYaw));
    targetPitch=viewMode==='first-person'?THREE.MathUtils.clamp(Math.atan2(body.y+1.7-(restingHeight+1),Math.max(1,Math.hypot(body.x,body.z-4))),-.75,1.05):.18;
    if(reducedMotion.matches){orbitYaw=targetYaw;orbitPitch=targetPitch;}
    document.getElementById('universe').focus({preventScroll:true});
  }
  shipLocator.addEventListener('click',locateShip);
  const app=document.getElementById('app');
  const welcome=document.getElementById('earthWelcome'),pilotLabel=document.getElementById('pilotLabel'),pilotReadout=document.getElementById('surfacePilot');
  welcome.dataset.destination=site.id;
  const title=document.getElementById('surfaceTitle');
  const objective=document.getElementById('surfaceObjective');
  const factPanel=document.getElementById('surfaceFact'),factTitle=document.getElementById('surfaceFactTitle');
  const factText=document.getElementById('surfaceFactText'),scienceNote=document.getElementById('surfaceScienceNote'),scienceSource=document.getElementById('surfaceScienceSource');
  const feature=visitFeaturePosition(site);
  let observationRead=false;
  function observe(){
    if(mode!=='walking'||Math.hypot(body.x-feature.x,body.z-feature.z)>3)return;
    observationRead=true;keys.clear();
    if(!hasObservation())onEvent('observation',{feature:site.feature});
    factPanel.hidden=false;factTitle.textContent=site.feature;factText.textContent=site.fact;document.getElementById('surfaceFactContext').textContent=site.fiction;
    scienceSource.href=site.source;
    refresh();
  }
  function closeFact(){surfaceScanner.reset();observationRead=false;jumpPresses.length=0;keys.clear();factPanel.hidden=true;document.getElementById('universe').focus({preventScroll:true});}
  document.getElementById('surfaceFactClose').addEventListener('click',closeFact);

  const projected=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),focus=new THREE.Vector3();
  const desiredQuaternion=new THREE.Quaternion();
  const cameraButtons=[...document.querySelectorAll('[data-camera]')];
  function text(el,value){if(el.textContent!==value)el.textContent=value;}
  function refresh(){
    if(mode==='closed')return;
    const distance=Math.hypot(body.x-feature.x,body.z-feature.z);
    const studied=hasObservation();

    text(title,isEarth?region.name:site.title);
    objective.hidden=true;
    text(objective,mode==='walking'?(isEarth&&!isFernlilt?'Explore '+region.name+'. Follow a marked route to another region.':studied?'Discovery saved. Take a photo or head back to your ship.':site.goal+' · '+Math.round(distance)+' m'):mode==='parked'?'Step outside to explore. Board your ship when you’re ready to leave.':mode==='descending'?'Your ship is landing automatically.':'Your ship is returning to orbit.');
    text(scienceNote,site.kind==='imagined'?'Imagined terrain and gravity; real '+site.name+' has no walkable surface.':isEarth?region.description:notes[site.id]);
    if(mode!=='walking')factPanel.hidden=true;
    const shipRange=Math.hypot(body.x,body.z-4),near=(!isEarth||isFernlilt)&&shipRange<8;
    const exit=isEarth&&mode==='walking'?earthExitNear(region.id,body.x,body.z):null;
    shipLocator.hidden=mode!=='walking';
    if(mode==='walking'){
      const metres=Math.round(shipRange),bearing=Math.atan2(body.x,body.z-4);
      const homeExit=isEarth&&!isFernlilt?earthRegionExits(region.id).find(e=>e.to===earthNextRegion(region.id)):null;
      text(shipDistance,homeExit?'Toward ship · '+homeExit.name+' · '+Math.round(Math.hypot(body.x-homeExit.x,body.z-homeExit.z))+' m':'Find ship · '+metres+' m');
      const homeBearing=homeExit?Math.atan2(body.x-homeExit.x,body.z-homeExit.z):bearing;
      shipArrow.style.transform='rotate('+(-(homeBearing-orbitYaw))+'rad)';
      shipLocator.setAttribute('aria-label',homeExit?'Route toward your ship via '+homeExit.name+'. Turn your view toward the route.':'Ship, '+metres+' metres away. Turn your view toward it.');
    }else shipWaypoint.hidden=true;
    primary.disabled=mode==='descending'||mode==='ascending'||mode==='departing'||mode==='walking'&&!near&&!exit;
    text(primary,mode==='descending'?'Landing…':mode==='parked'?'Explore':mode==='walking'?(exit?'Travel to '+exit.name:near?'Board ship':isEarth&&!isFernlilt?'Follow a marked route':'Return to ship'):'Taking off…');
    secondary.hidden=mode!=='parked';text(secondary,'Take off');
    text(status,elapsed<messageUntil?message:mode==='descending'?site.name+' · Landing':mode==='parked'?site.name+' · Ship parked':mode==='walking'?(body.swimming?(body.fastSwimming?'Fast swimming':body.swimExhausted?(body.swimStamina>=.3?'Head-up swim · release Shift':'Head-up swim · recovering'):'Head-up swim'):body.wading?'Wading · head toward the shore to walk':body.swimExhausted?(body.swimStamina>=.3?'Tired · release Shift':'Tired · recovering'):site.conditions):site.name+' · Departure');
    const noticeState=elapsed<messageUntil?'message:'+message:mode!=='walking'?mode:body.swimming?(body.fastSwimming?'fast-swim':body.swimExhausted?'tired-swim':'swim'):body.wading?'wade':body.swimExhausted?'tired':studied?'studied':'walking';
    const noticeText=elapsed<messageUntil?message:mode!=='walking'?objective.textContent:body.swimming||body.wading||body.swimExhausted?status.textContent:studied?'Discovery saved.':isEarth&&!isFernlilt?'Follow marked routes to explore or head toward your ship.':site.goal;
    text(status,surfaceNotice.update(elapsed,noticeState,noticeText));
    status.classList.toggle('visible',Boolean(status.textContent));
        text(pilotReadout,getPilotName());
    pilotReadout.hidden=mode!=='walking'||viewMode!=='first-person';
    if(welcomeUntil>elapsed)text(welcome,isEarth?(welcomeIsRegion?region.name:'Welcome to Earth'):('Welcome to '+site.name+', ')+getPilotName());
    welcome.classList.toggle('visible',welcomeUntil>elapsed&&!['closed','ascending','departing'].includes(mode));
    text(pilotLabel,getPilotName());
    for(const button of cameraButtons){
      button.disabled=mode!=='walking';
      button.setAttribute('aria-pressed',String(button.dataset.camera===viewMode));
    }
  }
  function blendCamera(duration=.55){
    cameraBlend=reducedMotion.matches?null:{position:camera.position.clone(),rotation:camera.quaternion.clone(),elapsed:0,duration};
  }
  function setMode(next){
    if(mode===next)return;
    const previous=mode;
    surfaceScanner.reset();scanUI.hidden=true;
    mode=next;transitionTime=0;keys.clear();jumpPresses.length=0;boostSmoke.reset();wake?.reset();body.vx=body.vz=0;
    if(next!=='walking'){factPanel.hidden=true;observationRead=false;}
    app.classList.toggle('surface-walking',next==='walking');
    app.classList.toggle('surface-first-person',next==='walking'&&viewMode==='first-person');
    blendCamera();
    if(next==='parked'&&previous==='descending'){
      touchdownAt=elapsed;
      welcomeUntil=elapsed+5.5;
      onEvent('landing');
    }else if(next==='walking'&&!sessionExplored){
      sessionExplored=true;onEvent('explore');
    }else if(next==='parked'&&previous==='walking')onEvent('board');
    refresh();
  }
  function open(resume=null){
    surfaceScanner.reset();scanUI.hidden=true;
    observationRead=false;factPanel.hidden=true;scienceSource.href=site.source;
    hud.setAttribute('aria-label',site.name+' landing and exploration');
    elapsed=0;welcomeUntil=0;welcomeIsRegion=Boolean(resume?.entryFrom);messageUntil=0;surfaceNotice.reset();sessionExplored=false;text(welcome,'');
    touchdownAt=-Infinity;landingGear.update(0);
    orbitYaw=targetYaw=.55;orbitPitch=targetPitch=.18;viewMode='chase';
    body.swimStamina=1;body.swimExhausted=false;body.fastSwimming=false;body.running=false;
    body.x=6;body.z=7;body.y=terrainHeight(6,7);body.vx=body.vz=body.vy=0;body.grounded=true;body.swimming=body.wading=false;body.support=null;body.boostReady=false;
    astronaut.position.set(body.x,body.y,body.z);astronaut.rotation.y=orbitYaw;
    landedShip.position.set(0,restingHeight+54,4);landedShip.visible=true;
    firstCameraFrame=true;cameraBlend=null;
    hud.hidden=false;app.classList.add('surface-mode');
    document.getElementById('fieldGuide').inert=true;document.querySelector('.destination-panel').inert=true;
    const valid=resume?.worldId===site.id&&['walking','parked','descending','ascending'].includes(resume.mode)&&resume.position&&['x','y','z','vy'].every(key=>Number.isFinite(resume.position[key]))&&Math.hypot(resume.position.x,resume.position.z)<=visitRadius(site)+.1;
    if(valid){
      const saved=resume.position;
      Object.assign(body,{x:saved.x,y:saved.y,z:saved.z,vy:saved.vy,vx:0,vz:0,grounded:saved.grounded===true,swimming:saved.swimming===true,wading:saved.wading===true,boostReady:saved.boostReady===true,swimStamina:Number.isFinite(saved.swimStamina)?THREE.MathUtils.clamp(saved.swimStamina,0,1):1,swimExhausted:saved.swimExhausted===true});
      if(isFernlilt){
        const restored=clearEarthResumePosition(body.x,body.z,(x,z)=>!walkableAt(x,z,obstacles,Math.max(body.y,terrainHeight(x,z))));
        if(restored.x!==body.x||restored.z!==body.z){
          body.x=restored.x;body.z=restored.z;body.y=terrainHeight(body.x,body.z);body.vy=0;
          body.grounded=true;body.swimming=body.wading=false;body.boostReady=false;
        }
      }
      const floor=supportAt(body.x,body.z,body.y+.2,obstacles,terrainHeight);
      if(body.grounded&&Math.abs(floor.height-body.y)<.35){body.y=floor.height;body.support=floor.support;}else body.grounded=false;
      orbitYaw=targetYaw=Number.isFinite(resume.yaw)?resume.yaw:.55;
      orbitPitch=targetPitch=Number.isFinite(resume.pitch)?THREE.MathUtils.clamp(resume.pitch,-.75,1.05):.18;
      viewMode=resume.viewMode==='first-person'?'first-person':'chase';
      sessionExplored=resume.explored===true||resume.mode==='walking';
      setMode(resume.mode);
      transitionTime=Number.isFinite(resume.transitionTime)?Math.max(0,resume.transitionTime):0;
      elapsed=Number.isFinite(resume.elapsed)?Math.max(0,resume.elapsed):0;
      astronaut.position.set(body.x,body.y,body.z);astronaut.rotation.y=Number.isFinite(resume.facing)?resume.facing:orbitYaw;
      if(mode==='walking'||mode==='parked'){landedShip.position.y=restingHeight;landingGear.update(1);}
      if(welcomeIsRegion)welcomeUntil=elapsed+3.5;
      update(0);refresh();
    }else setMode('descending');
    cameraBlend=null;
    document.getElementById('universe').focus({preventScroll:true});
  }
  function close(departed=false){
    setMode('closed');hud.hidden=true;factPanel.hidden=true;landedShip.visible=false;astronaut.visible=false;
    welcomeUntil=0;pilotLabel.hidden=true;shipWaypoint.hidden=true;shipLocator.hidden=true;scanUI.hidden=true;
    app.classList.remove('surface-mode','surface-walking','surface-first-person');
    cameraButtons.forEach(button=>button.disabled=false);
    onExit(departed);
  }
  function activate(){
    if(mode==='parked'){
      body.x=6;body.z=7;body.y=terrainHeight(6,7);body.vy=0;body.grounded=true;
      setMode('walking');document.getElementById('universe').focus({preventScroll:true});
    }else if(mode==='walking'){
      const exit=isEarth?earthExitNear(region.id,body.x,body.z):null;
      if(exit){keys.clear();onRegionTravel(exit.to);}
      else if((!isEarth||isFernlilt)&&Math.hypot(body.x,body.z-4)<8)setMode('parked');
    }
  }
  function setView(next){
    if(mode!=='walking'||!['first-person','chase'].includes(next)||next===viewMode)return;
    viewMode=next;blendCamera(.42);
    app.classList.toggle('surface-first-person',next==='first-person');refresh();
  }
  const depart=()=>{if(mode==='parked')setMode('ascending');};
  primary.addEventListener('click',activate);
  secondary.addEventListener('click',depart);
  function update(dt,paused=false){
    const ratio=innerWidth/innerHeight;
    if(camera.aspect!==ratio){camera.aspect=ratio;camera.updateProjectionMatrix();}
    const step=paused?0:dt;
    if(paused)jumpPresses.length=0;
    elapsed+=step;transitionTime+=step;
    if(animatedWater)animatedWater.uniforms.time.value=reducedMotion.matches?0:elapsed;
    if(earthGrass)earthGrass.userData.update(body.x,body.z,elapsed,reducedMotion.matches,Math.max(0,camera.position.y-terrainHeight(camera.position.x,camera.position.z)),camera.position.x,camera.position.z);
    meadowGroundTime.value=reducedMotion.matches?0:elapsed;
    if(isEarth){
      const texel=130/1024;
      sun.target.position.set(Math.round(body.x/texel)*texel,terrainHeight(body.x,body.z),Math.round(body.z/texel)*texel);
      sun.position.copy(sun.target.position).add(earthSunOffset);
    }
    environment?.update(reducedMotion.matches?0:step);
    orbitYaw=THREE.MathUtils.damp(orbitYaw,targetYaw,18,step);
    orbitPitch=THREE.MathUtils.damp(orbitPitch,targetPitch,18,step);
    const settle=THREE.MathUtils.clamp((elapsed-touchdownAt)/.65,0,1);
    const compression=reducedMotion.matches?0:Math.sin(settle*Math.PI)*.045;
    let gearDeployment=mode==='parked'||mode==='walking'?1:0;
    if(mode==='descending'){
      const t=Math.min(1,transitionTime/(reducedMotion.matches?.15:3.4));
      gearDeployment=reducedMotion.matches?1:THREE.MathUtils.smoothstep(t,.22,.62);
      landedShip.position.y=restingHeight+54*(1-t)**3;
      landedShip.rotation.z=reducedMotion.matches?0:Math.sin(t*Math.PI)*.045;
      if(t===1)setMode('parked');
    }else if(mode==='ascending'){
      const t=Math.min(1,transitionTime/(reducedMotion.matches?.15:2.8));
      gearDeployment=reducedMotion.matches?0:1-THREE.MathUtils.smoothstep(t,.2,.58);
      landedShip.position.y=restingHeight+75*t*t;
      if(t===1){document.getElementById('sceneCurtain').classList.add('covered');setMode('departing');}
    }else if(mode==='departing'){
      if(transitionTime>=(reducedMotion.matches?.08:.25)){onEvent('takeoff');close(true);return;}
    }else{
      landedShip.position.y=restingHeight-compression*landedShip.scale.y;landedShip.rotation.z=0;
    }
    landedShip.visible=!isEarth||isFernlilt;
    landingGear.update(gearDeployment,compression);
    let motion={distance:0,speed:0,landed:false,landingSpeed:0};
    if(mode==='walking'&&!paused){
      const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
      const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      const x=side*Math.cos(orbitYaw)-forward*Math.sin(orbitYaw),z=-side*Math.sin(orbitYaw)-forward*Math.cos(orbitYaw);
      motion=stepAstronaut(body,{x,z,jumpPresses,run:keys.has('ShiftLeft')||keys.has('ShiftRight')},step,obstacles);
      jumpPresses.length=0;
      if(motion.boosted)boostSmoke.trigger();
      if(motion.blocked==='boundary'){message='Edge of this area · follow a marked route to continue';messageUntil=elapsed+1.5;}
      astronaut.position.set(body.x,body.y,body.z);
      const facing=viewMode==='first-person'?orbitYaw:motion.speed>.1?Math.atan2(-body.vx,-body.vz):astronaut.rotation.y;
      const turn=Math.atan2(Math.sin(facing-astronaut.rotation.y),Math.cos(facing-astronaut.rotation.y));
      astronaut.rotation.y+=THREE.MathUtils.clamp(turn,-(motion.running?6:4.5)*step,(motion.running?6:4.5)*step);
    }
    swimStamina.hidden=mode!=='walking'||!(body.swimming||body.running||body.swimStamina<.999||body.swimExhausted);
    swimMeter.value=body.swimStamina??1;text(swimPercent,Math.round((body.swimStamina??1)*100)+'%');
    wake?.update(step,{active:mode==='walking'&&(body.swimming||body.wading),x:body.x,z:body.z,speed:motion.speed,swimming:body.swimming,reduced:reducedMotion.matches});
    rig.update(step,{...motion,grounded:body.grounded,swimming:body.swimming===true,vy:body.vy,time:elapsed,waterDepth:isEarth?(surfaceWater(body.x,body.z)??terrainHeight(body.x,body.z))-terrainHeight(body.x,body.z):0,reduced:reducedMotion.matches,groundHeight:(x,z)=>supportAt(x,z,body.y+.18,obstacles,terrainHeight,body.support).height});
    astronaut.updateWorldMatrix(true,true);
    boostSmoke.update(step,boostNozzles,body,reducedMotion.matches);
    const walking=mode==='walking';
    if(walking&&viewMode==='first-person'){
      // Eye-height camera: no artificial head bob, and no visible inside of the helmet.
      desiredCamera.set(body.x,body.y+rig.eyeHeight,body.z);
      if(isEarth)desiredCamera.y=regionCameraHeight(desiredCamera.x,desiredCamera.z,desiredCamera.y);
      camera.rotation.set(-orbitPitch,orbitYaw,0,'YXZ');
      desiredQuaternion.copy(camera.quaternion);
    }else{
      const distance=walking?5.6:18;
      const elevation=walking?Math.tan(orbitPitch)*distance+.55:5+orbitPitch*8;
      focus.set(walking?body.x:0,walking?body.y+1.25:landedShip.position.y+.5,walking?body.z:4);
      desiredCamera.copy(focus).add(new THREE.Vector3(Math.sin(orbitYaw)*distance,elevation,Math.cos(orbitYaw)*distance));
      desiredCamera.y=Math.max(desiredCamera.y,terrainHeight(desiredCamera.x,desiredCamera.z)+.8);
      if(isEarth)desiredCamera.y=regionCameraHeight(desiredCamera.x,desiredCamera.z,desiredCamera.y);
      camera.position.copy(desiredCamera);camera.lookAt(focus);desiredQuaternion.copy(camera.quaternion);
    }
    if(firstCameraFrame){camera.position.copy(desiredCamera);camera.quaternion.copy(desiredQuaternion);firstCameraFrame=false;}
    else if(cameraBlend){
      cameraBlend.elapsed+=step;
      const t=Math.min(1,cameraBlend.elapsed/cameraBlend.duration),ease=t*t*(3-2*t);
      camera.position.lerpVectors(cameraBlend.position,desiredCamera,ease);
      camera.quaternion.slerpQuaternions(cameraBlend.rotation,desiredQuaternion,ease);
      if(t===1)cameraBlend=null;
    }else{
      // Movement is already damped; keeping the eye attached avoids first-person lag.
      camera.position.copy(desiredCamera);camera.quaternion.copy(desiredQuaternion);
    }
    // Camera-view blends must respect the same waterline constraint.
    if(isEarth)camera.position.y=regionCameraHeight(camera.position.x,camera.position.z,camera.position.y);
    astronaut.visible=walking&&viewMode==='chase'&&camera.position.distanceTo(astronaut.position)>1.2;
    camera.updateMatrixWorld();
    const scanRange=(!isEarth||isFernlilt)&&Math.hypot(body.x-feature.x,body.z-feature.z)<=3;
    const scanBlocked=paused||mode!=='walking'||!factPanel.hidden;
    const scan=surfaceScanner.update(step,{inRange:scanRange,holding:keys.has('KeyR'),blocked:scanBlocked});
    // The hint and interaction share the same proximity check in both camera views.
    scanUI.hidden=scanBlocked||!scanRange;
    scanMeter.hidden=scan.progress===0;
    scanMeter.setAttribute('aria-valuenow',String(Math.round(scan.progress*100)));
    scanFill.style.transform='scaleX('+scan.progress+')';
    if(!scanUI.hidden){
      let hintX=innerWidth*.5,hintY=innerHeight*.76;
      if(viewMode==='chase'){
        hintX=0;hintY=0;
        for(const foot of scanFeet){
          projected.set(0,-.1025,-.04);foot.localToWorld(projected);projected.project(camera);
          hintX+=(projected.x*.5+.5)*innerWidth/2;
          hintY=Math.max(hintY,(-projected.y*.5+.5)*innerHeight+28);
        }
      }
      scanUI.style.transform='translate3d('+Math.max(150,Math.min(innerWidth-150,hintX))+'px,'+Math.max(100,Math.min(innerHeight-90,hintY))+'px,0)';
      text(scanTitle,scan.progress>0?'Scanning survey · '+Math.round(scan.progress*100)+'%':(hasObservation()?'Hold R to read discovery':'Hold R to scan'));
    }
    if(scan.complete){scanUI.hidden=true;observe();}
    projected.set(body.x,body.y+2.16,body.z).project(camera);
    pilotLabel.hidden=!astronaut.visible||projected.z>1||projected.z< -1;
    projected.set(0,landedShip.position.y+2.4,4).project(camera);
    const markerX=(projected.x*.5+.5)*innerWidth,markerY=(-projected.y*.5+.5)*innerHeight;
    const inCopy=markerX<460&&markerY<310;
    shipWaypoint.hidden=isEarth&&!isFernlilt||!walking||Math.hypot(body.x,body.z-4)<8||projected.z>1||projected.z< -1||markerX<30||markerX>innerWidth-30||markerY<82||markerY>innerHeight-160||inCopy;
    if(!shipWaypoint.hidden){shipWaypoint.style.transform='translate3d('+markerX+'px,'+markerY+'px,0) translate(-50%,-100%)';text(shipWaypointText,'Your ship · '+Math.round(Math.hypot(body.x,body.z-4))+' m');}
    projected.set(body.x,body.y+2.16,body.z).project(camera);
    if(!pilotLabel.hidden)pilotLabel.style.transform='translate3d('+((projected.x*.5+.5)*innerWidth)+'px,'+((-projected.y*.5+.5)*innerHeight)+'px,0) translate(-50%,-100%)';
    refresh();
  }
  return {
    scene,camera,open,close,update,activate,setView,observe,closeFact,terrainHeight,waterLevelAt:surfaceWater,
    get regionId(){return isEarth?region.id:null;},get regionName(){return isEarth?region.name:site.title;},
    setGraphicsQuality(quality,scale){earthGrass?.userData.setQuality(quality,scale);},
    snapshot(){if(mode==='closed'||mode==='departing')return null;return {worldId:site.id,regionId:isEarth?region.id:null,mode,position:{x:body.x,y:body.y,z:body.z,vy:body.vy,grounded:body.grounded,swimming:body.swimming,wading:body.wading,boostReady:body.boostReady===true,swimStamina:body.swimStamina,swimExhausted:body.swimExhausted===true},yaw:targetYaw,pitch:targetPitch,viewMode,facing:astronaut.rotation.y,explored:sessionExplored,transitionTime,elapsed};},
    requestJump(code='KeyJ'){if(mode==='walking'&&!this.factOpen&&jumpPresses.length<2)jumpPresses.push(code);},
    get factOpen(){return !factPanel.hidden;},
    get worldId(){return site.id;},
    dispose(){
      shipLocator.removeEventListener('click',locateShip);primary.removeEventListener('click',activate);secondary.removeEventListener('click',depart);
      scanUI.hidden=true;document.getElementById('surfaceFactClose').removeEventListener('click',closeFact);
      // Hull resources belong to the orbital ship; release only the visit's own assets.
      landedShip.remove(landingGear.root);scene.remove(landedShip);
      const geometries=new Set(earthGrass?.userData.geometries||[]),materials=new Set(),textures=new Set();
      for(const object of [scene,landingGear.root])object.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
      geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());scene.clear();
    },
    get active(){return mode!=='closed';},get mode(){return mode;},get viewMode(){return viewMode;},
    drag(dx,dy){targetYaw-=dx*.006;targetPitch=THREE.MathUtils.clamp(targetPitch+dy*.004,-.75,1.05);},
    get heading(){return astronaut.rotation.y;},
    get position(){const {support,...position}=body;return position;},
  };
}
