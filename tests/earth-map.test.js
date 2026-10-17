import test from 'node:test';
import assert from 'node:assert/strict';
import {createEarthMap} from '../src/earth-map.js';
import {earthMapStorageKey} from '../src/earth-map-state.js';

test('map opens from its button, saves fog, closes with M, and keeps other planets out',()=>{
  const previous={document:globalThis.document,window:globalThis.window,localStorage:globalThis.localStorage,HTMLInputElement:globalThis.HTMLInputElement};
  const originalNow=Date.now;let now=1000;Date.now=()=>now;
  const elements=new Map(),storage=new Map();let focused=null,mode='discovery',opens=0,closes=0;
  const calls=[];
  const context=new Proxy({}, {get:(_,key)=> (...args)=>{if(key==='drawImage')calls.push(args);if(key==='createRadialGradient')return {addColorStop(){}};}});
  class Element{
    constructor(){this.listeners=new Map();this.hidden=false;this.open=false;this.children=[];this.isConnected=true;this.textContent='';this.style={};}
    addEventListener(type,handler){if(!this.listeners.has(type))this.listeners.set(type,[]);this.listeners.get(type).push(handler);}
    emit(type,event={}){for(const callback of this.listeners.get(type)||[])callback(event);}
    getContext(){return context;}
    replaceChildren(...items){this.children=items;}
    append(...items){this.children.push(...items);}
    setAttribute(name,value){this[name]=value;}
    getBoundingClientRect(){return {left:0,top:0,right:768,bottom:768,width:768,height:768};}
    showModal(){this.open=true;this.modal=true;}
    show(){this.open=true;this.modal=false;}
    close(){this.open=false;this.emit('close');}
    focus(){focused=this;}
  }
  const get=id=>{if(!elements.has(id))elements.set(id,new Element());return elements.get(id);};
  const surface={active:true,worldId:'earth',mode:'walking',position:{x:6,z:7},heading:.55};
  try{
    globalThis.document={getElementById:get,createElement:()=>new Element(),get activeElement(){return focused;}};
    globalThis.window={addEventListener:()=>{}};
    globalThis.HTMLInputElement=class extends Element{};
    globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)};
    const map=createEarthMap({getSurface:()=>surface,getMode:()=>mode,onOpen:()=>opens++,onClose:()=>closes++});
    map.update();assert.equal(get('surfaceMap').hidden,false);
    get('surfaceMap').emit('click');assert.equal(map.active,true);assert.equal(opens,1);
    assert.equal(get('earthMapDialog').modal,false,'the live map does not make gameplay inert');
    let stopped=false;
    get('earthMapDialog').emit('keydown',{code:'KeyW',target:get('closeEarthMap'),stopPropagation(){stopped=true;},preventDefault(){}});
    assert.equal(stopped,false,'walking keys must reach the gameplay handler');
    surface.position={x:24,z:32};now+=500;map.update();
    assert.match(get('earthMapCoordinates').textContent,/24 m E \/ 32 m S/,'map position refreshes while open');
    surface.position={x:6,z:7};now+=500;map.update();
    assert.equal(get('earthMapRegions').children.length,11);
    get('earthMapRegionPanel').hidden=true;get('earthMapRegionsToggle').emit('click');assert.equal(get('earthMapRegionPanel').hidden,false);assert.equal(get('earthMapRegionsToggle')['aria-expanded'],'true');
    get('earthMapRegionsToggle').emit('click');assert.equal(get('earthMapRegionPanel').hidden,true);
    get('earthMapZoomIn').emit('click');assert.equal(get('earthMapZoomLabel').textContent,'3.5×');
    assert.equal(get('earthMapProgress').textContent,'1 of 11 regions visited');
    assert.ok(calls.length>=2,'renders terrain and fog layers');
    get('earthMapCanvas').emit('click',{clientX:384,clientY:384});
    assert.match(get('earthMapWaypoint').textContent,/Waypoint/);
    get('earthMapClear').emit('click');assert.equal(get('earthMapClear').hidden,true);
    get('earthMapDialog').emit('keydown',{code:'KeyM',target:get('closeEarthMap'),stopPropagation(){},preventDefault(){},repeat:false});
    assert.equal(map.active,false);assert.equal(closes,1);
    assert.ok(storage.has(earthMapStorageKey('discovery')));
    for(const position of [{x:34,z:-30},{x:-67,z:-9}]){surface.position=position;map.update();}
    map.open();assert.equal(get('earthMapProgress').textContent,'1 of 11 regions visited');map.close();
    mode='exploration';surface.position={x:6,z:7};map.update();map.open();map.close();
    assert.ok(storage.has(earthMapStorageKey('exploration')));
    map.reset('discovery');assert.equal(storage.has(earthMapStorageKey('discovery')),false);assert.equal(storage.has(earthMapStorageKey('exploration')),true);
    surface.worldId='moon';map.update();assert.equal(get('surfaceMap').hidden,true);map.open();assert.equal(map.active,false);
    surface.worldId='earth';surface.mode='ascending';map.update();assert.equal(get('surfaceMap').hidden,true);
  }finally{Date.now=originalNow;for(const [key,value]of Object.entries(previous)){if(value===undefined)delete globalThis[key];else globalThis[key]=value;}}
});
