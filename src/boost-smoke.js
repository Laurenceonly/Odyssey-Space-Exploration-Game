import * as THREE from 'three';

// Reusable world-space puffs: exhaust stays behind as the astronaut rises.
export function createBoostSmoke(scene){
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
  const context=canvas.getContext('2d');
  for(const [x,y,r] of [[32,32,28],[22,26,20],[41,23,18],[39,40,19],[21,41,16]]){
    const gradient=context.createRadialGradient(x,y,0,x,y,r);
    gradient.addColorStop(0,'rgba(235,238,240,.45)');
    gradient.addColorStop(.45,'rgba(207,214,220,.25)');
    gradient.addColorStop(1,'rgba(190,198,205,0)');
    context.fillStyle=gradient;context.fillRect(0,0,64,64);
  }
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const root=new THREE.Group();root.name='suit-boost-smoke';scene.add(root);
  const particles=Array.from({length:32},()=>{
    const material=new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false,opacity:0,color:0xe1e6e9});
    const sprite=new THREE.Sprite(material);sprite.visible=false;root.add(sprite);
    return {sprite,velocity:new THREE.Vector3(),age:0,life:1,size:.2,spin:0,reduced:false};
  });
  const origin=new THREE.Vector3();let cursor=0,remaining=0,untilNext=0;
  function spawn(nozzle,body,reduced){
    const p=particles[cursor++%particles.length];
    nozzle.getWorldPosition(origin);p.sprite.position.copy(origin);
    p.sprite.position.y-=.08;
    p.reduced=reduced;p.age=0;p.life=reduced?.2:.85+Math.random()*.3;
    p.size=reduced?.24:.16+Math.random()*.12;
    p.velocity.set((Math.random()-.5)*.55+(body.vx||0)*.12,-1.5-Math.random()*.7,(Math.random()-.5)*.55+(body.vz||0)*.12);
    p.spin=(Math.random()-.5)*.6;p.sprite.material.rotation=Math.random()*Math.PI*2;
    p.sprite.material.opacity=reduced?.3:.6;p.sprite.scale.setScalar(p.size);p.sprite.visible=true;
  }
  return {
    trigger(){remaining=.22;untilNext=0;},
    reset(){remaining=0;for(const p of particles)p.sprite.visible=false;},
    update(dt,nozzles,body,reduced=false){
      dt=Math.min(.1,Math.max(0,dt));if(!dt)return;
      if(remaining>0){
        untilNext-=Math.min(dt,remaining);
        while(untilNext<=0){for(const nozzle of nozzles)spawn(nozzle,body,reduced);untilNext+=reduced?.25:1/60;}
        remaining=Math.max(0,remaining-dt);
      }
      for(const p of particles){
        if(!p.sprite.visible)continue;
        p.age+=dt;const t=Math.min(1,p.age/p.life);
        if(t===1){p.sprite.visible=false;continue;}
        if(!p.reduced){
          p.sprite.position.addScaledVector(p.velocity,dt);p.velocity.multiplyScalar(Math.exp(-2*dt));
          p.sprite.material.rotation+=p.spin*dt;
          p.sprite.scale.setScalar(p.size+.8*(1-(1-t)**2));
        }
        p.sprite.material.opacity=(p.reduced?.3:.6)*(1-t)**2;
      }
    }
  };
}
