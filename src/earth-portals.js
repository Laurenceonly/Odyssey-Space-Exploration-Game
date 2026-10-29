import * as THREE from 'three';

// Each closed entrance is shaped by the place beyond it, not a shared neon ring.
const designs={
 fernlilt:{stone:0x9e906e,accent:0xd0b778,form:'grassland'},
 rainselve:{stone:0x665341,accent:0x567a48,form:'forest'},
 evrathen:{stone:0x6d9291,accent:0x9ac5bf,form:'lake'},
 vaelcren:{stone:0x7a7770,accent:0xb2ab96,form:'ridge'},
 ossamber:{stone:0x5b5842,accent:0x3f824e,form:'jungle'},
 ashqarin:{stone:0xb78159,accent:0xe2b777,form:'desert'},
 nacreloom:{stone:0x626d73,accent:0xa8c5c6,form:'cave'},
 keltrond:{stone:0x778083,accent:0xdde5df,form:'mountain'},
 teshora:{stone:0xc9b7a1,accent:0xe1c8af,form:'coast'},
 hyskrum:{stone:0x9bbcc5,accent:0xe1f0ee,form:'ice'},
 uloqai:{stone:0x5b9894,accent:0x9dd5c5,form:'ocean'},
 cirelune:{stone:0x655541,accent:0xa99463,form:'marsh'},
 dorynth:{stone:0x454340,accent:0xc87949,form:'volcanic'},
};
export function createEarthPortal(destination,timeUniform={value:0}){
 const design=designs[destination]||designs.fernlilt,group=new THREE.Group();
 group.name='portal-to-'+destination;group.userData.destination=destination;group.userData.available=false;group.userData.form=design.form;
 const stone=new THREE.MeshStandardMaterial({color:design.stone,roughness:.95,flatShading:true});
 const accent=new THREE.MeshStandardMaterial({color:design.accent,roughness:.9,flatShading:true});
 const dormant=new THREE.ShaderMaterial({
  side:THREE.DoubleSide,
  uniforms:{portalTime:timeUniform,portalColor:{value:new THREE.Color(design.accent)}},
  vertexShader:'varying vec2 portalUv; void main(){portalUv=vec2(position.x/4.7+.5,position.y/8.2);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:`uniform float portalTime; uniform vec3 portalColor; varying vec2 portalUv;
    void main(){
      vec2 p=(portalUv-vec2(.5,.48))*vec2(1.2,1.0);
      float drift=sin(p.y*12.0-portalTime*.8+sin(p.x*8.0+portalTime*.35)*1.4);
      float ripple=sin(length(p)*19.0-portalTime*1.1);
      float light=.37+.13*drift+.08*ripple;
      gl_FragColor=vec4(portalColor*light,1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
 });
 function add(geometry,material,x,y,z=0,rz=0){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.rotation.z=rz;group.add(mesh);return mesh;}
 function block(x,y,w,h,material=stone,rotation=0){const mesh=add(new THREE.BoxGeometry(w,h,1.65),material,x,y,0,rotation);return mesh;}
 function rock(x,y,sx,sy,material=stone,rotation=0){const mesh=add(new THREE.DodecahedronGeometry(1,0),material,x,y,0,rotation);mesh.scale.set(sx,sy,1.1);return mesh;}
 function spike(x,y,height,material=accent,rotation=0){return add(new THREE.ConeGeometry(.62,height,5),material,x,y,.15,rotation);}
 function foliage(x,y,sx,sy,material=accent){const mesh=add(new THREE.IcosahedronGeometry(1,1),material,x,y,0);mesh.scale.set(sx,sy,1.3);return mesh;}
 const opening=new THREE.Shape();opening.moveTo(-2.35,.45);opening.lineTo(-2.35,5.25);opening.quadraticCurveTo(-2.35,8.15,0,8.15);opening.quadraticCurveTo(2.35,8.15,2.35,5.25);opening.lineTo(2.35,.45);opening.closePath();
 add(new THREE.ShapeGeometry(opening,18),dormant,0,0,.05);
 block(0,.25,7.5,.5,stone);
 switch(design.form){
  case 'forest': {
   // Two ancient trunks and a joined canopy form a giant tree doorway.
   for(const side of [-1,1]){
    const trunk=add(new THREE.CylinderGeometry(.62,1.05,8,7),stone,side*2.9,4,0,side*.05);trunk.scale.z=1.15;
    block(side*1.85,7.55,3.1,.72,stone,-side*.5);
    foliage(side*3,9.1,2.4,1.75);foliage(side*1.1,10,2.1,1.5);
   }foliage(0,9.2,2.1,1.55);break;
  }
  case 'jungle': {
   // Leaning roots and oversized leaves give this gateway a wilder canopy.
   for(const side of [-1,1]){
    add(new THREE.CylinderGeometry(.42,.9,8.2,7),stone,side*2.95,4,0,side*.12);
    for(let i=0;i<3;i++){const leaf=foliage(side*(3.25+i*.35),4.4+i*1.65,1.45,.55);leaf.rotation.z=side*.45;}
    block(side*1.65,7.8,3.1,.55,stone,-side*.48);
   }foliage(0,9,2.1,.9);break;
  }
  case 'cave': {
   // Rough rock shoulders, an uneven lintel and hanging points read as a cave mouth.
   for(const side of [-1,1]){rock(side*3.1,2.4,1.45,2.8);rock(side*2.75,6.1,1.3,2.05,stone,side*.28);}
   rock(0,8.45,3.3,1.35);for(const x of [-1.4,0,1.4])spike(x,7.8,1.25,accent,Math.PI);break;
  }
  case 'marsh': {
   // Low mossy root pillars curve together over a dark peat-colored opening.
   for(const side of [-1,1]){
    add(new THREE.CylinderGeometry(.4,1.05,8,7),stone,side*3,4,0,side*.14);
    block(side*1.7,7.55,3.4,.65,stone,-side*.52);
    rock(side*3.7,.9,1.3,.9,accent,side*.18);
    foliage(side*2,8.35,1.3,.48,accent);
   }foliage(0,8.65,1.25,.45,accent);break;
  }
  case 'volcanic': {
   // Broken basalt shoulders with warm mineral seams, rather than a mountain peak.
   for(const side of [-1,1]){rock(side*3.1,2.5,1.45,2.8);rock(side*2.85,6,1.35,2.2,stone,side*.22);spike(side*3.5,6.8,2.5,stone,side*.18);}
   rock(0,8.3,2.8,1.2);block(-1.1,7.7,1.35,.16,accent,-.3);block(1.1,7.7,1.35,.16,accent,.3);break;
  }
  case 'ridge': {
   for(const side of [-1,1]){rock(side*3,3.35,1.25,3.5);rock(side*2.3,7.3,1.5,1.8,accent,side*.4);}
   rock(0,8.55,2,1.15);break;
  }
  case 'mountain': {
   for(const side of [-1,1]){rock(side*3,3.4,1.3,3.55);const peak=spike(side*2.9,7.85,3.8,accent,side*.08);peak.scale.x=1.8;}
   rock(0,8.1,2,1.2);break;
  }
  case 'desert': {
   for(const side of [-1,1]){block(side*2.95,3.7,1.45,7.4);block(side*2.95,1.05,1.85,.5,accent);}
   block(0,8.05,7.25,1.25);block(0,9,5.1,.55,accent);break;
  }
  case 'ice': {
   for(const side of [-1,1]){const base=spike(side*3,3.7,7.4,stone,side*.08);base.scale.x=2.1;spike(side*3.65,6,4.7,accent,side*.16);}
   rock(0,8.35,2.4,1.15,accent);break;
  }
  case 'lake': {
   for(const side of [-1,1]){rock(side*3,3.3,1.2,3.35);const reed=add(new THREE.CylinderGeometry(.09,.11,4,6),accent,side*3.8,2.2,.35,side*.12);reed.scale.z=1;}
   const wave=add(new THREE.TorusGeometry(2.8,.3,6,24,Math.PI),accent,0,6.3,.1);wave.scale.y=.72;break;
  }
  case 'coast': {
   for(const side of [-1,1]){add(new THREE.CylinderGeometry(.56,.72,6.8,8),stone,side*3,3.4);block(side*3,6.95,1.65,.45,accent);}
   block(0,7.8,7.1,1.15,stone);add(new THREE.SphereGeometry(.8,9,6),accent,0,8.8,.1);break;
  }
  case 'ocean': {
   for(const side of [-1,1]){rock(side*3.1,3.1,1.25,3.1);for(let i=0;i<3;i++){const coral=spike(side*(3.05+i*.38),5.2+i*.55,2.1,accent,side*(i-1)*.22);coral.scale.x=.55;}}
   const crest=add(new THREE.TorusGeometry(2.8,.35,6,24,Math.PI),accent,0,6.3,.1);crest.scale.y=.72;break;
  }
  default: for(const side of [-1,1])block(side*3,3.6,1.3,7.2);block(0,7.8,7,1,accent);
 }
 return group;
}

// Show one nearby in-world sign at a time so labels cannot pile up across the map.
export function updateEarthPortalSigns(group,x,z){
 let nearest=null,best=140*140;
 for(const portal of group.children){const dx=portal.position.x-x,dz=portal.position.z-z,distance=dx*dx+dz*dz;if(distance<best){best=distance;nearest=portal;}}
 for(const portal of group.children){const sign=portal.children[portal.userData.signIndex];if(sign)sign.visible=portal===nearest;}
}
