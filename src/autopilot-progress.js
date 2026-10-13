export function createAutopilotProgress(initialDistance) {
  const distance=Number.isFinite(initialDistance)?Math.max(0,initialDistance):0;
  const deadline=Math.min(120,Math.max(30,distance/40+30));
  let elapsed=0,stalled=0,best=distance,contacts=0;
  return {
    advance(dt,remaining) {
      if(!Number.isFinite(remaining))return true;
      const activeTime=Number.isFinite(dt)?Math.max(0,dt):0;
      elapsed+=activeTime;
      if(remaining<best-.25){best=remaining;stalled=0;}
      else stalled+=activeTime;
      return stalled>=12||elapsed>=deadline||contacts>=3;
    },
    contact(){contacts+=1;},
  };
}
