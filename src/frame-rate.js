// Wall-clock frame timing stays accurate when simulation dt is capped or paused.
export function createFrameRateMeter(){
  let samples=[],lastUpdate=-Infinity;
  return {
    reset(){samples=[];lastUpdate=-Infinity;},
    tick(now,hidden=false){
      if(hidden||!Number.isFinite(now)){samples=[];lastUpdate=-Infinity;return null;}
      if(samples.length&&now-samples.at(-1)>2000)samples=[];
      samples.push(now);while(samples.length>2&&(now-samples[0]>1000||samples.length>240))samples.shift();
      if(samples.length<2||now-lastUpdate<500)return null;
      const duration=now-samples[0];if(duration<=0)return null;lastUpdate=now;
      return Math.max(1,Math.round((samples.length-1)*1000/duration));
    },
  };
}
