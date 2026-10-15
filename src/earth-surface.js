import * as THREE from 'three';
import { LAKE, terrainHeight as earthHeight, stepAstronaut as stepBody, walkableAt as earthWalkable, waterLevelAt as earthWater } from './earth-physics.js';
import { createSurfaceCollider, supportAt } from './surface-collision.js';
import { createAstronaut } from './astronaut.js';
import { createLandingGear } from './landing-gear.js';

import { getVisitSite, visitFeaturePosition, visitRadius, visitTerrainHeight, surveyRouteDistance } from './visit-sites.js';
import { buildPlanetEnvironment, buildSurveyBeacon } from './planet-environment.js';

export function createEarthSurface({ ship, keys, onExit, onEvent, getPilotName, reducedMotion, site=getVisitSite('earth'), hasObservation=()=>false }) {
  const isEarth=site.id==='earth';
  const notes={mercury:'Illustrative terrain; extreme-temperature suit protection is fictional.',venus:'Fictional shielding makes this walk possible. Real spacesuits could not protect you here.',earth:'A stylized lakeside landscape inspired by Earth.',moon:'Illustrative lunar terrain and equipment, with the Moon’s low gravity.',mars:'A reconstructed landscape inspired by ancient Martian waterways.'};
  const terrainHeight=isEarth?earthHeight:(x,z)=>visitTerrainHeight(site,x,z);
  const walkableAt=isEarth?earthWalkable:(x,z,obstacles=[])=>Math.hypot(x,z)>visitRadius(site)?'boundary':obstacles.some(o=>Math.hypot(x-o.x,z-o.z)<o.radius+.35)?'obstacle':null;
  const stepAstronaut=(body,input,dt,obstacles)=>stepBody(body,input,dt,obstacles,{terrainHeight,walkableAt,gravity:site.gravity,waterLevelAt:isEarth?earthWater:()=>null});
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(isEarth?0x9ac9e2:site.sky);
  scene.fog = isEarth?new THREE.FogExp2(0xb2ced8,.0038):site.fog?new THREE.FogExp2(site.sky,site.fog):null;
  const camera = new THREE.PerspectiveCamera(58, 1, .1, 650);
  scene.add(new THREE.HemisphereLight(isEarth?0xc8e8ff:0xc4d2dc,isEarth?0x636442:0x393230,isEarth?2.2:site.kind==='imagined'?1.5:.85));
  const sun = new THREE.DirectionalLight(isEarth?0xffedce:site.id==='venus'?0xffcf89:0xfff4e4,isEarth?3.1:site.light??2.2);
  sun.position.set(...(site.id==='mercury'?[-95,25,-180]:site.id==='moon'?[-85,40,-60]:site.id==='uranus'?[100,25,-70]:site.id==='neptune'?[-65,35,-90]:[-65,100,-48]));
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -65;
  sun.shadow.camera.right = sun.shadow.camera.top = 65;
  sun.shadow.camera.far = 240;
  sun.shadow.normalBias = .08;
  scene.add(sun);
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

  let environment=null;
  if(isEarth) {
  const groundGeometry = new THREE.PlaneGeometry(440, 440, 200, 200);
  groundGeometry.rotateX(-Math.PI / 2);
  const positions = groundGeometry.attributes.position, colors = [];
  const green = new THREE.Color(0x536e35),trailSoil=new THREE.Color(0x827655);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i), z = positions.getZ(i), y = terrainHeight(x, z);
    positions.setY(i, y);
    const shore = Math.hypot(x-LAKE.x,z-LAKE.z)<32 ? THREE.MathUtils.smoothstep(y,LAKE.level+.1,LAKE.level+1.25) : 1;
    color.set(0xa89c79).lerp(green,shore);
    const trail=1-THREE.MathUtils.smoothstep(surveyRouteDistance(site,x,z),.4,1.7+.2*Math.sin(x*.7+z*.3));
    color.lerp(trailSoil,trail*.72);
    color.multiplyScalar(.86 + random(i, 8) * .27);
    colors.push(color.r, color.g, color.b);
  }
  groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeometry.computeVertexNormals();
  const textureCanvas = document.createElement('canvas');
  textureCanvas.width = textureCanvas.height = 256;
  const ctx = textureCanvas.getContext('2d');
  ctx.fillStyle = '#d2d2bd'; ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 15000; i++) {
    ctx.fillStyle = i % 3 ? 'rgba(37,52,20,.12)' : 'rgba(255,247,207,.22)';
    ctx.fillRect(random(i, 3) * 256, random(i, 4) * 256, 1, 1 + random(i, 5) * 3);
  }
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(110, 110);
  mesh(groundGeometry, material(0xffffff, { vertexColors: true, map: texture }));

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
      'float mist=1.-exp(-length(cameraPosition-world)*.0038);',
      'gl_FragColor=vec4(mix(c,vec3(.70,.81,.85),mist),1.);',
      '#include <tonemapping_fragment>',
      '#include <colorspace_fragment>',
      '}',
    ].join('\n'),
    side: THREE.DoubleSide,
  });
  const water = mesh(new THREE.CircleGeometry(32, 96), waterMaterial, [LAKE.x, LAKE.level, LAKE.z]);
  water.rotation.x = -Math.PI / 2; water.castShadow = water.receiveShadow = false;

  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(.24, .48, 1, 7), material(0x665141), 90);
  const leaves = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), material(0x53703b), 450);
  let treeCount = 0, leafCount = 0;
  for (let i = 0; i < 220 && treeCount < 90; i++) {
    const x = (random(i, 10) - .5) * 280, z = (random(i, 11) - .5) * 280, y = terrainHeight(x, z);
    if (Math.hypot(x, z) < 19 || y < LAKE.level + 1.2 || surveyRouteDistance(site,x,z)<3 || Math.hypot(x-visitFeaturePosition(site).x,z-visitFeaturePosition(site).z)<6) continue;
    const height = 5 + random(i, 12) * 5;
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
  const rocks = new THREE.InstancedMesh(stoneGeometry, material(0x87877d), 100);
  let rockCount = 0;
  for (let i = 0; i < 140 && rockCount < 100; i++) {
    const x = (random(i, 20) - .5) * 200, z = (random(i, 21) - .5) * 200, y = terrainHeight(x, z);
    if (Math.hypot(x, z) < 13 || y < LAKE.level + .3 || surveyRouteDistance(site,x,z)<3 || Math.hypot(x-visitFeaturePosition(site).x,z-visitFeaturePosition(site).z)<6) continue;
    const size = .4 + random(i, 22) * 2.2;
    dummy.position.set(x, y + size * .28, z); dummy.rotation.set(random(i, 24), random(i, 23) * 6, random(i, 25));
    dummy.scale.set(size, size * .7, size * .85); dummy.updateMatrix(); rocks.setMatrixAt(rockCount, dummy.matrix);
    rocks.setColorAt(rockCount++, color.setHSL(.12, .05, .26 + random(i, 26) * .17));
    obstacles.push(createSurfaceCollider(stoneGeometry,dummy.matrix,{radius:size*.85}));
  }
  rocks.count = rockCount; rocks.castShadow = rocks.receiveShadow = true; scene.add(rocks);

  const bladeGeometry = new THREE.BufferGeometry();
  bladeGeometry.setAttribute('position', new THREE.Float32BufferAttribute([-.045,0,0,.045,0,0,.04,.42,.015,-.045,0,0,.04,.42,.015,.005,.62,.04],3));
  bladeGeometry.computeVertexNormals();
  const grass = new THREE.InstancedMesh(bladeGeometry, material(0x749246, { side: THREE.DoubleSide }), 14000);
  let bladeCount = 0;
  for (let i = 0; i < grass.instanceMatrix.count * 2 && bladeCount < grass.instanceMatrix.count; i++) {
    const x = (random(i, 30) - .5) * 200, z = (random(i, 31) - .5) * 200, y = terrainHeight(x, z);
    if (y < LAKE.level + .45 || Math.hypot(x, z - 4) < 6 || surveyRouteDistance(site,x,z)<.7+random(i,36)*.7) continue;
    dummy.position.set(x, y, z); dummy.rotation.set(0, random(i, 32) * 6.28, 0);
    dummy.scale.setScalar(.55 + random(i, 33) * .8); dummy.updateMatrix(); grass.setMatrixAt(bladeCount, dummy.matrix);
    grass.setColorAt(bladeCount++, color.setHSL(.23 + random(i, 34) * .05, .35, .22 + random(i, 35) * .12));
  }
  grass.count = bladeCount; scene.add(grass);
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(.1, 5, 4), material(0xf7e8bb), 160);
  let flowerCount = 0;
  for (let i = 0; i < 250 && flowerCount < 160; i++) {
    const x = (random(i, 40) - .5) * 110, z = (random(i, 41) - .5) * 110, y = terrainHeight(x, z);
    if (y < LAKE.level + .8 || Math.hypot(x,z) < 10) continue;
    dummy.position.set(x,y+.32,z); dummy.rotation.set(0,0,0); dummy.scale.set(1,.45,1); dummy.updateMatrix();
    flowers.setMatrixAt(flowerCount,dummy.matrix); flowers.setColorAt(flowerCount++,color.set(i%3?0xeee5b9:0xc0b6da));
  }
  flowers.count=flowerCount; scene.add(flowers);

  for (let i = 0; i < 20; i++) {
    const angle = i / 20 * Math.PI * 2;
    const mountainGeometry=new THREE.ConeGeometry(35+random(i,51)*40,45+random(i,52)*55,18,8);
    const mountainPositions=mountainGeometry.attributes.position;
    for(let j=0;j<mountainPositions.count;j++){
      const x=mountainPositions.getX(j),y=mountainPositions.getY(j),z=mountainPositions.getZ(j);
      const rough=1+.16*Math.sin(x*.13+i)*Math.cos(z*.17+i);
      mountainPositions.setXYZ(j,x*rough+Math.sin(y*.047+i)*8,y,z*rough);
    }
    mountainGeometry.computeVertexNormals();
    const mountain=mesh(mountainGeometry,material(0x77817a),[Math.sin(angle)*260,-12,Math.cos(angle)*260]);
    mountain.rotation.y = random(i, 53) * 6; mountain.castShadow = false;
  }
  const cloudMaterial = new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.6,depthWrite:false});
  for (let i = 0; i < 20; i++) {
    const group = new THREE.Group();
    group.position.set((random(i,60)-.5)*500,65+random(i,61)*35,(random(i,62)-.5)*500);
    for (let j=0;j<4;j++) {const cloud=mesh(new THREE.SphereGeometry(1,12,8),cloudMaterial,[j*8,Math.sin(j)*2,0],[12,3.5,7],group);cloud.castShadow=cloud.receiveShadow=false;}
    scene.add(group);
  }

  } else environment=buildPlanetEnvironment({scene,site,terrainHeight,mesh,material,obstacles});
  buildSurveyBeacon({scene,site,terrainHeight,mesh,material,obstacles});
  let animatedWater=null; if(isEarth)scene.traverse(o=>{if(o.material?.uniforms?.time)animatedWater=o.material;});
  const wake=isEarth?mesh(new THREE.RingGeometry(.65,.72,48),new THREE.MeshBasicMaterial({color:0xd3e5e8,transparent:true,opacity:.35,side:THREE.DoubleSide,depthWrite:false}),[0,LAKE.level+.025,0]):null;
  if(wake){wake.rotation.x=-Math.PI/2;wake.visible=false;wake.castShadow=wake.receiveShadow=false;}
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
  obstacles.push({x:0,z:4,radius:3.5},{x:-3.1,z:5,radius:1.2},{x:3.1,z:5,radius:1.2});
  const rig=createAstronaut(),astronaut=rig.root;scene.add(astronaut);
  const body={x:6,y:0,z:7,vx:0,vz:0,vy:0,grounded:true};
  let mode='closed',viewMode='chase',transitionTime=0,elapsed=0;
  let orbitYaw=.55,targetYaw=.55,orbitPitch=.18,targetPitch=.18,previousJump=false;
  let messageUntil=0,message='',welcomeUntil=0,cameraBlend=null,firstCameraFrame=true;
  let sessionExplored=false,jumpRequested=false;
  const hud=document.getElementById('surfaceHud'),status=document.getElementById('surfaceStatus');
  const primary=document.getElementById('surfacePrimary'),secondary=document.getElementById('surfaceSecondary');
  const shipLocator=document.getElementById('surfaceShipLocator'),shipArrow=document.getElementById('surfaceShipArrow'),shipDistance=document.getElementById('surfaceShipDistance');
  const shipWaypoint=document.getElementById('surfaceShipWaypoint'),shipWaypointText=document.getElementById('surfaceShipWaypointText');
  function locateShip(){
    if(mode!=='walking')return;
    if(!factPanel.hidden)closeFact();
    keys.clear();
    const bearing=Math.atan2(body.x,body.z-4);
    targetYaw=orbitYaw+Math.atan2(Math.sin(bearing-orbitYaw),Math.cos(bearing-orbitYaw));
    targetPitch=viewMode==='first-person'?THREE.MathUtils.clamp(Math.atan2(body.y+1.7-(restingHeight+1),Math.max(1,Math.hypot(body.x,body.z-4))),-.75,1.05):.18;
    if(reducedMotion.matches){orbitYaw=targetYaw;orbitPitch=targetPitch;}
    document.getElementById('universe').focus({preventScroll:true});
  }
  shipLocator.addEventListener('click',locateShip);
  const hint=document.getElementById('surfaceHint'),app=document.getElementById('app');
  const welcome=document.getElementById('earthWelcome'),pilotLabel=document.getElementById('pilotLabel'),pilotReadout=document.getElementById('surfacePilot');
  const title=document.getElementById('surfaceTitle');
  const objective=document.getElementById('surfaceObjective'),observeButton=document.getElementById('surfaceObserve');
  const factPanel=document.getElementById('surfaceFact'),factTitle=document.getElementById('surfaceFactTitle');
  const factText=document.getElementById('surfaceFactText'),scienceNote=document.getElementById('surfaceScienceNote'),scienceSource=document.getElementById('surfaceScienceSource');
  const feature=visitFeaturePosition(site);
  let observationRead=false;
  function observe(){
    if(mode!=='walking'||Math.hypot(body.x-feature.x,body.z-feature.z)>5)return;
    observationRead=true;keys.clear();
    if(!hasObservation())onEvent('observation',{feature:site.feature});
    factPanel.hidden=false;factTitle.textContent=site.feature;factText.textContent=site.fact;document.getElementById('surfaceFactContext').textContent=site.fiction;
    scienceSource.href=site.source;
    refresh();
  }
  function closeFact(){observationRead=false;jumpRequested=false;keys.clear();factPanel.hidden=true;document.getElementById('universe').focus({preventScroll:true});}
  document.getElementById('surfaceFactClose').addEventListener('click',closeFact);
  observeButton.addEventListener('click',observe);
  const projected=new THREE.Vector3(),desiredCamera=new THREE.Vector3(),focus=new THREE.Vector3();
  const desiredQuaternion=new THREE.Quaternion();
  const cameraButtons=[...document.querySelectorAll('[data-camera]')];
  function text(el,value){if(el.textContent!==value)el.textContent=value;}
  function refresh(){
    if(mode==='closed')return;
    const distance=Math.hypot(body.x-feature.x,body.z-feature.z);
    const studied=hasObservation();
    observeButton.hidden=mode!=='walking'||distance>5||!factPanel.hidden;
    text(observeButton,studied?'Read discovery':site.action);
    text(title,site.title);
    text(objective,mode==='walking'?(studied?'Discovery saved. Take a photo or head back to your ship.':site.goal+' · '+Math.round(distance)+' m'):mode==='parked'?'Step outside to explore. Board your ship when you’re ready to leave.':mode==='descending'?'Your ship is landing automatically.':'Your ship is returning to orbit.');
    text(scienceNote,site.kind==='imagined'?'Imagined terrain and gravity; real '+site.name+' has no walkable surface.':notes[site.id]);
    if(mode!=='walking')factPanel.hidden=true;
    const shipRange=Math.hypot(body.x,body.z-4),near=shipRange<8;
    shipLocator.hidden=mode!=='walking';
    if(mode==='walking'){
      const metres=Math.round(shipRange),bearing=Math.atan2(body.x,body.z-4);
      text(shipDistance,'Find ship · '+metres+' m');
      shipArrow.style.transform='rotate('+(-(bearing-orbitYaw))+'rad)';
      shipLocator.setAttribute('aria-label','Ship, '+metres+' metres away. Turn your view toward it.');
    }else shipWaypoint.hidden=true;
    primary.disabled=mode==='descending'||mode==='ascending'||mode==='departing'||mode==='walking'&&!near;
    text(primary,mode==='descending'?'Landing…':mode==='parked'?'Explore':mode==='walking'?(near?'Board ship':'Return to ship'):'Taking off…');
    secondary.hidden=mode!=='parked';text(secondary,'Take off');
    text(hint,'WASD move · Shift run\nDrag look · Space jump · C view · E board');
    hint.hidden=mode!=='walking';
    text(status,elapsed<messageUntil?message:mode==='descending'?site.name+' · Landing':mode==='parked'?site.name+' · Ship parked':mode==='walking'?(body.swimming?'Swimming · Shift for a stronger stroke':body.wading?'Wading · head toward the shore to walk':site.conditions):site.name+' · Departure');
    text(pilotReadout,getPilotName());
    pilotReadout.hidden=mode!=='walking'||viewMode!=='first-person';
    if(welcomeUntil>elapsed)text(welcome,('Welcome to '+site.name+', ')+getPilotName());
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
    mode=next;transitionTime=0;keys.clear();previousJump=false;jumpRequested=false;body.vx=body.vz=0;
    if(next!=='walking'){factPanel.hidden=true;observationRead=false;}
    app.classList.toggle('surface-walking',next==='walking');
    app.classList.toggle('surface-first-person',next==='walking'&&viewMode==='first-person');
    blendCamera();
    if(next==='parked'&&previous==='descending'){
      touchdownAt=elapsed;
      welcomeUntil=elapsed+4.5;
      onEvent('landing');
    }else if(next==='walking'&&!sessionExplored){
      sessionExplored=true;onEvent('explore');
    }else if(next==='parked'&&previous==='walking')onEvent('board');
    refresh();
  }
  function open(resume=null){
    observationRead=false;factPanel.hidden=true;scienceSource.href=site.source;
    hud.setAttribute('aria-label',site.name+' landing and exploration');
    elapsed=0;welcomeUntil=0;messageUntil=0;sessionExplored=false;text(welcome,'');
    touchdownAt=-Infinity;landingGear.update(0);
    orbitYaw=targetYaw=.55;orbitPitch=targetPitch=.18;viewMode='chase';
    body.x=6;body.z=7;body.y=terrainHeight(6,7);body.vx=body.vz=body.vy=0;body.grounded=true;body.swimming=body.wading=false;body.support=null;
    astronaut.position.set(body.x,body.y,body.z);astronaut.rotation.y=orbitYaw;
    landedShip.position.set(0,restingHeight+54,4);landedShip.visible=true;
    firstCameraFrame=true;cameraBlend=null;
    hud.hidden=false;app.classList.add('surface-mode');
    document.getElementById('fieldGuide').inert=true;document.querySelector('.destination-panel').inert=true;
    const valid=resume?.worldId===site.id&&['walking','parked','descending','ascending'].includes(resume.mode)&&resume.position&&['x','y','z','vy'].every(key=>Number.isFinite(resume.position[key]))&&Math.hypot(resume.position.x,resume.position.z)<=visitRadius(site)+.1;
    if(valid){
      const saved=resume.position;
      Object.assign(body,{x:saved.x,y:saved.y,z:saved.z,vy:saved.vy,vx:0,vz:0,grounded:saved.grounded===true,swimming:saved.swimming===true,wading:saved.wading===true});
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
      update(0);refresh();
    }else setMode('descending');
    cameraBlend=null;
    document.getElementById('universe').focus({preventScroll:true});
  }
  function close(departed=false){
    setMode('closed');hud.hidden=true;factPanel.hidden=true;landedShip.visible=false;astronaut.visible=false;
    welcomeUntil=0;pilotLabel.hidden=true;shipWaypoint.hidden=true;shipLocator.hidden=true;
    app.classList.remove('surface-mode','surface-walking','surface-first-person');
    cameraButtons.forEach(button=>button.disabled=false);
    onExit(departed);
  }
  function activate(){
    if(mode==='parked'){
      body.x=6;body.z=7;body.y=terrainHeight(6,7);body.vy=0;body.grounded=true;
      setMode('walking');document.getElementById('universe').focus({preventScroll:true});
    }else if(mode==='walking'&&Math.hypot(body.x,body.z-4)<8)setMode('parked');
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
    elapsed+=step;transitionTime+=step;
    if(animatedWater)animatedWater.uniforms.time.value=reducedMotion.matches?0:elapsed;
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
    landingGear.update(gearDeployment,compression);
    let motion={distance:0,speed:0,landed:false,landingSpeed:0};
    if(mode==='walking'&&!paused){
      const forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
      const side=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
      const x=side*Math.cos(orbitYaw)-forward*Math.sin(orbitYaw),z=-side*Math.sin(orbitYaw)-forward*Math.cos(orbitYaw);
      const pressed=keys.has('Space')||keys.has('KeyJ');
      motion=stepAstronaut(body,{x,z,jump:jumpRequested||pressed&&!previousJump,run:keys.has('ShiftLeft')||keys.has('ShiftRight')},step,obstacles);
      previousJump=pressed;jumpRequested=false;
      if(motion.blocked==='boundary'){message='Edge of the landing area · head back toward the ship';messageUntil=elapsed+1.5;}
      astronaut.position.set(body.x,body.y,body.z);
      const facing=viewMode==='first-person'?orbitYaw:motion.speed>.1?Math.atan2(-body.vx,-body.vz):astronaut.rotation.y;
      const turn=Math.atan2(Math.sin(facing-astronaut.rotation.y),Math.cos(facing-astronaut.rotation.y));
      astronaut.rotation.y+=turn*(1-Math.exp(-12*step));
    }
    if(wake){wake.visible=mode==='walking'&&(body.swimming||body.wading);wake.position.set(body.x,LAKE.level+.025,body.z);wake.scale.setScalar(reducedMotion.matches?1:1+Math.sin(elapsed*3)*.06+motion.speed*.06);}
    rig.update(step,{...motion,grounded:body.grounded,swimming:body.swimming===true,vy:body.vy,time:elapsed,reduced:reducedMotion.matches,groundHeight:(x,z)=>supportAt(x,z,body.y+.18,obstacles,terrainHeight,body.support).height});
    const walking=mode==='walking';
    if(walking&&viewMode==='first-person'){
      // Eye-height camera: no artificial head bob, and no visible inside of the helmet.
      desiredCamera.set(body.x,body.y+1.7,body.z);
      camera.rotation.set(-orbitPitch,orbitYaw,0,'YXZ');
      desiredQuaternion.copy(camera.quaternion);
    }else{
      const distance=walking?5.6:18;
      const elevation=walking?Math.tan(orbitPitch)*distance+1.15:5+orbitPitch*8;
      focus.set(walking?body.x:0,walking?body.y+1.25:landedShip.position.y+.5,walking?body.z:4);
      desiredCamera.copy(focus).add(new THREE.Vector3(Math.sin(orbitYaw)*distance,elevation,Math.cos(orbitYaw)*distance));
      desiredCamera.y=Math.max(desiredCamera.y,terrainHeight(desiredCamera.x,desiredCamera.z)+.8);
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
    astronaut.visible=walking&&viewMode==='chase'&&camera.position.distanceTo(astronaut.position)>1.2;
    camera.updateMatrixWorld();
    projected.set(body.x,body.y+2.16,body.z).project(camera);
    pilotLabel.hidden=!astronaut.visible||projected.z>1||projected.z< -1;
    projected.set(0,landedShip.position.y+2.4,4).project(camera);
    const markerX=(projected.x*.5+.5)*innerWidth,markerY=(-projected.y*.5+.5)*innerHeight;
    const inCopy=markerX<460&&markerY<310;
    shipWaypoint.hidden=!walking||Math.hypot(body.x,body.z-4)<8||projected.z>1||projected.z< -1||markerX<30||markerX>innerWidth-30||markerY<82||markerY>innerHeight-160||inCopy;
    if(!shipWaypoint.hidden){shipWaypoint.style.transform='translate3d('+markerX+'px,'+markerY+'px,0) translate(-50%,-100%)';text(shipWaypointText,'Your ship · '+Math.round(Math.hypot(body.x,body.z-4))+' m');}
    projected.set(body.x,body.y+2.16,body.z).project(camera);
    if(!pilotLabel.hidden)pilotLabel.style.transform='translate3d('+((projected.x*.5+.5)*innerWidth)+'px,'+((-projected.y*.5+.5)*innerHeight)+'px,0) translate(-50%,-100%)';
    refresh();
  }
  return {
    scene,camera,open,close,update,activate,setView,observe,closeFact,
    snapshot(){if(mode==='closed'||mode==='departing')return null;return {worldId:site.id,mode,position:{x:body.x,y:body.y,z:body.z,vy:body.vy,grounded:body.grounded,swimming:body.swimming,wading:body.wading},yaw:targetYaw,pitch:targetPitch,viewMode,facing:astronaut.rotation.y,explored:sessionExplored,transitionTime,elapsed};},
    requestJump(){if(mode==='walking'&&!this.factOpen)jumpRequested=true;},
    get factOpen(){return !factPanel.hidden;},
    get worldId(){return site.id;},
    dispose(){
      shipLocator.removeEventListener('click',locateShip);primary.removeEventListener('click',activate);secondary.removeEventListener('click',depart);
      observeButton.removeEventListener('click',observe);document.getElementById('surfaceFactClose').removeEventListener('click',closeFact);
      // Hull resources belong to the orbital ship; release only the visit's own assets.
      landedShip.remove(landingGear.root);scene.remove(landedShip);
      const geometries=new Set(),materials=new Set(),textures=new Set();
      for(const object of [scene,landingGear.root])object.traverse(o=>{if(o.isInstancedMesh)o.dispose();if(o.geometry)geometries.add(o.geometry);for(const m of (Array.isArray(o.material)?o.material:o.material?[o.material]:[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
      geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());scene.clear();
    },
    get active(){return mode!=='closed';},get mode(){return mode;},get viewMode(){return viewMode;},
    drag(dx,dy){targetYaw-=dx*.006;targetPitch=THREE.MathUtils.clamp(targetPitch+dy*.004,-.75,1.05);},
    get position(){const {support,...position}=body;return position;},
  };
}
