import {SITE_RADIUS} from './earth-physics.js';
// Facts: NASA destination pages and NSSDC gravity values. Local landscapes are illustrative.
const nasa = id => 'https://science.nasa.gov/' + id + '/facts/';
export const visitSites = {
  mercury: { name:'Mercury', action:'Inspect impact rim', landmark:'crater', title:'Crater rim', kind:'surface', gravity:3.70, sky:0x030405, ground:0x77736d, light:3.5, fog:0,
    feature:'Impact-scarred ground', goal:'Head toward the flag beside the raised impact rim.',
    fact:'Mercury has only a thin exosphere. Without substantial air or flowing water to erase them, many impact craters remain visible.',
    conditions:'3.70 m/s² gravity · almost no atmosphere', fiction:'Illustrative terrain. Your suit’s extreme-temperature protection and the survey beacon are fictional.', source:nasa('mercury') },
  venus: { name:'Venus', action:'Examine volcanic rock', landmark:'basalt', title:'Volcanic plain', kind:'surface', gravity:8.87, sky:0x796039, ground:0x776044, light:1.5, fog:.009,
    feature:'Volcanic landscape', goal:'Find the hexagonal basalt outcrop in the volcanic plain.',
    fact:'Venus has a thick carbon-dioxide atmosphere and volcanic terrain. Its surface is about 467°C, at roughly 92 times Earth’s sea-level pressure.',
    conditions:'8.87 m/s² gravity · dense CO₂ atmosphere', fiction:'Imaginary suit and ship shielding make this walk possible. Real spacesuits could not protect a person here. Terrain is illustrative.', source:'https://science.nasa.gov/venus/venus-facts/' },
  earth: { name:'Earth', action:'Observe living woodland', landmark:'woodland', title:'Fernlilt Grasslands', kind:'surface', gravity:9.81,
    feature:'A world with surface water', goal:'Follow the trail to a fallen branch at the woodland edge.',
    fact:'Earth has abundant liquid water at its surface. Its atmosphere and water cycle help support the only life we know of so far.',
    conditions:'Golden hour · light breeze', fiction:'This small lakeside landscape and its survey beacon are illustrative, rather than a mapped real location.', source:nasa('earth') },
  moon: { name:'Moon', action:'Read lunar survey', landmark:'lunar', title:'Lunar crater margin', kind:'surface', gravity:1.62, sky:0x010203, ground:0x94918b, light:3.0, fog:0,
    feature:'Craters and lunar regolith', goal:'Find the lunar reflector at the crater margin. Try a low-gravity jump.',
    fact:'Impacts break lunar rock into dusty regolith. The Moon has a very thin exosphere and about one-sixth of Earth’s surface gravity; ordinary wind and rain do not reshape its craters.',
    conditions:'1.62 m/s² gravity · no ordinary atmospheric weather', fiction:'An illustrative near-side landing zone, with fictional survey equipment. Earth is shown in the sky.', source:nasa('moon') },
  mars: { name:'Mars', action:'Trace ancient water', landmark:'channel', title:'Dry channel overlook', kind:'surface', gravity:3.71, sky:0xa77b62, ground:0xa35c3d, light:2.4, fog:.0025,
    feature:'Evidence of ancient water', goal:'Find the layered outcrop beside the dry channel.',
    fact:'Ancient river valleys, deltas, and lakebeds preserve evidence of a wetter Mars. Its rusty color comes from oxidized iron minerals; today its atmosphere is thin and mostly carbon dioxide.',
    conditions:'3.71 m/s² gravity · thin CO₂ atmosphere', fiction:'This reconstructed channel is illustrative, not a specific rover site. Suit support and survey equipment are fictional.', source:nasa('mars') },
  jupiter: { name:'Jupiter', action:'Observe the storm eye', landmark:'vortex', title:'Storm terraces', kind:'imagined', gravity:14, sky:0xa88a71, fog:.0028, ground:0xc89d78, planet:0xc9ae94,
    feature:'Cloud belts and storms', goal:'Head toward the flag at the storm-eye overlook.',
    fact:'Jupiter is a gas giant with no true solid surface. Its visible bands are cloud systems, and the Great Red Spot is a vast, long-lived storm.',
    conditions:'Heavy footsteps · storm-swept cloudstone', fiction:'Odyssey’s imagined storm landscape. Real Jupiter has no solid surface; this terrain and its playable gravity are fictional.', source:'https://science.nasa.gov/jupiter/jupiter-facts/' },
  saturn: { name:'Saturn', action:'Examine ring-ice crystals', landmark:'ice-arch', title:'Ringlit ice fields', kind:'imagined', gravity:9, sky:0xb9ac91, fog:.0018, ground:0xc9bea5, planet:0xd8c69e,
    feature:'A ring made of countless pieces', goal:'Find the crystalline grove beneath the rings.',
    fact:'Saturn’s rings consist mostly of pieces of ice, with rock and dust. They are many separate orbiting particles, not one solid sheet. Saturn itself has no true solid surface.',
    conditions:'Pale dunes · crystalline ice · ringlit sky', fiction:'Odyssey’s imagined ringlit landscape. Real Saturn has no solid surface. The ice fields, sky view, and playable gravity are fictional.', source:nasa('saturn') },
  uranus: { name:'Uranus', action:'Study the tilted formation', landmark:'tilted-canyon', title:'Tilted frost canyon', kind:'imagined', gravity:6, sky:0x659b9e, fog:.003, ground:0x9fc6c9, planet:0xafd1d3,
    feature:'A world tipped on its side', goal:'Find the leaning ice formation in the frost canyon.',
    fact:'Uranus rotates on its side, with an axial tilt of about 98 degrees. Methane in its atmosphere absorbs red light, contributing to its blue-green appearance. It has no solid surface to walk on.',
    conditions:'Light steps · leaning ice walls · cyan haze', fiction:'Odyssey’s imagined frost canyon, inspired by Uranus’s color and tilt. Real Uranus has no walkable ice crust. Terrain and playable gravity are fictional.', source:nasa('uranus') },
  neptune: { name:'Neptune', action:'Watch the wind currents', landmark:'wind-arch', title:'Wind-carved expanse', kind:'imagined', gravity:8, sky:0x243b59, fog:.0038, ground:0x496b88, planet:0x98bcc8,
    feature:'A dynamic distant atmosphere', goal:'Follow the wind streamers to the carved stone arch.',
    fact:'Neptune has powerful winds and changing clouds. Methane contributes to its blue appearance. Like Uranus, it has no solid surface; ice giant describes its composition, not an icy walking surface.',
    conditions:'Blue ridges · swift wind streamers · deep haze', fiction:'Odyssey’s imagined wind-carved world. Real Neptune has no solid surface. Terrain, wind effects, and playable gravity are fictional.', source:'https://science.nasa.gov/neptune/neptune-facts/' },
};
export const visitFeaturePosition = site => site.id==='earth'?{x:-18,z:18}:{x:18,z:-18};
export function surveyRouteDistance(site,x,z){
  const feature=visitFeaturePosition(site),dx=feature.x-6,dz=feature.z-7;
  const t=Math.min(1,Math.max(0,((x-6)*dx+(z-7)*dz)/(dx*dx+dz*dz)));
  return Math.hypot(x-6-dx*t,z-7-dz*t);
}
export const visitRadius = site => site?.id==='earth'?SITE_RADIUS:104;
export function visitTerrainHeight(site,x,z) {
  const d=Math.hypot(x,z), fade=Math.min(1,Math.max(0,(d-13)/24));
  let y=(Math.sin(x*.043)*Math.cos(z*.039)*1.5 + Math.sin((x+z)*.092)*.45)*fade;
  if(site.id==='mercury'||site.id==='moon') {
    const r=Math.hypot(x-36,z+25);
    y+=(-(site.id==='moon'?2.2:3.5)*Math.exp(-Math.pow(r/12,4))+1.6*Math.exp(-Math.pow((r-(site.id==='moon'?14:16))/3.4,2)))*fade;
    if(site.id==='moon')y-=1.8*Math.exp(-Math.pow(Math.hypot(x+40,z-30)/11,4))*fade;
  }
  if(site.id==='mars') y-=3.8*Math.exp(-Math.pow((x-30+Math.sin(z*.025)*9)/9,2))*fade;
  if(site.id==='venus') y+=Math.sin(x*.065+z*.035)*Math.sin(z*.06)*1.3*fade;
  if(site.id==='jupiter')y+=(Math.sin(z*.07+Math.sin(x*.028))*3.5+Math.cos(x*.035)*2)*fade;
  if(site.id==='saturn')y+=(Math.sin((x+z)*.037)*2+Math.cos(z*.05)*1.5)*fade;
  if(site.id==='uranus')y+=(Math.sin(x*.065+z*.016)*3.6+Math.cos(z*.035)*1.3)*fade;
  if(site.id==='neptune')y+=(Math.sin(x*.075-z*.028)*3+Math.sin(z*.058)*1.7)*fade;
  return y;
}
export function getVisitSite(id) { const data=Object.hasOwn(visitSites,id)?visitSites[id]:null; return data ? {id,...data} : null; }
export function canStartVisit({site,locked,intro,autopilot,distance,parkedId,manualReady,maxDistance=25}) {
  return Boolean(site&&!locked&&!intro&&!autopilot&&Number.isFinite(distance)&&distance>=0&&distance<=maxDistance&&(parkedId===site.id||manualReady));
}
