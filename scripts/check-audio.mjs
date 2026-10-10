import assert from 'node:assert/strict';
import {createShipAudio} from '../src/audio.js';

const saved=new Map();
globalThis.localStorage={getItem:key=>saved.get(key)??null,setItem:(key,value)=>saved.set(key,value)};
let clock;
let tick;
globalThis.setInterval=callback=>{tick=callback;return 1;};
globalThis.setTimeout=()=>1;

class Param {
  value=0;
  setValueAtTime(value){this.value=value;}
  exponentialRampToValueAtTime(value){this.value=value;}
  linearRampToValueAtTime(value){this.value=value;}
  setTargetAtTime(value){this.value=value;}
  cancelScheduledValues(){}
  cancelAndHoldAtTime(){}
}
class Node {
  gain=new Param();frequency=new Param();Q=new Param();
  detune=new Param();pan=new Param();threshold=new Param();knee=new Param();
  ratio=new Param();attack=new Param();release=new Param();
  connect(){}
  disconnect(){}
  start(){}
  stop(){}
}
class FakeAudioContext {
  currentTime=0;
  sampleRate=8000;
  destination=new Node();
  constructor(){clock=this;}
  createGain(){return new Node();}
  createOscillator(){return new Node();}
  createBiquadFilter(){return new Node();}
  createConvolver(){return new Node();}
  createDynamicsCompressor(){return new Node();}
  createStereoPanner(){return new Node();}
  createBufferSource(){return new Node();}
  createBuffer(channels,length){return {getChannelData:()=>new Float32Array(length)};}
  resume(){return Promise.resolve();}
}
globalThis.window={AudioContext:FakeAudioContext};

const audio=createShipAudio();
assert.equal(audio.start(),true);
assert.equal(audio.getMusicSelection(),'playlist');
assert.equal(audio.getActiveTrackName(),'Odyssey');
for(let i=0;i<9;i++){clock.currentTime+=11;tick();}
assert.equal(audio.getActiveTrackName(),'Event Horizon');
audio.setMusicSelection('starlight');
assert.equal(audio.getActiveTrackName(),'Starlight Drift');
assert.equal(saved.get('odyssey-music-track'),'starlight');
assert.equal(createShipAudio().getMusicSelection(),'starlight');
audio.setMusicVolume(120);
audio.update(20,.3);
audio.asteroidImpact(true,14,.6,.5,.3);
clock.currentTime+=1;
audio.asteroidImpact(false,3,3,-.5,.1);
audio.setEnabled(false);
audio.setEnabled(true);
console.log('Audio scheduling, playlist rotation, track switching, and saved choice passed.');
