// Tracks complete close encounters so one world can produce multiple log entries.
export function createFlybyTracker() {
  const active=new Map();

  function update(id,ship,center,radius,speed) {
    const x=ship.x-center.x,y=ship.y-center.y,z=ship.z-center.z;
    const length=Math.hypot(x,y,z)||1;
    const distance=Math.max(0,length-radius);
    const threshold=Math.max(35,radius*1.3);
    const current=active.get(id);

    if(distance<=threshold){
      if(!current){
        if(speed<4)return null;
        active.set(id,{
          minDistance:distance,
          entry:{x:x/length,y:y/length,z:z/length},
          last:{x,y,z},
          traveled:0,
        });
      }else{
        current.minDistance=Math.min(current.minDistance,distance);
        current.traveled+=Math.hypot(x-current.last.x,y-current.last.y,z-current.last.z);
        current.last={x,y,z};
      }
      return null;
    }

    if(!current)return null;
    active.delete(id);
    current.traveled+=Math.hypot(x-current.last.x,y-current.last.y,z-current.last.z);
    const dot=Math.max(-1,Math.min(1,(current.entry.x*x+current.entry.y*y+current.entry.z*z)/length));
    return {
      worldId:id,
      distance:Math.round(current.minDistance),
      passKind:current.traveled>=18&&dot<Math.cos(Math.PI/6)?'flyby':'approach',
    };
  }

  return {update,clear:()=>active.clear()};
}
