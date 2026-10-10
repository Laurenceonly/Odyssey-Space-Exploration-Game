const cometSemimajor=500;
const cometEccentricity=.76;
const cometSemiminor=cometSemimajor*Math.sqrt(1-cometEccentricity**2);
export const cometPeriod=360;

export function cometPosition(seconds) {
  const mean=.7+(((seconds%cometPeriod)+cometPeriod)%cometPeriod)*2*Math.PI/cometPeriod;
  let anomaly=mean;
  for(let i=0;i<6;i++)anomaly-=(anomaly-cometEccentricity*Math.sin(anomaly)-mean)/(1-cometEccentricity*Math.cos(anomaly));
  const orbitalX=cometSemimajor*(Math.cos(anomaly)-cometEccentricity);
  const orbitalZ=cometSemiminor*Math.sin(anomaly);
  const projectedZ=orbitalZ*Math.cos(.12);
  const x=orbitalX*Math.cos(.55)-projectedZ*Math.sin(.55);
  const z=orbitalX*Math.sin(.55)+projectedZ*Math.cos(.55);
  const y=orbitalZ*Math.sin(.12);
  const distance=Math.hypot(x,y,z);
  return {x,y,z,activity:Math.max(0,Math.min(1,(900-distance)/650))};
}
