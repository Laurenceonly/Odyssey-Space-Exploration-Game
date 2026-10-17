import {earthPathDistance,earthTrailWidth,earthGrassHeightScale,earthGrassDensity,earthGrassDryness} from './earth-layout.js';
import * as THREE from 'three';
import {LAKE,SITE_RADIUS,waterLevelAt} from './earth-physics.js';
import {surveyRouteDistance} from './visit-sites.js';

export function createEarthGrass(scene,site,terrainHeight,random){
  // The main field rises above the astronaut; paths and landing clearance stay low.
  const points=[],indices=[],shades=[],segments=2;
  for(let blade=0;blade<28;blade++){
    const angle=blade*2.399963,c=Math.cos(angle),s=Math.sin(angle),base=points.length/3;
    // Roots fill an area, rather than radiating from a repeated planted bunch.
    const rootAngle=blade*5.71,radius=Math.sqrt((blade+.5)/28)*.85;
    const rootX=Math.cos(rootAngle)*radius,rootZ=Math.sin(rootAngle)*radius;
    const height=1.05+.55*(.5+.5*Math.sin(blade*5.7));
    const width=.020+.009*(.5+.5*Math.sin(blade*3.1));
    const lean=.18+.33*(.5+.5*Math.sin(blade*1.9));
    for(let j=0;j<=segments;j++){
      const t=j/segments,edge=width*(1-t)*(1+.8*t);
      const x=rootX+c*lean*t*t,z=rootZ+s*lean*t*t,y=height*t;
      points.push(x-s*edge,y,z+c*edge,x+s*edge,y,z-c*edge);
      const shade=.30+.70*Math.sqrt(t);shades.push(shade,shade,shade,shade,shade,shade);
      if(j<segments){const a=base+j*2,b=a+1,d=a+2,e=a+3;indices.push(a,b,d);if(j<segments-1)indices.push(b,e,d);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));// Draw fewer well-spread blades on lighter presets without rebuilding instances.
  const bladeOrder=[0,14,7,21,3,17,10,24,5,19,12,26,1,15,8,22,4,18,11,25,6,20,13,27,2,16,9,23];
  geometry.setIndex(bladeOrder.flatMap(blade=>indices.slice(blade*9,blade*9+9)));geometry.computeVertexNormals();
  const windTime={value:0},detailFade={value:new THREE.Vector2(56,88)};
  let detailRadius=118;
  const material=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,alphaToCoverage:true});
  function compileGrass(shader,far=false){
    shader.uniforms.meadowTime=windTime;
    shader.uniforms.meadowDetailFade=detailFade;
    shader.uniforms.meadowLayer={value:far?1:0};
    shader.vertexShader='uniform float meadowTime;varying float meadowDistance;varying float meadowTip;varying vec3 meadowPosition;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',[
      '#include <begin_vertex>',
      'vec3 meadowWorld=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;',
      'vec3 meadowOrigin=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;',
      'float tip=clamp(position.y/1.6,0.,1.);meadowTip=tip;meadowPosition=meadowWorld;',
      'float gust=.5+.5*sin(meadowWorld.x*.032+meadowWorld.z*.018-meadowTime*.65);',
      'float sway=sin(meadowWorld.x*.043+meadowWorld.z*.025-meadowTime*.95);',
      'float flutter=sin(meadowWorld.x*.8+meadowWorld.z*.63+meadowTime*2.4);',
      'float bend=.14+gust*.30+sway*.12+flutter*.035;',
      'vec2 wind=vec2(1.,.52)*bend*tip*tip;',
      'transformed.x+=dot(wind,instanceMatrix[0].xz)/max(.01,dot(instanceMatrix[0].xz,instanceMatrix[0].xz));',
      'transformed.z+=dot(wind,instanceMatrix[2].xz)/max(.01,dot(instanceMatrix[2].xz,instanceMatrix[2].xz));',
      'float cameraClear=smoothstep(1.2,3.2,length(cameraPosition.xz-meadowOrigin.xz));',
      'transformed.y*=cameraClear;',
      'meadowDistance=length(cameraPosition.xz-meadowWorld.xz);',
    ].join('\n'));
    shader.fragmentShader='uniform vec2 meadowDetailFade;uniform float meadowLayer;varying float meadowDistance;varying float meadowTip;varying vec3 meadowPosition;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',[
      '#include <clipping_planes_fragment>',
      'float coverage=meadowLayer<.5?1.-smoothstep(meadowDetailFade.x,meadowDetailFade.y,meadowDistance):smoothstep(24.,36.,meadowDistance)*(1.-smoothstep(380.,480.,meadowDistance));',
      'if(coverage<=.001)discard;',
    ].join('\n'));
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',[
      '#include <color_fragment>',
      'diffuseColor.a*=coverage;',
      'float backlight=pow(max(0.,dot(normalize(cameraPosition-meadowPosition),normalize(vec3(-200.,95.,-110.)))),3.);',
      'diffuseColor.rgb+=vec3(.13,.085,.025)*meadowTip*backlight;',
    ].join('\n'));
  }
  material.onBeforeCompile=shader=>compileGrass(shader);
  material.customProgramCacheKey=()=> 'odyssey-meadow-gust-blend-v4';
  const root=new THREE.Group();root.name='meadow-grass';scene.add(root);
  const dummy=new THREE.Object3D(),color=new THREE.Color(),tileSize=32,capacity=1100;
  const fresh=new THREE.Color(0xa49a53),dry=new THREE.Color(0xc8a64f);
  function grassColor(x,z,variation){
    return color.copy(fresh).lerp(dry,.6+earthGrassDryness(x,z)*.4).multiplyScalar(.83+variation*.28);
  }
  const tiles=Array.from({length:49},()=>{
    const mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.name='meadow-tile';mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh);
    return {mesh,x:Infinity,z:Infinity};
  });
  // Lower-density, wider blades carry the meadow well beyond the detailed tiles.
  const distant=new THREE.Group();distant.name='distant-meadow';root.add(distant);
  const farPoints=[],farColors=[],farIndices=[];
  for(let blade=0;blade<4;blade++){
    const angle=blade*2.4,c=Math.cos(angle),s=Math.sin(angle),base=farPoints.length/3;
    const rootX=Math.sin(blade*4.1)*.6,rootZ=Math.cos(blade*3.7)*.6;
    for(let j=0;j<=2;j++){
      const t=j/2,width=.07*(1-t),lean=.38*t*t,height=(1.1+blade*.133)*t;
      farPoints.push(rootX+c*lean-s*width,height,rootZ+s*lean+c*width,rootX+c*lean+s*width,height,rootZ+s*lean-c*width);
      const shade=.72+.28*t;farColors.push(shade,shade,shade,shade,shade,shade);
    }
    farIndices.push(base,base+1,base+2,base+1,base+3,base+2,base+2,base+3,base+4);
  }
  const farGeometry=new THREE.BufferGeometry();farGeometry.setAttribute('position',new THREE.Float32BufferAttribute(farPoints,3));farGeometry.setAttribute('color',new THREE.Float32BufferAttribute(farColors,3));farGeometry.setIndex(farIndices);farGeometry.setDrawRange(0,36);farGeometry.computeVertexNormals();
  const farMaterial=material.clone();
  farMaterial.onBeforeCompile=shader=>compileGrass(shader,true);
  farMaterial.customProgramCacheKey=()=> 'odyssey-distant-gust-blend-v3';
  for(let cx=-4;cx<=4;cx++)for(let cz=-4;cz<=4;cz++){
    const farMesh=new THREE.InstancedMesh(farGeometry,farMaterial,4600);farMesh.name='distant-meadow-tile';farMesh.userData.tileX=cx*160;farMesh.userData.tileZ=cz*160;farMesh.receiveShadow=false;farMesh.castShadow=false;
    let count=0;
    // The underlayer uses a stable subset of the detailed field's patch origins.
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      const nx=cx*5+dx,nz=cz*5+dz,seed=nx*1931+nz*7919;
      for(let i=0;i<capacity;i+=6){
        const x=(nx+random(i+seed,30)-.5)*tileSize,z=(nz+random(i+seed,31)-.5)*tileSize;
        if(Math.hypot(x,z)>790||waterLevelAt(x,z)!==null||Math.hypot(x,z-4)<6||random(i+seed,34)>earthGrassDensity(x,z))continue;
        const y=terrainHeight(x,z),trail=Math.min(surveyRouteDistance(site,x,z),earthPathDistance(x,z));
        if(trail<earthTrailWidth(x,z)+1.7+random(i+seed,36)*.2||Math.hypot(x-LAKE.x,z-LAKE.z)<32&&y<LAKE.level+.45)continue;
        const rolling=.5+.5*Math.sin(x*.017+Math.sin(z*.012))*Math.cos(z*.019);
        const shelter=THREE.MathUtils.clamp(1-Math.max(0,y-8)*.008,.92,1);
        const height=(1.52+rolling*.12+random(i+seed,33)*.10)*shelter*earthGrassHeightScale(x,z,trail)*(.93+random(i+seed,35)*.12);
        const spread=.95+random(i+seed,37)*.45;
        dummy.position.set(x,y-.08,z);dummy.rotation.set(0,random(i+seed,32)*Math.PI*2,0);
        dummy.scale.set(spread,height,spread*(.7+random(i+seed,38)*.6));dummy.updateMatrix();
        farMesh.setMatrixAt(count,dummy.matrix);farMesh.setColorAt(count++,grassColor(x,z,random(i+seed,39)));
      }
    }
    farMesh.count=count;farMesh.instanceMatrix.needsUpdate=true;if(farMesh.instanceColor)farMesh.instanceColor.needsUpdate=true;
    if(count){farMesh.computeBoundingSphere();farMesh.boundingSphere.radius+=.9;}else farMesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx*160,0,cz*160),0);
    distant.add(farMesh);
  }
  let lastX=Infinity,lastZ=Infinity;
  function fill(tile,cx,cz){
    tile.x=cx;tile.z=cz;const mesh=tile.mesh,seed=cx*1931+cz*7919;let count=0;
    for(let i=0;i<capacity;i++){
      const x=(cx+random(i+seed,30)-.5)*tileSize,z=(cz+random(i+seed,31)-.5)*tileSize;
      if(Math.hypot(x,z)>SITE_RADIUS)continue;
      const y=terrainHeight(x,z),lakeshore=Math.hypot(x-LAKE.x,z-LAKE.z)<32&&y<LAKE.level+.45;
      if(waterLevelAt(x,z)!==null||lakeshore||Math.hypot(x,z-4)<6||Math.min(surveyRouteDistance(site,x,z),earthPathDistance(x,z))<earthTrailWidth(x,z)+1.7+random(i+seed,36)*.2)continue;
      const cover=earthGrassDensity(x,z);
      if(random(i+seed,34)>cover)continue;
      const rollingMeadow=.5+.5*Math.sin(x*.017+Math.sin(z*.012))*Math.cos(z*.019);
      const shelter=THREE.MathUtils.clamp(1-Math.max(0,y-8)*.008,.92,1);
      const height=(1.52+rollingMeadow*.12+random(i+seed,33)*.10)*shelter;
      dummy.position.set(x,y-.08,z);dummy.rotation.set(0,random(i+seed,32)*Math.PI*2,0);
      const trail=Math.min(surveyRouteDistance(site,x,z),earthPathDistance(x,z));
      const edgeHeight=earthGrassHeightScale(x,z,trail);
      const spread=.95+random(i+seed,37)*.45;
      dummy.scale.set(spread,height*edgeHeight*(.93+random(i+seed,35)*.12),spread*(.7+random(i+seed,38)*.6));dummy.updateMatrix();
      // Conform the spread-out roots to the local ground plane, keeping stalks upright.
      const slopeX=terrainHeight(x+.5,z)-terrainHeight(x-.5,z),slopeZ=terrainHeight(x,z+.5)-terrainHeight(x,z-.5),m=dummy.matrix.elements;
      m[1]=slopeX*m[0]+slopeZ*m[2];m[9]=slopeX*m[8]+slopeZ*m[10];
      mesh.setMatrixAt(count,dummy.matrix);
      mesh.setColorAt(count++,grassColor(x,z,random(i+seed,39)));
    }
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    if(count){mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.9;}else mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx*tileSize,0,cz*tileSize),0);
  }
  root.userData.setQuality=(quality,scale=1)=>{
    const preset=quality==='auto'?(scale<=.8?'low':'medium'):quality;
    const profiles={low:{blades:10,farBlades:2,fade:[32,56]},medium:{blades:18,farBlades:3,fade:[44,72]},high:{blades:28,farBlades:4,fade:[56,88]}};
    const profile=profiles[preset]||profiles.medium;
    geometry.setDrawRange(0,profile.blades*9);
    farGeometry.setDrawRange(0,profile.farBlades*9);
    detailFade.value.set(...profile.fade);detailRadius=profile.fade[1]+30;
    root.userData.quality=Object.hasOwn(profiles,preset)?preset:'medium';
    // Apply immediately, including when the explorer hasn't crossed a tile boundary.
    if(Number.isFinite(lastX))root.userData.update(lastPlayerX,lastPlayerZ,windTime.value);
  };
  let lastPlayerX=6,lastPlayerZ=7;
  root.userData.windTime=windTime;
  root.userData.update=(x,z,time,reduced=false)=>{
    lastPlayerX=x;lastPlayerZ=z;
    // Tiles beyond the blade fade still cost vertices unless explicitly culled.
    for(const tile of tiles)tile.mesh.visible=Math.hypot(tile.x*tileSize-x,tile.z*tileSize-z)<detailRadius;
    windTime.value=reduced?0:time;
    const cx=Math.floor((x+tileSize/2)/tileSize),cz=Math.floor((z+tileSize/2)/tileSize);
    if(cx===lastX&&cz===lastZ)return;
    lastX=cx;lastZ=cz;
    for(const mesh of distant.children)mesh.visible=Math.hypot(mesh.userData.tileX-x,mesh.userData.tileZ-z)<625;
    const wanted=[];for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)wanted.push({x:cx+dx,z:cz+dz});
    const reusable=tiles.filter(tile=>!wanted.some(p=>p.x===tile.x&&p.z===tile.z));
    for(const point of wanted){if(tiles.some(tile=>tile.x===point.x&&tile.z===point.z))continue;const tile=reusable.pop();fill(tile,point.x,point.z);tile.mesh.visible=Math.hypot(tile.x*tileSize-x,tile.z*tileSize-z)<detailRadius;}
  };
  root.userData.update(6,7,0,true);
  return root;
}
