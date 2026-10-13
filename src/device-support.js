// Viewport size alone never decides whether a desktop can play.
export function isUnsupportedMobile({userAgent='',maxTouchPoints=0,coarsePointer=false,finePointer=false}={}) {
  return /Android|iPhone|iPad|iPod|Windows Phone|Mobi/i.test(userAgent)
    ||(/Macintosh/i.test(userAgent)&&maxTouchPoints>1)
    ||(maxTouchPoints>0&&coarsePointer&&!finePointer);
}
