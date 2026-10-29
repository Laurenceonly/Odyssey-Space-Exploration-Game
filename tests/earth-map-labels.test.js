import test from 'node:test';
import assert from 'node:assert/strict';
import {layoutEarthMapLabels} from '../src/earth-map-labels.js';
import {EARTH_REGIONS} from '../src/earth-regions.js';
import {drawEarthDestinationIcon,earthDestinationColor} from '../src/earth-map-icons.js';

test('close destination labels are separated and stay within the map',()=>{
 const labels=[{text:'Rainselve Woods',x:150,y:30,width:90},{text:'Mount Keltrond',x:145,y:31,width:85},{text:'Hyskrum Tundra',x:130,y:32,width:90}];
 const result=layoutEarthMapLabels(labels,300,180);
 assert.equal(result.length,3);
 for(const item of result){assert.ok(item.left>=0&&item.left+item.width<=300);assert.ok(item.baseline>=0&&item.baseline<=180);}
 for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++){
  const a=result[i].box,b=result[j].box;assert.ok(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top,'location names do not overlap');
 }
});
test('each planned destination has a map color and a drawable icon',()=>{
 const calls=[];const context=new Proxy({}, {get:(_,key)=> (...args)=>calls.push([key,...args]),set:()=>true});
 const destinations=EARTH_REGIONS.filter(region=>region.id!=='fernlilt');
 assert.equal(new Set(destinations.map(region=>earthDestinationColor(region.id))).size,destinations.length);
 for(const region of destinations)drawEarthDestinationIcon(context,region.id,10,10,20);
 assert.equal(calls.filter(([name])=>name==='stroke').length,destinations.length*2);
});
