const colors={
 fernlilt:'#c9b875',rainselve:'#a5c78d',evrathen:'#91c9d2',vaelcren:'#c7bba4',ossamber:'#80c68b',ashqarin:'#e4a571',
 nacreloom:'#b6c5db',keltrond:'#dae3df',teshora:'#e8baae',hyskrum:'#a9d9e6',uloqai:'#73cec5',cirelune:'#c2bb7e',dorynth:'#ef9265',
};
export const earthDestinationColor=id=>colors[id]||'#d4c99d';

// Draw tiny, readable symbols; north remains up in both maps.
export function drawEarthDestinationIcon(ctx,id,x,y,size){
 const color=earthDestinationColor(id);ctx.save();ctx.translate(x,y);ctx.scale(size/20,size/20);
 ctx.beginPath();ctx.arc(0,0,9,0,Math.PI*2);ctx.fillStyle='#172421';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.stroke();
 ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.35;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();
 switch(id){
  case 'rainselve':ctx.moveTo(0,-6);ctx.lineTo(-5,2);ctx.lineTo(5,2);ctx.closePath();ctx.moveTo(0,2);ctx.lineTo(0,6);break;
  case 'ossamber':ctx.moveTo(-5,4);ctx.quadraticCurveTo(-5,-5,5,-6);ctx.quadraticCurveTo(5,3,-5,4);ctx.moveTo(-4,4);ctx.lineTo(3,-3);break;
  case 'evrathen':ctx.moveTo(-6,-2);ctx.quadraticCurveTo(-3,-4,0,-2);ctx.quadraticCurveTo(3,0,6,-2);ctx.moveTo(-6,3);ctx.quadraticCurveTo(-3,1,0,3);ctx.quadraticCurveTo(3,5,6,3);break;
  case 'vaelcren':ctx.moveTo(-6,4);ctx.lineTo(-2,-4);ctx.lineTo(1,1);ctx.lineTo(3,-2);ctx.lineTo(6,4);break;
  case 'keltrond':ctx.moveTo(-6,5);ctx.lineTo(0,-6);ctx.lineTo(6,5);ctx.moveTo(-2,-2);ctx.lineTo(0,0);ctx.lineTo(2,-2);break;
  case 'ashqarin':ctx.moveTo(-6,2);ctx.quadraticCurveTo(-2,-4,2,1);ctx.quadraticCurveTo(4,3,6,1);ctx.moveTo(-6,5);ctx.lineTo(6,5);break;
  case 'nacreloom':ctx.moveTo(-5,5);ctx.lineTo(-5,-1);ctx.lineTo(0,-6);ctx.lineTo(5,-1);ctx.lineTo(5,5);ctx.moveTo(-2,-3);ctx.lineTo(0,0);ctx.lineTo(2,-3);break;
  case 'teshora':ctx.moveTo(-6,4);ctx.quadraticCurveTo(-3,1,0,4);ctx.quadraticCurveTo(3,6,6,4);ctx.moveTo(-3,0);ctx.lineTo(1,-6);ctx.lineTo(4,0);break;
  case 'hyskrum':ctx.moveTo(-6,0);ctx.lineTo(6,0);ctx.moveTo(0,-6);ctx.lineTo(0,6);ctx.moveTo(-4,-4);ctx.lineTo(4,4);ctx.moveTo(4,-4);ctx.lineTo(-4,4);break;
  case 'uloqai':ctx.moveTo(-6,3);ctx.quadraticCurveTo(-3,0,0,3);ctx.quadraticCurveTo(3,6,6,3);ctx.moveTo(-2,-3);ctx.arc(-2,-3,2,0,Math.PI*2);break;
  case 'cirelune':ctx.moveTo(-4,5);ctx.lineTo(-4,-4);ctx.moveTo(0,5);ctx.lineTo(0,-6);ctx.moveTo(4,5);ctx.lineTo(4,-3);ctx.moveTo(-6,5);ctx.lineTo(6,5);break;
  case 'dorynth':ctx.moveTo(-6,5);ctx.lineTo(-2,-4);ctx.lineTo(0,-2);ctx.lineTo(2,-4);ctx.lineTo(6,5);ctx.moveTo(0,-4);ctx.lineTo(0,-7);break;
  default:ctx.moveTo(-5,5);ctx.lineTo(-2,-2);ctx.lineTo(0,3);ctx.lineTo(3,-5);ctx.lineTo(5,5);
 }
 ctx.stroke();ctx.restore();
}
