export const landmarks = [
  {
    id:'olympus-mons',worldId:'mars',name:'Olympus Mons',kind:'VOLCANO',
    u:.127,v:.60,uRadius:.04,vRadius:.065,range:58,
    hint:'Search the raised terrain north of the Martian equator.',
    fact:'The largest volcano in the solar system rises above the Martian plains.',
    source:'https://science.nasa.gov/mars/facts/',
  },
  {
    id:'great-red-spot',worldId:'jupiter',name:'Great Red Spot',kind:'STORM',
    u:.365,v:.39,uRadius:.045,vRadius:.05,range:125,
    hint:'Watch the southern cloud bands for an oval storm.',
    fact:'This immense storm has persisted in Jupiter’s atmosphere for centuries.',
    source:'https://science.nasa.gov/jupiter/jupiter-facts/',
  },
  {
    id:'cassini-division',worldId:'saturn',name:'Cassini Division',kind:'RING GAP',
    range:115,
    hint:'Aim into the broad dark gap between the bright rings.',
    fact:'The broad gap separates Saturn’s bright B and A rings.',
    source:'https://science.nasa.gov/saturn/facts/',
  },
];

export function surfaceLandmarkAt(worldId,u,v) {
  return landmarks.find(item=>{
    if(item.worldId!==worldId||item.u===undefined)return false;
    const du=Math.min(Math.abs(u-item.u),1-Math.abs(u-item.u))/item.uRadius;
    const dv=(v-item.v)/item.vRadius;
    return du*du+dv*dv<=1;
  })||null;
}
