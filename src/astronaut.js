import * as THREE from 'three';

// Lightweight articulated suit: animation follows distance travelled, not key presses.
export function createAstronaut() {
  const root=new THREE.Group();root.name='astronaut';
  const pelvis=new THREE.Group();root.add(pelvis);
  const torso=new THREE.Group();pelvis.add(torso);
  const white=new THREE.MeshStandardMaterial({color:0xe9e7de,roughness:.7});
  const fabric=new THREE.MeshStandardMaterial({color:0xabb3b4,roughness:.95});
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
  part(new THREE.BoxGeometry(.3,.25,.03),rubber,torso,[0,1.2,.36]);
  for(const x of [-.13,.13])part(capsule(.055,.29),fabric,torso,[x,1.2,.39]);
  part(new THREE.BoxGeometry(.23,.2,.05),rubber,torso,[0,1.28,-.22]);
  part(new THREE.BoxGeometry(.13,.065,.015),glass,torso,[-.025,1.31,-.252]);
  for(const x of [-.065,0,.065])part(new THREE.SphereGeometry(.014,8,6),orange,torso,[x,1.23,-.255]);
  const collar=part(new THREE.TorusGeometry(.18,.04,8,24),rubber,torso,[0,1.49,0]);collar.rotation.x=Math.PI/2;
  const head=new THREE.Group();head.position.y=1.7;torso.add(head);
  part(new THREE.SphereGeometry(.275,24,18),white,head,[0,0,0],[1,1.05,.98]);
  part(new THREE.SphereGeometry(.246,24,18),rubber,head,[0,0,-.09],[1,.85,.9]);
  part(new THREE.SphereGeometry(.228,24,18),visor,head,[0,.005,-.13],[1,.82,.83]);
  for(const side of [-1,1]){
    part(new THREE.CylinderGeometry(.078,.078,.07,12),fabric,head,[side*.27,0,0]).rotation.z=Math.PI/2;
    part(new THREE.SphereGeometry(.035,10,8),glass,head,[side*.185,.17,-.13]);
  }
  const limbs=[];
  for(const side of [-1,1]){
    const hip=new THREE.Group();hip.position.set(side*.145,.88,0);pelvis.add(hip);hip.name=side<0?'left-hip':'right-hip';
    part(capsule(.115,.20),white,hip,[0,-.18,0],[1,1,.94]);
    const knee=new THREE.Group();knee.position.y=-.39;hip.add(knee);knee.name=side<0?'left-knee':'right-knee';
    part(new THREE.SphereGeometry(.105,12,8),rubber,knee,[0,0,0]);
    part(capsule(.10,.18),white,knee,[0,-.18,0]);
    part(new THREE.BoxGeometry(.13,.15,.045),fabric,knee,[0,-.02,-.09]);
    const ankle=new THREE.Group();ankle.position.y=-.39;knee.add(ankle);
    ankle.name=side<0?'left-foot':'right-foot';
    part(new THREE.BoxGeometry(.235,.155,.34),rubber,ankle,[0,0,-.04]);
    part(new THREE.BoxGeometry(.22,.11,.19),white,ankle,[0,.08,-.015]);
    part(new THREE.BoxGeometry(.24,.025,.35),fabric,ankle,[0,-.09,-.04]);
    const shoulder=new THREE.Group();shoulder.position.set(side*.31,1.39,0);torso.add(shoulder);
    part(new THREE.SphereGeometry(.13,12,10),white,shoulder,[0,0,0]);
    part(capsule(.087,.16),white,shoulder,[side*.035,-.15,0]);
    part(new THREE.BoxGeometry(.03,.12,.13),orange,shoulder,[side*.125,-.06,-.01]);
    shoulder.name=side<0?'left-shoulder':'right-shoulder';
    const elbow=new THREE.Group();elbow.name=side<0?'left-elbow':'right-elbow';elbow.position.set(side*.04,-.31,0);shoulder.add(elbow);
    part(new THREE.SphereGeometry(.085,12,8),rubber,elbow,[0,0,0]);
    part(capsule(.081,.13),white,elbow,[0,-.12,0]);
    part(new THREE.SphereGeometry(.085,12,8),rubber,elbow,[0,-.28,0],[.9,1.2,.85]).name=side<0?'left-hand':'right-hand';
    shoulder.rotation.z=side*.08;
    limbs.push({hip,knee,ankle,shoulder,elbow,side});
  }
  let phase=0,swimPhase=0,swimWeight=0,weight=0,impact=0;
  const footWorld=new THREE.Vector3(),footLocal=new THREE.Vector3();
  const legLength=.39,ankleHeight=.1025;
  function update(dt,{distance=0,speed=0,grounded=true,swimming=false,vy=0,landed=false,landingSpeed=0,time=0,reduced=false,groundHeight=()=>0}={}){
    const running=THREE.MathUtils.clamp((speed-2.8)/2.8,0,1);
    const stride=1.3+running*.5,stance=.48-running*.02;
    if(grounded)phase+=Math.max(0,distance)/stride;
    if(swimming)swimPhase+=dt*(.55+speed*.12);
    swimWeight=THREE.MathUtils.damp(swimWeight,swimming?1:0,10,dt);
    weight=THREE.MathUtils.damp(weight,Math.min(1,speed/2.8),10,dt);
    if(landed)impact=Math.min(.035,landingSpeed*.007);
    impact=THREE.MathUtils.damp(impact,0,12,dt);
    pelvis.position.y=THREE.MathUtils.damp(pelvis.position.y,grounded?-(.08+running*.06)*weight-impact:0,14,dt);
    torso.rotation.x=THREE.MathUtils.damp(torso.rotation.x,THREE.MathUtils.lerp(grounded?.05*running*weight:.02,.14,swimWeight),10,dt);
    torso.rotation.y=THREE.MathUtils.damp(torso.rotation.y,reduced?0:Math.sin(phase*Math.PI*2)*.012*weight*(1-swimWeight),10,dt);
    torso.scale.y=1+(reduced?0:Math.sin(time*1.7)*.002)*(1-weight);
    root.updateWorldMatrix(true,true);
    for(const limb of limbs){
      const cycle=phase+(limb.side<0?.5:0),fraction=cycle-Math.floor(cycle);
      const halfStep=stride*stance*.5;
      let z,lift=0;
      if(fraction<stance){
        // Stance moves backward relative to the body at the actual travel speed.
        z=stride*(fraction-stance*.5);
      }else{
        const t=(fraction-stance)/(1-stance),ease=t*t*(3-2*t);
        z=halfStep*(1-2*ease);
        lift=Math.sin(t*Math.PI)**2*(.045+running*.035);
      }
      z*=weight;lift*=weight;
      if(!grounded){z=-.045;lift=.045+Math.max(0,vy)*.012;}
      footWorld.set(limb.side*.145,ankleHeight,z);root.localToWorld(footWorld);
      if(grounded)footWorld.y=groundHeight(footWorld.x,footWorld.z)+ankleHeight+lift;
      else footWorld.y+=lift;
      footLocal.copy(footWorld);root.worldToLocal(footLocal);
      const y=footLocal.y-limb.hip.position.y-pelvis.position.y;
      const forward=footLocal.z;
      const reach=THREE.MathUtils.clamp(Math.hypot(y,forward),.45,legLength*2-.001);
      const bend=Math.acos(THREE.MathUtils.clamp(reach/(legLength*2),-1,1));
      // Knees are hinge joints: keep motion in the forward/back plane to avoid twisting.
      const hipAngle=Math.atan2(-forward,-y)+bend;
      const kneeAngle=-2*bend;
      limb.hip.rotation.set(hipAngle,0,0);
      limb.knee.rotation.set(kneeAngle,0,0);
      limb.ankle.rotation.set(-hipAngle-kneeAngle,0,0);
      // Suit faces -Z: positive X flexion brings the forearm forward.
      // Keep the elbow hinge positive in every state, including transitions.
      const stroke=reduced?0:Math.sin((swimPhase+(limb.side<0?.5:0))*Math.PI*2);
      if(swimWeight>.001){
        limb.hip.rotation.x=THREE.MathUtils.lerp(hipAngle,.16+stroke*.12,swimWeight);
        limb.knee.rotation.x=THREE.MathUtils.lerp(kneeAngle,-.42-stroke*.1,swimWeight);
        limb.ankle.rotation.x=THREE.MathUtils.lerp(-hipAngle-kneeAngle,.2,swimWeight);
      }
      const armSwing=THREE.MathUtils.clamp(z/halfStep,-1,1)*(.22+running*.16);
      const landShoulder=grounded?armSwing:.16;
      const landElbow=.2+running*.35*weight+(grounded?0:.15);
      limb.shoulder.rotation.x=THREE.MathUtils.damp(limb.shoulder.rotation.x,THREE.MathUtils.lerp(landShoulder,.62+stroke*.26,swimWeight),14,dt);
      limb.shoulder.rotation.z=THREE.MathUtils.damp(limb.shoulder.rotation.z,limb.side*THREE.MathUtils.lerp(.08,.28,swimWeight),14,dt);
      limb.elbow.rotation.x=THREE.MathUtils.damp(limb.elbow.rotation.x,THREE.MathUtils.lerp(landElbow,.82-stroke*.18,swimWeight),14,dt);
    }
  }
  return {root,update};
}
