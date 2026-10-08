const cometSemimajor=680;
const cometEccentricity=.78;
const cometSemiminor=cometSemimajor*Math.sqrt(1-cometEccentricity**2);
const cometPeriod=1000;

export function cometPosition(seconds) {
  const mean=.7+(((seconds%cometPeriod)+cometPeriod)%cometPeriod)*2*Math.PI/cometPeriod;
  let anomaly=mean;
  for(let i=0;i<6;i++)anomaly-=(anomaly-cometEccentricity*Math.sin(anomaly)-mean)/(1-cometEccentricity*Math.cos(anomaly));
  const x=cometSemimajor*(Math.cos(anomaly)-cometEccentricity);
  const z=cometSemiminor*Math.sin(anomaly);
  const y=z*.26;
  const distance=Math.hypot(x,y,z);
  return {x,y,z,activity:Math.max(0,Math.min(1,(900-distance)/650))};
}
