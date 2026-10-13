import test from'node:test';import assert from'node:assert/strict';import{isUnsupportedMobile}from'../src/device-support.js';
test('phones and Android tablets show the desktop notice',()=>{for(const userAgent of ['Mozilla/5.0 (iPhone)','Mozilla/5.0 (Linux; Android 15; Pixel)','Mozilla/5.0 (Linux; Android 15; Tablet)'])assert.equal(isUnsupportedMobile({userAgent,maxTouchPoints:5,coarsePointer:true}),true);});
test('iPad desktop-browser mode remains unsupported',()=>assert.equal(isUnsupportedMobile({userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X)',maxTouchPoints:5,finePointer:true}),true));
test('desktop windows are supported regardless of viewport size',()=>assert.equal(isUnsupportedMobile({userAgent:'Mozilla/5.0 (Windows NT 10.0)',maxTouchPoints:0,finePointer:true,viewportWidth:320}),false));
test('touchscreen laptops with a mouse are supported',()=>assert.equal(isUnsupportedMobile({userAgent:'Mozilla/5.0 (Windows NT 10.0)',maxTouchPoints:10,coarsePointer:true,finePointer:true}),false));
test('touch-only tablets are unsupported without guessing from screen size',()=>assert.equal(isUnsupportedMobile({userAgent:'Tablet browser',maxTouchPoints:5,coarsePointer:true,finePointer:false}),true));
test('ordinary macOS desktops are supported',()=>assert.equal(isUnsupportedMobile({userAgent:'Mozilla/5.0 (Macintosh)',maxTouchPoints:0,finePointer:true}),false));
