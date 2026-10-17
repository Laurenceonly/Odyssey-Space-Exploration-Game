import test from 'node:test';
import assert from 'node:assert/strict';
import {EARTH_LOOP,EARTH_RIDGE_ROUTE,EARTH_MEADOW_TRAIL,EARTH_STREAM_TRAIL,earthRegionAt,earthWoodland,earthMeadowCover,clearEarthResumePosition,earthStreamAt} from '../src/earth-layout.js';
import {SITE_RADIUS,terrainHeight,waterLevelAt,stepAstronaut,walkableAt} from '../src/earth-physics.js';

const obstacles=[{x:0,z:4,radius:3.5},{x:-3.1,z:5,radius:1.2},{x:3.1,z:5,radius:1.2}];
test('forest-lake loop and ridge branch can be walked both ways without swimming or jumping',()=>{
  for(const fps of [30,60])for(const original of [EARTH_LOOP,EARTH_RIDGE_ROUTE])for(const reverse of [false,true]){
    const route=reverse?[...original].reverse():original;
    const body={x:route[0][0],z:route[0][1],y:terrainHeight(...route[0]),vy:0,grounded:true};
    for(const [x,z] of route.slice(1)){
      let frames=0;
      while(Math.hypot(x-body.x,z-body.z)>.18&&frames++<fps*65){
        const dx=x-body.x,dz=z-body.z,len=Math.hypot(dx,dz);
        const motion=stepAstronaut(body,{x:dx/len,z:dz/len},1/fps,obstacles);
        assert.equal(motion.swimming,false,'main route must stay on land');
        assert.equal(walkableAt(body.x,body.z),null);
        assert.ok(Number.isFinite(body.y));
      }
      assert.ok(Math.hypot(x-body.x,z-body.z)<=.18,'waypoint '+[x,z]+' reachable at '+fps+' fps, from '+[body.x,body.z]);
    }
  }
});
test('the whole trail corridor stays dry and the landing pad remains level',()=>{
  for(const route of [EARTH_LOOP,EARTH_RIDGE_ROUTE])for(let i=1;i<route.length;i++){
    const [ax,az]=route[i-1],[bx,bz]=route[i],length=Math.hypot(bx-ax,bz-az);
    for(let d=0;d<=length;d+=.5)for(const width of [-1.2,0,1.2]){
      const x=ax+(bx-ax)*d/length-(bz-az)*width/length,z=az+(bz-az)*d/length+(bx-ax)*width/length;
      assert.equal(waterLevelAt(x,z),null,'dry trail corridor');
    }
  }
  for(const [x,z] of [[0,4],[6,7],[-3.1,5],[3.1,5]])assert.equal(terrainHeight(x,z),0);
});
test('local scenery stays within Fernlilt instead of unlocking other large regions',()=>{
  assert.equal(earthRegionAt(6,7),'Fernlilt Grasslands');
  assert.equal(earthRegionAt(-16,-37),'Fernlilt Grasslands');
  assert.equal(earthRegionAt(34,-30),'Fernlilt Grasslands');
  assert.equal(earthRegionAt(-67,-9),'Fernlilt Grasslands');
  assert.ok(earthWoodland(-16,-37)<.05,'the main view stays open meadow');
  assert.ok(earthWoodland(-87,-46)>.5,'groves gather at the edge');
  assert.ok(earthMeadowCover(-27,-34)>.9,'large meadow patches dominate their centers');
  assert.equal(earthMeadowCover(90,-5),0,'open spaces remain between meadow swathes');
  assert.ok(terrainHeight(-67,-9)>2&&terrainHeight(-67,-9)<6,'low rises preserve the sunlit horizon');
});

test('vegetation changes preserve clear saved positions and move obstructed saves to nearby dry ground',()=>{
  const old={x:-16,z:-37},tree={...old,radius:.55};
  assert.deepEqual(clearEarthResumePosition(old.x,old.z,()=>true),old);
  const resolved=clearEarthResumePosition(old.x,old.z,(x,z)=>walkableAt(x,z,[tree],terrainHeight(x,z))===null&&waterLevelAt(x,z)===null);
  assert.equal(walkableAt(resolved.x,resolved.z,[tree],terrainHeight(resolved.x,resolved.z)),null);
  assert.ok(Math.hypot(resolved.x-old.x,resolved.z-old.z)<=1.5,'avoid teleporting back to the ship when nearby space exists');
  assert.deepEqual(clearEarthResumePosition(old.x,old.z,()=>false),{x:6,z:7},'dense obstruction has a safe landing-area fallback');
});

test('Fernlilt has almost one square kilometre and broad dry walking routes beyond the original patch',()=>{
  assert.ok(Math.PI*SITE_RADIUS**2>980000&&Math.PI*SITE_RADIUS**2<1000000);
  for(const target of [[400,0],[-350,120],[0,450]]){
    const body={x:6,z:7,y:terrainHeight(6,7),vy:0,grounded:true};
    for(let frame=0;frame<15000&&Math.hypot(body.x-target[0],body.z-target[1])>.3;frame++){
      const dx=target[0]-body.x,dz=target[1]-body.z,len=Math.hypot(dx,dz);
      const motion=stepAstronaut(body,{x:dx/len,z:dz/len},1/60);
      assert.equal(motion.blocked,null);assert.ok(Number.isFinite(body.y));
    }
    assert.ok(Math.hypot(body.x-target[0],body.z-target[1])<.3,'far meadow is reachable');
  }
});


test('creek water is enclosed by dry banks and tapers beneath terrain at both ends',()=>{
  for(let z=-270;z<=270;z+=.5){
    const s=earthStreamAt(0,z);
    for(const sign of [-1,1]){
      const edge=s.center+sign*(s.width+8);
      assert.ok(terrainHeight(edge,z)>=s.level,'water ribbon edge must be buried');
      // The rendered two-metre bank grid must also cover the water edge.
      const x0=100+Math.floor((edge-100)/2)*2,z0=-280+Math.floor((z+280)/2)*2;
      const heights=[[x0,z0],[x0+2,z0],[x0,z0+2],[x0+2,z0+2]].map(([x,z])=>terrainHeight(x,z));
      assert.ok(Math.min(...heights)>s.level,'no floating edge between mesh vertices');
    }
    if(Math.abs(z)<220){assert.equal(waterLevelAt(s.center,z),s.level);assert.ok(s.level-terrainHeight(s.center,z)<.6,'shallow wading water');}
    if(Math.abs(z)===270)assert.equal(waterLevelAt(s.center,z),null);
  }
});
test('shallow creek can be crossed in both directions without jumping at different frame rates',()=>{
  for(const fps of [30,60,120])for(const z of [-200,-90,0,100,200])for(const direction of [-1,1]){
    const s=earthStreamAt(0,z),start=s.center-direction*30,target=s.center+direction*30;
    const body={x:start,z,y:terrainHeight(start,z),vy:0,grounded:true};let sawWater=false;
    for(let frame=0;frame<fps*45&&Math.abs(body.x-target)>.2;frame++){
      const motion=stepAstronaut(body,{x:direction,z:0},1/fps);
      assert.equal(motion.blocked,null);assert.equal(motion.swimming,false);
      sawWater||=motion.wading;
    }
    assert.ok(sawWater,'crossing enters shallow water');assert.ok(Math.abs(body.x-target)<.2,'opposite bank remains reachable');
  }
});


test('long scenic trails stay inside Fernlilt and can be walked both ways',()=>{
  for(const fps of [30,60])for(const original of [EARTH_MEADOW_TRAIL,EARTH_STREAM_TRAIL])for(const reverse of [false,true]){
    const route=reverse?[...original].reverse():original;
    const body={x:route[0][0],z:route[0][1],y:terrainHeight(...route[0]),vy:0,grounded:true};
    for(const [x,z] of route.slice(1)){
      assert.ok(Math.hypot(x,z)<SITE_RADIUS);let frames=0;
      while(Math.hypot(x-body.x,z-body.z)>.18&&frames++<fps*12){
        const dx=x-body.x,dz=z-body.z,length=Math.hypot(dx,dz);
        const motion=stepAstronaut(body,{x:dx/length,z:dz/length},1/fps,obstacles);
        assert.equal(motion.swimming,false);assert.equal(motion.blocked,null);
      }
      assert.ok(Math.hypot(x-body.x,z-body.z)<=.18,'scenic bend reachable at '+[x,z]);
    }
  }
});
