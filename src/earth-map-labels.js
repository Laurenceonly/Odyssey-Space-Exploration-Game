// Keep location names legible when the complete region fits into a small map.
export function layoutEarthMapLabels(items,width,height,ratio=1,reserved=[]){
 const placed=reserved.slice(),result=[];
 const overlaps=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 for(const item of [...items].sort((a,b)=>a.y-b.y)){
  const w=Math.min(width-8*ratio,item.width),h=15*ratio;
  const preferred=item.x>width/2+12*ratio?item.x+11*ratio:item.x<width/2-12*ratio?item.x-w-11*ratio:item.x-w/2;
  const left=Math.max(4*ratio,Math.min(width-w-4*ratio,preferred));
  const base=item.y-12*ratio,step=16*ratio;
  let choice=null;
  for(let n=0;n<18;n++){
   const offset=n===0?0:(n%2?-1:1)*Math.ceil(n/2)*step;
   const baseline=Math.max(h,Math.min(height-4*ratio,base+offset));
   const box={left:left-3*ratio,right:left+w+3*ratio,top:baseline-h,bottom:baseline+3*ratio};
   if(!placed.some(other=>overlaps(box,other))){choice={...item,left,baseline,box};break;}
  }
  if(!choice)choice={...item,left,baseline:Math.max(h,Math.min(height-4*ratio,base)),box:{left,top:base-h,right:left+w,bottom:base+3*ratio}};
  placed.push(choice.box);result.push(choice);
 }
 return result;
}
