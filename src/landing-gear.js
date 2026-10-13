import * as THREE from 'three';

// A nose support and two supports at the wing roots, away from the wing tips.
export function createLandingGear() {
  const root=new THREE.Group();
  root.name='landing-gear';
  const structure=new THREE.MeshStandardMaterial({color:0x29424e,metalness:.65,roughness:.45});
  const piston=new THREE.MeshStandardMaterial({color:0x9baeb2,metalness:.8,roughness:.28});
  const rubber=new THREE.MeshStandardMaterial({color:0x172127,metalness:.15,roughness:.9});
  const unit=new THREE.CylinderGeometry(1,1,1,12);
  const up=new THREE.Vector3(0,1,0),direction=new THREE.Vector3();
  const supports=[];
  function mesh(geometry,material){
    const object=new THREE.Mesh(geometry,material);
    object.castShadow=object.receiveShadow=true;root.add(object);return object;
  }
  function strut(radius,material){const object=mesh(unit,material);object.userData.radius=radius;return object;}
  function connect(object,a,b){
    direction.subVectors(b,a);object.position.copy(a).add(b).multiplyScalar(.5);
    object.scale.set(object.userData.radius,direction.length(),object.userData.radius);
    object.quaternion.setFromUnitVectors(up,direction.normalize());
  }
  for(const side of [-1,1,0]){
    const nose=side===0;
    const mount=new THREE.Vector3(side*.76,nose?-.22:-.18,nose?-1.55:.75);
    const deployedKnee=new THREE.Vector3(side*.98,-.57,nose?-1.43:.9);
    const deployedFoot=new THREE.Vector3(side*1.12,-.94,nose?-1.7:1.03);
    const foldedKnee=new THREE.Vector3(side*.79,-.25,nose?-1.1:1.08);
    const foldedFoot=new THREE.Vector3(side*.8,-.28,nose?-.75:1.45);
    const housing=mesh(new THREE.BoxGeometry(nose?.25:.32,.12,.42),structure);housing.position.copy(mount);
    const upper=strut(.085,structure),lower=strut(.048,piston),brace=strut(.032,structure);
    const hinge=mesh(new THREE.CylinderGeometry(.09,.09,.15,12),piston);hinge.rotation.z=Math.PI/2;
    const foot=mesh(new THREE.CylinderGeometry(.23,.26,.08,16),rubber);foot.name='landing-foot';foot.scale.set(1,.999,1.25);
    const pad=mesh(new THREE.CylinderGeometry(.19,.22,.025,16),structure);pad.scale.z=1.25;
    const back=mount.clone();back.z+=nose?-.22:.28;
    supports.push({mount,back,deployedKnee,deployedFoot,foldedKnee,foldedFoot,upper,lower,brace,hinge,foot,pad,knee:new THREE.Vector3(),end:new THREE.Vector3()});
  }
  function update(deployment,compression=0){
    const t=THREE.MathUtils.clamp(deployment,0,1);
    root.visible=t>.001;
    for(const leg of supports){
      leg.knee.lerpVectors(leg.foldedKnee,leg.deployedKnee,t);leg.knee.y+=compression*.4;
      leg.end.lerpVectors(leg.foldedFoot,leg.deployedFoot,t);leg.end.y+=compression;
      connect(leg.upper,leg.mount,leg.knee);connect(leg.lower,leg.knee,leg.end);connect(leg.brace,leg.back,leg.knee);
      leg.hinge.position.copy(leg.knee);leg.foot.position.copy(leg.end);leg.pad.position.copy(leg.end);leg.pad.position.y+=.05;
    }
  }
  update(0);
  return {root,update,groundOffset:.98};
}
