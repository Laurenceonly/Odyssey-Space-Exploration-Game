// Fit a destination inside the largest space left by the guide panels and flight HUD.
export function previewRegion(width,height,panels=[]){
  let regions=[{left:24,top:88,right:width-24,bottom:Math.max(160,height-230)}];
  for(const p of panels){
    const cuts=[];
    for(const r of regions){
      if(p.right<=r.left||p.left>=r.right||p.bottom<=r.top||p.top>=r.bottom){cuts.push(r);continue;}
      cuts.push({...r,right:p.left-20},{...r,left:p.right+20},{...r,bottom:p.top-20},{...r,top:p.bottom+20});
    }
    regions=cuts.filter(r=>r.right-r.left>40&&r.bottom-r.top>40);
  }
  return regions.sort((a,b)=>(b.right-b.left)*(b.bottom-b.top)-(a.right-a.left)*(a.bottom-a.top))[0]??{left:24,top:88,right:width-24,bottom:height-88};
}
export function previewDistance(radius,extent,region,width,height,fov=53){
  const tangent=Math.tan(fov*Math.PI/360);
  const fit=.88*Math.min((region.right-region.left)/height,(region.bottom-region.top)/height)*tangent;
  return radius*extent/Math.sin(Math.atan(fit));
}
