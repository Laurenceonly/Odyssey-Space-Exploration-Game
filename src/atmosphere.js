import {Color,Mesh,ShaderMaterial,SphereGeometry,BackSide,AdditiveBlending} from 'three';

export function createAtmosphere(radius,color,density=.55) {
  return new Mesh(new SphereGeometry(radius*1.035,48,32),new ShaderMaterial({
    uniforms:{tint:{value:new Color(color)},density:{value:density}},
    vertexShader:`
      varying vec3 worldPosition;
      varying vec3 worldNormal;
      void main(){
        vec4 world=modelMatrix*vec4(position,1.0);
        worldPosition=world.xyz;
        worldNormal=normalize(mat3(modelMatrix)*normal);
        gl_Position=projectionMatrix*viewMatrix*world;
      }`,
    fragmentShader:`
      uniform vec3 tint;
      uniform float density;
      varying vec3 worldPosition;
      varying vec3 worldNormal;
      void main(){
        vec3 normal=normalize(worldNormal);
        vec3 viewDirection=normalize(cameraPosition-worldPosition);
        float rim=pow(1.0-abs(dot(normal,viewDirection)),3.5);
        float daylight=smoothstep(-0.18,0.45,dot(normal,normalize(-worldPosition)));
        gl_FragColor=vec4(tint,rim*density*(0.08+daylight*0.92));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side:BackSide,transparent:true,depthWrite:false,blending:AdditiveBlending,
  }));
}
