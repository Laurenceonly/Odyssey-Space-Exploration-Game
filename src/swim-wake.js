import * as THREE from 'three';

export function createSwimWake(scene,level){
  const waterHeight=(x,z)=>typeof level==='function'?(level(x,z)??0):level;
  const root=new THREE.Group();root.name='swim-wake';scene.add(root);
  const geometry=new THREE.RingGeometry(.82,1,48);
  const ripples=Array.from({length:16},()=>{
    const material=new THREE.ShaderMaterial({
      uniforms:{alpha:{value:0}},transparent:true,depthWrite:false,side:THREE.DoubleSide,
      vertexShader:'varying vec2 ring; void main(){ring=position.xy;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader:'varying vec2 ring; uniform float alpha; void main(){float r=length(ring);float feather=smoothstep(.82,.90,r)*(1.-smoothstep(.93,1.,r));gl_FragColor=vec4(.80,.90,.93,alpha*feather);}',
    });
    const mesh=new THREE.Mesh(geometry,material);mesh.rotation.x=-Math.PI/2;mesh.visible=false;root.add(mesh);
    return {mesh,age:0,strength:0};
  });
  let cursor=0,distance=0,idle=0,wasActive=false;
  function spawn(x,z,strength){
    const p=ripples[cursor++%ripples.length];p.age=0;p.strength=strength;
    p.mesh.position.set(x,waterHeight(x,z)+.025,z);p.mesh.scale.setScalar(.35);p.mesh.visible=true;
  }
  return {
    reset(){for(const p of ripples)p.mesh.visible=false;distance=idle=0;wasActive=false;},
    update(dt,{active,x,z,speed=0,swimming=false,reduced=false}){
      dt=Math.min(.1,Math.max(0,dt));if(!dt)return;
      if(reduced){
        for(const p of ripples)p.mesh.visible=false;
        const p=ripples[0];p.mesh.visible=active;p.mesh.position.set(x,waterHeight(x,z)+.025,z);p.mesh.scale.setScalar(.75);p.mesh.material.uniforms.alpha.value=.16;
        wasActive=false;distance=idle=0;return;
      }
      if(active){
        distance+=speed*dt;idle+=dt;
        if(!wasActive||distance>=.6||idle>=.9){spawn(x,z,swimming?.32:.18);distance=idle=0;}
      }else{distance=idle=0;}
      wasActive=active;
      for(const p of ripples){
        if(!p.mesh.visible)continue;
        p.age+=dt;const t=Math.min(1,p.age/1.5);
        p.mesh.visible=t<1;p.mesh.scale.setScalar(.35+1.45*t);
        p.mesh.material.uniforms.alpha.value=p.strength*(1-t)**2;
      }
    }
  };
}
