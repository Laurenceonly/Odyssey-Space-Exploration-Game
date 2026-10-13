import { isUnsupportedMobile } from './device-support.js';

const mobile=isUnsupportedMobile({
  userAgent:navigator.userAgent,
  maxTouchPoints:navigator.maxTouchPoints,
  coarsePointer:matchMedia('(pointer: coarse)').matches,
  finePointer:matchMedia('(any-pointer: fine)').matches,
});

if(mobile){
  document.querySelector('#desktopNotice').hidden=false;
}else{
  document.querySelector('#app').hidden=false;
  import('./main.js').catch(error=>{
    console.error('Unable to load Odyssey',error);
    document.querySelector('#loadingStatus').textContent='Unable to load the game. Refresh to retry.';
    document.querySelector('#loadingProgress').hidden=true;
  });
}
