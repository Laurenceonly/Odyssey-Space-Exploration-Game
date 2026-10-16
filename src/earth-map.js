import {Vector3} from 'three';
import {LAKE,SITE_RADIUS,terrainHeight,waterLevelAt} from './earth-physics.js';
import {EARTH_LOOP,EARTH_RIDGE_ROUTE,earthMeadowCover,earthWoodland} from './earth-layout.js';
import {EARTH_REGIONS,MAP_EXTENT,MAP_CELL,MAP_GRID,createEarthMapState,earthMapStorageKey} from './earth-map-state.js';

const SIZE=1024,SCALE=SIZE/(MAP_EXTENT*2);
const screen=value=>(value+MAP_EXTENT)*SCALE;
const world=value=>value/SCALE-MAP_EXTENT;
const element=id=>document.getElementById(id);
const path=(ctx,points)=>{ctx.beginPath();points.forEach(([x,z],i)=>ctx[i?'lineTo':'moveTo'](screen(x),screen(z)));ctx.stroke();};

export function createEarthMap({getSurface,getMode,onOpen=()=>{},onClose=()=>{}}){
  const dialog=element('earthMapDialog'),button=element('surfaceMap'),canvas=element('earthMapCanvas'),ctx=canvas.getContext('2d');
  const waypointLabel=element('earthMapWaypoint'),clearButton=element('earthMapClear');
  const minimap=element('earthMinimap'),miniCanvas=element('earthMinimapCanvas'),mini=miniCanvas.getContext('2d');
  const worldMarker=element('surfaceMapWaypoint'),worldMarkerText=element('surfaceMapWaypointText'),markerArrow=element('surfaceMapWaypointArrow'),projected=new Vector3();
  let lastMiniFrame=-Infinity,lastFogState=null,lastFogSize=-1;
  const base=document.createElement('canvas');base.width=base.height=SIZE;
  const fog=document.createElement('canvas');fog.width=fog.height=SIZE;
  let mode=null,state=null,dirty=false,lastSaved=0,returnFocus=null,baseReady=false,zoom=1,centerX=0,centerZ=0,projection=null,drag=null,suppressClick=false;
  function load(){
    const nextMode=getMode();if(mode===nextMode&&state)return;
    save();mode=nextMode;let saved=null;
    try{saved=JSON.parse(localStorage.getItem(earthMapStorageKey(mode))||'null');}catch{}
    state=createEarthMapState(saved);dirty=false;
  }
  function save(){
    if(!dirty||!state||!mode)return;
    try{localStorage.setItem(earthMapStorageKey(mode),JSON.stringify(state.snapshot()));dirty=false;}catch{}
    lastSaved=Date.now();
  }
  function buildBase(){
    if(baseReady)return;const c=base.getContext('2d');
    c.fillStyle='#323b35';c.fillRect(0,0,SIZE,SIZE);
    const resolution=384,cell=SIZE/resolution,spacing=MAP_EXTENT*2/resolution;
    for(let iz=0;iz<resolution;iz++)for(let ix=0;ix<resolution;ix++){
      const x=(ix+.5)*spacing-MAP_EXTENT,z=(iz+.5)*spacing-MAP_EXTENT;
      
      const height=terrainHeight(x,z),water=waterLevelAt(x,z);
      if(water!==null){const depth=LAKE.level-height;c.fillStyle=depth<2?'#6d9292':depth<6?'#527a80':'#3e626f';}
      else{
        const dx=(terrainHeight(x+.5,z)-terrainHeight(x-.5,z)),dz=(terrainHeight(x,z+.5)-terrainHeight(x,z-.5));
        const woods=earthWoodland(x,z),grain=Math.sin(x*1.7+z*.67)*Math.cos(z*1.3)*.8;
        const light=Math.max(25,Math.min(53,43+height*.5-dx*9-dz*7-woods*13+grain));
        c.fillStyle='hsl('+(woods>.16?120:89)+' '+(16+earthMeadowCover(x,z)*9)+'% '+light+'%)';
      }
      c.fillRect(ix*cell,iz*cell,cell+.5,cell+.5);
    }
    c.save();c.beginPath();c.arc(SIZE/2,SIZE/2,SITE_RADIUS*SCALE,0,Math.PI*2);c.clip();
    // Contours sample the same height function as the actual walking terrain.
    const steps=96,delta=MAP_EXTENT*2/steps;c.strokeStyle='#dce4bd24';c.lineWidth=1;
    for(let level=-9;level<=27;level+=3){
      c.beginPath();
      for(let iz=0;iz<steps;iz++)for(let ix=0;ix<steps;ix++){
        const x=ix*delta-MAP_EXTENT,z=iz*delta-MAP_EXTENT;
        const corners=[[x,z],[x+delta,z],[x+delta,z+delta],[x,z+delta]],heights=corners.map(([a,b])=>terrainHeight(a,b)),hits=[];
        for(let j=0;j<4;j++){
          const k=(j+1)%4;if((heights[j]<level)===(heights[k]<level))continue;
          const t=(level-heights[j])/(heights[k]-heights[j]);
          hits.push([corners[j][0]+(corners[k][0]-corners[j][0])*t,corners[j][1]+(corners[k][1]-corners[j][1])*t]);
        }
        for(let j=1;j<hits.length;j+=2){c.moveTo(screen(hits[j-1][0]),screen(hits[j-1][1]));c.lineTo(screen(hits[j][0]),screen(hits[j][1]));}
      }
      c.stroke();
    }
    c.lineJoin='round';c.lineCap='round';
    c.strokeStyle='#3b402b';c.lineWidth=5;path(c,EARTH_LOOP);path(c,EARTH_RIDGE_ROUTE);
    c.strokeStyle='#c7bc91';c.lineWidth=2.5;path(c,EARTH_LOOP);path(c,EARTH_RIDGE_ROUTE);
    c.restore();baseReady=true;
  }
  function buildFog(){
    if(lastFogState===state&&lastFogSize===state.explored.size)return;
    lastFogState=state;lastFogSize=state.explored.size;
    const f=fog.getContext('2d');f.globalCompositeOperation='source-over';f.filter='none';f.clearRect(0,0,SIZE,SIZE);
    f.fillStyle='rgba(18,27,25,.48)';f.fillRect(0,0,SIZE,SIZE);
    f.globalCompositeOperation='destination-out';f.fillStyle='#000';f.filter='blur(12px)';f.beginPath();
    for(const id of state.explored){const x=(id%MAP_GRID+.5)*MAP_CELL-MAP_EXTENT,z=(Math.floor(id/MAP_GRID)+.5)*MAP_CELL-MAP_EXTENT;f.moveTo(screen(x)+MAP_CELL*SCALE,screen(z));f.arc(screen(x),screen(z),MAP_CELL*SCALE,0,Math.PI*2);}
    f.fill();f.filter='none';f.globalCompositeOperation='source-over';  }
  function drawMinimap(surface){
    buildBase();buildFog();
    const size=320,range=160,p=surface.mode==='walking'?surface.position:{x:0,z:4},scale=size/(range*2);
    const sx=x=>size/2+(x-p.x)*scale,sz=z=>size/2+(z-p.z)*scale;
    miniCanvas.width=miniCanvas.height=size;mini.fillStyle='#29312d';mini.fillRect(0,0,size,size);
    for(const layer of [base,fog])mini.drawImage(layer,sx(-MAP_EXTENT),sz(-MAP_EXTENT),MAP_EXTENT*2*scale,MAP_EXTENT*2*scale);
    mini.strokeStyle='#bdcddd';mini.fillStyle='#233d44';mini.lineWidth=3;mini.beginPath();mini.moveTo(sx(0),sz(4)-7);mini.lineTo(sx(0)+7,sz(4));mini.lineTo(sx(0),sz(4)+7);mini.lineTo(sx(0)-7,sz(4));mini.closePath();mini.fill();mini.stroke();
    if(state.waypoint){
      const w=state.waypoint;mini.strokeStyle='#f4ca81';mini.lineWidth=2;mini.setLineDash([5,5]);mini.beginPath();mini.moveTo(size/2,size/2);mini.lineTo(sx(w.x),sz(w.z));mini.stroke();mini.setLineDash([]);
      const dx=w.x-p.x,dz=w.z-p.z,factor=Math.min(1,140/Math.max(1,Math.hypot(dx,dz)));mini.fillStyle='#f4ca81';mini.beginPath();mini.arc(size/2+dx*factor,size/2+dz*factor,5,0,Math.PI*2);mini.fill();
    }
    mini.save();mini.translate(size/2,size/2);mini.rotate(-(surface.heading??0));mini.fillStyle='#fff';mini.strokeStyle='#142018';mini.lineWidth=2;mini.beginPath();mini.moveTo(0,-10);mini.lineTo(7,8);mini.lineTo(0,4);mini.lineTo(-7,8);mini.closePath();mini.fill();mini.stroke();mini.restore();
  }
  function updateWaypoint(surface){
    const w=state.waypoint;worldMarker.hidden=!w||surface.mode!=='walking'||dialog.open;
    if(worldMarker.hidden||!surface.camera)return;
    const p=surface.position,distance=Math.hypot(w.x-p.x,w.z-p.z),camera=surface.camera;
    projected.set(w.x,terrainHeight(w.x,w.z)+1.8,w.z).project(camera);
    const width=window.innerWidth,height=window.innerHeight;
    const bearing=Math.atan2(-(w.x-camera.position.x),-(w.z-camera.position.z));
    const cameraYaw=Math.atan2(Math.sin(camera.rotation.y),Math.cos(camera.rotation.y));
    const relative=Math.atan2(Math.sin(bearing-cameraYaw),Math.cos(bearing-cameraYaw));
    const onscreen=projected.z>=-1&&projected.z<=1&&Math.abs(projected.x)<.85&&Math.abs(projected.y)<.65;
    const x=onscreen?(projected.x*.5+.5)*width:Math.max(90,Math.min(width-130,width/2-Math.sin(relative)*width*.43));
    const y=onscreen?(-projected.y*.5+.5)*height:height*.28;
    worldMarker.style.transform='translate3d('+x+'px,'+y+'px,0) translate(-50%,-50%)';
    markerArrow.textContent=onscreen?'◆':'↑';markerArrow.style.transform=onscreen?'none':'rotate('+(-relative)+'rad)';
    worldMarkerText.textContent=distance<8?'Waypoint reached':'Waypoint · '+Math.round(distance)+' m';
  }
  function renderRegions(){
    const list=element('earthMapRegions');list.replaceChildren();
    for(const region of EARTH_REGIONS){
      const li=document.createElement('li'),name=document.createElement('strong'),status=document.createElement('span');
      name.textContent=region.name;status.textContent=region.available?(state.visited.has(region.id)?'You are here':'Not visited'):'Not yet available';
      li.className=region.available?'earth-map-current':'earth-map-future';li.append(name,status);list.append(li);
    }
    element('earthMapProgress').textContent=state.visited.size+' of '+EARTH_REGIONS.length+' regions visited';
  }
  function render(){
    if(!dialog.open)return;const surface=getSurface();if(!surface)return;
    const rect=canvas.getBoundingClientRect(),ratio=Math.min(window.devicePixelRatio||1,1.5);
    const width=Math.max(1,Math.round(rect.width*ratio)),height=Math.max(1,Math.round(rect.height*ratio));
    canvas.width=width;canvas.height=height;
    const scale=Math.min(width,height)/(MAP_EXTENT*2)*zoom;
    const sx=x=>width/2+(x-centerX)*scale,sz=z=>height/2+(z-centerZ)*scale;
    projection={scale,width,height,sx,sz};
    buildBase();ctx.clearRect(0,0,width,height);ctx.fillStyle='#29312d';ctx.fillRect(0,0,width,height);
    ctx.drawImage(base,sx(-MAP_EXTENT),sz(-MAP_EXTENT),MAP_EXTENT*2*scale,MAP_EXTENT*2*scale);
    buildFog();ctx.drawImage(fog,sx(-MAP_EXTENT),sz(-MAP_EXTENT),MAP_EXTENT*2*scale,MAP_EXTENT*2*scale);
    ctx.strokeStyle='#c1d0ce05';ctx.lineWidth=ratio;
    for(let value=-500;value<=500;value+=100){ctx.beginPath();ctx.moveTo(sx(value),sz(-SITE_RADIUS));ctx.lineTo(sx(value),sz(SITE_RADIUS));ctx.moveTo(sx(-SITE_RADIUS),sz(value));ctx.lineTo(sx(SITE_RADIUS),sz(value));ctx.stroke();}
    ctx.strokeStyle='#d6e6dc45';ctx.lineWidth=ratio;ctx.setLineDash([3*ratio,7*ratio]);ctx.beginPath();ctx.arc(sx(0),sz(0),SITE_RADIUS*scale,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
    const label=(text,x,z,align='left')=>{
      ctx.font=12*ratio+'px "DM Sans",sans-serif';ctx.textAlign=align;ctx.fillStyle='#e6e9e5';ctx.shadowColor='#071014';ctx.shadowBlur=7*ratio;ctx.fillText(text,x,z);ctx.shadowBlur=0;ctx.textAlign='left';
    };
    const walking=surface.mode==='walking',position=walking?surface.position:{x:0,z:4};
    // Geographic labels sit on the terrain; local landmarks aren't separate regions.
    ctx.font='500 '+Math.round(27*ratio)+'px "Oxanium",sans-serif';ctx.textAlign='center';ctx.fillStyle='#e5e8cf85';
    ctx.fillText('Fernlilt Grasslands',sx(-45),sz(-155));ctx.textAlign='left';
    if(zoom>=2){label('Pond',sx(LAKE.x),sz(LAKE.z)-25*scale,'center');}
    if(walking){
      ctx.save();ctx.translate(sx(position.x),sz(position.z));ctx.rotate(-(surface.heading??0));
      const cone=ctx.createRadialGradient(0,0,0,0,0,75*ratio);cone.addColorStop(0,'#ffffff24');cone.addColorStop(1,'#ffffff00');ctx.fillStyle=cone;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,75*ratio,-Math.PI*.7,-Math.PI*.3);ctx.closePath();ctx.fill();ctx.restore();
    }
    // Ship and player use different silhouettes and labels, even near touchdown.
    ctx.save();ctx.translate(sx(0),sz(4));ctx.scale(ratio,ratio);ctx.strokeStyle='#a9c5b8';ctx.fillStyle='#182c2b';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(7,0);ctx.lineTo(0,7);ctx.lineTo(-7,0);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    label('Your ship',sx(0)-12*ratio,sz(4)+24*ratio,'right');
    const waypoint=state.waypoint;
    if(waypoint){
      const px=sx(waypoint.x),pz=sz(waypoint.z);
      ctx.strokeStyle='#e8c48299';ctx.lineWidth=1.5*ratio;ctx.setLineDash([5*ratio,6*ratio]);ctx.beginPath();ctx.moveTo(sx(position.x),sz(position.z));ctx.lineTo(px,pz);ctx.stroke();ctx.setLineDash([]);
      ctx.strokeStyle='#f4ca81';ctx.lineWidth=2*ratio;
      ctx.beginPath();ctx.moveTo(px,pz+8*ratio);ctx.lineTo(px,pz-12*ratio);ctx.lineTo(px+13*ratio,pz-8*ratio);ctx.lineTo(px,pz-4*ratio);ctx.stroke();
      label('Waypoint',px+18*ratio,pz);
      waypointLabel.textContent='Waypoint · '+Math.round(Math.hypot(position.x-waypoint.x,position.z-waypoint.z))+' m away';clearButton.hidden=false;
    }else{waypointLabel.textContent='';clearButton.hidden=true;}
    if(walking){
      ctx.save();ctx.translate(sx(position.x),sz(position.z));ctx.scale(ratio,ratio);ctx.rotate(-(surface.heading??0));
      ctx.shadowColor='#dce9da66';ctx.shadowBlur=12;ctx.fillStyle='#f1f3ee';ctx.strokeStyle='#0a141a';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,-10);ctx.lineTo(7,8);ctx.lineTo(0,4);ctx.lineTo(-7,8);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
      label('You are here',sx(position.x)+15*ratio,sz(position.z)-10*ratio);
    }
    const metres=zoom>2?50:100,bx=36*ratio,by=height-80*ratio;
    ctx.strokeStyle='#d2dbd4';ctx.lineWidth=1.5*ratio;ctx.beginPath();ctx.moveTo(bx,by-4*ratio);ctx.lineTo(bx,by);ctx.lineTo(bx+metres*scale,by);ctx.lineTo(bx+metres*scale,by-4*ratio);ctx.stroke();
    label(metres+' m',bx,by-11*ratio);
    element('earthMapZoomLabel').textContent=zoom.toFixed(1)+'×';element('earthMapZoomOut').disabled=zoom<=1;element('earthMapZoomIn').disabled=zoom>=8;
    element('earthMapLocation').textContent=walking?'Fernlilt Grasslands':'Your ship · Fernlilt';
    element('earthMapCoordinates').textContent=Math.round(Math.abs(position.x))+' m '+(position.x<0?'W':'E')+' / '+Math.round(Math.abs(position.z))+' m '+(position.z<0?'N':'S');
    canvas.setAttribute('aria-label','Fernlilt Grasslands map. '+(walking?'You are '+Math.round(Math.hypot(position.x,position.z-4))+' metres from your ship.':'You are aboard your parked ship.')+' Fog marks unexplored ground.');
  }
  function changeZoom(next){zoom=Math.max(1,Math.min(8,next));if(zoom===1){centerX=0;centerZ=0;}render();}
  function close(){if(dialog.open)dialog.close();}
  function open(){
    if(dialog.open)return;
    const surface=getSurface();if(!surface?.active||surface.worldId!=='earth'||!['walking','parked'].includes(surface.mode))return;
    load();if(surface.mode==='walking')dirty=state.visit(surface.position.x,surface.position.z)||dirty;
    zoom=3;const p=surface.mode==='walking'?surface.position:{x:0,z:4};centerX=p.x;centerZ=p.z;returnFocus=document.activeElement;onOpen();dialog.showModal();element('earthMapRegionPanel').hidden=true;element('earthMapRegionsToggle').setAttribute('aria-expanded','false');element('earthMapPinControls').hidden=true;renderRegions();render();element('closeEarthMap').focus();save();
  }
  function toggle(){if(dialog.open)close();else open();}
  function place(x,z){
    if(!state.setWaypoint(x,z)){waypointLabel.textContent='Choose a point inside Fernlilt.';return;}
    render();
  }
  const onMapClick=event=>{
    if(suppressClick){suppressClick=false;return;}if(!projection)return;
    const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*projection.width,z=(event.clientY-rect.top)/rect.height*projection.height;
    place(centerX+(x-projection.width/2)/projection.scale,centerZ+(z-projection.height/2)/projection.scale);
  };
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;drag={x:event.clientX,y:event.clientY,centerX,centerZ,moved:false};canvas.setPointerCapture?.(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{
    if(!drag||!projection)return;const dx=event.clientX-drag.x,dz=event.clientY-drag.y;
    if(Math.hypot(dx,dz)>4)drag.moved=true;if(!drag.moved)return;
    const rect=canvas.getBoundingClientRect();centerX=Math.max(-SITE_RADIUS,Math.min(SITE_RADIUS,drag.centerX-dx/rect.width*projection.width/projection.scale));centerZ=Math.max(-SITE_RADIUS,Math.min(SITE_RADIUS,drag.centerZ-dz/rect.height*projection.height/projection.scale));render();
  });
  canvas.addEventListener('pointerup',()=>{suppressClick=drag?.moved===true;drag=null;});
  canvas.addEventListener('pointercancel',()=>{drag=null;suppressClick=false;});
  canvas.addEventListener('wheel',event=>{event.preventDefault();changeZoom(zoom+(event.deltaY<0?.25:-.25));},{passive:false});
  element('earthMapZoomIn').addEventListener('click',()=>changeZoom(zoom+.5));
  element('earthMapZoomOut').addEventListener('click',()=>changeZoom(zoom-.5));
  element('earthMapCenter').addEventListener('click',()=>{const surface=getSurface(),p=surface.mode==='walking'?surface.position:{x:0,z:4};centerX=p.x;centerZ=p.z;zoom=2;render();});
  window.addEventListener('resize',()=>{if(dialog.open)render();});
  element('earthMapRegionsToggle').addEventListener('click',()=>{const panel=element('earthMapRegionPanel');panel.hidden=!panel.hidden;element('earthMapRegionsToggle').setAttribute('aria-expanded',String(!panel.hidden));});
  minimap.addEventListener('click',open);
  button.addEventListener('click',toggle);canvas.addEventListener('click',onMapClick);element('closeEarthMap').addEventListener('click',close);
  clearButton.addEventListener('click',()=>{state.clearWaypoint();render();});
  element('earthMapPin').addEventListener('click',()=>{const panel=element('earthMapPinControls');panel.hidden=!panel.hidden;if(!panel.hidden){const p=getSurface().position;element('earthMapPinX').value=Math.round(p.x);element('earthMapPinZ').value=Math.round(p.z);element('earthMapPinX').focus();}});
  element('earthMapPlacePin').addEventListener('click',()=>{
    const x=element('earthMapPinX').valueAsNumber,z=element('earthMapPinZ').valueAsNumber;place(x,z);
  });
  dialog.addEventListener('keydown',event=>{
    event.stopPropagation();
    const editing=event.target instanceof HTMLInputElement;
    if(event.code==='Escape'||event.code==='KeyM'&&!editing&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();if(!event.repeat)close();}
  });
  dialog.addEventListener('click',event=>{const r=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom))close();});
  dialog.addEventListener('close',()=>{save();onClose();if(returnFocus?.isConnected&&!returnFocus.hidden)returnFocus.focus({preventScroll:true});else element('universe').focus({preventScroll:true});});
  window.addEventListener('pagehide',save);
  return {
    open,close,toggle,get active(){return dialog.open;},
    update(){
      const surface=getSurface();const available=surface?.active&&surface.worldId==='earth'&&['walking','parked'].includes(surface.mode);
      button.hidden=!available;minimap.hidden=!available||dialog.open;worldMarker.hidden=true;if(!available){close();save();return;}
      load();
      if(surface.mode==='walking'&&!dialog.open)dirty=state.visit(surface.position.x,surface.position.z)||dirty;
      if(dirty&&Date.now()-lastSaved>1000)save();
      if(!dialog.open){updateWaypoint(surface);const now=Date.now();if(now-lastMiniFrame>250){drawMinimap(surface);lastMiniFrame=now;}} 
    },
    reset(resetMode){if(resetMode===mode){dirty=false;state=createEarthMapState();}try{localStorage.removeItem(earthMapStorageKey(resetMode));}catch{}},
  };
}
