import assert from 'node:assert/strict';
let started=0;
let timer;

class Parameter {
  value=0;
  setTargetAtTime(value){this.value=value;}
  setValueAtTime(value){this.value=value;}
  exponentialRampToValueAtTime(value){this.value=value;}
}
class AudioNode {
  gain=new Parameter();
  frequency=new Parameter();
  Q=new Parameter();
  connect(){}
  disconnect(){}
  start(){started++;}
  stop(){this.onended?.();}
}
class FakeAudioContext {
  constructor(){FakeAudioContext.last=this;}
  currentTime=0;
  sampleRate=8000;
  destination=new AudioNode();
  createGain(){return new AudioNode();}
  createBiquadFilter(){return new AudioNode();}
  createConvolver(){return new AudioNode();}
  createOscillator(){return new AudioNode();}
  createBuffer(){return {getChannelData:()=>new Float32Array(16000)};}
  createBufferSource(){return new AudioNode();}
  resume(){return Promise.resolve();}
}

const values=new Map();
globalThis.window={AudioContext:FakeAudioContext};
globalThis.document={hidden:false};
globalThis.setInterval=callback=>{timer=callback;return 1;};
globalThis.localStorage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
const {createShipAudio}=await import('../src/audio.js');
const audio=createShipAudio();
assert.equal(audio.getMusicVolume(),100);
assert.equal(audio.start(),true);
const initialVoices=started;
FakeAudioContext.last.currentTime=35;
timer();
assert.ok(started>initialVoices,'music scheduling continues without render frames');
audio.update(18,.3);
audio.cue('engage');
audio.cue('arrival');
assert.equal(audio.setEnabled(false),false);
assert.equal(values.get('odyssey-sound'),'off');
assert.equal(audio.setEnabled(true),true);
assert.equal(values.get('odyssey-sound'),'on');
assert.equal(audio.setMusicVolume(140),140);
assert.equal(values.get('odyssey-music-volume'),'140');
assert.equal(createShipAudio().getMusicVolume(),140);
console.log('Audio smoke check passed');
