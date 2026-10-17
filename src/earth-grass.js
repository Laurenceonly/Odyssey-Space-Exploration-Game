import {bakeGrassCanopy} from './grass-canopy.js';
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
      const shade=.46+.54*Math.sqrt(t);shades.push(shade,shade,shade,shade,shade,shade);
      if(j<segments){const a=base+j*2,b=a+1,d=a+2,e=a+3;indices.push(a,b,d);if(j<segments-1)indices.push(b,e,d);}
    }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(shades,3));// Draw fewer well-spread blades on lighter presets without rebuilding instances.
  const bladeOrder=[0,14,7,21,3,17,10,24,5,19,12,26,1,15,8,22,4,18,11,25,6,20,13,27,2,16,9,23];
  const bladeRanks=new Float32Array(points.length/3);bladeOrder.forEach((blade,rank)=>bladeRanks.fill(rank,blade*6,blade*6+6));geometry.setAttribute('meadowBladeRank',new THREE.BufferAttribute(bladeRanks,1));
  geometry.setIndex(bladeOrder.flatMap(blade=>indices.slice(blade*9,blade*9+9)));geometry.computeVertexNormals();
  const aerialView={value:0};
  const windTime={value:0},detailFade={value:new THREE.Vector2(56,88)};
  let detailRadius=118;
  const tierFade={value:new THREE.Vector4(24,40,40,64)};
  const mediumGeometry=geometry.clone(),outerGeometry=geometry.clone();mediumGeometry.setDrawRange(0,18*9);outerGeometry.setDrawRange(0,6*9);
  const material=new THREE.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:THREE.DoubleSide,alphaToCoverage:true});
  function compileGrass(shader,far=false){
    shader.uniforms.meadowTime=windTime;
    shader.uniforms.meadowAerial=aerialView;
    shader.uniforms.meadowDetailFade=detailFade;shader.uniforms.meadowTierFade=tierFade;
    shader.uniforms.meadowLayer={value:far?1:0};
    shader.vertexShader=(far?'':'attribute float meadowBladeRank;varying float meadowRank;')+'uniform float meadowTime;varying float meadowDistance;varying float meadowTip;varying vec3 meadowPosition;varying float meadowBacklight;\n'+shader.vertexShader;
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',[
      '#include <begin_vertex>',
      ...(far?[]:['meadowRank=meadowBladeRank;']),
      'vec3 meadowWorld=(modelMatrix*instanceMatrix*vec4(position,1.)).xyz;',
      'float tip=clamp(position.y/1.6,0.,1.);meadowTip=tip;meadowPosition=meadowWorld;',
      ...(far?['meadowBacklight=pow(max(0.,dot(normalize(cameraPosition-meadowWorld),normalize(vec3(-200.,95.,-110.)))),3.);']:[]),
      'float gust=.5+.5*sin(meadowWorld.x*.032+meadowWorld.z*.018-meadowTime*.65);',
      ...(far?['float bend=.14+gust*.30;']:[
        'float sway=sin(meadowWorld.x*.043+meadowWorld.z*.025-meadowTime*.95);',
        'float flutter=sin(meadowWorld.x*.8+meadowWorld.z*.63+meadowTime*2.4);',
        'float bend=.14+gust*.30+sway*.12+flutter*.035;',
      ]),
      'vec2 wind=vec2(1.,.52)*bend*tip*tip;',
      'transformed.x+=dot(wind,instanceMatrix[0].xz)/max(.01,dot(instanceMatrix[0].xz,instanceMatrix[0].xz));',
      'transformed.z+=dot(wind,instanceMatrix[2].xz)/max(.01,dot(instanceMatrix[2].xz,instanceMatrix[2].xz));',
      'meadowDistance=length(cameraPosition.xz-meadowWorld.xz);',
    ].join('\n'));
    shader.fragmentShader=(far?'':'uniform vec4 meadowTierFade;varying float meadowRank;')+'uniform float meadowAerial;uniform vec2 meadowDetailFade;uniform float meadowLayer;varying float meadowDistance;varying float meadowTip;varying vec3 meadowPosition;varying float meadowBacklight;\n'+shader.fragmentShader;
    shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',[
      '#include <clipping_planes_fragment>',
      'float coverage=meadowLayer<.5?1.-smoothstep(meadowDetailFade.x,meadowDetailFade.y,meadowDistance):1.-smoothstep(mix(540.,1100.,meadowAerial),mix(680.,1300.,meadowAerial),meadowDistance);',
      ...(far?[]:[
        'if(meadowRank>=18.)coverage*=1.-smoothstep(meadowTierFade.x,meadowTierFade.y,meadowDistance);',
        'else if(meadowRank>=6.)coverage*=1.-smoothstep(meadowTierFade.z,meadowTierFade.w,meadowDistance);',
      ]),
      'if(coverage<=.001)discard;',
    ].join('\n'));
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',[
      '#include <color_fragment>',
      'diffuseColor.a*=coverage;',
      ...(far?['if(diffuseColor.a<=.001)discard;']:[]),
      far?'float backlight=meadowBacklight;':'float backlight=pow(max(0.,dot(normalize(cameraPosition-meadowPosition),normalize(vec3(-200.,95.,-110.)))),3.);',
      'diffuseColor.rgb+=vec3(.13,.085,.025)*meadowTip*backlight;',
    ].join('\n'));
    // A grass-only warm fill keeps every blade golden, even on its shaded side.
    // Blend after Lambert lighting so directional depth and real shadows remain.
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',[
      'outgoingLight=mix(outgoingLight,diffuseColor.rgb*1.65,.42);',
      '#include <opaque_fragment>',
    ].join('\n'));
  }
  material.onBeforeCompile=shader=>compileGrass(shader);
  material.customProgramCacheKey=()=> 'odyssey-meadow-tiered-golden-v3';
  const root=new THREE.Group();root.name='meadow-grass';root.userData.geometries=[geometry,mediumGeometry,outerGeometry];scene.add(root);
  const dummy=new THREE.Object3D(),color=new THREE.Color(),tileSize=32,capacity=1100;
  const fresh=new THREE.Color(0xcbb154),dry=new THREE.Color(0xe0bd5c);
  const patchPoint=new THREE.Vector2();
  function patchOrigin(cx,cz,i,seed){
    let u=random(i+seed,30),v=random(i+seed,31);
    if(i%6===0){const cell=(i/6*73)%196;u=(cell%14+.5+(u-.5)*.65)/14;v=(Math.floor(cell/14)+.5+(v-.5)*.65)/14;}
    return patchPoint.set((cx+u-.5)*tileSize,(cz+v-.5)*tileSize);
  }
  function grassColor(x,z,variation){
    return color.copy(fresh).lerp(dry,.35+earthGrassDryness(x,z)*.45).multiplyScalar(.94+variation*.12);
  }
  const tiles=Array.from({length:49},()=>{
    const mesh=new THREE.InstancedMesh(geometry,material,capacity);mesh.name='meadow-tile';mesh.receiveShadow=true;mesh.castShadow=false;root.add(mesh);
    return {mesh,x:Infinity,z:Infinity};
  });
  // A permanent meadow underlayer preserves the same canopy at every distance.
  const distant=new THREE.Group();distant.name='distant-meadow';root.add(distant);
  // Keep the full canopy at all distances. Bake its silhouettes from these
  // same 28 curved blades, so the distant field never becomes a different plant.
  const atlas=bakeGrassCanopy(geometry);
  const canopyTexture=new THREE.DataTexture(atlas.pixels,atlas.width,atlas.height,THREE.RGBAFormat);
  canopyTexture.magFilter=THREE.LinearFilter;canopyTexture.minFilter=THREE.LinearMipmapLinearFilter;canopyTexture.generateMipmaps=true;canopyTexture.anisotropy=4;canopyTexture.needsUpdate=true;
  const farPoints=[],farColors=[],farIndices=[],farUvs=[];
  for(let blade=0;blade<4;blade++){
    const angle=blade*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle),base=farPoints.length/3;
    for(const [side,t]of [[-1,0],[1,0],[-1,1],[1,1]]){
      farPoints.push(c*side*atlas.halfWidth,atlas.top*t,s*side*atlas.halfWidth);farColors.push(1,1,1);farUvs.push((blade+(side+1)/2)/4,t);
    }
    farIndices.push(base,base+1,base+2,base+1,base+3,base+2);
  }
  const farGeometry=new THREE.BufferGeometry();farGeometry.setAttribute('position',new THREE.Float32BufferAttribute(farPoints,3));farGeometry.setAttribute('color',new THREE.Float32BufferAttribute(farColors,3));farGeometry.setAttribute('uv',new THREE.Float32BufferAttribute(farUvs,2));farGeometry.setIndex(farIndices);farGeometry.setDrawRange(0,24);farGeometry.computeVertexNormals();
  const farMaterial=material.clone();farMaterial.map=canopyTexture;farMaterial.alphaTest=0;
  farMaterial.onBeforeCompile=shader=>compileGrass(shader,true);
  farMaterial.customProgramCacheKey=()=> 'odyssey-matched-golden-canopy-v5';
  root.userData.canopyProfile={height:atlas.top,halfWidth:atlas.halfWidth,views:atlas.views};
  for(let cx=-4;cx<=4;cx++)for(let cz=-4;cz<=4;cz++){
    const farMesh=new THREE.InstancedMesh(farGeometry,farMaterial,4600);farMesh.name='distant-meadow-tile';farMesh.userData.tileX=cx*160;farMesh.userData.tileZ=cz*160;farMesh.receiveShadow=false;farMesh.castShadow=false;
    let count=0;
    // The underlayer uses a stable subset of the detailed field's patch origins.
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){
      const nx=cx*5+dx,nz=cz*5+dz,seed=nx*1931+nz*7919;
      for(let i=0;i<capacity;i+=6){
        const p=patchOrigin(nx,nz,i,seed),x=p.x,z=p.y;
        if(Math.hypot(x,z)>790||waterLevelAt(x,z)!==null||Math.hypot(x,z-4)<6||random(i+seed,34)>earthGrassDensity(x,z))continue;
        const y=terrainHeight(x,z),trail=Math.min(surveyRouteDistance(site,x,z),earthPathDistance(x,z));
        if(trail<earthTrailWidth(x,z)+1.7+random(i+seed,36)*.2||Math.hypot(x-LAKE.x,z-LAKE.z)<32&&y<LAKE.level+.45)continue;
        const rolling=.5+.5*Math.sin(x*.017+Math.sin(z*.012))*Math.cos(z*.019);
        const shelter=THREE.MathUtils.clamp(1-Math.max(0,y-8)*.008,.92,1);
        const height=(1.52+rolling*.12+random(i+seed,33)*.10)*shelter*earthGrassHeightScale(x,z,trail)*(.93+random(i+seed,35)*.12);
        const spread=.95+random(i+seed,37)*.45;
        dummy.position.set(x,y-.08,z);dummy.rotation.set(0,random(i+seed,32)*Math.PI*2,0);
        dummy.scale.set(spread,height,spread*(.7+random(i+seed,38)*.6));dummy.updateMatrix();
        const slopeX=terrainHeight(x+.5,z)-terrainHeight(x-.5,z),slopeZ=terrainHeight(x,z+.5)-terrainHeight(x,z-.5),m=dummy.matrix.elements;
        m[1]=slopeX*m[0]+slopeZ*m[2];m[9]=slopeX*m[8]+slopeZ*m[10];
        farMesh.setMatrixAt(count,dummy.matrix);farMesh.setColorAt(count++,grassColor(x,z,random(i+seed,39)));
      }
    }
    farMesh.count=count;farMesh.instanceMatrix.needsUpdate=true;if(farMesh.instanceColor)farMesh.instanceColor.needsUpdate=true;
    if(count){farMesh.computeBoundingSphere();farMesh.boundingSphere.radius+=.9;}else farMesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx*160,0,cz*160),0);
    distant.add(farMesh);
  }
  let lastX=Infinity,lastZ=Infinity;
  function beginTile(tile,cx,cz){
    tile.x=cx;tile.z=cz;tile.nextIndex=tile.fillCount=0;tile.pending=true;tile.mesh.visible=false;tile.mesh.count=0;
  }
  function fillBatch(tile,budget=capacity){
    const {mesh,x:cx,z:cz}=tile,seed=cx*1931+cz*7919,end=Math.min(capacity,tile.nextIndex+budget);let count=tile.fillCount;
    for(let i=tile.nextIndex;i<end;i++){
      const p=patchOrigin(cx,cz,i,seed),x=p.x,z=p.y;
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
    tile.nextIndex=end;tile.fillCount=count;if(end<capacity)return;tile.pending=false;
    mesh.count=count;mesh.instanceMatrix.needsUpdate=true;if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
    if(count){mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.9;}else mesh.boundingSphere=new THREE.Sphere(new THREE.Vector3(cx*tileSize,0,cz*tileSize),0);
  }
  root.userData.setQuality=(quality,scale=1)=>{
    const preset=quality==='auto'?(scale<=.8?'low':'medium'):quality;
    const profiles={low:{blades:6,farBlades:3,fade:[32,56],tiers:[24,40,28,48]},medium:{blades:18,farBlades:3,fade:[44,72],tiers:[24,40,28,48]},high:{blades:28,farBlades:4,fade:[56,88],tiers:[24,40,40,64]}};
    const profile=profiles[preset]||profiles.medium;
    geometry.setDrawRange(0,profile.blades*9);
    farGeometry.setDrawRange(0,Math.max(3,profile.farBlades)*6);
    tierFade.value.set(...profile.tiers);
    detailFade.value.set(...profile.fade);detailRadius=profile.fade[1]+30;
    root.userData.quality=Object.hasOwn(profiles,preset)?preset:'medium';
    // Apply immediately, including when the explorer hasn't crossed a tile boundary.
    if(Number.isFinite(lastX))root.userData.update(lastPlayerX,lastPlayerZ,windTime.value,false,lastAltitude,lastViewX,lastViewZ);
  };
  let lastPlayerX=6,lastPlayerZ=7,lastAltitude=0,lastViewX=6,lastViewZ=7;
  root.userData.windTime=windTime;root.userData.aerialView=aerialView;
  root.userData.update=(x,z,time,reduced=false,altitude=0,viewX=x,viewZ=z)=>{
    lastPlayerX=x;lastPlayerZ=z;lastAltitude=altitude;lastViewX=viewX;lastViewZ=viewZ;
    aerialView.value=THREE.MathUtils.smoothstep(altitude,10,45);
    for(const mesh of distant.children)mesh.visible=Math.hypot(mesh.userData.tileX-x,mesh.userData.tileZ-z)<800+500*aerialView.value;
    windTime.value=reduced?0:time;
    const cx=Math.floor((x+tileSize/2)/tileSize),cz=Math.floor((z+tileSize/2)/tileSize);
    if(cx!==lastX||cz!==lastZ){
      const immediate=!Number.isFinite(lastX)||Math.abs(cx-lastX)>1||Math.abs(cz-lastZ)>1;
      lastX=cx;lastZ=cz;
      const wanted=[];for(let dx=-3;dx<=3;dx++)for(let dz=-3;dz<=3;dz++)wanted.push({x:cx+dx,z:cz+dz});
      const reusable=tiles.filter(tile=>!wanted.some(p=>p.x===tile.x&&p.z===tile.z));
      for(const point of wanted){if(tiles.some(tile=>tile.x===point.x&&tile.z===point.z))continue;const tile=reusable.pop();beginTile(tile,point.x,point.z);if(immediate)fillBatch(tile);}
    }
    // The spare tile margin lets walking refills finish before they become visible.
    // Limit generation to 128 candidates per frame instead of seven full tiles.
    const pending=tiles.filter(tile=>tile.pending).reduce((best,tile)=>!best||Math.hypot(tile.x*tileSize-x,tile.z*tileSize-z)<Math.hypot(best.x*tileSize-x,best.z*tileSize-z)?tile:best,null);if(pending)fillBatch(pending,128);
    for(const tile of tiles){
      tile.mesh.visible=!tile.pending&&Math.hypot(tile.x*tileSize-x,tile.z*tileSize-z)<detailRadius;
      // Cull only detail already fully faded across the entire tile footprint.
      // A two-metre margin covers blade spread, wind and the previous camera frame.
      const nearest=Math.hypot(Math.max(0,Math.abs(tile.x*tileSize-viewX)-18),Math.max(0,Math.abs(tile.z*tileSize-viewZ)-18));
      tile.mesh.geometry=root.userData.quality==='high'&&nearest<tierFade.value.y+2?geometry:
        root.userData.quality!=='low'&&nearest<tierFade.value.w+2?(root.userData.quality==='high'?mediumGeometry:geometry):outerGeometry;
    }
    root.userData.pendingTiles=tiles.filter(tile=>tile.pending).length;
  };
  root.userData.update(6,7,0,true);
  return root;
}
