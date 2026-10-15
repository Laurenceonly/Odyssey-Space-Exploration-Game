import * as THREE from 'three';
import { cabinLayout, cabinPositionClear, moveCabinWalker, nearCabinCockpit, windowRenderSize } from './cabin-physics.js';

export function createShipCabin({ keys, onControl }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090a0b);
  const camera = new THREE.PerspectiveCamera(66, 1, .025, 40);
  camera.rotation.order = 'YXZ';
  const player = new THREE.Vector3(0, cabinLayout.eyeHeight, 1.3);
  const basis = new THREE.Matrix4(), orientation = new THREE.Quaternion();
  const exteriorOffset = new THREE.Vector3(), viewDirection = new THREE.Vector3();
  const sunward = new THREE.Vector3(), windowAim = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  const renderSize = new THREE.Vector2(), viewMatrix = new THREE.Matrix4(), frustum = new THREE.Frustum();
  const portals = [];
  const drawingSize = new THREE.Vector2();
  const windowTarget = new THREE.WebGLRenderTarget(1,1,{depthBuffer:true,samples:4});
  const exteriorCamera = new THREE.PerspectiveCamera(66,1,.015,5000);
  const windowMaterial = new THREE.MeshBasicMaterial({map:windowTarget.texture,toneMapped:false});
  windowMaterial.onBeforeCompile = shader => {
    shader.uniforms.windowResolution={value:drawingSize};
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec2 windowResolution;')
      .replace('#include <map_fragment>','diffuseColor *= texture2D(map,gl_FragCoord.xy/windowResolution);');
  };
  windowMaterial.customProgramCacheKey=()=> 'live-window-screen-pixels-v1';
  let yaw = 0, pitch = 0;
  const controlRay = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let hoveredControl = null;
  function resolveControl() {
    camera.updateMatrixWorld(); scene.updateMatrixWorld();
    controlRay.setFromCamera(pointer, camera);
    const hit = controlRay.intersectObjects(scene.children, false)[0];
    const next = hit?.distance <= 3.4 && hit.object.userData.action ? hit.object : null;
    const previousButton=hoveredControl?.userData.button||hoveredControl;
    if(hoveredControl!==next&&previousButton?.material.emissive)previousButton.material.emissive.setHex(0x000000);
    hoveredControl = next;
    const nextButton=next?.userData.button||next;
    if(nextButton?.material.emissive)nextButton.material.emissive.setHex(0x444444);
    return next;
  }
  function point(clientX, clientY, rect) {
    pointer.set((clientX - rect.left) / rect.width * 2 - 1, -(clientY - rect.top) / rect.height * 2 + 1);
    return resolveControl();
  }
  function activatePointedControl() {
    const control = resolveControl();
    if (!control) return false;
    onControl(control.userData.action);
    return true;
  }
  const materials = {
    wall: new THREE.MeshStandardMaterial({ color: 0x393b3e, roughness: .75, metalness: .18 }),
    panel: new THREE.MeshStandardMaterial({ color: 0x25272a, roughness: .65, metalness: .25 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x121416, roughness: .48, metalness: .55 }),
    deck: new THREE.MeshStandardMaterial({ color: 0x17191b, roughness: .9 }),
    trim: new THREE.MeshStandardMaterial({ color: 0x878b90, metalness: .65, roughness: .38 }),
    seat: new THREE.MeshStandardMaterial({ color: 0x303236, roughness: .96 }),
    light: new THREE.MeshBasicMaterial({ color: 0xeeeeee }),
    screen: new THREE.MeshBasicMaterial({ color: 0xced3d8 }),
  };
  function box(name, size, position, material, rotation = 0) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.name = name; mesh.position.set(...position); mesh.rotation.z = rotation; scene.add(mesh); return mesh;
  }
  box('cabin-deck', [6, .18, 6.6], [0, -.09, 0], materials.deck);
  box('cabin-ceiling', [6, .16, 6.6], [0, 3.28, 0], materials.panel);
  box('starboard-wall', [.18, 3.2, 6.4], [2.99, 1.6, 0], materials.wall);
  box('aft-bulkhead', [6, 3.2, .18], [0, 1.6, 3.29], materials.wall);
  // The port observation window and cockpit windshield share the actual exterior.
  box('port-lower-wall', [.18, .975, 6.4], [-2.99, .4875, 0], materials.wall);
  box('port-upper-wall', [.18, .475, 6.4], [-2.99, 2.9625, 0], materials.wall);
  box('port-aft-wall', [.18, 1.75, 2.45], [-2.99, 1.85, 1.975], materials.wall);
  box('port-forward-wall', [.18, 1.75, .65], [-2.99, 1.85, -2.875], materials.wall);
  for (const z of [-2.6, .8]) box('port-window-jamb', [.2, 1.91, .12], [-2.84, 1.85, z], materials.frame);
  for (const y of [.91, 2.79]) box('port-window-rail', [.2, .13, 3.55], [-2.84, y, -.9], materials.frame);
  for (const side of [-1, 1]) {
    box('cabin-ceiling-light', [.045, .025, 5.8], [side * 2.47, 3.185, 0], materials.light);
    box('deck-guide', [.025, .01, 5.7], [side * 1.25, .008, 0], materials.trim);
    box('cockpit-door-side', [1.85, 3.2, .24], [side * 1.975, 1.6, -3.2], materials.wall);
    box('door-jamb', [.08, 2.65, .32], [side * 1.05, 1.325, -3.2], materials.trim);
    for (const z of [-2.9, 2.9]) box('cabin-rib', [.08, 3.15, .1], [side * 2.87, 1.6, z], materials.frame);
  }
  box('door-header', [2.18, .55, .28], [0, 2.925, -3.2], materials.panel);
  box('door-light', [1.65, .035, .05], [0, 2.65, -3.03], materials.light);
  box('bench-base', [.85, .38, 1.8], [-2.45, .19, 1.5], materials.frame);
  box('bench-cushion', [.95, .14, 1.8], [-2.425, .45, 1.5], materials.seat);
  box('bench-back', [.12, .6, 1.8], [-2.79, .78, 1.5], materials.seat);
  for (const z of [.9, 1.5, 2.1]) box('cushion-seam', [.9, .012, .015], [-2.4, .525, z], materials.frame);
  box('equipment-locker', [.8, 2.15, 1.8], [2.5, 1.075, 1.55], materials.panel);
  for (const z of [1.08, 2]) {
    box('locker-door', [.03, 1.9, .8], [2.087, 1.1, z], materials.wall);
    box('locker-handle', [.09, .24, .025], [2.045, 1.1, z + .24], materials.trim);
  }
  // Continuous floor and an open passage into a separate, walkable cockpit.
  box('cockpit-deck', [5, .18, 4.65], [0, -.09, -5.5], materials.deck);
  box('cockpit-ceiling', [5, .16, 4.65], [0, 3.28, -5.5], materials.panel);
  for (const side of [-1, 1]) {
    box('cockpit-side-wall', [.18, 3.2, 4.4], [side * 2.49, 1.6, -5.4], materials.wall);
    box('cockpit-light', [.04, .025, 4.1], [side * 1.9, 3.185, -5.4], materials.light);
    box('console-wing', [.65, .85, 1.25], [side * 1.95, .425, -6.35], materials.panel);
    box('windshield-jamb', [.15, 2.09, .22], [side * 2.225, 1.85, -7.48], materials.frame);
  }
  box('nose-lower-wall', [5, .9, .18], [0, .45, -7.69], materials.wall);
  box('nose-upper-wall', [5, .4, .18], [0, 3, -7.69], materials.wall);
  for (const side of [-1, 1]) box('nose-side-wall', [.25, 1.9, .18], [side * 2.275, 1.85, -7.69], materials.wall);
  for (const y of [.84, 2.86]) box('windshield-cross-member', [4.55, .12, .25], [0, y, -7.48], materials.frame);
  box('windshield-mullion', [.055, 1.9, .08], [0, 1.85, -7.54], materials.frame);
  box('navigation-console', [4.5, .85, .94], [0, .425, -7.12], materials.panel);
  box('console-top', [4.55, .07, 1], [0, .88, -7.1], materials.frame);
  const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.22, .32, .36, 12), materials.frame);
  pedestal.position.set(0, .18, -5.25); scene.add(pedestal);
  box('pilot-seat-base', [.82, .18, 1.06], [0, .46, -5.25], materials.frame);
  box('pilot-seat-cushion', [.75, .15, .92], [0, .605, -5.29], materials.seat);
  box('pilot-seat-back', [.82, .78, .17], [0, 1.01, -4.75], materials.seat);
  box('pilot-headrest', [.48, .22, .19], [0, 1.44, -4.75], materials.seat);
  for (const side of [-1, 1]) {
    box('seat-arm', [.1, .09, .72], [side * .43, .9, -5.3], materials.frame);
    box('seat-support', [.065, .42, .065], [side * .43, .68, -5.08], materials.trim);
  }
  function label(text, width, height, position, rotation = 0) {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 128;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#bcbcbc';
    ctx.font = '500 52px Oxanium, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 384, 64);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }));
    mesh.position.set(...position); mesh.rotation.y = rotation; scene.add(mesh);
  }
  label('COCKPIT', .9, .15, [0, 2.93, -3.045]);
  label('ODYSSEY', 1.15, .18, [0, 2.98, -7.57]);
  label('CABIN', .8, .14, [0, 2.95, -3.36], Math.PI);
  function actionTexture(title, action, width = 512, height = 256) {
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#101214'; ctx.fillRect(0,0,width,height);
    ctx.fillStyle = '#bcbcbc'; ctx.font = '500 24px Oxanium, sans-serif'; ctx.fillText(title,30,45);
    ctx.fillStyle = '#eee'; ctx.font = '500 38px Oxanium, sans-serif'; ctx.fillText(action,30,109);
    ctx.strokeStyle = '#696d73'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(30,140); ctx.lineTo(482,140); ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }
  function instrument(title, x, primary, actionLabel, controls) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1.04,.52),new THREE.MeshBasicMaterial({map:actionTexture(title,actionLabel)}));
    mesh.name = 'cockpit-instrument'; mesh.position.set(x,1.15,-7.04); mesh.rotation.x = -.42;
    mesh.userData = {action:primary,label:actionLabel}; scene.add(mesh);
    controls.forEach(([action,label],i) => {
      const dx = controls.length === 1 ? 0 : (i / (controls.length - 1) - .5) * .78;
      const key = box('console-key',[.215,.035,.2],[x+dx,.936,-6.87],materials.trim.clone());
      key.userData = {action,label};
      const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext('2d'); ctx.fillStyle = '#1b1d20';ctx.fillRect(0,0,256,128);
      ctx.fillStyle = '#eee';ctx.textAlign = 'center';ctx.textBaseline = 'middle';ctx.font = '600 34px Oxanium, sans-serif';ctx.fillText(label.toUpperCase(),128,64);
      const texture = new THREE.CanvasTexture(canvas);texture.colorSpace = THREE.SRGBColorSpace;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(.205,.18),new THREE.MeshBasicMaterial({map:texture}));
      face.rotation.x = -Math.PI/2;face.position.set(x+dx,.955,-6.87);face.userData = {action,label,button:key};face.name = 'console-key-label';scene.add(face);
    });
  }
  instrument('NAVIGATION',-1.25,'destinations','DESTINATIONS',[
    ['destinations','Map'],['log','Log'],['photo','Photo'],
  ]);
  instrument('SOUND & MUSIC',0,'settings','SOUNDTRACK',[
    ['sound','Sound'],['next-track','Next'],['volume-down','Vol −'],['volume-up','Vol +'],
  ]);
  instrument('FLIGHT CONTROLS',1.25,'take-controls','TAKE CONTROLS',[
    ['take-controls','Fly'],['camera-first','First'],['camera-chase','Third'],['settings','Settings'],
  ]);
  function portal(name, layout) {
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(layout.width,layout.height),windowMaterial);
    pane.name=name;pane.position.set(layout.x,layout.y,layout.z);pane.rotation.y=layout.yaw;scene.add(pane);portals.push(pane);
  }
  portal('live-cockpit-windshield',cabinLayout.window);
  portal('live-observation-window',cabinLayout.sideWindow);
  scene.add(new THREE.HemisphereLight(0xf3f4f6, 0x45484b, 1.55));
  for (const z of [.5, -5.2]) {
    const light = new THREE.PointLight(0xf0f1f3, 19, 8, 2); light.position.set(0, 2.7, z); scene.add(light);
  }
  function reset() { player.set(0, cabinLayout.eyeHeight, 1.3); yaw = pitch = 0; pointer.set(0,0); hoveredControl = null;
    scene.children.forEach(mesh=>{if(mesh.userData.action&&mesh.material.emissive)mesh.material.emissive.setHex(0x000000);});update(0); }
  function drag(dx, dy) { yaw -= dx * .004; pitch = THREE.MathUtils.clamp(pitch - dy * .003, -1.1, 1.1); }
  function update(dt, paused = false) {
    if (!paused) {
      yaw += (Number(keys.has('ArrowLeft')) - Number(keys.has('ArrowRight'))) * dt * 1.3;
      pitch = THREE.MathUtils.clamp(pitch + (Number(keys.has('ArrowUp')) - Number(keys.has('ArrowDown'))) * dt, -1.1, 1.1);
      moveCabinWalker(player, Number(keys.has('KeyW')) - Number(keys.has('KeyS')), Number(keys.has('KeyD')) - Number(keys.has('KeyA')), yaw, dt, keys.has('ShiftLeft') || keys.has('ShiftRight') ? 2.3 : 1.65);
    }
    camera.position.copy(player); camera.rotation.set(pitch, yaw, 0, 'YXZ');
    if(!paused)resolveControl();
  }
  function render(renderer, exteriorScene, ship, shipPosition, target, radius, flightOrientation = ship.quaternion) {
    const size = renderer.getSize(renderSize);
    if (camera.aspect !== size.x / size.y) { camera.aspect = size.x / size.y; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld(); scene.updateMatrixWorld();
    frustum.setFromProjectionMatrix(viewMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    if(target){
      viewDirection.copy(target).sub(shipPosition).normalize(); sunward.copy(target).negate().projectOnPlane(viewDirection);
      if (sunward.lengthSq() < .001) sunward.crossVectors(viewDirection, up);
      windowAim.copy(target).addScaledVector(sunward.normalize(), radius * .65);
      basis.lookAt(shipPosition, windowAim, up); orientation.setFromRotationMatrix(basis);
    }else orientation.copy(flightOrientation);
    exteriorOffset.copy(player).multiplyScalar(.06).applyQuaternion(orientation);
    renderer.getDrawingBufferSize(drawingSize);
    const dimensions=windowRenderSize(drawingSize.x,drawingSize.y,Math.min(4096,renderer.capabilities.maxTextureSize));
    if(windowTarget.width!==dimensions.width||windowTarget.height!==dimensions.height){windowTarget.setSize(dimensions.width,dimensions.height);windowTarget.samples=Math.min(4,renderer.capabilities.maxSamples);}
    exteriorCamera.aspect=camera.aspect;exteriorCamera.fov=camera.fov;exteriorCamera.updateProjectionMatrix();
    exteriorCamera.position.copy(shipPosition).add(exteriorOffset);
    exteriorCamera.quaternion.copy(orientation).multiply(camera.quaternion);
    // Both panes sample the exterior by screen pixel. Approaching the glass
    // never magnifies a fixed-resolution image or discards its offscreen area.
    const previousTarget=renderer.getRenderTarget(),visible=ship.visible;
    try{
      if(portals.some(pane=>frustum.intersectsObject(pane))){
        ship.visible=false;renderer.setRenderTarget(windowTarget);renderer.render(exteriorScene,exteriorCamera);
      }
    }finally{ship.visible=visible;renderer.setRenderTarget(previousTarget);}
    renderer.render(scene, camera);
  }
  reset();
  return { scene, camera, player, exteriorCamera, windowTarget, reset, drag, update, render, point, activatePointedControl,
    snapshot(){return {position:player.toArray(),yaw,pitch};},
    restore(state){if(!Array.isArray(state?.position)||state.position.length!==3||!state.position.every(Number.isFinite)||!Number.isFinite(state.yaw)||!Number.isFinite(state.pitch)||!cabinPositionClear(state.position[0],state.position[2]))return false;player.fromArray(state.position);yaw=state.yaw;pitch=THREE.MathUtils.clamp(state.pitch,-1.1,1.1);update(0);return true;},
    get pointedControl() { return hoveredControl ? {action:hoveredControl.userData.action,label:hoveredControl.userData.label} : null; },
    get inCockpit() { return player.z < -cabinLayout.halfDepth; },
    get nearCockpit() { return nearCabinCockpit(player); },
  };
}
