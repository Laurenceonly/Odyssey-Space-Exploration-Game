import test from 'node:test';
import assert from 'node:assert/strict';
import {createShipAudio, musicTracks} from '../src/audio.js';
import {playlistTrackIds} from '../src/music-scores.js';

class Param {
  value=0;
  setValueAtTime(v){this.value=v;} exponentialRampToValueAtTime(v){this.value=v;}
  linearRampToValueAtTime(v){this.value=v;} setTargetAtTime(v){this.value=v;}
  cancelScheduledValues(){} cancelAndHoldAtTime(){}
}
class AudioNode {
  gain=new Param();frequency=new Param();detune=new Param();Q=new Param();pan=new Param();playbackRate=new Param();
  threshold=new Param();knee=new Param();ratio=new Param();attack=new Param();release=new Param();
  disconnected=false;stopAt=null;startedAt=null;loop=false;
  connect(node){this.destination=node;return node;} disconnect(){this.disconnected=true;}
  start(at,offset){this.startedAt=at;this.offset=offset;} stop(at){this.stopAt=at;}
}
class Context {
  currentTime=0;sampleRate=8000;state='suspended';sources=[];gains=[];listeners=[];destination=new AudioNode();
  createGain(){const gain=new AudioNode();this.gains.push(gain);return gain;} createOscillator(){return new AudioNode();}
  createBiquadFilter(){return new AudioNode();} createConvolver(){return new AudioNode();}
  createDynamicsCompressor(){return new AudioNode();} createStereoPanner(){return new AudioNode();}
  createBufferSource(){const source=new AudioNode();this.sources.push(source);return source;}
  createBuffer(channels,length,rate){const data=new Float32Array(length);return{duration:length/rate,getChannelData:()=>data,copyToChannel(){}};}
  addEventListener(name,fn){this.listeners.push(fn);} resume(){this.state='running';this.listeners.forEach(fn=>fn());return Promise.resolve();}
}
class OfflineContext extends Context {
  constructor(channels,length,rate){super();this.length=length;this.sampleRate=rate;}
  createBuffer(channels,length,rate){return{duration:length/rate,getChannelData:()=>new Float32Array(1),copyToChannel(){}};}
  startRendering(){return Promise.resolve(this.createBuffer(1,this.length,this.sampleRate));}
}
function fixture(OfflineClass=OfflineContext){
  let context;const ticks=[];const saved=new Map();
  globalThis.localStorage={getItem:key=>saved.get(key)??null,setItem:(key,v)=>saved.set(key,v)};
  globalThis.setInterval=fn=>{ticks.push(fn);return ticks.length;};
  globalThis.window={AudioContext:class extends Context{constructor(){super();context=this;}},OfflineAudioContext:OfflineClass};
  const audio=createShipAudio();audio.start();
  return{audio,saved,get context(){return context;},tick(){ticks.forEach(fn=>fn());},advance(seconds){context.currentTime+=seconds;for(const s of context.sources)if(s.stopAt!==null&&s.stopAt<=context.currentTime&&!s.ended){s.ended=true;s.onended?.();}}};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
const loopSource=f=>f.context.sources.findLast(s=>s.loop&&s.buffer?.duration>10&&s.stopAt===null);

test('music uses an indefinitely looping native source when scheduler callbacks stop',async()=>{
  const f=fixture();await flush();const source=loopSource(f);assert.ok(source);
  assert.equal(source.buffer.duration,34);f.advance(180);
  assert.equal(source.loop,true);assert.equal(source.stopAt,null);assert.equal(source.disconnected,false);
  f.tick();await flush();assert.ok(loopSource(f),'late scheduler switches without first ending the playing loop');
});

test('track crossfade cleanup follows audio time rather than elapsed wall-clock time',async()=>{
  const f=fixture();await flush();const original=loopSource(f),bus=original.destination;
  f.audio.setMusicSelection('horizon');await flush();
  assert.ok(original.stopAt>f.context.currentTime);assert.equal(bus.disconnected,false);
  f.context.state='suspended';assert.equal(bus.disconnected,false,'suspending cannot discard the audible bus');
  f.context.state='running';f.advance(2);assert.equal(bus.disconnected,true,'disconnect only after source ends on the audio clock');
  assert.ok(loopSource(f));
});

test('all five tracks can be selected and restored, including both new scores',async()=>{
  const f=fixture();await flush();
  for(const track of musicTracks.filter(t=>t.id!=='playlist')){
    f.audio.setMusicSelection(track.id);await flush();f.advance(.2);f.tick();
    assert.equal(f.audio.getMusicSelection(),track.id);assert.equal(f.saved.get('odyssey-music-track'),track.id);
    assert.equal(f.audio.getActiveTrackName(),track.name.split(' · ')[0]);assert.ok(loopSource(f));
  }
  assert.equal(createShipAudio().getMusicSelection(),'bluehour');
});

test('next-track skips reach every playlist score without replacing playlist selection',async()=>{
  const f=fixture();await flush();const visited=['odyssey'];
  for(let i=0;i<playlistTrackIds.length;i++){visited.push(f.audio.nextTrack());await flush();f.advance(.2);f.tick();assert.equal(f.audio.getMusicSelection(),'playlist');}
  assert.deepEqual([...new Set(visited)],playlistTrackIds);
});

test('muting, zero volume, and a delayed resume retain the chosen native loop',async()=>{
  const f=fixture();await flush();f.audio.setMusicSelection('bluehour');await flush();
  f.audio.setMusicVolume(0);assert.equal(f.audio.isPlaying(),false);
  f.audio.setEnabled(false);f.advance(90);assert.ok(loopSource(f));
  f.audio.setMusicVolume(120);f.audio.setEnabled(true);await flush();assert.equal(f.audio.getMusicSelection(),'bluehour');assert.equal(f.audio.isPlaying(),true);
  assert.equal(f.audio.setMusicVolume(1000),150);assert.equal(f.audio.setMusicVolume(-20),0);
});


test('an uncached selection keeps the current music audible until its loop is ready',async()=>{
  const pending=[];
  class DeferredOffline extends OfflineContext{startRendering(){return new Promise(resolve=>pending.push(()=>resolve(this.createBuffer(1,this.length,this.sampleRate))));}}
  const f=fixture(DeferredOffline);pending.splice(0).forEach(resolve=>resolve());await flush();const original=loopSource(f);assert.ok(original);
  f.audio.setMusicSelection('sails');assert.equal(f.audio.getPendingTrackName(),'Solar Sails');
  assert.equal(original.stopAt,null);f.advance(30);f.tick();assert.equal(original.stopAt,null,'preparation never ends the existing loop');
  pending.splice(0).forEach(resolve=>resolve());await flush();f.advance(.2);f.tick();
  assert.equal(f.audio.getPendingTrackName(),null);assert.equal(f.audio.getActiveTrackName(),'Solar Sails');assert.ok(loopSource(f));
});

test('Earth music starts Solar Sails without changing the saved selection and restores it on departure',async()=>{
  const f=fixture();await flush();f.audio.setMusicSelection('bluehour');await flush();
  f.audio.enterEarthMusic();await flush();f.advance(.2);f.tick();
  assert.equal(f.audio.getActiveTrackName(),'Solar Sails');assert.equal(f.audio.getMusicSelection(),'bluehour');assert.equal(f.saved.get('odyssey-music-track'),'bluehour');
  f.audio.leaveEarthMusic();await flush();f.advance(.2);f.tick();assert.equal(f.audio.getActiveTrackName(),'Blue Hour');
});

test('movement sounds follow distance and stop while muted',async()=>{
  const f=fixture();await flush();const before=f.context.sources.length;
  f.audio.surfaceMotion({grounded:true,distance:.6});assert.equal(f.context.sources.length,before);
  f.audio.surfaceMotion({grounded:true,distance:.6});assert.equal(f.context.sources.length,before+1);
  f.audio.surfaceMotion({swimming:true,distance:1.2,enteredWater:true});assert.equal(f.context.sources.length,before+3);
  f.audio.setEnabled(false);f.audio.surfaceMotion({grounded:true,distance:3,landed:true});assert.equal(f.context.sources.length,before+3);
});

test('surface movements play loaded footstep and splash recordings',async()=>{
  const originalFetch=globalThis.fetch;
  Context.prototype.decodeAudioData=async()=>({duration:1,recording:true});
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});
  try{
    const f=fixture();await flush();await flush();
    f.audio.surfaceMotion({grounded:true,distance:1.2});
    assert.equal(f.context.sources.at(-1).buffer.recording,true,'footsteps use recordings');
    f.audio.surfaceMotion({swimming:true,distance:1.2});
    assert.equal(f.context.sources.at(-1).buffer.recording,true,'swimming uses recordings');
    assert.ok(f.context.sources.at(-1).offset>=.48,'skip the silence at the start of the splash');
    const before=f.context.sources.length;f.audio.surfaceMotion({inWater:true,grounded:true,landed:true,distance:1.2});
    assert.equal(f.context.sources.length,before+1,'wading plays a splash without a dry landing footstep');
    assert.ok(f.context.sources.at(-1).offset>=.48);
  }finally{globalThis.fetch=originalFetch;delete Context.prototype.decodeAudioData;}
});

test('hoverboard sound rises with movement speed and fades when stopped or unequipped',async()=>{
  const f=fixture();await flush();
  f.audio.setHoverboardSound(false,0);const before=f.context.gains.map(node=>node.gain.value);
  f.audio.setHoverboardSound(true,5);const slow=f.context.gains.map(node=>node.gain.value);
  const changed=slow.map((value,i)=>value!==before[i]?i:-1).filter(i=>i>=0);assert.equal(changed.length,2);
  f.audio.setHoverboardSound(true,12);for(const i of changed)assert.ok(f.context.gains[i].gain.value>slow[i]);
  f.audio.setHoverboardSound(true,0);for(const i of changed)assert.equal(f.context.gains[i].gain.value,0);
  f.audio.setHoverboardSound(true,8);f.audio.setHoverboardSound(false,8);for(const i of changed)assert.equal(f.context.gains[i].gain.value,0);
});
