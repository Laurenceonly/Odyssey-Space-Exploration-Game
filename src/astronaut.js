import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// Lightweight articulated suit: animation follows distance travelled, not key presses.
export function createAstronaut() {
  const root=new THREE.Group();root.name='astronaut';
  const pelvis=new THREE.Group();root.add(pelvis);
  const torso=new THREE.Group();torso.name='torso';pelvis.add(torso);
  const white=new THREE.MeshStandardMaterial({color:0xe9e7de,roughness:.7});
  const fabric=new THREE.MeshStandardMaterial({color:0xabb3b4,roughness:.95});
  const reinforcement=new THREE.MeshStandardMaterial({color:0xb9b9ae,roughness:.96});
  const rubber=new THREE.MeshStandardMaterial({color:0x29343b,roughness:.88});
  const orange=new THREE.MeshStandardMaterial({color:0xc27842,roughness:.65});
  const visor=new THREE.MeshStandardMaterial({color:0x9e7835,metalness:.88,roughness:.16});
  const glass=new THREE.MeshStandardMaterial({color:0xa8d9e4,emissive:0x294f5f,emissiveIntensity:.3,metalness:.3,roughness:.3});
  function part(geometry,material,parent,position,scale){
    const object=new THREE.Mesh(geometry,material);object.position.set(...position);
    if(scale)object.scale.set(...scale);object.castShadow=object.receiveShadow=true;parent.add(object);return object;
  }
  const capsule=(r,h)=>new THREE.CapsuleGeometry(r,h,5,12);
  part(capsule(.245,.32),white,torso,[0,1.19,0],[1.15,1,.8]);
  part(new THREE.SphereGeometry(.26,16,10),fabric,torso,[0,.92,0],[1,.55,.78]);
  part(new THREE.BoxGeometry(.38,.43,.17),white,torso,[0,1.19,.26]);
  const fieldPack=part(new RoundedBoxGeometry(.38,.39,.17,3,.035),fabric,torso,[0,1.18,.38]);fieldPack.name='field-backpack';
  part(new RoundedBoxGeometry(.27,.18,.035,2,.015),white,torso,[0,1.10,.475]);
  part(new THREE.BoxGeometry(.25,.018,.012),rubber,torso,[0,1.18,.498]);
  part(new THREE.BoxGeometry(.045,.025,.015),orange,torso,[0,1.18,.507]);
  part(new THREE.BoxGeometry(.3,.25,.03),rubber,torso,[0,1.2,.36]);
  for(const x of [-.13,.13])part(capsule(.055,.29),fabric,torso,[x,1.2,.39]);
  part(new THREE.BoxGeometry(.23,.2,.05),rubber,torso,[0,1.28,-.22]);
  part(new THREE.BoxGeometry(.13,.065,.015),glass,torso,[-.025,1.31,-.252]);
  for(const x of [-.065,0,.065])part(new THREE.SphereGeometry(.014,8,6),orange,torso,[x,1.23,-.255]);
  const collar=part(new THREE.TorusGeometry(.18,.04,8,24),rubber,torso,[0,1.49,0]);collar.rotation.x=Math.PI/2;
  const head=new THREE.Group();head.name='helmet-head';head.position.y=1.7;torso.add(head);
  part(new THREE.SphereGeometry(.275,24,18),white,head,[0,0,0],[1,1.05,.98]);
  part(new THREE.SphereGeometry(.246,24,18),rubber,head,[0,0,-.09],[1,.85,.9]);
  part(new THREE.SphereGeometry(.228,24,18),visor,head,[0,.005,-.13],[1,.82,.83]);
  for(const side of [-1,1]){
    part(new THREE.CylinderGeometry(.078,.078,.07,12),fabric,head,[side*.27,0,0]).rotation.z=Math.PI/2;
    part(new THREE.SphereGeometry(.035,10,8),glass,head,[side*.185,.17,-.13]);
  }
  function bootSole(){
    // Rounded footprint with a broad toe and a narrower heel. Extrude across sole thickness.
    const shape=new THREE.Shape();
    shape.moveTo(-.045,-.175);shape.quadraticCurveTo(-.12,-.175,-.12,-.10);
    shape.lineTo(-.105,.11);shape.quadraticCurveTo(-.105,.175,-.045,.175);
    shape.lineTo(.045,.175);shape.quadraticCurveTo(.105,.175,.105,.11);
    shape.lineTo(.12,-.10);shape.quadraticCurveTo(.12,-.175,.045,-.175);shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.025,bevelEnabled:false,curveSegments:8});
    geometry.translate(0,0,-.0125);geometry.rotateX(Math.PI/2);return geometry;
  }
  function fabricJoint(parent,radius){
    // Soft restraint folds cover the hinge while remaining attached to the existing rig.
    for(const y of [-.035,0,.035]){
      const fold=part(new THREE.TorusGeometry(radius,.009,5,16),fabric,parent,[0,y,0],[1,.9,1]);
      fold.rotation.x=Math.PI/2;
    }
  }
  const limbs=[];
  for(const side of [-1,1]){
    const hip=new THREE.Group();hip.position.set(side*.145,.88,0);pelvis.add(hip);hip.name=side<0?'left-hip':'right-hip';
    part(capsule(.115,.20),white,hip,[0,-.18,0],[1,1,.94]);
    const knee=new THREE.Group();knee.position.y=-.39;hip.add(knee);knee.name=side<0?'left-knee':'right-knee';
    part(new THREE.SphereGeometry(.105,12,8),white,knee,[0,0,0],[1,1,.94]);
    fabricJoint(knee,.102);
    part(capsule(.10,.18),white,knee,[0,-.18,0]);
    part(new THREE.SphereGeometry(.105,16,10),reinforcement,knee,[0,-.015,-.077],[.94,1.05,.34]).name='curved-knee-patch';
    const ankle=new THREE.Group();ankle.position.y=-.39;knee.add(ankle);
    ankle.name=side<0?'left-foot':'right-foot';
    part(new RoundedBoxGeometry(.235,.155,.34,4,.065),rubber,ankle,[0,0,-.04]);
    part(new RoundedBoxGeometry(.22,.11,.19,4,.045),white,ankle,[0,.08,-.015]);
    part(bootSole(),fabric,ankle,[0,-.09,-.04]);
    part(new RoundedBoxGeometry(.20,.024,.047,2,.01),reinforcement,ankle,[0,.077,-.10]);
    for(const y of [.12,.145]){
      const cuff=part(new THREE.TorusGeometry(.094,.009,5,16),fabric,ankle,[0,y,0],[1,.82,1]);cuff.rotation.x=Math.PI/2;
    }
    for(const z of [-.17,-.10,-.03,.04,.10])part(new RoundedBoxGeometry(.18,.005,.024,1,.002),rubber,ankle,[0,-.099,z]);
    const shoulder=new THREE.Group();shoulder.position.set(side*.31,1.39,0);torso.add(shoulder);
    part(new THREE.SphereGeometry(.13,12,10),white,shoulder,[0,0,0]);
    part(capsule(.087,.16),white,shoulder,[side*.035,-.15,0]);
    part(new THREE.BoxGeometry(.03,.12,.13),orange,shoulder,[side*.125,-.06,-.01]);
    shoulder.name=side<0?'left-shoulder':'right-shoulder';
    const elbow=new THREE.Group();elbow.name=side<0?'left-elbow':'right-elbow';elbow.position.set(side*.04,-.31,0);shoulder.add(elbow);
    part(new THREE.SphereGeometry(.085,12,8),white,elbow,[0,0,0]);
    fabricJoint(elbow,.083);
    part(capsule(.081,.13),white,elbow,[0,-.12,0]);
    const wrist=part(new THREE.TorusGeometry(.073,.012,6,16),reinforcement,elbow,[0,-.20,0]);wrist.rotation.x=Math.PI/2;
    // Simple rounded gloves; finger detail is deferred.
    part(new THREE.SphereGeometry(.085,16,12),white,elbow,[0,-.28,0],[.9,1.08,.85]).name=side<0?'left-hand':'right-hand';
    shoulder.rotation.z=side*.08;
    limbs.push({hip,knee,ankle,shoulder,elbow,side,footTarget:new THREE.Vector3(),worldFoot:new THREE.Vector3(),plant:new THREE.Vector3(),swingStart:new THREE.Vector3(),landing:new THREE.Vector3(),lastFraction:null,swingFraction:0,planted:true,forcedSwing:false,footYaw:0,correction:null,footRoll:0,resumeSwing:false});
  }
  // Lean around the hips, rather than rotating the chest around the soles.
  torso.position.y=.88;
  for(const child of torso.children)child.position.y-=.88;
  let phase=0,swimPhase=0,swimWeight=0,proneWeight=0,fastSwimWeight=0,weight=0,impact=0,pelvisVelocity=0,runWeight=0,airWeight=0;
  let initialized=false,wasMoving=false,wasGrounded=true,previousYaw=0;
  const previousPosition=new THREE.Vector3(),position=new THREE.Vector3(),velocity=new THREE.Vector3();
  const footWorld=new THREE.Vector3(),rest=new THREE.Vector3(),local=new THREE.Vector3();
  const inverseLeg=new THREE.Quaternion(),footRotation=new THREE.Quaternion(),rollRotation=new THREE.Quaternion(),up=new THREE.Vector3(0,1,0),across=new THREE.Vector3(1,0,0);
  const legLength=.39,ankleHeight=.1025;
  const ease=t=>t*t*(3-2*t);
  const swimOffset=new THREE.Vector3(),swimRotation=new THREE.Quaternion(),armTarget=new THREE.Quaternion(),strokeTarget=new THREE.Quaternion();
  const strokeEuler=new THREE.Euler(0,0,0,'XYZ');
  // Catch, underwater pull, push past the hip, then bent-elbow recovery.
  // The recovery continues around the shoulder; quaternions avoid a wrap snap.
  const crawlKeys=[
    [0,2.9,.12,.22],[.18,2.1,.20,.8],[.42,.6,.16,1.22],
    [.58,-.25,.14,.32],[.72,-1.3,1.05,1.48],[.90,-2.6,.55,.8],[1,2.9-Math.PI*2,.12,.22],
  ];
  function crawlPose(t,side){
    let i=0;while(i<crawlKeys.length-2&&t>crawlKeys[i+1][0])i++;
    const a=crawlKeys[i],b=crawlKeys[i+1],u=ease((t-a[0])/(b[0]-a[0]));
    return {shoulder:THREE.MathUtils.lerp(a[1],b[1],u),spread:side*THREE.MathUtils.lerp(a[2],b[2],u),elbow:THREE.MathUtils.lerp(a[3],b[3],u)};
  }
  function update(dt,{distance=0,speed=0,running:run=false,riding=false,grounded=true,swimming=false,fastSwimming=false,vy=0,landed=false,landingSpeed=0,time=0,reduced=false,waterDepth=10,groundHeight=()=>0}={}){
    dt=Math.min(.1,Math.max(0,dt));
    if(dt===0&&initialized)return;
    // Solve grounded foot placement in the unposed frame, then apply the
    // full-body water posture around the hips after the walking/jump solve.
    pelvis.position.sub(swimOffset);swimOffset.set(0,0,0);pelvis.quaternion.identity();
    root.updateWorldMatrix(true,true);root.getWorldPosition(position);
    const yaw=root.rotation.y;
    velocity.copy(position).sub(previousPosition).multiplyScalar(initialized&&dt>0?1/dt:0);velocity.y=0;
    const moving=grounded&&(speed>.12||distance>.002);
    runWeight=THREE.MathUtils.damp(runWeight,run?1:0,10,dt);
    const running=runWeight;
    airWeight=THREE.MathUtils.damp(airWeight,!grounded&&!swimming?1:0,9,dt);
    const stride=THREE.MathUtils.lerp(1.1,2.8,running),stance=THREE.MathUtils.lerp(.52,.22,running),halfStep=.24;
    if(moving&&!wasMoving)phase=stance*.5;
    else if(grounded)phase+=Math.max(0,distance)/stride;
    if(swimming)swimPhase+=dt*(.6+Math.min(3,speed)*.12);
    swimWeight=THREE.MathUtils.damp(swimWeight,swimming?1:0,10,dt);
    weight=THREE.MathUtils.damp(weight,Math.min(1,speed/2.4),12,dt);
    if(landed)impact=Math.min(.045,landingSpeed*.007);
    impact=THREE.MathUtils.damp(impact,0,12,dt);
    fastSwimWeight=THREE.MathUtils.damp(fastSwimWeight,swimming&&fastSwimming?1:0,6,dt);
    const swimDrive=THREE.MathUtils.smoothstep(speed,.15,1.5)*THREE.MathUtils.smoothstep(waterDepth,1,1.8);
    proneWeight=THREE.MathUtils.damp(proneWeight,swimming?swimDrive:0,6,dt);
    torso.rotation.x=THREE.MathUtils.damp(torso.rotation.x,riding?-.08:THREE.MathUtils.lerp(grounded?-.20*running*weight:.02,-.04,swimWeight),10,dt);
    torso.rotation.y=THREE.MathUtils.damp(torso.rotation.y,riding?-.22:reduced?0:Math.sin(phase*Math.PI*2)*(.012+running*.025)*weight*(1-swimWeight),10,dt);
    torso.scale.y=1+(reduced?0:Math.sin(time*1.7)*.002)*(1-weight);
    for(const limb of limbs){
      rest.set(limb.side*.145,ankleHeight,0);root.localToWorld(rest);
      rest.y=groundHeight(rest.x,rest.z)+ankleHeight;
      if(!initialized){
        limb.worldFoot.copy(rest);limb.plant.copy(rest);limb.footTarget.set(limb.side*.145,ankleHeight,0);limb.footYaw=yaw;
      }
      if(grounded&&!wasGrounded){
        limb.worldFoot.copy(limb.footTarget);root.localToWorld(limb.worldFoot);
        limb.worldFoot.y=groundHeight(limb.worldFoot.x,limb.worldFoot.z)+ankleHeight;
        limb.plant.copy(limb.worldFoot);limb.landing.copy(limb.worldFoot);limb.lastFraction=null;
      }
      if(riding){
        // Feet follow the deck in local space instead of chasing the terrain.
        local.set(limb.side*.25,ankleHeight,0);
        limb.footTarget.lerp(local,1-Math.exp(-12*dt));
        limb.worldFoot.copy(limb.footTarget);root.localToWorld(limb.worldFoot);
        limb.plant.copy(limb.worldFoot);limb.lastFraction=null;limb.planted=grounded;limb.forcedSwing=false;limb.correction=null;
        limb.footYaw+=Math.atan2(Math.sin(yaw-limb.footYaw),Math.cos(yaw-limb.footYaw))*(1-Math.exp(-12*dt));
        limb.footRoll=THREE.MathUtils.damp(limb.footRoll,0,20,dt);
      }else if(!grounded){
        // Once airborne the boots turn with the body, rather than keeping a ground anchor.
        const bodyTurn=initialized?Math.atan2(Math.sin(yaw-previousYaw),Math.cos(yaw-previousYaw)):0;
        limb.footYaw+=bodyTurn;
        limb.footYaw+=Math.atan2(Math.sin(yaw-limb.footYaw),Math.cos(yaw-limb.footYaw))*(1-Math.exp(-12*dt));
        // Retract gradually on takeoff; do not teleport both knees into an airborne pose.
        local.set(limb.side*.145,ankleHeight+.045+Math.max(0,vy)*.012,-.045);
        limb.footTarget.lerp(local,1-Math.exp(-12*dt));
        limb.worldFoot.copy(limb.footTarget);root.localToWorld(limb.worldFoot);
        limb.lastFraction=null;limb.planted=false;limb.forcedSwing=false;limb.correction=null;limb.footRoll=THREE.MathUtils.damp(limb.footRoll,0,12,dt);
        continue;
      }
      else if(!moving){
        limb.worldFoot.lerp(rest,initialized?1-Math.exp(-12*dt):1);
        limb.worldFoot.y=Math.max(limb.worldFoot.y,groundHeight(limb.worldFoot.x,limb.worldFoot.z)+ankleHeight);
        limb.plant.copy(limb.worldFoot);limb.lastFraction=null;limb.planted=true;limb.forcedSwing=false;limb.correction=null;limb.footRoll=THREE.MathUtils.damp(limb.footRoll,0,20,dt);
        limb.footYaw+=Math.atan2(Math.sin(yaw-limb.footYaw),Math.cos(yaw-limb.footYaw))*(1-Math.exp(-12*dt));
      }else{
        const cycle=phase+(limb.side<0?.5:0),fraction=cycle-Math.floor(cycle);
        const wrapped=limb.lastFraction!==null&&fraction<limb.lastFraction-.5;
        if(wrapped)limb.forcedSwing=false;
        let inStance=fraction<stance&&!limb.forcedSwing;
        if(inStance){
          if(limb.lastFraction===null){limb.plant.copy(limb.worldFoot);limb.footYaw=yaw;}
          else if(!limb.planted){limb.plant.copy(limb.landing);limb.footYaw=yaw;}
          limb.worldFoot.copy(limb.plant);limb.planted=true;
          local.copy(limb.worldFoot);root.worldToLocal(local);
          const turn=Math.abs(Math.atan2(Math.sin(yaw-limb.footYaw),Math.cos(yaw-limb.footYaw)));
          // Release before the knee crosses the body or the leg reaches its limit.
          if(limb.correction===null&&(turn>.22||limb.side*local.x<.065||Math.abs(local.x-limb.side*.145)>.13||Math.hypot(local.x-limb.side*.145,local.z)>.43)){
            limb.correction=0;limb.swingStart.copy(limb.worldFoot);limb.planted=false;inStance=false;
          }
        }
        if(limb.correction!==null){
          limb.correction=Math.min(1,limb.correction+dt/.16);
          const t=limb.correction;
          limb.landing.copy(rest).addScaledVector(velocity,.06);
          limb.landing.y=groundHeight(limb.landing.x,limb.landing.z)+ankleHeight;
          limb.worldFoot.lerpVectors(limb.swingStart,limb.landing,ease(t));
          limb.worldFoot.y=Math.max(limb.worldFoot.y,groundHeight(limb.worldFoot.x,limb.worldFoot.z)+ankleHeight)+Math.sin(Math.PI*t)*.055;
          limb.footYaw+=Math.atan2(Math.sin(yaw-limb.footYaw),Math.cos(yaw-limb.footYaw))*(1-Math.exp(-24*dt));
          limb.footRoll=THREE.MathUtils.damp(limb.footRoll,0,20,dt);
          limb.planted=false;
          if(t===1){limb.plant.copy(limb.worldFoot);limb.correction=null;limb.lastFraction=null;limb.planted=true;limb.resumeSwing=true;limb.footRoll=0;}
        }else if(!inStance||limb.forcedSwing){
          if(limb.planted||limb.lastFraction===null){limb.swingStart.copy(limb.worldFoot);limb.swingFraction=limb.lastFraction===null||limb.resumeSwing?fraction:stance;limb.resumeSwing=false;}
          const t=THREE.MathUtils.clamp((fraction-limb.swingFraction)/Math.max(.01,1-limb.swingFraction),0,1);
          const remaining=(1-fraction)*stride/Math.max(.12,speed);
          footWorld.set(limb.side*.145,ankleHeight,-halfStep);root.localToWorld(footWorld);
          limb.landing.copy(footWorld).addScaledVector(velocity,Math.min(.6,remaining));
          limb.landing.y=groundHeight(limb.landing.x,limb.landing.z)+ankleHeight;
          limb.worldFoot.lerpVectors(limb.swingStart,limb.landing,ease(t));
          const walkLift=Math.sin(Math.PI*t)*.065;
          const heelRecovery=Math.sin(Math.PI*t)*(.48-.28*t);
          limb.worldFoot.y=Math.max(limb.worldFoot.y,groundHeight(limb.worldFoot.x,limb.worldFoot.z)+ankleHeight)+THREE.MathUtils.lerp(walkLift,heelRecovery,running);
          limb.planted=false;
          limb.footYaw+=Math.atan2(Math.sin(yaw-limb.footYaw),Math.cos(yaw-limb.footYaw))*(1-Math.exp(-18*dt));
        }
        if(limb.planted&&limb.lastFraction!==null){
          const contact=THREE.MathUtils.clamp(fraction/stance,0,1);
          const heel=THREE.MathUtils.lerp(.12,.03,running),toe=THREE.MathUtils.lerp(.22,.32,running);
          const roll=contact<.18?heel*(1-ease(contact/.18)):contact>.68?-toe*ease((contact-.68)/.32):0;
          limb.footRoll=THREE.MathUtils.damp(limb.footRoll,roll,24,dt);
        }else if(limb.correction===null)limb.footRoll=THREE.MathUtils.damp(limb.footRoll,0,18,dt);
        limb.lastFraction=fraction;
      }
      footWorld.copy(limb.worldFoot);
      const pivot=limb.footRoll>=0?.135:-.215;
      const rollY=ankleHeight*(Math.cos(limb.footRoll)-1)+Math.sin(limb.footRoll)*pivot;
      const rollZ=pivot*(1-Math.cos(limb.footRoll))+ankleHeight*Math.sin(limb.footRoll);
      footWorld.y+=Math.max(0,rollY);footWorld.x+=Math.sin(limb.footYaw)*rollZ;footWorld.z+=Math.cos(limb.footYaw)*rollZ;
      local.copy(footWorld);root.worldToLocal(local);
      // Anatomical limits stop a sharp input change from pulling either boot across the body.
      local.x=limb.side*Math.max(.055,Math.min(.36,limb.side*local.x));
      const lateral=local.x-limb.side*.145,horizontal=Math.hypot(lateral,local.z),limit=.43;
      if(horizontal>limit){local.x=limb.side*.145+lateral*limit/horizontal;local.z*=limit/horizontal;}
      limb.footTarget.copy(local);
    }
    const maxReach=THREE.MathUtils.lerp(legLength*2-.0001,legLength*2-.004,weight);
    let ceiling=.0024*(1-weight)-.08*running;
    if(grounded)for(const limb of limbs){
      // A swinging boot is not supporting the body; using it as a height
      // constraint makes the hips snap down repeatedly at running speed.
      if(!limb.planted)continue;
      const foot=limb.footTarget,side=foot.x-limb.hip.position.x;
      const legHeight=Math.sqrt(Math.max(.01,maxReach*maxReach-foot.z*foot.z-side*side));
      ceiling=Math.min(ceiling,foot.y+legHeight-limb.hip.position.y);
    }
    // A foot hanging over a ledge cannot pull the whole body down to reach the lower floor.
    ceiling=Math.max(-.15,ceiling);
    // A small, steady knee bend absorbs ordinary walking steps. Do not
    // make the whole torso rise and drop to chase each swinging boot.
    const walkHeight=.0024*(1-weight)-.025*weight;
    const target=grounded?(riding?Math.min(ceiling,-.045):THREE.MathUtils.lerp(Math.min(ceiling,walkHeight),ceiling,running))-impact:0;
    // Critically damped body weight: stable across frame rates, without artificial bobbing.
    const omega=22,offset=pelvis.position.y-target,impulse=pelvisVelocity+omega*offset,decay=Math.exp(-omega*dt);
    pelvis.position.y=target+(offset+impulse*dt)*decay;
    pelvisVelocity=(pelvisVelocity-omega*impulse*dt)*decay;
    if(grounded&&pelvis.position.y>ceiling){pelvis.position.y=ceiling;pelvisVelocity=Math.min(0,pelvisVelocity);}
    for(const limb of limbs){
      const x=limb.footTarget.x-limb.hip.position.x;
      const y=limb.footTarget.y-limb.hip.position.y-pelvis.position.y,z=limb.footTarget.z;
      const vertical=-Math.hypot(x,y);
      const reach=THREE.MathUtils.clamp(Math.hypot(vertical,z),.23,THREE.MathUtils.lerp(legLength*2-.0001,legLength*2-.001,weight));
      const bend=Math.acos(THREE.MathUtils.clamp(reach/(legLength*2),-1,1));
      const hipAngle=Math.atan2(-z,-vertical)+bend,kneeAngle=-2*bend;
      // Hip abduction follows the planted foot; the knee remains a single forward hinge.
      limb.hip.rotation.set(hipAngle,0,Math.atan2(x,-y),'ZXY');
      limb.knee.rotation.set(kneeAngle,0,0);
      inverseLeg.copy(limb.hip.quaternion).multiply(limb.knee.quaternion).invert();
      footRotation.setFromAxisAngle(up,limb.footYaw-yaw).multiply(rollRotation.setFromAxisAngle(across,limb.footRoll));
      limb.ankle.quaternion.copy(inverseLeg).multiply(footRotation);
      const swimAngle=swimPhase*Math.PI*2;
      const tread=reduced?0:Math.sin(swimAngle+(limb.side<0?Math.PI:0));
      const kick=reduced?0:Math.sin(swimAngle*3+(limb.side<0?Math.PI:0));
      const crawl=crawlPose(reduced?.2:(swimPhase+(limb.side<0?.5:0))%1,limb.side);
      if(swimWeight>.001){
        const recovery=reduced?.5:(1+Math.cos(swimAngle))*.5;
        const swimHip=THREE.MathUtils.lerp(.35+tread*.12,THREE.MathUtils.lerp(.12+recovery*.28,.06+kick*.19,fastSwimWeight),swimDrive);
        const swimKnee=THREE.MathUtils.lerp(-.65-tread*.12,THREE.MathUtils.lerp(-.3-recovery*.55,-.12-Math.max(0,-kick)*.28,fastSwimWeight),swimDrive);
        limb.hip.rotation.x=THREE.MathUtils.lerp(hipAngle,swimHip,swimWeight);
        limb.knee.rotation.x=THREE.MathUtils.lerp(kneeAngle,swimKnee,swimWeight);
        limb.hip.rotation.z=THREE.MathUtils.lerp(limb.hip.rotation.z,limb.side*(.1+.13*(1-fastSwimWeight)*Math.max(0,Math.cos(swimAngle))-.06*swimDrive*fastSwimWeight),swimWeight);
        limb.ankle.quaternion.slerp(strokeTarget.setFromEuler(strokeEuler.set(-.25,0,0)),swimWeight);
      }
      const armSwing=THREE.MathUtils.clamp(z/halfStep,-1,1)*(.2+running*.45);
      const jumpShoulder=1.05+THREE.MathUtils.clamp(vy,-3,4.4)*.09;
      const landShoulder=THREE.MathUtils.lerp(armSwing,jumpShoulder,airWeight);
      const landElbow=riding?.35:THREE.MathUtils.lerp(.2+running*1.1*weight,.82,airWeight);
      armTarget.setFromEuler(strokeEuler.set(riding?.12:landShoulder,0,limb.side*(riding?.25:THREE.MathUtils.lerp(.08,.22,airWeight))));
      // Tread upright when still; alternate complete front-crawl strokes when moving.
      const breastStroke=reduced?0:Math.sin(swimAngle),breastRecovery=reduced?.5:(1+Math.cos(swimAngle))*.5;
      const swimShoulder=THREE.MathUtils.lerp(.8+tread*.18,THREE.MathUtils.lerp(.95+breastStroke*.45,crawl.shoulder,fastSwimWeight),swimDrive);
      const swimSpread=THREE.MathUtils.lerp(limb.side*(.5+tread*.12),THREE.MathUtils.lerp(limb.side*(.3+(1-breastStroke)*.2),crawl.spread,fastSwimWeight),swimDrive);
      strokeTarget.setFromEuler(strokeEuler.set(swimShoulder,0,swimSpread));
      armTarget.slerp(strokeTarget,swimWeight);
      limb.shoulder.quaternion.slerp(armTarget,1-Math.exp(-14*dt));
      const swimElbow=THREE.MathUtils.lerp(.8,THREE.MathUtils.lerp(.65+breastRecovery*.55,crawl.elbow,fastSwimWeight),swimDrive);
      limb.elbow.rotation.x=THREE.MathUtils.damp(limb.elbow.rotation.x,THREE.MathUtils.lerp(landElbow,swimElbow,swimWeight),14,dt);
    }
    // Rotate the entire articulated suit around its hips, not just its chest.
    // At speed the body lies about 9 degrees above horizontal, with legs trailing.
    const pitch=-THREE.MathUtils.lerp(1.05,1.42,fastSwimWeight)*proneWeight;
    const bodyRoll=reduced?0:Math.sin(swimPhase*Math.PI*2)*.12*proneWeight*fastSwimWeight;
    swimRotation.setFromEuler(strokeEuler.set(pitch,bodyRoll,0));
    pelvis.quaternion.copy(swimRotation);
    swimOffset.set(0,.88,0).applyQuaternion(swimRotation).multiplyScalar(-1);
    swimOffset.y+=.88+.05*proneWeight;
    pelvis.position.add(swimOffset);
    // Extend the neck to keep the visor near the surface during the pull.
    head.rotation.x=THREE.MathUtils.damp(head.rotation.x,.9*proneWeight-.45*proneWeight*fastSwimWeight,8,dt);
    head.rotation.y=THREE.MathUtils.damp(head.rotation.y,riding?-1.35:reduced?0:Math.max(0,Math.sin(swimPhase*Math.PI*2))*.55*proneWeight*fastSwimWeight,8,dt);

    previousPosition.copy(position);previousYaw=yaw;initialized=true;wasMoving=moving;wasGrounded=grounded;
  }
  return {root,update,get eyeHeight(){return THREE.MathUtils.lerp(1.7,THREE.MathUtils.lerp(1.45,1.1,fastSwimWeight),proneWeight);}};
}
