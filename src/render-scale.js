// Adjust only the 3D drawing buffer; DOM controls retain native resolution.
export function createRenderScale(initialQuality='auto'){
  const presets={low:.7,medium:.85,high:1};
  let quality=Object.hasOwn(presets,initialQuality)?initialQuality:'auto';
  let scale=presets[quality]??1,last=null,duration=0,frames=0;
  return {
    get value(){return scale;},
    get quality(){return quality;},
    setQuality(value){
      quality=Object.hasOwn(presets,value)?value:'auto';
      scale=presets[quality]??1;last=null;duration=0;frames=0;
      return scale;
    },
    tick(now,active=true){
      const delta=last===null?0:now-last;last=now;
      if(quality!=='auto'||!active||delta<=0||delta>100){duration=0;frames=0;return null;}
      duration+=delta;frames++;
      if(duration<3000)return null;
      const fps=frames*1000/duration;duration=0;frames=0;
      // Keep a stable image: don't bounce resolution up and down at the threshold.
      if(fps>=52||scale<=.7)return null;
      scale=Math.max(.7,Math.round(scale*.9*100)/100);
      return scale;
    },
  };
}
