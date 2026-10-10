export const musicTracks = [
  {id:'playlist',name:'Playlist · all tracks'},
  {id:'odyssey',name:'Odyssey · original'},
  {id:'horizon',name:'Event Horizon · cinematic'},
  {id:'starlight',name:'Starlight Drift · ambient'},
];

const scores={
  odyssey:{interval:8.5,duration:11.4,kind:'original',progression:[
    {bass:73.42,pad:[146.83,174.61,220,329.63],melody:[659.25,587.33]},
    {bass:58.27,pad:[116.54,174.61,220,293.66],melody:[587.33,523.25]},
    {bass:87.31,pad:[130.81,174.61,196,329.63],melody:[698.46,659.25]},
    {bass:65.41,pad:[130.81,196,261.63,293.66],melody:[587.33,783.99]},
  ]},
  horizon:{interval:10.5,duration:13.2,kind:'cinematic',progression:[
    {bass:65.41,pad:[130.81,155.56,196,233.08],melody:[392,466.16,523.25]},
    {bass:51.91,pad:[103.83,155.56,196,261.63],melody:[392,349.23,311.13]},
    {bass:77.78,pad:[155.56,196,233.08,311.13],melody:[466.16,523.25,622.25]},
    {bass:58.27,pad:[116.54,174.61,233.08,293.66],melody:[349.23,466.16,587.33]},
  ]},
  starlight:{interval:7.8,duration:10.1,kind:'ambient',progression:[
    {bass:65.41,pad:[130.81,164.81,196,293.66],melody:[587.33,659.25,783.99]},
    {bass:82.41,pad:[164.81,196,246.94,329.63],melody:[659.25,783.99,987.77]},
    {bass:55,pad:[110,164.81,220,293.66],melody:[587.33,493.88,659.25]},
    {bass:73.42,pad:[146.83,185,220,329.63],melody:[659.25,739.99,880]},
  ]},
};

export function createShipAudio() {
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  let context;
  let master;
  let engineGain;
  let engineFilter;
  let engineLow;
  let engineHigh;
  let airGain;
  let airFilter;
  let boostGain;
  let boostTone;
  let boostNoiseGain;
  let boostNoiseFilter;
  let impactNoise;
  let lastAsteroidImpactAt=-Infinity;
  let lastSignalAt=-Infinity;
  let musicBus;
  let musicFilter;
  let impactMusicDuckUntil=-Infinity;
  let scoreBus;
  let continuousLow;
  let continuousHigh;
  let musicTimer;
  let nextChordTime=0;
  let chordIndex=0;
  let musicSelection='playlist';
  let activeTrackId='odyssey';
  let enabled=true;
  let musicVolume=1;
  try{enabled=localStorage.getItem('odyssey-sound')!=='off';}catch{}
  try{
    const stored=localStorage.getItem('odyssey-music-volume');
    const saved=Number(stored);
    if(stored!==null&&Number.isFinite(saved)&&saved>=0&&saved<=150)musicVolume=saved/100;
  }catch{}
  try{
    const stored=localStorage.getItem('odyssey-music-track');
    if(musicTracks.some(track=>track.id===stored))musicSelection=stored;
  }catch{}
  if(musicSelection!=='playlist')activeTrackId=musicSelection;

  function playMusicNote(frequency,at,duration,peak,type='triangle',attack=1.7) {
    const voice=context.createOscillator();voice.type=type;
    voice.detune.value=Math.sin(frequency)*4;
    voice.frequency.setValueAtTime(frequency,at);
    const level=context.createGain();
    level.gain.setValueAtTime(.0001,at);
    level.gain.exponentialRampToValueAtTime(peak,at+attack);
    level.gain.setValueAtTime(peak,at+duration-2.8);
    level.gain.exponentialRampToValueAtTime(.0001,at+duration);
    voice.connect(level);level.connect(scoreBus);
    voice.start(at);voice.stop(at+duration+.05);
    voice.onended=()=>{voice.disconnect();level.disconnect();};
  }

  function playBell(frequency,at,peak=.034) {
    const bell=context.createOscillator();bell.type='sine';
    bell.frequency.setValueAtTime(frequency,at);
    const level=context.createGain();
    level.gain.setValueAtTime(.0001,at);
    level.gain.exponentialRampToValueAtTime(peak,at+.025);
    level.gain.exponentialRampToValueAtTime(.0001,at+2.7);
    bell.connect(level);level.connect(scoreBus);
    bell.start(at);bell.stop(at+2.75);
    bell.onended=()=>{bell.disconnect();level.disconnect();};
  }

  function playPulse(frequency,at) {
    const pulse=context.createOscillator();pulse.type='sine';
    pulse.frequency.setValueAtTime(frequency*1.7,at);
    pulse.frequency.exponentialRampToValueAtTime(frequency,at+.7);
    const level=context.createGain();
    level.gain.setValueAtTime(.0001,at);
    level.gain.exponentialRampToValueAtTime(.055,at+.04);
    level.gain.exponentialRampToValueAtTime(.0001,at+1.4);
    pulse.connect(level);level.connect(scoreBus);
    pulse.start(at);pulse.stop(at+1.45);
    pulse.onended=()=>{pulse.disconnect();level.disconnect();};
  }

  function activateTrack(id,at=context.currentTime+.05) {
    const previousBus=scoreBus;
    const previousDrones=[continuousLow,continuousHigh].filter(Boolean);
    const switchTime=Math.max(at,context.currentTime+.02);
    if(previousBus){
      if(previousBus.gain.cancelAndHoldAtTime)previousBus.gain.cancelAndHoldAtTime(switchTime);
      else {
        previousBus.gain.cancelScheduledValues(switchTime);
        previousBus.gain.setValueAtTime(previousBus.gain.value,switchTime);
      }
      previousBus.gain.linearRampToValueAtTime(.0001,switchTime+1.2);
      previousDrones.forEach(drone=>drone.stop(switchTime+1.3));
      setTimeout(()=>previousBus.disconnect(),16000);
    }
    activeTrackId=id;
    chordIndex=0;
    nextChordTime=switchTime;
    const first=scores[id].progression[0];
    scoreBus=context.createGain();
    scoreBus.gain.setValueAtTime(.0001,switchTime);
    scoreBus.gain.linearRampToValueAtTime(1,switchTime+1.2);
    scoreBus.connect(musicBus);
    continuousLow=context.createOscillator();continuousLow.type='sine';continuousLow.frequency.value=first.pad[0];
    const lowBed=context.createGain();lowBed.gain.value=id==='horizon'?.028:.018;
    continuousLow.connect(lowBed);lowBed.connect(scoreBus);continuousLow.start(switchTime);
    continuousHigh=context.createOscillator();continuousHigh.type='triangle';continuousHigh.frequency.value=first.pad[2];
    const highBed=context.createGain();highBed.gain.value=id==='starlight'?.012:.008;
    continuousHigh.connect(highBed);highBed.connect(scoreBus);continuousHigh.start(switchTime);
  }

  function scheduleChord(at) {
    const score=scores[activeTrackId];
    const chord=score.progression[chordIndex%score.progression.length];
    continuousLow.frequency.setTargetAtTime(chord.pad[0],at,2.1);
    continuousHigh.frequency.setTargetAtTime(chord.pad[2],at,2.1);
    if(score.kind==='original'){
      chord.pad.forEach((frequency,index)=>{
        playMusicNote(frequency,at+index*.08,score.duration,.046,'triangle',1.7);
        playMusicNote(frequency*2.003,at+index*.08,score.duration,.014,'sine',2.2);
      });
      playMusicNote(chord.bass,at,score.duration,.068,'sine',.85);
      playBell(chord.melody[0],at+3.1);
      playBell(chord.melody[1],at+6.5,.026);
      playBell(chord.bass*4,at+1.2,.011);
      playPulse(chord.bass,at+.4);
      playPulse(chord.bass,at+4.65);
    }else if(score.kind==='cinematic'){
      chord.pad.forEach((frequency,index)=>{
        playMusicNote(frequency,at+index*.16,score.duration,.053,'triangle',3.6);
        playMusicNote(frequency*2,at+index*.16,score.duration,.011,'sine',4.2);
      });
      playMusicNote(chord.bass,at,score.duration,.095,'sine',2.3);
      chord.melody.forEach((frequency,index)=>playBell(frequency,at+3.5+index*2.6,.027));
      playPulse(chord.bass,at+.3);
      playPulse(chord.bass,at+5.6);
    }else{
      chord.pad.forEach((frequency,index)=>{
        playMusicNote(frequency,at+index*.35,score.duration,.029,'sine',2.4);
        playMusicNote(frequency*2,at+index*.35,score.duration,.009,'triangle',3);
      });
      playMusicNote(chord.bass,at,score.duration,.045,'sine',1.8);
      chord.melody.forEach((frequency,index)=>playBell(frequency,at+1.7+index*2.15,.018));
    }
    chordIndex++;
  }

  function scheduleMusic() {
    if(!context||!enabled)return;
    const now=context.currentTime;
    if(nextChordTime<now-1)nextChordTime=now+.08;
    while(nextChordTime<now+2){
      if(musicSelection==='playlist'&&chordIndex>=8){
        const ids=['odyssey','horizon','starlight'];
        activateTrack(ids[(ids.indexOf(activeTrackId)+1)%ids.length],nextChordTime);
      }
      scheduleChord(nextChordTime);
      nextChordTime+=scores[activeTrackId].interval;
    }
  }

  function start() {
    if(!enabled||!AudioContextClass)return false;
    if(!context) {
      try{context=new AudioContextClass();}catch{return false;}
      master=context.createGain();master.gain.value=0;
      const limiter=context.createDynamicsCompressor();
      limiter.threshold.value=-13;limiter.knee.value=18;limiter.ratio.value=4;
      limiter.attack.value=.006;limiter.release.value=.28;
      master.connect(limiter);limiter.connect(context.destination);
      engineFilter=context.createBiquadFilter();
      engineFilter.type='lowpass';engineFilter.frequency.value=360;
      engineGain=context.createGain();engineGain.gain.value=.018;
      engineFilter.connect(engineGain);engineGain.connect(master);
      engineLow=context.createOscillator();engineLow.type='triangle';engineLow.frequency.value=48;
      const lowLevel=context.createGain();lowLevel.gain.value=.55;
      engineLow.connect(lowLevel);lowLevel.connect(engineFilter);engineLow.start();
      engineHigh=context.createOscillator();engineHigh.type='sine';engineHigh.frequency.value=96;
      const highLevel=context.createGain();highLevel.gain.value=.22;
      engineHigh.connect(highLevel);highLevel.connect(engineFilter);engineHigh.start();

      const noiseBuffer=context.createBuffer(1,context.sampleRate*2,context.sampleRate);
      const samples=noiseBuffer.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
      impactNoise=noiseBuffer;
      const air=context.createBufferSource();air.buffer=noiseBuffer;air.loop=true;
      airFilter=context.createBiquadFilter();airFilter.type='bandpass';airFilter.frequency.value=600;airFilter.Q.value=.7;
      airGain=context.createGain();airGain.gain.value=0;
      air.connect(airFilter);airFilter.connect(airGain);airGain.connect(master);air.start();

      // A separate, low filtered thrust layer gives boost weight without sharp clicks.
      boostGain=context.createGain();boostGain.gain.value=0;
      const boostFilter=context.createBiquadFilter();boostFilter.type='lowpass';boostFilter.frequency.value=210;
      boostTone=context.createOscillator();boostTone.type='sawtooth';boostTone.frequency.value=63;
      boostTone.connect(boostFilter);boostFilter.connect(boostGain);boostGain.connect(master);boostTone.start();
      const boostAir=context.createBufferSource();boostAir.buffer=noiseBuffer;boostAir.loop=true;
      boostNoiseFilter=context.createBiquadFilter();boostNoiseFilter.type='lowpass';boostNoiseFilter.frequency.value=270;
      boostNoiseGain=context.createGain();boostNoiseGain.gain.value=0;
      boostAir.connect(boostNoiseFilter);boostNoiseFilter.connect(boostNoiseGain);boostNoiseGain.connect(master);boostAir.start();

      const ambience=context.createOscillator();ambience.type='sine';ambience.frequency.value=58;
      const ambienceGain=context.createGain();ambienceGain.gain.value=.003;
      ambience.connect(ambienceGain);ambienceGain.connect(master);ambience.start();

      musicBus=context.createGain();musicBus.gain.value=.55*musicVolume;
      musicFilter=context.createBiquadFilter();musicFilter.type='lowpass';musicFilter.frequency.value=2200;musicFilter.Q.value=.4;
      musicBus.connect(musicFilter);musicFilter.connect(master);
      const reverb=context.createConvolver();
      const reverbLength=Math.floor(context.sampleRate*1.8);
      const impulse=context.createBuffer(2,reverbLength,context.sampleRate);
      for(let channel=0;channel<2;channel++){
        const data=impulse.getChannelData(channel);
        for(let i=0;i<reverbLength;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/reverbLength,2.5);
      }
      reverb.buffer=impulse;
      const reverbLevel=context.createGain();reverbLevel.gain.value=.14;
      musicFilter.connect(reverb);reverb.connect(reverbLevel);reverbLevel.connect(master);
      activateTrack(activeTrackId);
      scheduleMusic();
      musicTimer=setInterval(scheduleMusic,750);
    }
    Promise.resolve(context.resume()).catch(()=>{});
    scheduleMusic();
    master.gain.setTargetAtTime(.75,context.currentTime,.08);
    return true;
  }

  function setEnabled(value) {
    enabled=Boolean(value);
    try{localStorage.setItem('odyssey-sound',enabled?'on':'off');}catch{}
    if(enabled)start();
    else if(context)master.gain.setTargetAtTime(0,context.currentTime,.04);
    return enabled;
  }

  function setMusicVolume(percent) {
    const value=Number(percent);
    musicVolume=Number.isFinite(value)?Math.min(1.5,Math.max(0,value/100)):1;
    try{localStorage.setItem('odyssey-music-volume',String(Math.round(musicVolume*100)));}catch{}
    if(enabled&&!context)start();
    return Math.round(musicVolume*100);
  }

  function setMusicSelection(id) {
    if(!musicTracks.some(track=>track.id===id))return musicSelection;
    if(id===musicSelection)return musicSelection;
    musicSelection=id;
    try{localStorage.setItem('odyssey-music-track',id);}catch{}
    const nextId=id==='playlist'?'odyssey':id;
    if(context){
      activateTrack(nextId);
      scheduleMusic();
    }else{
      activeTrackId=nextId;
      if(enabled)start();
    }
    return musicSelection;
  }

  function update(speed,boost,preview=false,thrust=false) {
    if(!context||!enabled)return;
    const now=context.currentTime;
    const power=Math.min(speed/43,1);
    const drive=preview?0:thrust?1:.24;
    const load=preview?0:thrust?Math.max(.35,power):.08;
    engineLow.frequency.setTargetAtTime(43+load*28+boost*20+Math.sin(now*.7)*.6,now,.2);
    engineHigh.frequency.setTargetAtTime(87+load*56+boost*38+Math.sin(now*.43)*1.1,now,.2);
    engineFilter.frequency.setTargetAtTime(220+load*260+boost*100,now,.25);
    engineGain.gain.setTargetAtTime(.009+load*.055+boost*.018,now,.22);
    airFilter.frequency.setTargetAtTime(390+power*720+boost*340,now,.2);
    airGain.gain.setTargetAtTime(drive*load*.004+boost*.004,now,.2);
    boostTone.frequency.setTargetAtTime(57+power*12+boost*24,now,.2);
    boostGain.gain.setTargetAtTime(preview?0:boost*.027,now,.22);
    boostNoiseFilter.frequency.setTargetAtTime(230+boost*240,now,.2);
    boostNoiseGain.gain.setTargetAtTime(preview?0:boost*.038,now,.24);
    const impactDuck=now<impactMusicDuckUntil ? .65 : 1;
    musicBus.gain.setTargetAtTime((.55+(preview?.05:0)-boost*.2)*musicVolume*impactDuck,now,.3);
    musicFilter.frequency.setTargetAtTime(preview?2500:2200-boost*650,now,.7);
    master.gain.setTargetAtTime(.75,now,.08);
  }

  function signalPulse(strength,direction) {
    if(!context||!enabled||strength<=0)return;
    const now=context.currentTime;
    if(now-lastSignalAt<Math.max(3.2,8-strength*4.5))return;
    lastSignalAt=now;
    const pan=context.createStereoPanner?.();
    if(pan){pan.pan.value=Math.max(-.75,Math.min(.75,direction));pan.connect(master);}
    const destination=pan||master;
    [0,.19].forEach((delay,index)=>{
      const at=now+delay;
      const tone=context.createOscillator();tone.type='sine';
      tone.frequency.setValueAtTime(index?540:420,at);
      tone.frequency.exponentialRampToValueAtTime(index?590:460,at+.14);
      const level=context.createGain();
      level.gain.setValueAtTime(.0001,at);
      level.gain.exponentialRampToValueAtTime((index?.012:.018)*(.45+strength*.55),at+.025);
      level.gain.exponentialRampToValueAtTime(.0001,at+.27);
      tone.connect(level);level.connect(destination);
      tone.start(at);tone.stop(at+.28);
      tone.onended=()=>{tone.disconnect();level.disconnect();if(index&&pan)pan.disconnect();};
    });
  }

  function cue(kind) {
    if(!context||!enabled)return;
    const now=context.currentTime;
    const notes=kind==='discovery'?[392,523,784,1046]:kind==='arrival'?[523,784]:[392,587];
    notes.forEach((frequency,index)=>{
      const tone=context.createOscillator();tone.type='sine';
      const level=context.createGain();
      const at=now+index*(kind==='discovery'?.17:.13);
      tone.frequency.setValueAtTime(frequency,at);
      tone.frequency.exponentialRampToValueAtTime(frequency*1.02,at+.2);
      level.gain.setValueAtTime(.0001,at);
      level.gain.exponentialRampToValueAtTime(kind==='discovery'?.028:.035,at+.025);
      level.gain.exponentialRampToValueAtTime(.0001,at+(kind==='discovery'?.52:.38));
      tone.connect(level);level.connect(master);
      tone.start(at);tone.stop(at+(kind==='discovery'?.54:.4));
      tone.onended=()=>{tone.disconnect();level.disconnect();};
    });
  }

  function playImpactNoise(at,duration,filterType,frequency,peak,attack=.004,destination=master) {
    const noise=context.createBufferSource();
    noise.buffer=impactNoise;
    const filter=context.createBiquadFilter();
    filter.type=filterType;
    filter.frequency.value=frequency;
    if(filterType==='bandpass')filter.Q.value=.6;
    const level=context.createGain();
    level.gain.setValueAtTime(.0001,at);
    level.gain.exponentialRampToValueAtTime(peak,at+attack);
    level.gain.exponentialRampToValueAtTime(.0001,at+duration);
    noise.connect(filter);filter.connect(level);level.connect(destination);
    noise.start(at,Math.random()*1.4);noise.stop(at+duration+.01);
    noise.onended=()=>{noise.disconnect();filter.disconnect();level.disconnect();};
  }

  function asteroidImpact(broken,speed,size=1,pan=0,severity=Math.min(1,speed/32)) {
    if(!context||!enabled)return;
    const now=context.currentTime;
    if(now-lastAsteroidImpactAt<(broken?.32:.2))return;
    lastAsteroidImpactAt=now;
    const force=Math.min(1,Math.max(.002,speed/36))**.85;
    const duration=.12+severity*.48;
    const panner=context.createStereoPanner();panner.pan.value=Math.max(-.8,Math.min(.8,pan));panner.connect(master);
    playImpactNoise(now,duration,'lowpass',180+force*480,.065*force,.008,panner);
    // Contact is heard through the hull: a short tap or a heavier damped resonance.
    [1,2.31,3.7].forEach((partial,index)=>{
      const hull=context.createOscillator();hull.type='sine';
      hull.frequency.setValueAtTime((78+force*24)*partial,now);
      hull.frequency.exponentialRampToValueAtTime((58+force*10)*partial,now+duration);
      const level=context.createGain();
      level.gain.setValueAtTime(.0001,now);
      level.gain.exponentialRampToValueAtTime(Math.max(.0002,(.025+severity*.095)*force/(1+index*3)),now+.008);
      level.gain.exponentialRampToValueAtTime(.0001,now+duration/(1+index*.25));
      hull.connect(level);level.connect(panner);hull.start(now);hull.stop(now+duration+.02);
      hull.onended=()=>{hull.disconnect();level.disconnect();};
    });
    if(broken){
      const mass=Math.min(1,Math.max(.25,size/2.5));
      playImpactNoise(now,.085,'bandpass',1100,.11*force,.003,panner);
      playImpactNoise(now+.025,.26,'bandpass',480,.09*force*mass,.018,panner);
      playImpactNoise(now+.065,.55,'lowpass',260,.07*force*mass,.025,panner);
    }
    if(severity>.18)impactMusicDuckUntil=now+.85;
    setTimeout(()=>panner.disconnect(),1000);
  }

  return {start,setEnabled,setMusicVolume,getMusicVolume:()=>Math.round(musicVolume*100),setMusicSelection,getMusicSelection:()=>musicSelection,getActiveTrackName:()=>musicTracks.find(track=>track.id===activeTrackId)?.name.split(' · ')[0]||'Odyssey',update,signalPulse,cue,asteroidImpact,isEnabled:()=>enabled,isSupported:()=>Boolean(AudioContextClass)};
}
