export const musicTracks = [
  {id:'playlist',name:'Playlist · all tracks'},
  {id:'odyssey',name:'Odyssey · original'},
  {id:'horizon',name:'Event Horizon · cinematic'},
  {id:'starlight',name:'Starlight Drift · ambient'},
  {id:'sails',name:'Solar Sails · synth voyage'},
  {id:'bluehour',name:'Blue Hour · quiet piano'},
];

export const musicScores={
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
  sails:{interval:8,duration:11,kind:'adventure',progression:[
    {bass:73.42,pad:[146.83,185,220,277.18],melody:[587.33,659.25,739.99,880]},
    {bass:61.74,pad:[123.47,146.83,185,246.94],melody:[739.99,659.25,587.33,493.88]},
    {bass:49,pad:[98,146.83,196,246.94],melody:[587.33,739.99,783.99,739.99]},
    {bass:55,pad:[110,164.81,220,277.18],melody:[659.25,739.99,880,1108.73]},
  ]},
  bluehour:{interval:11,duration:14.5,kind:'peaceful',progression:[
    {bass:65.41,pad:[130.81,164.81,196,246.94],melody:[523.25,493.88,392]},
    {bass:43.65,pad:[130.81,174.61,220,261.63],melody:[523.25,659.25,587.33]},
    {bass:55,pad:[110,164.81,220,329.63],melody:[659.25,523.25,440]},
    {bass:49,pad:[98,146.83,196,293.66],melody:[587.33,493.88,392]},
  ]},
};

export const playlistTrackIds = musicTracks.filter(track => track.id !== 'playlist').map(track => track.id);

export function writeMusicChord(context, bus, score, chordIndex, at) {
  const chord = score.progression[chordIndex % score.progression.length];
  const mixGain = score.kind === 'adventure' ? 2.6 : score.kind === 'peaceful' ? 1.6 : 1;
  function note(frequency, start, duration, peak, type = 'triangle', attack = 1.7, release = 2.8) {
    peak *= mixGain;
    const voice = context.createOscillator(); voice.type = type; voice.detune.value = Math.sin(frequency) * 4;
    voice.frequency.setValueAtTime(frequency, start);
    const level = context.createGain(); level.gain.setValueAtTime(.0001, start);
    level.gain.exponentialRampToValueAtTime(peak, start + attack);
    level.gain.setValueAtTime(peak, start + Math.max(attack, duration - release));
    level.gain.exponentialRampToValueAtTime(.0001, start + duration);
    voice.connect(level); level.connect(bus); voice.start(start); voice.stop(start + duration + .05);
    voice.onended = () => { voice.disconnect(); level.disconnect(); };
  }
  function bell(frequency, start, peak = .034, piano = false) {
    note(frequency, start, 2.7, peak, 'sine', .025, 2.675);
    if (piano) { note(frequency * 2, start, 1.7, peak * .17, 'sine', .01, 1.69); note(frequency * 3, start, .9, peak * .045, 'sine', .008, .892); }
  }
  function pulse(frequency, start, peak = .055) {
    const voice = context.createOscillator(); voice.type = 'sine';
    voice.frequency.setValueAtTime(frequency * 1.7, start); voice.frequency.exponentialRampToValueAtTime(frequency, start + .7);
    const level = context.createGain(); level.gain.setValueAtTime(.0001, start);
    level.gain.exponentialRampToValueAtTime(peak, start + .04); level.gain.exponentialRampToValueAtTime(.0001, start + 1.4);
    voice.connect(level); level.connect(bus); voice.start(start); voice.stop(start + 1.45);
    voice.onended = () => { voice.disconnect(); level.disconnect(); };
  }

  function pluck(frequency, start, duration, peak, cutoff = 1800) {
    peak *= mixGain;
    const voice = context.createOscillator(); voice.type = 'sawtooth';
    voice.frequency.setValueAtTime(frequency, start);
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = .6;
    filter.frequency.setValueAtTime(cutoff, start); filter.frequency.exponentialRampToValueAtTime(260, start + duration);
    const level = context.createGain(); level.gain.setValueAtTime(.0001, start);
    level.gain.exponentialRampToValueAtTime(peak, start + .008);
    level.gain.exponentialRampToValueAtTime(.0001, start + duration);
    voice.connect(filter); filter.connect(level); level.connect(bus); voice.start(start); voice.stop(start + duration + .02);
    voice.onended = () => { voice.disconnect(); filter.disconnect(); level.disconnect(); };
  }
  function drum(start, kind) {
    if (kind === 'kick') {
      const voice = context.createOscillator(); voice.type = 'sine';
      voice.frequency.setValueAtTime(135, start); voice.frequency.exponentialRampToValueAtTime(43, start + .12);
      const level = context.createGain(); level.gain.setValueAtTime(.14 * mixGain, start);
      level.gain.exponentialRampToValueAtTime(.0001, start + .3);
      voice.connect(level); level.connect(bus); voice.start(start); voice.stop(start + .32);
      voice.onended = () => { voice.disconnect(); level.disconnect(); }; return;
    }
    const duration = kind === 'snare' ? .16 : .065;
    const buffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
    const data = buffer.getChannelData(0); let seed = 27183;
    for (let i = 0; i < data.length; i++) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; data[i] = seed / 2147483648 - 1; }
    const source = context.createBufferSource(); source.buffer = buffer;
    const filter = context.createBiquadFilter(); filter.type = 'highpass'; filter.frequency.value = kind === 'snare' ? 750 : 1600;
    const level = context.createGain(); level.gain.setValueAtTime((kind === 'snare' ? .065 : .025) * mixGain, start);
    level.gain.exponentialRampToValueAtTime(.0001, start + duration);
    source.connect(filter); filter.connect(level); level.connect(bus); source.start(start); source.stop(start + duration + .01);
    source.onended = () => { source.disconnect(); filter.disconnect(); level.disconnect(); };
  }
  function piano(frequency, start, peak, duration = 5) {
    // Unequal partial decay gives the keys a struck, woody attack rather than a pad.
    note(frequency, start, duration, peak, 'sine', .008, duration - .008);
    note(frequency * 2.001, start, duration * .45, peak * .32, 'sine', .006, duration * .45 - .006);
    note(frequency * 3.003, start, .7, peak * .12, 'sine', .004, .696);
    note(frequency * 7, start, .12, peak * .035, 'sine', .003, .117);
  }
  if (score.kind === 'original') {
    chord.pad.forEach((f,i) => { note(f,at+i*.08,score.duration,.046); note(f*2.003,at+i*.08,score.duration,.014,'sine',2.2); });
    note(chord.bass,at,score.duration,.068,'sine',.85);
    bell(chord.melody[0],at+3.1); bell(chord.melody[1],at+6.5,.026); bell(chord.bass*4,at+1.2,.011);
    pulse(chord.bass,at+.4); pulse(chord.bass,at+4.65);
  } else if (score.kind === 'cinematic') {
    chord.pad.forEach((f,i) => { note(f,at+i*.16,score.duration,.053,'triangle',3.6); note(f*2,at+i*.16,score.duration,.011,'sine',4.2); });
    note(chord.bass,at,score.duration,.095,'sine',2.3);
    chord.melody.forEach((f,i) => bell(f,at+3.5+i*2.6,.027)); pulse(chord.bass,at+.3); pulse(chord.bass,at+5.6);
  } else if (score.kind === 'adventure') {
    // Four bars at 120 BPM: percussion, an eighth-note synth figure, and a short bass riff.
    for (let beat = 0; beat < 16; beat++) {
      const when = at + beat * .5;
      if (beat % 2 === 0) drum(when, 'kick'); else drum(when, 'snare');
      drum(when + .25, 'hat');
      pluck(chord.bass * (beat % 4 === 3 ? 2 : 1), when, .36, .055, 850);
    }
    const pattern = [0, 2, 1, 3, 2, 1, 3, 2];
    for (let step = 0; step < 32; step++) {
      pluck(chord.pad[pattern[step % pattern.length]] * 2, at + step * .25, .21, .026, 2100);
    }
    chord.melody.forEach((frequency, i) => piano(frequency, at + .5 + i * 2, .026, 1.4));
  } else if (score.kind === 'peaceful') {
    // Open space between piano phrases; no sustained pads, pulse, or percussion.
    piano(chord.bass * 2, at, .09, 8.5);
    piano(chord.pad[1], at + .09, .047, 7);
    piano(chord.pad[2], at + .19, .037, 6.5);
    const timings = [1.4, 4.1, 7.6];
    chord.melody.forEach((frequency, i) => piano(frequency, at + timings[i], .075, 5.5));
    piano(chord.pad[3], at + 9.1, .034, 5);
    note(chord.melody[2] * 2, at + 8.3, 3.5, .007, 'sine', .015, 3.485);
  } else {
    chord.pad.forEach((f,i) => { note(f,at+i*.35,score.duration,.029,'sine',2.4); note(f*2,at+i*.35,score.duration,.009,'triangle',3); });
    note(chord.bass,at,score.duration,.045,'sine',1.8);
    chord.melody.forEach((f,i) => bell(f,at+1.7+i*2.15,.018));
  }
}

// Render two cycles and keep the second: the previous chord's tail already
// overlaps the start, making the native AudioBufferSource loop continuous.
export async function renderMusicTrack(id, OfflineContextClass) {
  const score = musicScores[id], sampleRate = 24000;
  const frames = Math.round(score.interval * score.progression.length * sampleRate);
  const context = new OfflineContextClass(1, frames * 2 + Math.ceil((score.duration + 2) * sampleRate), sampleRate);
  const bus = context.createGain(); bus.gain.value = 1; bus.connect(context.destination);
  for (let i = 0; i < score.progression.length * 2; i++) writeMusicChord(context, bus, score, i, i * score.interval);
  const rendered = await context.startRendering();
  const loop = context.createBuffer(1, frames, sampleRate);
  loop.copyToChannel(rendered.getChannelData(0).subarray(frames, frames * 2), 0);
  return loop;
}
