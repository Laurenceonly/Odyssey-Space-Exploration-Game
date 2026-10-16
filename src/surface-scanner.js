// Same hold duration as an orbital landmark scan; interrupted scans start over.
export function createSurfaceScanner(duration=2.2){
  let seconds=0,finished=false;
  return {
    reset(){seconds=0;finished=false;},
    update(dt,{inRange=false,holding=false,blocked=false}={}){
      if(blocked||!inRange||!holding){seconds=0;finished=false;return {progress:0,complete:false};}
      seconds=Math.min(duration,seconds+Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0)));
      const complete=seconds>=duration&&!finished;
      if(complete)finished=true;
      return {progress:seconds/duration,complete};
    },
  };
}
