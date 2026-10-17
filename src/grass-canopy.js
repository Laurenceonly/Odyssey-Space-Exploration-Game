// Project the actual blade mesh into four inexpensive distant silhouettes.
// The distant canopy inherits the same roots, tips, and shading as close grass.
export function bakeGrassCanopy(geometry,size=128){
 const position=geometry.attributes.position,color=geometry.attributes.color,index=geometry.index;
 const views=4,width=size*views,height=size,pixels=new Uint8Array(width*height*4),masks=new Uint8Array(width*height);
 let halfWidth=.1,top=.1;
 for(let view=0;view<views;view++){const angle=view*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle);for(let i=0;i<position.count;i++){halfWidth=Math.max(halfWidth,Math.abs(position.getX(i)*c+position.getZ(i)*s));top=Math.max(top,position.getY(i));}}
 halfWidth*=1.04;top*=1.02;
 for(let i=0;i<pixels.length;i+=4)pixels[i]=pixels[i+1]=pixels[i+2]=255;
 const samples=[[.25,.25],[.75,.25],[.25,.75],[.75,.75]];
 for(let view=0;view<views;view++){
  const angle=view*Math.PI/4,c=Math.cos(angle),s=Math.sin(angle);
  const projected=Array.from({length:position.count},(_,i)=>({x:((position.getX(i)*c+position.getZ(i)*s)/(halfWidth*2)+.5)*size,y:position.getY(i)/top*size,shade:color?.getX(i)??1}));
  for(let i=0;i<index.count;i+=3){
   const a=projected[index.getX(i)],b=projected[index.getX(i+1)],d=projected[index.getX(i+2)];
   const area=(b.y-d.y)*(a.x-d.x)+(d.x-b.x)*(a.y-d.y);if(Math.abs(area)<1e-8)continue;
   const minX=Math.max(0,Math.floor(Math.min(a.x,b.x,d.x))),maxX=Math.min(size-1,Math.ceil(Math.max(a.x,b.x,d.x)));
   const minY=Math.max(0,Math.floor(Math.min(a.y,b.y,d.y))),maxY=Math.min(size-1,Math.ceil(Math.max(a.y,b.y,d.y)));
   for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
    let mask=0,shade=0,count=0;
    for(let n=0;n<samples.length;n++){
     const px=x+samples[n][0],py=y+samples[n][1];
     const u=((b.y-d.y)*(px-d.x)+(d.x-b.x)*(py-d.y))/area,v=((d.y-a.y)*(px-d.x)+(a.x-d.x)*(py-d.y))/area,w=1-u-v;
     if(u>=0&&v>=0&&w>=0){mask|=1<<n;shade+=u*a.shade+v*b.shade+w*d.shade;count++;}
    }
    if(!mask)continue;const pixel=y*width+view*size+x,offset=pixel*4;const previous=masks[pixel];masks[pixel]|=mask;
    const value=Math.round(255*shade/count);if(!previous||value>pixels[offset])pixels[offset]=pixels[offset+1]=pixels[offset+2]=value;
   }
  }
 }
 for(let i=0;i<masks.length;i++){let count=0;for(let bit=0;bit<4;bit++)if(masks[i]&(1<<bit))count++;pixels[i*4+3]=Math.round(count/4*255);}
 return {pixels,width,height,halfWidth,top,views};
}
