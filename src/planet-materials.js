import {TextureLoader,SRGBColorSpace,NoColorSpace} from 'three';

// Local Solar System Scope maps; attribution is shipped beside the assets.
const maps={sun:'sun',mercury:'mercury',venus:'venus_atmosphere',earth:'earth_daymap',moon:'moon',mars:'mars',jupiter:'jupiter',saturn:'saturn',uranus:'uranus',neptune:'neptune'};
const loader=new TextureLoader();
const textureLoads=[];

export async function waitForPlanetTextures(onProgress) {
  let completed=0;
  onProgress?.(completed,textureLoads.length);
  await Promise.all(textureLoads.map(ready=>ready.then(()=>{
    onProgress?.(++completed,textureLoads.length);
  })));
}

export function loadPlanetTexture(name,onLoad,{data=false,anisotropy=4}={}) {
  let complete;
  textureLoads.push(new Promise(resolve=>{complete=resolve;}));
  return loader.load(`${import.meta.env.BASE_URL}planet-textures/2k_${name}.jpg`,texture=>{
    try{
      texture.colorSpace=data?NoColorSpace:SRGBColorSpace;
      texture.anisotropy=anisotropy;
      onLoad(texture);
    }finally{complete();}
  },undefined,()=>{
    console.warn(`Planet texture ${name} unavailable; retaining the procedural surface.`);
    complete();
  });
}

export function applyPlanetSurface(mesh,id,onLoad) {
  if(!maps[id])return;
  loadPlanetTexture(maps[id],texture=>{
    const fallback=mesh.material.map;
    mesh.material.map=texture;
    // Albedo is not an elevation map. Keep relief subtle on bare rock only.
    if(['mercury','moon','mars'].includes(id)){
      const relief=texture.clone();relief.colorSpace=NoColorSpace;relief.needsUpdate=true;
      mesh.material.bumpMap=relief;
      mesh.material.bumpScale=mesh.geometry.parameters.radius*.003;
    }else mesh.material.bumpMap=null;
    mesh.material.needsUpdate=true;
    onLoad?.(texture.image);
    fallback?.dispose();
  });
}

export function applyEarthNightLights(mesh) {
  loadPlanetTexture('earth_nightmap',texture=>{
    mesh.material.emissive.set(0xffffff);
    mesh.material.emissiveMap=texture;
    mesh.material.emissiveIntensity=.65;
    mesh.material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
        varying vec3 surfaceWorldPosition;
        varying vec3 surfaceWorldNormal;`)
        .replace('#include <begin_vertex>',`#include <begin_vertex>
        surfaceWorldPosition=(modelMatrix*vec4(position,1.0)).xyz;
        surfaceWorldNormal=normalize(mat3(modelMatrix)*normal);`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying vec3 surfaceWorldPosition;
        varying vec3 surfaceWorldNormal;`)
        .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float solarFacing=dot(normalize(surfaceWorldNormal),normalize(-surfaceWorldPosition));
        totalEmissiveRadiance*=1.0-smoothstep(-0.2,0.08,solarFacing);`);
    };
    mesh.material.customProgramCacheKey=()=> 'earth-night-lights-v1';
    mesh.material.needsUpdate=true;
  });
}

export function applyRingShadow(material,planetCenter,radius) {
  // Analytical eclipse avoids a huge, low-resolution shadow map for the Sun.
  material.onBeforeCompile=shader=>{
    shader.uniforms.ringPlanetCenter={value:planetCenter};
    shader.uniforms.ringPlanetRadius={value:radius};
    shader.vertexShader=shader.vertexShader.replace('#include <common>',`#include <common>
      varying vec3 ringWorldPosition;`)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
      ringWorldPosition=(modelMatrix*vec4(position,1.0)).xyz;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      varying vec3 ringWorldPosition;
      uniform vec3 ringPlanetCenter;
      uniform float ringPlanetRadius;`)
      .replace('#include <opaque_fragment>',`
      vec3 lightDirection=normalize(-ringWorldPosition);
      vec3 relativePosition=ringWorldPosition-ringPlanetCenter;
      float alongRay=-dot(relativePosition,lightDirection);
      float closestDistance=length(relativePosition+lightDirection*max(0.0,alongRay));
      float eclipse=alongRay>0.0?1.0-smoothstep(ringPlanetRadius*.98,ringPlanetRadius*1.025,closestDistance):0.0;
      outgoingLight*=1.0-eclipse*.94;
      #include <opaque_fragment>`);
  };
  material.customProgramCacheKey=()=> 'ring-eclipse-v1';
}
