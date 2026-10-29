import * as THREE from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';

// A simple deck in the same soft white and gray as the explorer's suit.
export function createHoverboard(){
  const board=new THREE.Group();board.name='hoverboard';board.visible=false;
  const hull=new THREE.MeshStandardMaterial({color:0xabb3b4,roughness:.95});
  const deck=new THREE.MeshStandardMaterial({color:0xe9e7de,roughness:.7});
  const grip=new THREE.MeshStandardMaterial({color:0xb9b9ae,roughness:.96});
  const accent=new THREE.MeshStandardMaterial({color:0xc27842,roughness:.65});
  function add(geometry,material,x=0,y=0,z=0){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);board.add(mesh);return mesh;}
  const outline=new THREE.Shape();
  outline.moveTo(0,-.86);outline.bezierCurveTo(.20,-.86,.31,-.72,.32,-.51);
  outline.lineTo(.32,.48);outline.bezierCurveTo(.32,.69,.23,.8,0,.8);
  outline.bezierCurveTo(-.23,.8,-.32,.69,-.32,.48);outline.lineTo(-.32,-.51);
  outline.bezierCurveTo(-.31,-.72,-.20,-.86,0,-.86);
  const geometry=new THREE.ExtrudeGeometry(outline,{depth:.065,bevelEnabled:true,bevelThickness:.012,bevelSize:.014,bevelSegments:2,curveSegments:6});
  geometry.rotateX(Math.PI/2);geometry.translate(0,.0325,0);
  add(geometry,hull,0,-.063,0);
  add(new RoundedBoxGeometry(.49,.025,1.25,3,.055),deck,0,-.022,0);
  const pad=new RoundedBoxGeometry(.38,.012,.37,2,.035);
  add(pad,grip,0,-.003,-.31);add(pad,grip,0,-.003,.31);
  add(new RoundedBoxGeometry(.12,.009,.03,2,.01),accent,0,-.005,.61);
  for(const z of [-.4,.4]){const nozzle=new THREE.Object3D();nozzle.name='hoverboard-boost-nozzle';nozzle.position.set(0,-.11,z);board.add(nozzle);}
  return board;
}
