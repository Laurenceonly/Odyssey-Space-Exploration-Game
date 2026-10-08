export function createShipAudio() {
  const AudioContextClass=window.AudioContext||window.webkitAudioContext;
  let context;
  let master;
  let engineGain;
  let engineLow;
  let engineHigh;
  let airGain;
  let airFilter;
  let musicBus;
  let continuousLow;
  let continuousHigh;
  let musicTimer;
  let nextChordTime=0;
  let chordIndex=0;
  let enabled=true;
  let musicVolume=1;
  try{enabled=localStorage.getItem('odyssey-sound')!=='off';}catch{}
  try{
    const stored=localStorage.getItem('odyssey-music-volume');
    const saved=Number(stored);
    if(stored!==null&&Number.isFinite(saved)&&saved>=0&&saved<=150)musicVolume=saved/100;
  }catch{}

  const progression=[
    {bass:73.42,pad:[146.83,174.61,220,329.63],melody:[659.25,587.33]},
    {bass:58.27,pad:[116.54,174.61,220,293.66],melody:[587.33,523.25]},
    {bass:87.31,pad:[130.81,174.61,196,329.63],melody:[698.46,659.25]},
    {bass:65.41,pad:[130.81,196,261.63,293.66],melody:[587.33,783.99]},
  ];

  function playMusicNote(frequency,at,duration,peak,type='triangle',attack=1.7) {
    const voice=context.createOscillator();voice.type=type;
    voice.frequency.setValueAtTime(frequency,at);
    const level=context.createGain();
    level.gain.setValueAtTime(.0001,at);
    level.gain.exponentialRampToValueAtTime(peak,at+attack);
    level.gain.setValueAtTime(peak,at+duration-2.8);
    level.gain.exponentialRampToValueAtTime(.0001,at+duration);
    voice.connect(level);level.connect(musicBus);
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
    bell.connect(level);level.connect(musicBus);
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
    pulse.connect(level);level.connect(musicBus);
    pulse.start(at);pulse.stop(at+1.45);
    pulse.onended=()=>{pulse.disconnect();level.disconnect();};
  }

  function scheduleChord(at) {
    const chord=progression[chordIndex%progression.length];
    continuousLow.frequency.setTargetAtTime(chord.pad[0],at,2.1);
    continuousHigh.frequency.setTargetAtTime(chord.pad[2],at,2.1);
    chord.pad.forEach((frequency,index)=>{
      playMusicNote(frequency,at+index*.08,11.4,.046,'triangle',1.7);
      playMusicNote(frequency*2.003,at+index*.08,11.4,.014,'sine',2.2);
    });
    playMusicNote(chord.bass,at,11.4,.068,'sine',.85);
    playBell(chord.melody[0],at+3.1);
    playBell(chord.melody[1],at+6.5,.026);
    playBell(chord.bass*4,at+1.2,.011);
    playPulse(chord.bass,at+.4);
    playPulse(chord.bass,at+4.65);
    chordIndex++;
  }

  function scheduleMusic() {
    if(!context||!enabled)return;
    const now=context.currentTime;
    if(nextChordTime<now-1)nextChordTime=now+.08;
    while(nextChordTime<now+32){scheduleChord(nextChordTime);nextChordTime+=8.5;}
  }

  function start() {
    if(!enabled||!AudioContextClass)return false;
    if(!context) {
      try{context=new AudioContextClass();}catch{return false;}
      master=context.createGain();master.gain.value=0;master.connect(context.destination);
      const engineFilter=context.createBiquadFilter();
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
      const air=context.createBufferSource();air.buffer=noiseBuffer;air.loop=true;
      airFilter=context.createBiquadFilter();airFilter.type='bandpass';airFilter.frequency.value=600;airFilter.Q.value=.7;
      airGain=context.createGain();airGain.gain.value=0;
      air.connect(airFilter);airFilter.connect(airGain);airGain.connect(master);air.start();

      const ambience=context.createOscillator();ambience.type='sine';ambience.frequency.value=58;
      const ambienceGain=context.createGain();ambienceGain.gain.value=.003;
      ambience.connect(ambienceGain);ambienceGain.connect(master);ambience.start();

      musicBus=context.createGain();musicBus.gain.value=.55*musicVolume;
      musicBus.connect(master);
      continuousLow=context.createOscillator();continuousLow.type='sine';continuousLow.frequency.value=146.83;
      const lowBed=context.createGain();lowBed.gain.value=.022;
      continuousLow.connect(lowBed);lowBed.connect(musicBus);continuousLow.start();
      continuousHigh=context.createOscillator();continuousHigh.type='triangle';continuousHigh.frequency.value=220;
      const highBed=context.createGain();highBed.gain.value=.009;
      continuousHigh.connect(highBed);highBed.connect(musicBus);continuousHigh.start();
      const reverb=context.createConvolver();
      const reverbLength=Math.floor(context.sampleRate*1.8);
      const impulse=context.createBuffer(2,reverbLength,context.sampleRate);
      for(let channel=0;channel<2;channel++){
        const data=impulse.getChannelData(channel);
        for(let i=0;i<reverbLength;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/reverbLength,2.5);
      }
      reverb.buffer=impulse;
      const reverbLevel=context.createGain();reverbLevel.gain.value=.14;
      musicBus.connect(reverb);reverb.connect(reverbLevel);reverbLevel.connect(master);
      nextChordTime=context.currentTime+.08;
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

  function update(speed,boost,preview=false) {
    if(!context||!enabled)return;
    const now=context.currentTime;
    const power=Math.min(speed/43,1);
    engineLow.frequency.setTargetAtTime(48+power*39+boost*13,now,.09);
    engineHigh.frequency.setTargetAtTime(96+power*93+boost*36,now,.09);
    engineGain.gain.setTargetAtTime(.018+power*.065+boost*.04,now,.08);
    airFilter.frequency.setTargetAtTime(560+power*860+boost*520,now,.1);
    airGain.gain.setTargetAtTime(power*.007+boost*.012,now,.08);
    musicBus.gain.setTargetAtTime((.55+(preview?.05:0)-boost*.25)*musicVolume,now,.35);
    master.gain.setTargetAtTime(.75,now,.08);
  }

  function cue(kind) {
    if(!context||!enabled)return;
    const now=context.currentTime;
    const notes=kind==='arrival'?[523,784]:[392,587];
    notes.forEach((frequency,index)=>{
      const tone=context.createOscillator();tone.type='sine';
      const level=context.createGain();
      const at=now+index*.13;
      tone.frequency.setValueAtTime(frequency,at);
      tone.frequency.exponentialRampToValueAtTime(frequency*1.02,at+.2);
      level.gain.setValueAtTime(.0001,at);
      level.gain.exponentialRampToValueAtTime(.035,at+.025);
      level.gain.exponentialRampToValueAtTime(.0001,at+.38);
      tone.connect(level);level.connect(master);
      tone.start(at);tone.stop(at+.4);
      tone.onended=()=>{tone.disconnect();level.disconnect();};
    });
  }

  return {start,setEnabled,setMusicVolume,getMusicVolume:()=>Math.round(musicVolume*100),update,cue,isEnabled:()=>enabled,isSupported:()=>Boolean(AudioContextClass)};
}
