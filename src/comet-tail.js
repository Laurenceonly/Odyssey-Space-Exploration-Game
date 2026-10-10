import {Vector3} from 'three';

export const cometTailCount=1200;

export function cometTailShape(activity) {
  activity=Math.max(0,Math.min(1,activity));
  // Keep this stylized visitor recognizable in the outer system, too.
  return {length:65+activity*95,width:4+activity*7,opacity:.55+activity*.3};
}

const outward=new Vector3();
const across=new Vector3();
const above=new Vector3();
const trailing=new Vector3();
const up=new Vector3(0,1,0);
function seed(index,salt) {
  const value=Math.sin(index*127.1+salt*311.7)*43758.5453;
  return value-Math.floor(value);
}

export function writeCometTail(positions,colors,seconds,activity,center,orbitalVelocity=null) {
  const shape=cometTailShape(activity);
  outward.copy(center).normalize();
  if(outward.lengthSq()<1e-6)outward.set(1,0,0);
  across.crossVectors(outward,up);
  if(across.lengthSq()<1e-6)across.set(1,0,0);
  across.normalize();
  above.crossVectors(outward,across).normalize();
  // Dust lags orbital motion; ions stream straight away from the Sun.
  trailing.copy(orbitalVelocity??across);
  trailing.addScaledVector(outward,-trailing.dot(outward));
  if(trailing.lengthSq()<1e-6)trailing.copy(across);
  trailing.normalize().negate();
  for(let i=0;i<cometTailCount;i++){
    const ion=i>=800;
    const phase=((seed(i,57)+seconds*(ion ? .11 : .075))%1+1)%1;
    const distance=3+phase*shape.length*(ion?1.15:1);
    const spread=(.5+phase*shape.width)*(ion ? .2 : 1)*Math.sqrt(seed(i,59));
    const angle=seed(i,58)*Math.PI*2;
    const bend=ion?0:phase*phase*shape.length*.2;
    const lateral=Math.cos(angle)*spread;
    const vertical=Math.sin(angle)*spread;
    const offset=i*3;
    positions[offset]=outward.x*distance+across.x*lateral+above.x*vertical+trailing.x*bend;
    positions[offset+1]=outward.y*distance+across.y*lateral+above.y*vertical+trailing.y*bend;
    positions[offset+2]=outward.z*distance+across.z*lateral+above.z*vertical+trailing.z*bend;
    const fade=.12*Math.sin(Math.PI*phase)**.65*(1-phase*.65);
    colors[offset]=fade*(ion ? .3 : 1);
    colors[offset+1]=fade*(ion ? .65 : .85);
    colors[offset+2]=fade*(ion?1:.65);
  }
  return shape;
}
