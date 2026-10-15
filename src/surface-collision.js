// Preproject visible mesh triangles once; vertical support queries need no render-time raycasts.
export function createSurfaceCollider(geometry,matrix,{climbable=true,radius}={}){
  const p=geometry.attributes.position,e=matrix.elements??matrix,vertices=[];
  let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity,minZ=Infinity,maxZ=-Infinity;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i),v={x:e[0]*x+e[4]*y+e[8]*z+e[12],y:e[1]*x+e[5]*y+e[9]*z+e[13],z:e[2]*x+e[6]*y+e[10]*z+e[14]};vertices.push(v);
    minX=Math.min(minX,v.x);maxX=Math.max(maxX,v.x);minY=Math.min(minY,v.y);maxY=Math.max(maxY,v.y);minZ=Math.min(minZ,v.z);maxZ=Math.max(maxZ,v.z);
  }
  const faces=[],index=geometry.index,count=index?index.count:p.count;
  for(let i=0;i<count;i+=3){const a=vertices[index?index.getX(i):i],b=vertices[index?index.getX(i+1):i+1],c=vertices[index?index.getX(i+2):i+2];const denominator=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);if(Math.abs(denominator)<1e-8)continue;faces.push({a,b,c,denominator});}
  return {x:(minX+maxX)/2,z:(minZ+maxZ)/2,radius:radius??Math.hypot(maxX-minX,maxZ-minZ)/2,baseY:minY,topY:maxY,climbable,
    contains(x,z,margin=.35){return x>=minX-margin&&x<=maxX+margin&&z>=minZ-margin&&z<=maxZ+margin;},
    spanAt(x,z){if(x<minX||x>maxX||z<minZ||z>maxZ)return null;let height=-Infinity,bottom=Infinity;
      for(const {a,b,c,denominator} of faces){const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/denominator,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/denominator,w=1-u-v;if(u>=-1e-7&&v>=-1e-7&&w>=-1e-7){const y=u*a.y+v*b.y+w*c.y;height=Math.max(height,y);bottom=Math.min(bottom,y);}}
      return Number.isFinite(height)?{top:height,bottom}:null;
    },topAt(x,z){return this.spanAt(x,z)?.top??null;}};
}
export function containsCollider(o,x,z,margin=.35){return o.contains?o.contains(x,z,margin):Math.hypot(x-o.x,z-o.z)<o.radius+margin;}
export function supportAt(x,z,ceiling,obstacles,terrainHeight,currentSupport=null){
  let height=terrainHeight(x,z),support=null;
  for(const o of obstacles){if(!o.climbable||!containsCollider(o,x,z,0))continue;const y=o.topAt?o.topAt(x,z):o.topY;if(!Number.isFinite(y))continue;if(y>height&&y<=ceiling+(o===currentSupport ? .18 : 0)){height=y;support=o;}}
  return {height,support};
}
