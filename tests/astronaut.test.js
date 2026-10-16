import test from 'node:test';import assert from 'node:assert/strict';import*as THREE from'three';import{createAstronaut}from'../src/astronaut.js';import{stepAstronaut}from'../src/earth-physics.js';
const point=(root,name)=>root.getObjectByName(name).getWorldPosition(new THREE.Vector3());
test('idle boots rest on the ground and knees bend toward the front',()=>{const rig=createAstronaut();rig.update(1/60);rig.root.updateMatrixWorld(true);for(const side of ['left','right']){const foot=point(rig.root,side+'-foot'),hip=point(rig.root,side+'-hip'),knee=point(rig.root,side+'-knee');assert.ok(Math.abs(foot.y-.1025)<.003);assert.ok(knee.z<=hip.z);assert.ok(knee.y<hip.y&&knee.y>foot.y);}});
test('walk and run keep soles grounded during stance without flipped boots',()=>{for(const speed of [2.4,5.8]){const rig=createAstronaut();let contacts=0,locked=0,last=null;for(let i=0;i<240;i++){const dt=1/60;rig.root.position.z-=speed*dt;rig.update(dt,{distance:speed*dt,speed,running:speed>3});rig.root.updateMatrixWorld(true);const foot=point(rig.root,'left-foot');assert.ok(foot.y>=.1-1e-4);const q=rig.root.getObjectByName('left-foot').getWorldQuaternion(new THREE.Quaternion());assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(q).y>.94);if(i>60&&Math.abs(foot.y-.1025)<.005){contacts++;if(last&&foot.distanceTo(last)<.005)locked++;}last=foot;}assert.ok(contacts>30);assert.ok(locked>15,'stance feet should hold world position');}});
test('terrain, jump, landing, and turn poses stay finite',()=>{for(const hz of [30,60,120]){const rig=createAstronaut();const ground=(x,z)=>x*.1+z*.06;for(let i=0;i<hz*2;i++){const dt=1/hz;rig.root.position.set(i/hz*.5,ground(i/hz*.5,-i/hz*.8),-i/hz*.8);rig.root.rotation.y=i/hz*.4;const air=i>hz*.5&&i<hz;rig.root.position.y+=air?.5:0;rig.update(dt,{distance:dt,speed:1,grounded:!air,vy:air?2:0,landed:i===hz,landingSpeed:4,groundHeight:ground});rig.root.updateMatrixWorld(true);for(const side of ['left','right'])assert.ok(point(rig.root,side+'-foot').toArray().every(Number.isFinite));}}});

test('elbows flex forward through walking, running, jumping, and swimming',()=>{
  for(const speed of [0,2.4,5.8]){const rig=createAstronaut();for(let i=0;i<360;i++){const swimming=i>=120&&i<240,grounded=!swimming&&i<300;rig.update(1/60,{distance:speed/60,speed,running:speed>3,swimming,grounded,vy:grounded?0:1});rig.root.updateMatrixWorld(true);for(const side of ['left','right']){const elbow=rig.root.getObjectByName(side+'-elbow'),hand=point(rig.root,side+'-hand');elbow.parent.worldToLocal(hand);assert.ok(elbow.rotation.x>=0&&elbow.rotation.x<1.6,'elbow must never bend backward');assert.ok(hand.z<elbow.position.z,'glove must flex forward relative to the upper arm');}}}
});
test('front crawl completes underwater pulls and above-water recovery without pose snaps',()=>{
  const rig=createAstronaut();rig.root.position.y=-.95;let previous=null,previousQ=null,under=0,over=0,alternating=0;
  for(let i=0;i<480;i++){
    const swimming=i>=60&&i<360;
    rig.update(1/60,{distance:2/60,speed:2,grounded:!swimming,swimming,fastSwimming:swimming});rig.root.updateMatrixWorld(true);
    const shoulder=rig.root.getObjectByName('left-shoulder'),hand=point(rig.root,'left-hand');
    if(previous)assert.ok(hand.distanceTo(previous)<.17,'hand movement must remain continuous through stroke wraps and shore transitions');
    if(previousQ)assert.ok(shoulder.quaternion.angleTo(previousQ)<.24,'recovery must not snap at the shoulder wrap');
    previous=hand;previousQ=shoulder.quaternion.clone();
    if(i>120&&i<350){
      const other=point(rig.root,'right-hand');
      if(hand.y<-.2)under++;if(hand.y>.2)over++;
      if((hand.y<-.2&&other.y>.2)||(other.y<-.2&&hand.y>.2))alternating++;
    }
  }
  assert.ok(under>30&&over>30,'each arm must pull below water and recover above it');
  assert.ok(alternating>50,'arms must take turns pulling and recovering');
});

test('brisk walking clears the ground and straightens between steps instead of staying crouched',()=>{
  const rig=createAstronaut();let highestFoot=0,highestHip=-Infinity,hipSum=0,count=0;
  for(let i=0;i<360;i++){
    rig.root.position.z-=2.4/60;
    rig.update(1/60,{distance:2.4/60,speed:2.4});
    rig.root.updateMatrixWorld(true);
    if(i<60)continue;
    highestFoot=Math.max(highestFoot,point(rig.root,'left-foot').y);
    const hip=rig.root.children[0].position.y;
    highestHip=Math.max(highestHip,hip);hipSum+=hip;count++;
  }
  assert.ok(highestFoot>.16,'swinging boot should clearly lift off the ground');
  assert.ok(highestHip>-.035,'hips should rise toward an upright stance between steps');
  assert.ok(hipSum/count>-.075,'walking should avoid a permanent deep crouch');
});

test('planted boots hold their world position through a curved walk',()=>{
  const rig=createAstronaut();rig.update(1/60);const last=new Map();let contacts=0;
  for(let i=0;i<360;i++){
    const yaw=i/60*.6;rig.root.rotation.y=yaw;
    rig.root.position.x-=Math.sin(yaw)*2.4/60;rig.root.position.z-=Math.cos(yaw)*2.4/60;
    rig.update(1/60,{distance:2.4/60,speed:2.4});rig.root.updateMatrixWorld(true);
    for(const side of ['left','right']){
      const foot=point(rig.root,side+'-foot'),previous=last.get(side);
      if(i>60&&Math.abs(foot.y-.1025)<.0005&&previous&&Math.abs(previous.y-.1025)<.0005){
        assert.ok(foot.distanceTo(previous)<.0015,'a planted foot must not skate while turning');contacts++;
      }
      last.set(side,foot);
    }
  }
  assert.ok(contacts>30,'exercise both feet over multiple stance phases');
});
test('landing after a long jump replants the boots beneath the current body',()=>{
  const rig=createAstronaut();rig.update(1/60);
  for(let i=0;i<120;i++){
    rig.root.position.set(0,Math.sin(i/120*Math.PI)*5,-i*.1);
    rig.update(1/60,{distance:.1,speed:6,grounded:false,vy:i<60?3:-3});
  }
  rig.root.position.y=0;rig.update(1/60,{distance:.1,speed:6,grounded:true,landed:true,landingSpeed:3});rig.root.updateMatrixWorld(true);
  for(const side of ['left','right']){
    const foot=point(rig.root,side+'-foot');rig.root.worldToLocal(foot);
    assert.ok(Math.abs(foot.z)<.5,'landing must not reuse the old takeoff foot anchor');
    assert.ok(foot.y>=.1&&foot.y<.16);
  }
});
test('pausing freezes the complete walking pose without resetting its step',()=>{
  const rig=createAstronaut();rig.update(1/60);
  for(let i=0;i<50;i++){rig.root.position.z-=2.4/60;rig.update(1/60,{distance:2.4/60,speed:2.4});}
  rig.root.updateMatrixWorld(true);const before=point(rig.root,'left-foot');
  rig.update(0);rig.root.updateMatrixWorld(true);assert.ok(point(rig.root,'left-foot').distanceTo(before)<1e-10);
});

const soleHeight=(root,name)=>{const foot=root.getObjectByName(name);return Math.min(...[-.215,.135].map(z=>foot.localToWorld(new THREE.Vector3(0,-.1025,z)).y));};
test('walking keeps ground support while Shift-running has a separate flight phase and lean',()=>{
  const samples=[];
  for(const running of [false,true]){
    const rig=createAstronaut(),speed=running?5.8:2.4;rig.update(1/60);let supported=0,flying=0,lean=0;
    for(let i=0;i<420;i++){
      rig.root.position.z-=speed/60;rig.update(1/60,{distance:speed/60,speed,running});rig.root.updateMatrixWorld(true);
      if(i<120)continue;
      const floor=Math.min(soleHeight(rig.root,'left-foot'),soleHeight(rig.root,'right-foot'));
      if(floor<.003)supported++;else flying++;
      lean+=rig.root.children[0].children[0].rotation.x;
    }
    samples.push({supported,flying,lean:lean/300});
  }
  assert.ok(samples[0].supported>260,'walking should keep a foot on the ground');
  assert.ok(samples[1].flying>60,'running should have a clear flight phase');
  assert.ok(samples[1].lean<samples[0].lean-.12,'running should use a separate forward lean');
});
test('repeated sharp left and right turns cannot split the legs or pull the hips into the floor',()=>{
  for(const running of [false,true]){
    const rig=createAstronaut(),speed=running?5.8:2.4;rig.update(1/60);
    for(let i=0;i<360;i++){
      const yaw=Math.sin(i/25)*1.3;rig.root.rotation.y=yaw;
      rig.root.position.x-=Math.sin(yaw)*speed/60;rig.root.position.z-=Math.cos(yaw)*speed/60;
      rig.update(1/60,{distance:speed/60,speed,running});rig.root.updateMatrixWorld(true);
      for(const side of ['left','right']){
        const foot=point(rig.root,side+'-foot');rig.root.worldToLocal(foot);
        assert.ok((side==='left'?-1:1)*foot.x>.04,'feet must stay on their own side');
        assert.ok(Math.abs(foot.z)<.46,'turning foot must stay inside leg reach');
      }
      assert.ok(rig.root.children[0].position.y>-.22,'turning must not collapse the pelvis');
    }
  }
});

test('running chest leans ahead of the hips and the landing boot stays beneath the body',()=>{
  const rig=createAstronaut();rig.update(1/60);let contacts=0;
  for(let i=0;i<360;i++){
    rig.root.position.z-=5.8/60;rig.update(1/60,{distance:5.8/60,speed:5.8,running:true});rig.root.updateMatrixWorld(true);
    if(i<120)continue;
    const torso=rig.root.getObjectByName('torso'),chest=torso.localToWorld(new THREE.Vector3(0,.4,0)),hip=point(rig.root,'left-hip');
    assert.ok(chest.z<hip.z-.06,'chest must lean toward the facing direction, never backward');
    for(const side of ['left','right']){
      const foot=point(rig.root,side+'-foot');rig.root.worldToLocal(foot);
      if(soleHeight(rig.root,side+'-foot')<.003){assert.ok(foot.z>-.29,'contact must not reach far out ahead of the hips');contacts++;}
    }
  }
  assert.ok(contacts>50);
});

test('extended running has no sporadic foot snaps at 30, 60, or 120 fps',()=>{
  for(const hz of [30,60,120]){
    const rig=createAstronaut();rig.update(1/hz);const previous=new Map();
    for(let i=0;i<hz*20;i++){
      rig.root.position.z-=5.8/hz;rig.update(1/hz,{distance:5.8/hz,speed:5.8,running:true});rig.root.updateMatrixWorld(true);
      for(const side of ['left','right']){
        const foot=point(rig.root,side+'-foot'),last=previous.get(side);
        if(last&&i>hz*2)assert.ok(foot.distanceTo(last)*hz<13,'boot must not teleport between steps');
        previous.set(side,foot);
      }
    }
  }
});

test('jumping lifts hands smoothly, relaxes on descent, and settles after landing',()=>{
  const rig=createAstronaut();rig.update(1/60);const hand=()=>point(rig.root,'left-hand').y;
  const idle=hand();let previous=rig.root.getObjectByName('left-shoulder').rotation.x;
  for(let i=0;i<24;i++){
    rig.update(1/60,{grounded:false,vy:4.4-i*.1});rig.root.updateMatrixWorld(true);
    const current=rig.root.getObjectByName('left-shoulder').rotation.x;
    assert.ok(Math.abs(current-previous)<.15,'jump arm lift must not snap');previous=current;
  }
  const raised=hand();assert.ok(raised>idle+.3,'hands should rise clearly during takeoff');
  for(let i=0;i<30;i++)rig.update(1/60,{grounded:false,vy:-3});
  assert.ok(hand()<raised-.08,'arms should relax as the astronaut descends');
  for(let i=0;i<90;i++)rig.update(1/60,{grounded:true,landed:i===0,landingSpeed:4});
  assert.ok(Math.abs(hand()-idle)<.02,'hands should return to rest after landing');
});

test('rapid changing mouse-like turns cannot flip a planted boot after a corrective step',()=>{
  for(const hz of [30,60,120]){
    const rig=createAstronaut();rig.update(1/hz);const previous=new Map();
    for(let i=0;i<hz*12;i++){
      const yaw=Math.sin(i/hz*2)*1.1+Math.sin(i/hz*7)*.2;rig.root.rotation.y=yaw;
      rig.root.position.x-=Math.sin(yaw)*2.4/hz;rig.root.position.z-=Math.cos(yaw)*2.4/hz;
      rig.update(1/hz,{distance:2.4/hz,speed:2.4});rig.root.updateMatrixWorld(true);
      for(const side of ['left','right']){
        const foot=rig.root.getObjectByName(side+'-foot'),q=foot.getWorldQuaternion(new THREE.Quaternion());
        assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(q).y>.94,'turn replant must never roll the boot onto its side');
        const knee=rig.root.getObjectByName(side+'-knee').rotation.x,last=previous.get(side);
        assert.ok(Number.isFinite(knee)&&knee<=0&&knee>-2.6,'knee must keep its anatomical bend while changing direction');
        previous.set(side,knee);
      }
    }
  }
});

test('walking and running retain alternating strides after repeated changes of direction',()=>{
  for(const running of [false,true]){
    const rig=createAstronaut(),speed=running?5.8:2.4;rig.update(1/60);
    for(let i=0;i<240;i++){
      const yaw=Math.sin(i/60*3)*1.2;rig.root.rotation.y=yaw;
      rig.root.position.x-=Math.sin(yaw)*speed/60;rig.root.position.z-=Math.cos(yaw)*speed/60;
      rig.update(1/60,{distance:speed/60,speed,running});
    }
    let leftLead=0,rightLead=0;
    for(let i=0;i<240;i++){
      const yaw=rig.root.rotation.y;rig.root.position.x-=Math.sin(yaw)*speed/60;rig.root.position.z-=Math.cos(yaw)*speed/60;
      rig.update(1/60,{distance:speed/60,speed,running});rig.root.updateMatrixWorld(true);
      if(i<60)continue;
      const left=point(rig.root,'left-foot'),right=point(rig.root,'right-foot');
      rig.root.worldToLocal(left);rig.root.worldToLocal(right);
      if(left.z<right.z-.15)leftLead++;if(right.z<left.z-.15)rightLead++;
    }
    assert.ok(leftLead>30&&rightLead>30,'both legs must take turns leading, rather than hopping in sync');
  }
});

test('standing straightens the knees and walking avoids a sustained crouch',()=>{
  const rig=createAstronaut();for(let i=0;i<120;i++)rig.update(1/60);
  for(const side of ['left','right'])assert.ok(Math.abs(rig.root.getObjectByName(side+'-knee').rotation.x)<.05,'resting knees should be almost straight');
  const torso=rig.root.getObjectByName('torso');assert.ok(Math.abs(torso.rotation.x)<.005,'standing torso should be upright');
  let hipSum=0,count=0;
  for(let i=0;i<360;i++){rig.root.position.z-=2.4/60;rig.update(1/60,{distance:2.4/60,speed:2.4});if(i>120){hipSum+=rig.root.children[0].position.y;count++;}}
  assert.ok(hipSum/count>-.045,'walking should remain tall rather than crouching through the cycle');
});

test('boots follow body turns throughout a lunar jump and replant without twisting',()=>{
  const environment={gravity:1.62,terrainHeight:()=>0,walkableAt:()=>null,waterLevelAt:()=>null};
  for(const hz of [30,60,120]){
    const rig=createAstronaut(),body={x:0,y:0,z:0,vx:0,vz:-2.4,vy:0,grounded:true};rig.update(1/hz);let airborne=0,landed=false;
    for(let i=0;i<hz*7;i++){
      const motion=stepAstronaut(body,{x:0,z:0,jump:i===0},1/hz,[],environment);
      const yaw=i/hz*3+Math.sin(i/hz*6)*.9;rig.root.rotation.y=Math.atan2(Math.sin(yaw),Math.cos(yaw));
      rig.root.position.set(body.x,body.y,body.z);
      rig.update(1/hz,{...motion,grounded:body.grounded,vy:body.vy});rig.root.updateMatrixWorld(true);
      if(body.grounded){if(airborne>0)landed=true;continue;}
      airborne++;
      for(const side of ['left','right']){
        const foot=rig.root.getObjectByName(side+'-foot'),q=foot.getWorldQuaternion(new THREE.Quaternion());
        const facing=new THREE.Vector3(0,0,-1).applyQuaternion(q);facing.y=0;facing.normalize();
        const bodyFacing=new THREE.Vector3(0,0,-1).applyQuaternion(rig.root.quaternion);
        assert.ok(facing.dot(bodyFacing)>.995,'airborne boots must follow body yaw, including wrapped turns');
        assert.ok(new THREE.Vector3(0,1,0).applyQuaternion(q).y>.94,'airborne boots must stay upright');
      }
    }
    assert.ok(airborne>hz*5,'exercise the full low-gravity airtime');assert.ok(landed,'exercise landing after the airborne turns');
  }
});

test('fast swimmers lie horizontally with trailing legs, then tread upright when stopped',()=>{
  for(const hz of [30,60,120]){
    const rig=createAstronaut();rig.root.position.y=-.95;
    const head=rig.root.getObjectByName('torso').children.find(c=>c.type==='Group'&&c.position.y>.7);
    for(let i=0;i<hz*4;i++){
      rig.update(1/hz,{speed:1.9,grounded:false,swimming:true,fastSwimming:true});rig.root.updateMatrixWorld(true);
      if(i<hz)continue;
      const hip=point(rig.root,'left-hip').add(point(rig.root,'right-hip')).multiplyScalar(.5);
      const helmet=head.getWorldPosition(new THREE.Vector3()),axis=helmet.clone().sub(hip).normalize();
      assert.ok(Math.abs(axis.y)<.25,'head-to-hip axis must be nearly horizontal, not just a tilted chest');
      assert.ok(helmet.y>-.04&&helmet.y<.2,'helmet sits partly above the waterline');
      for(const side of ['left','right']){
        assert.ok(point(rig.root,side+'-foot').z>hip.z+.6,'legs must trail behind the hips');
        assert.ok(rig.root.getObjectByName(side+'-knee').rotation.x>-.5,'flutter kicks must not tuck into a walking crouch');
      }
    }
    const before=[];rig.root.traverse(o=>before.push(...o.position.toArray(),...o.quaternion.toArray()));
    rig.update(0,{swimming:true,grounded:false,speed:1.9});
    const after=[];rig.root.traverse(o=>after.push(...o.position.toArray(),...o.quaternion.toArray()));assert.deepEqual(after,before);
    for(let i=0;i<hz*2;i++)rig.update(1/hz,{speed:0,grounded:false,swimming:true});
    rig.root.updateMatrixWorld(true);
    const hip=point(rig.root,'left-hip'),helmet=head.getWorldPosition(new THREE.Vector3());
    assert.ok(helmet.y-hip.y>.75,'stopping returns to an upright tread');assert.ok(rig.eyeHeight>1.69);
  }
});
test('shallow water brings the body upright before walking ashore',()=>{
  const rig=createAstronaut();
  for(let i=0;i<120;i++)rig.update(1/60,{speed:1.9,grounded:false,swimming:true,fastSwimming:true,waterDepth:4});
  assert.ok(rig.eyeHeight<1.2,'deep water uses the swimmer eye level');
  for(let i=0;i<120;i++)rig.update(1/60,{speed:1.9,grounded:false,swimming:true,fastSwimming:true,waterDepth:1.02});
  assert.ok(rig.eyeHeight>1.68,'shallow water restores an upright eye level');
  for(let i=0;i<120;i++)rig.update(1/60,{speed:0,grounded:true,swimming:false});
  rig.root.updateMatrixWorld(true);
  for(const side of ['left','right'])assert.ok(Math.abs(soleHeight(rig.root,side+'-foot'))<.01,'walking soles return to ground contact');
});

test('normal swimming keeps the helmet up while Shift selects the lower crawl posture',()=>{
  const samples=[];
  for(const fastSwimming of [false,true]){
    const rig=createAstronaut();rig.root.position.y=-.95;
    const head=rig.root.getObjectByName('torso').children.find(c=>c.type==='Group'&&c.position.y>.7);let min=Infinity,max=-Infinity;
    for(let i=0;i<240;i++){
      rig.update(1/60,{speed:fastSwimming?2.7:1.9,grounded:false,swimming:true,fastSwimming});rig.root.updateMatrixWorld(true);
      if(i>120){const y=head.getWorldPosition(new THREE.Vector3()).y;min=Math.min(min,y);max=Math.max(max,y);}
    }
    samples.push({min,max,eyes:rig.eyeHeight});
  }
  assert.ok(samples[0].min>.30,'normal swim holds the head clear of the water');
  assert.ok(samples[1].max<.2,'fast crawl lowers the head toward the surface');
  assert.ok(samples[0].eyes>samples[1].eyes+.3,'camera follows the two distinct postures');
});

test('walking keeps the body steady through foot planting at 30, 60 and 120 fps',()=>{
  for(const hz of [30,60,120]){
    const rig=createAstronaut();let minimum=Infinity,maximum=-Infinity,last=null,maxStep=0;
    for(let i=0;i<hz*8;i++){
      rig.root.position.z-=2.4/hz;rig.update(1/hz,{distance:2.4/hz,speed:2.4});
      const y=rig.root.children[0].position.y;
      if(i>hz*2){minimum=Math.min(minimum,y);maximum=Math.max(maximum,y);if(last!==null)maxStep=Math.max(maxStep,Math.abs(y-last));}
      last=y;
    }
    assert.ok(maximum-minimum<.02,'normal walking should not bounce the torso more than 2cm');
    assert.ok(maxStep<.012,'a planted step should not cause a sudden body drop');
    assert.ok(minimum>-.045,'smoothing must not turn walking into a sustained crouch');
  }
});
