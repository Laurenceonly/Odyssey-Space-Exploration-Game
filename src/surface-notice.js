// Events display once; repeated frame updates never extend their lifetime.
export function createSurfaceNotice(){
 let previous=null,message='',until=0;
 return {
  reset(){previous=null;message='';until=0;},
  update(now,key,text,duration=3,override=''){
   if(key!==previous){previous=key;if(text){message=text;until=now+duration;}}
   return override||(now<until?message:'');
  },
 };
}
