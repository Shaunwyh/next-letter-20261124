import * as THREE from './vendor/three.module.js';
import './castle-clock.js?v=castle-18';
import {createTheatre} from './castle-theatre.js?v=castle-18';
const canvas=document.getElementById('cake-canvas'),host=canvas.parentElement;
const theatre=createTheatre(host);
theatre.init();
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){console.warn('3D scene unavailable',e);}
if(!renderer)theatre.enableFallback();
if(renderer){
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-2,2,2,-2,.1,40);camera.position.set(1.5,2.4,9);camera.lookAt(0,1.0,0);
const studio=new THREE.Scene();studio.background=new THREE.Color('#e8d5bd');
for(const [x,y,z,s,c] of [[-6,5,3,7,'#fff9ec'],[5,3,-2,5,'#e2baa0'],[0,8,0,9,'#fffefa']]){const p=new THREE.Mesh(new THREE.SphereGeometry(s,12,12),new THREE.MeshBasicMaterial({color:c,side:THREE.BackSide}));p.position.set(x,y,z);studio.add(p);}
const pmrem=new THREE.PMREMGenerator(renderer),env=pmrem.fromScene(studio,.025).texture;scene.environment=env;
const ambient=new THREE.HemisphereLight('#fff5df','#94745e',1.05);scene.add(ambient);
const key=new THREE.DirectionalLight('#fff3dc',2.3);key.position.set(-3,6,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-4;key.shadow.normalBias=.025;key.shadow.bias=-.0005;key.shadow.radius=5;scene.add(key);
const rim=new THREE.DirectionalLight('#f5c8b0',1.1);rim.position.set(3,3,-4);scene.add(rim);
const material=(color,roughness=.43,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const cream=material('#eeddc4',.43),sponge=material('#dfb78c',.62),rose=material('#ca7966',.39),pink=material('#ead0ba',.49),gold=material('#c3a168',.25,.65),windowMat=material('#83684a',.4),green=material('#67794e',.56);
const castleWindows=[];
const cake=new THREE.Group();scene.add(cake);cake.position.y=.05;
function mesh(geo,mat,x=0,y=0,z=0,parent=cake){const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cylinder(r,h,y,mat,x=0,z=0){return mesh(new THREE.CylinderGeometry(r,r,h,64,1),mat,x,y,z);}
function sphere(r,x,y,z,mat,scale=[1,1,1]){const m=mesh(new THREE.SphereGeometry(r,20,16),mat,x,y,z);m.scale.set(...scale);return m;}
function ring(radius,tube,y,mat,x=0,z=0){const m=mesh(new THREE.TorusGeometry(radius,tube,10,80),mat,x,y,z);m.rotation.x=Math.PI/2;return m;}
function roundLayer(r,h,y,mat){const pts=[];const b=.055;pts.push(new THREE.Vector2(0,-h/2));pts.push(new THREE.Vector2(r-b,-h/2));for(let i=0;i<=8;i++){const a=-Math.PI/2+i/8*Math.PI/2;pts.push(new THREE.Vector2(r-b+b*Math.cos(a),-h/2+b+b*Math.sin(a)));}pts.push(new THREE.Vector2(r,h/2-b));for(let i=0;i<=8;i++){const a=i/8*Math.PI/2;pts.push(new THREE.Vector2(r-b+b*Math.cos(a),h/2-b+b*Math.sin(a)));}pts.push(new THREE.Vector2(0,h/2));return mesh(new THREE.LatheGeometry(pts,80),mat,0,y);}
roundLayer(1.54,.11,.07,gold);roundLayer(1.43,.08,.16,cream);
roundLayer(1.22,.55,.475,sponge);roundLayer(1.25,.10,.24,cream);roundLayer(1.25,.12,.72,cream);ring(1.23,.022,.47,rose);
roundLayer(.85,.61,1.075,pink);roundLayer(.88,.13,1.35,cream);ring(.855,.025,.87,gold);
roundLayer(.48,.39,1.59,cream);roundLayer(.50,.07,1.795,cream);
for(const [r,y,n,size] of [[1.22,.785,40,.048],[.84,1.427,32,.04],[.47,1.84,24,.034],[1.25,.28,44,.037]])for(let i=0;i<n;i++){const a=i/n*Math.PI*2;sphere(size,r*Math.cos(a),y,r*Math.sin(a),cream,[1,.83,1]);}
for(let i=0;i<17;i++){const a=i/17*Math.PI*2,y=.65-(i%3)*.026;const m=sphere(.065,1.248*Math.cos(a),y,1.248*Math.sin(a),cream,[.7,1.6,.65]);m.rotation.z=Math.sin(a)*.1;}
function tower(x,z,h){const y=.77;const r=.205;cylinder(r,h,y+h/2,cream,x,z);ring(r,.033,y+h,cream,x,z);ring(r,.021,y+.13,gold,x,z);const roof=mesh(new THREE.ConeGeometry(.28,.44,64),rose,x,y+h+.22,z);roof.geometry.computeVertexNormals();sphere(.035,x,y+h+.48,z,gold);const arch=new THREE.Shape();arch.moveTo(-.047,0);arch.lineTo(-.047,.1);arch.absarc(0,.1,.047,Math.PI,0,true);arch.lineTo(.047,0);const win=mesh(new THREE.ShapeGeometry(arch),windowMat,x,y+h*.48,z+.205);win.material=windowMat.clone();win.material.emissive.set('#ffcf83');castleWindows.push(win);win.rotation.y=Math.atan2(x,z)*.4;for(let i=0;i<12;i++){const a=i/12*Math.PI*2;sphere(.023,x+.2*Math.cos(a),y+h-.027,z+.2*Math.sin(a),cream);}}
tower(-.89,.45,.85);tower(.94,.12,1.04);tower(-.30,-.89,1.1);
function strawberry(x,y,z,scale=1){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);cake.add(g);const berry=new THREE.Mesh(new THREE.SphereGeometry(.15,24,24),rose);berry.scale.set(.85,1.3,.85);berry.rotation.z=.15;berry.castShadow=true;g.add(berry);for(let i=0;i<22;i++){const a=i*2.39996,b=Math.acos(1-2*(i+.5)/22);const seed=new THREE.Mesh(new THREE.SphereGeometry(.006,6,4),gold);seed.position.set(.13*Math.sin(b)*Math.cos(a),.194*Math.cos(b),.13*Math.sin(b)*Math.sin(a));seed.scale.y=1.5;g.add(seed);}for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.065,12,8),green);leaf.scale.set(.35,.12,1);leaf.position.y=.17;leaf.rotation.y=i/5*Math.PI*2;leaf.rotation.x=.4;g.add(leaf);}return g;}
const topBerry=strawberry(0,2.025,0,1.05);strawberry(.54,1.51,.40,.8);strawberry(-.53,1.5,.27,.76);strawberry(.45,.89,-.98,.7);
for(let i=0;i<7;i++){const a=i/7*Math.PI*2;sphere(.055,.57*Math.cos(a),1.47,.57*Math.sin(a),cream,[1,1.2,1]);}
const archShape=new THREE.Shape();archShape.moveTo(-.16,0);archShape.lineTo(-.16,.22);archShape.absarc(0,.22,.16,Math.PI,0,true);archShape.lineTo(.16,0);const doorway=mesh(new THREE.ShapeGeometry(archShape),windowMat,0,.30,1.235);doorway.rotation.x=-.02;
const doorHinge=new THREE.Group();doorHinge.position.set(-.16,.30,1.244);cake.add(doorHinge);
const doorMat=material('#a2714e',.54),doorLeaf=new THREE.Mesh(new THREE.ShapeGeometry(archShape),doorMat);doorLeaf.position.x=.16;doorLeaf.castShadow=true;doorHinge.add(doorLeaf);
const doorKnob=new THREE.Mesh(new THREE.SphereGeometry(.021,12,8),gold);doorKnob.position.set(.25,.17,.015);doorHinge.add(doorKnob);
const shadow=new THREE.Mesh(new THREE.PlaneGeometry(20,20),new THREE.ShadowMaterial({opacity:.07}));shadow.rotation.x=-Math.PI/2;shadow.position.y=-.015;shadow.receiveShadow=true;scene.add(shadow);
// Bake the static cake pieces into one draw per material for mobile GPUs.
function bakeStaticGroup(group){
  group.updateMatrixWorld(true);const inverse=group.matrixWorld.clone().invert(),materials=new Map(),originals=new Set();
  group.traverse(node=>{if(!node.isMesh)return;const geo=node.geometry.index?node.geometry.toNonIndexed():node.geometry.clone();geo.applyMatrix4(inverse.clone().multiply(node.matrixWorld));if(!materials.has(node.material))materials.set(node.material,[]);materials.get(node.material).push(geo);originals.add(node.geometry);});
  group.clear();
  for(const [mat,geometries] of materials){const count=geometries.reduce((sum,g)=>sum+g.attributes.position.count,0),positions=new Float32Array(count*3),normals=new Float32Array(count*3);let offset=0;
    for(const geo of geometries){positions.set(geo.attributes.position.array,offset);normals.set(geo.attributes.normal.array,offset);offset+=geo.attributes.position.array.length;geo.dispose();}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.BufferAttribute(normals,3));const merged=new THREE.Mesh(geo,mat);merged.castShadow=true;merged.receiveShadow=true;group.add(merged);
  }
  originals.forEach(geo=>geo.dispose());
}
const liveProps=[...castleWindows,doorHinge,topBerry];
for(const prop of liveProps)cake.remove(prop);
bakeStaticGroup(cake);
for(const prop of liveProps)cake.add(prop);
bakeStaticGroup(topBerry);
// A porcelain miniature princess shares the stage with the cake.
cake.scale.setScalar(.64);cake.position.set(-.97,.025,-.40);
const princess=new THREE.Group();scene.add(princess);princess.position.set(.43,.04,.44);princess.rotation.y=.16;princess.scale.setScalar(1.04);
const skin=material('#d29b77',.65),hair=material('#55382b',.48),gown=material('#ba7c70',.48),blouse=material('#f5e6cd',.42),cheek=material('#d89282',.65),eyeMat=material('#4b3329',.56);
skin.envMapIntensity=.45;blouse.envMapIntensity=.65;
function piece(geo,mat,x,y,z,parent=princess,scale=[1,1,1]){const m=mesh(geo,mat,x,y,z,parent);m.scale.set(...scale);return m;}
function ball(r,mat,x,y,z,parent=princess,scale=[1,1,1]){return piece(new THREE.SphereGeometry(r,24,20),mat,x,y,z,parent,scale);}
function hoop(r,tube,mat,x,y,z,parent=princess){const m=piece(new THREE.TorusGeometry(r,tube,10,56),mat,x,y,z,parent);m.rotation.x=Math.PI/2;return m;}
const gownPoints=[[0,0],[.35,0],[.41,.07],[.35,.2],[.29,.45],[.2,.72],[.14,.81],[0,.82]].map(p=>new THREE.Vector2(...p));
const skirt=piece(new THREE.LatheGeometry(gownPoints,64),gown,0,.22,0);hoop(.39,.012,gold,0,.29,0);
for(let i=0;i<10;i++){const a=i/10*Math.PI*2;ball(.018,gold,.355*Math.cos(a),.38,.355*Math.sin(a));}
ball(.19,blouse,0,1.04,0,princess,[1,1.21,.83]);hoop(.153,.015,gold,0,.98,0);
piece(new THREE.CylinderGeometry(.072,.072,.12,24),skin,0,1.29,0);
ball(.065,gold,-.13,.14,.1,princess,[1.15,.65,1.6]);ball(.065,gold,.13,.14,.1,princess,[1.15,.65,1.6]);
const head=new THREE.Group();head.position.set(0,1.60,.02);princess.add(head);
ball(.345,skin,0,0,0,head,[1,1.04,.97]);ball(.35,hair,0,-.05,-.17,head,[1.06,1.27,.68]);
piece(new THREE.SphereGeometry(.356,32,24,0,Math.PI*2,0,1.43),hair,0,.004,-.015,head,[1,1.025,1]);
const fringe=ball(.16,hair,-.15,.205,.19,head,[1.22,.55,.68]);fringe.rotation.z=-.3;
ball(.115,hair,-.31,-.025,-.025,head,[.55,1.5,.75]);ball(.115,hair,.31,-.025,-.025,head,[.55,1.5,.75]);
for(const x of [-.12,.12])ball(.045,cheek,x*1.40,-.09,.285,head,[1,.58,.14]);
const eyes=new THREE.Group();head.add(eyes);ball(.023,eyeMat,-.11,-.008,.325,eyes,[.76,1.18,.45]);ball(.023,eyeMat,.11,-.008,.325,eyes,[.76,1.18,.45]);for(const x of [-.11,.11])ball(.006,blouse,x-.005,.002,.338,eyes);
const sleepyEyes=new THREE.Group();head.add(sleepyEyes);sleepyEyes.visible=false;
for(const x of [-.11,.11]){const points=[new THREE.Vector3(x-.028,-.005,.326),new THREE.Vector3(x,-.018,.332),new THREE.Vector3(x+.028,-.005,.326)];piece(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),10,.0055,6,false),eyeMat,0,0,0,sleepyEyes);}
ball(.019,skin,0,-.05,.34,head,[.75,1,1]);
const mouth=new THREE.Group();head.add(mouth);
const smile=new THREE.CatmullRomCurve3([new THREE.Vector3(-.03,-.121,.302),new THREE.Vector3(0,-.133,.314),new THREE.Vector3(.03,-.121,.302)]);piece(new THREE.TubeGeometry(smile,14,.006,6,false),rose,0,0,0,mouth);
const openMouth=ball(.025,rose,0,-.125,.315,head,[.65,1,.2]);openMouth.visible=false;
const crown=new THREE.Group();head.add(crown);crown.position.set(0,.332,-.01);
piece(new THREE.CylinderGeometry(.195,.165,.075,40,1,true),gold,0,.012,0,crown);hoop(.184,.012,gold,0,.05,0,crown);
for(let i=0;i<5;i++){const a=i/5*Math.PI*2;piece(new THREE.ConeGeometry(.041,.13,8),gold,.17*Math.cos(a),.10,.17*Math.sin(a),crown);ball(.019,gold,.17*Math.cos(a),.169,.17*Math.sin(a),crown);}
ball(.025,rose,0,.04,.172,crown,[1,1.15,.45]);
const leftArm=new THREE.Group(),rightArm=new THREE.Group();princess.add(leftArm,rightArm);leftArm.position.set(-.185,1.20,0);rightArm.position.set(.185,1.20,0);leftArm.rotation.z=-.37;rightArm.rotation.z=.37;
const forearms=[];
for(const arm of [leftArm,rightArm]){
  ball(.073,blouse,0,-.04,0,arm,[1,1.2,1]);piece(new THREE.CapsuleGeometry(.047,.13,6,12),skin,0,-.14,0,arm);
  const forearm=new THREE.Group();forearm.position.y=-.235;arm.add(forearm);forearms.push(forearm);
  piece(new THREE.CapsuleGeometry(.044,.12,6,12),skin,0,-.095,0,forearm);ball(.058,skin,0,-.206,0,forearm,[1,1.14,.85]);
}

// A small cream-and-caramel cat sits in the foreground beside the princess.
const cat=new THREE.Group();scene.add(cat);cat.position.set(1.30,.035,1.06);cat.scale.setScalar(1.10);cat.rotation.y=.16;
const fur=material('#ddb588',.59),furLight=material('#f3e3c8',.56),earPink=material('#ce9184',.63),whiskerMat=material('#9b795c',.66);
const catBody=new THREE.Group();cat.add(catBody);
ball(.27,fur,0,.35,0,catBody,[.88,1.27,.85]);
ball(.22,furLight,0,.36,.17,catBody,[.68,1.14,.35]);
for(const x of [-.17,.17]){ball(.17,fur,x,.19,-.03,catBody,[.8,.88,1.1]);ball(.081,furLight,x,.055,.10,catBody,[1,.66,1.5]);}
piece(new THREE.CapsuleGeometry(.049,.21,5,10),furLight,-.10,.19,.23,catBody);ball(.073,furLight,-.10,.047,.26,catBody,[1,.68,1.15]);
const catPaw=new THREE.Group();cat.add(catPaw);catPaw.position.set(.11,.30,.23);
piece(new THREE.CapsuleGeometry(.049,.16,5,10),furLight,0,-.11,0,catPaw);ball(.073,furLight,0,-.244,.018,catPaw,[1,.68,1.15]);
const catHead=new THREE.Group();catHead.position.set(0,.76,.045);cat.add(catHead);
ball(.27,furLight,0,0,0,catHead,[1.08,.93,.94]);
ball(.17,fur,-.095,.112,-.075,catHead,[1.10,.76,.78]);
const catEars=[];
for(const x of [-.18,.18]){
  const ear=new THREE.Group();ear.position.set(x,.16,-.01);catHead.add(ear);catEars.push(ear);
  const shape=new THREE.Shape();shape.moveTo(-.092,0);shape.quadraticCurveTo(-.07,.10,0,.18);shape.quadraticCurveTo(.07,.10,.092,0);shape.closePath();
  piece(new THREE.ExtrudeGeometry(shape,{depth:.085,steps:1,bevelEnabled:true,bevelSize:.018,bevelThickness:.014,bevelSegments:3}),fur,0,0,0,ear);
  piece(new THREE.ShapeGeometry(shape),earPink,0,.025,.104,ear,[.58,.60,1]);
}
const catEyes=new THREE.Group();catHead.add(catEyes);
for(const x of [-.095,.095]){ball(.026,eyeMat,x,-.013,.24,catEyes,[.74,1.35,.45]);ball(.007,furLight,x-.006,.001,.253,catEyes);}
const catSleepEyes=new THREE.Group();catHead.add(catSleepEyes);catSleepEyes.visible=false;
for(const x of [-.095,.095]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(x-.035,-.008,.242),new THREE.Vector3(x,-.024,.255),new THREE.Vector3(x+.035,-.008,.242)]);piece(new THREE.TubeGeometry(curve,10,.007,5,false),eyeMat,0,0,0,catSleepEyes);}
for(const x of [-.04,.04])ball(.055,fur,x,-.096,.238,catHead,[1,.80,.65]);
ball(.018,earPink,0,-.071,.282,catHead,[1,.7,.65]);
for(const side of [-1,1]){
  ball(.038,earPink,side*.16,-.08,.211,catHead,[1,.48,.18]);
  for(const lift of [-.02,.025]){const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(side*.09,-.10,.256),new THREE.Vector3(side*.19,-.10+lift,.242),new THREE.Vector3(side*.27,-.095+lift,.211)]);piece(new THREE.TubeGeometry(curve,8,.004,4,false),whiskerMat,0,0,0,catHead);}
}
hoop(.178,.017,gold,0,.578,0,catBody);ball(.036,gold,0,.545,.235,catBody);
const milk=material('#fffaf0',.25);milk.envMapIntensity=.6;
const creamMoustache=new THREE.Group();catHead.add(creamMoustache);creamMoustache.visible=false;
for(const [x,y,r] of [[-.048,-.09,.038],[.023,-.12,.026],[.076,-.084,.019]])ball(r,milk,x,y,.286,creamMoustache,[1,.54,.3]);
const catMouth=ball(.018,eyeMat,0,-.139,.278,catHead,[.7,.75,.22]);
const catTail=new THREE.Group();catTail.position.set(-.21,.11,-.14);cat.add(catTail);
const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(-.19,.06,0),new THREE.Vector3(-.34,.26,.02),new THREE.Vector3(-.30,.48,.03),new THREE.Vector3(-.17,.64,.04),new THREE.Vector3(-.04,.57,.04)]);
piece(new THREE.TubeGeometry(tailCurve,32,.047,9,false),fur,0,0,0,catTail);ball(.05,furLight,-.04,.57,.04,catTail);

// Merge static parts while preserving each animated joint and expression.
function bakeAroundJoints(parent,joints){const fixed=new THREE.Group();for(const child of [...parent.children])if(!joints.includes(child))fixed.add(child);parent.add(fixed);bakeStaticGroup(fixed);}
bakeAroundJoints(princess,[head,leftArm,rightArm]);bakeAroundJoints(head,[eyes,sleepyEyes,mouth,openMouth]);bakeStaticGroup(mouth);for(const arm of [leftArm,rightArm]){bakeAroundJoints(arm,[...forearms]);}for(const arm of forearms)bakeStaticGroup(arm);
bakeAroundJoints(cat,[catHead,catTail,catPaw,catBody]);bakeStaticGroup(catBody);bakeAroundJoints(catHead,[catEyes,catSleepEyes,creamMoustache,catMouth,...catEars]);bakeStaticGroup(creamMoustache);bakeStaticGroup(catTail);bakeStaticGroup(catPaw);

// Story props stay separate from the baked scenery.
const tray=new THREE.Group();scene.add(tray);tray.position.set(-.1,.13,1.13);
piece(new THREE.CylinderGeometry(.25,.25,.027,40),cream,0,0,0,tray,[1,1,.8]);hoop(.235,.009,gold,0,.018,0,tray);
piece(new THREE.CylinderGeometry(.13,.13,.18,3),sponge,0,.11,0,tray);piece(new THREE.CylinderGeometry(.135,.135,.035,3),blouse,0,.21,0,tray);
ball(.042,rose,0,.263,0,tray,[1,1.2,1]);bakeStaticGroup(tray);
const book=new THREE.Group();princess.add(book);book.position.set(0,1.03,.35);book.rotation.x=-.5;
for(const side of [-1,1]){const page=new THREE.Group();book.add(page);page.rotation.y=side*.32;piece(new THREE.BoxGeometry(.20,.26,.035),green,side*.10,0,0,page);piece(new THREE.BoxGeometry(.187,.24,.022),cream,side*.10,0,.028,page);for(let i=0;i<4;i++)piece(new THREE.BoxGeometry(.12,.005,.002),gold,side*.10,.07-i*.035,.041,page);}
bakeStaticGroup(book);
const flowers=new THREE.Group();scene.add(flowers);flowers.position.set(-1.17,.02,1.04);
piece(new THREE.CylinderGeometry(.13,.09,.16,24),rose,0,.09,0,flowers);hoop(.132,.013,cream,0,.17,0,flowers);
for(let i=0;i<3;i++){const stem=new THREE.Group();flowers.add(stem);stem.position.set((i-1)*.09,0,(i%2)*.055);piece(new THREE.CylinderGeometry(.009,.009,.24+i*.025,8),green,0,.30,0,stem);for(let j=0;j<5;j++){const a=j/5*Math.PI*2;ball(.036,pink,Math.cos(a)*.039,.435+i*.025+Math.sin(a)*.039,0,stem,[1,1,.32]);}ball(.021,gold,0,.435+i*.025,.018,stem);}
bakeStaticGroup(flowers);

// A thin porcelain-and-gold stage ties the three characters together.
const platform=piece(new THREE.CylinderGeometry(2.22,2.25,.055,96),pink,0,-.025,0,scene,[1,1,.68]);platform.castShadow=false;
const platformRim=piece(new THREE.TorusGeometry(2.24,.017,8,96),gold,0,-.027,0,scene,[1,.68,1]);platformRim.rotation.x=Math.PI/2;platformRim.castShadow=false;
const sparkleMaterial=new THREE.MeshStandardMaterial({color:'#e9c891',roughness:.27,metalness:.35,emissive:'#b4925b',emissiveIntensity:.10,transparent:true});
function starGeometry(){const shape=new THREE.Shape(),n=8;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=i%2===0?.077:.018;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();return new THREE.ShapeGeometry(shape);}
const starGeo=starGeometry(),stars=[];
for(let i=0;i<12;i++){const mat=sparkleMaterial.clone();const star=piece(starGeo,mat,0,0,0,scene);star.castShadow=false;star.receiveShadow=false;stars.push(star);}
const wanderingStar=piece(starGeo,sparkleMaterial.clone(),0,0,0,scene);wanderingStar.castShadow=false;
let pointer={x:0,y:0},time=0,last=0,visible=true,raf=null,bedtime=host.dataset.bedtime==='true',lastDraw=0,renderLost=false;
let currentPose='read',poseTime=0;
const princessButton=document.getElementById('scene-princess'),catButton=document.getElementById('scene-cat');
const bubble=document.getElementById('scene-dialogue');
const projected=new THREE.Vector3();
const damp=(value,target,dt)=>reduced.matches?target:THREE.MathUtils.damp(value,target,9,dt||.016);
function toScreen(x,y,z,object){projected.set(x,y,z);object.localToWorld(projected);projected.project(camera);return {x:(projected.x*.5+.5)*host.clientWidth,y:(-.5*projected.y+.5)*host.clientHeight};}
function anchorActors(){
  scene.updateMatrixWorld(true);
  for(const [actor,button,top,left,right] of [[princess,princessButton,2.03,-.48,.56],[cat,catButton,1.09,-.46,.40]]){
    const a=toScreen(left,top,.12,actor),b=toScreen(right,.05,.26,actor),foot=toScreen(0,.02,.25,actor);
    const x=Math.min(a.x,b.x),y=Math.max(47,Math.min(a.y,b.y));
    button.style.left=x+'px';button.style.top=y+'px';button.style.width=Math.max(44,Math.abs(b.x-a.x))+'px';button.style.height=Math.max(44,foot.y-y+16)+'px';
  }
  if(!bubble.hidden){
    const w=host.clientWidth,h=host.clientHeight,rect=bubble.getBoundingClientRect();
    if(bubble.dataset.speaker==='princess'){
      const anchor=toScreen(0,1.59,.4,princess),y=Math.max(w<361?50:w<600?51:62,anchor.y-rect.height-13);
      bubble.style.top=y+'px';bubble.style.setProperty('--tail-x',Math.max(20,Math.min(rect.width-17,anchor.x-18-8))+'px');
    }else{
      const anchor=toScreen(-.12,.76,.26,cat),y=Math.min(h-rect.height-64,Math.max(h*.45,anchor.y-rect.height*.5));
      bubble.style.top=y+'px';bubble.style.setProperty('--tail-y',Math.max(15,Math.min(rect.height-17,anchor.y-y-6))+'px');
    }
  }
}
host.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=host.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5};},{passive:true});
host.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
function theme(){const dark=document.documentElement.dataset.theme==='dark';key.intensity=dark?2.1:1.85;rim.intensity=dark?1.5:.8;ambient.intensity=dark?1.25:1.0;renderer.toneMappingExposure=dark?1.02:.93;skin.color.set(dark?'#e7b79a':'#cc926e');gown.color.set(dark?'#ba7c70':'#ad6c5b');shadow.material.opacity=dark?.16:.14;start();}
window.addEventListener('theme-change',theme);
function resize(){const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);const aspect=w/h,extent=Math.max(1.83,2.22/aspect);camera.left=-extent*aspect;camera.right=extent*aspect;camera.top=extent;camera.bottom=-extent;const target=1.27+(h<320?(h-300)/160:0);camera.lookAt(0,bedtime?target-.07:target,0);camera.updateProjectionMatrix();start();}
new ResizeObserver(resize).observe(host);
window.addEventListener('castle-clock-change',e=>{bedtime=e.detail.isBedtime;resize();});
function draw(t){
  if(!visible||document.hidden||document.getElementById('player-sheet').open||renderLost)return;
  const dt=last?Math.min((t-last)/1000,.25):0;last=t;time+=dt;
  const state=theatre.tick(dt),moving=!reduced.matches,pose=state.pose,effect=state.effect,phase=state.elapsed;
  if(pose!==currentPose){currentPose=pose;poseTime=0;}else poseTime+=dt;
  host.dataset.pose=pose;
  const sin=(rate,shift=0)=>moving?Math.sin(time*rate+shift):0;
  const motion=state.talking?1:.45,enter=moving?Math.min(1,poseTime/.5):1;
  const pulse=moving?Math.sin(Math.min(1,phase/.9)*Math.PI):0;
  const isSleep=pose==='sleep'||pose==='nap',isRead=pose==='read',isGarden=['garden','sniff'].includes(pose),isChase=pose==='chase',isCatch=pose==='catch';
  const isWave=['welcome','invite'].includes(pose),isTease=pose==='tease',isCaught=pose==='caught';
  cake.rotation.y=damp(cake.rotation.y,.17+sin(.45)*.025+pointer.x*.045,dt);
  cake.rotation.x=sin(.8)*.003+(effect==='crumbs'?sin(7)*.008:0);cake.position.y=.025;
  const doorOpen=effect==='welcome'?1:0;
  doorHinge.rotation.y=damp(doorHinge.rotation.y,-doorOpen*1.25,dt);
  castleWindows.forEach((win,i)=>{const light=effect==='starlight'?(i===0?.9:.08):effect==='welcome'?.9:isCatch?.7:document.documentElement.dataset.theme==='dark'?.34:.03;win.material.emissiveIntensity=damp(win.material.emissiveIntensity,light,dt);win.material.color.set(light>.3?'#c69a57':'#83684a');});
  topBerry.rotation.z=damp(topBerry.rotation.z,effect==='mischief'||effect==='crumbs'?sin(7)*.18:0,dt);
  topBerry.position.y=2.025+(effect==='crumbs'?Math.abs(sin(5))*.085:0);
  princess.position.y=damp(princess.position.y,.04+(moving?sin(2.4)*.018:0)+(isCatch?Math.max(0,pulse)*.09:0),dt);
  princess.position.z=damp(princess.position.z,.44+(isWave?.14:0),dt);
  princess.rotation.y=damp(princess.rotation.y,.16+(isTease?.36:isGarden?-.50:isCatch?.2:0),dt);
  princess.rotation.z=damp(princess.rotation.z,isSleep?-.10:isGarden?.12:isTease?-.09:sin(1.1)*.012,dt);
  head.rotation.z=damp(head.rotation.z,isSleep?.25:isTease?-.16:isWave?-.10:sin(1.4)*.027,dt);
  head.rotation.x=damp(head.rotation.x,isSleep?.16:isRead?.16:isGarden?.10:0,dt);
  head.rotation.y=damp(head.rotation.y,isTease?.35:isChase?.28:isRead?-.08:sin(.8)*.03,dt);
  const blink=moving&&time%4.8>4.63;
  eyes.visible=!isSleep&&!blink;sleepyEyes.visible=isSleep||blink;
  const speaking=state.speaker==='princess';mouth.visible=!speaking||!moving||Math.sin(time*13)<.1;
  openMouth.visible=speaking&&moving&&!mouth.visible||pose==='yawn';openMouth.scale.y=pose==='yawn'?1.9:1;
  let leftZ=-.32,rightZ=.32,leftX=0,rightX=0,leftBend=0,rightBend=0;
  if(isWave){rightZ=2.33+sin(8)*.23*enter;rightBend=-.33+sin(8)*.17;leftZ=-.28;rightX=-.12;}
  else if(isRead){leftX=-1.05;rightX=-1.05;leftZ=.42;rightZ=-.42;leftBend=.1;rightBend=-.1;}
  else if(isTease){rightZ=-1.22;rightX=-.45;rightBend=-.65;leftZ=-.43;}
  else if(isCatch){rightZ=2.03+sin(2)*.12;rightX=-.55;rightBend=.42;}
  else if(isGarden){leftZ=-1.18;leftX=-.60;leftBend=.30;rightZ=.2;}
  else if(isSleep||pose==='yawn'){rightZ=-2.18;rightX=-.15;rightBend=-.70;leftZ=.25;leftX=-.6;}
  else if(pose==='listen'){leftZ=.20;rightZ=-.20;leftX=-.7;rightX=-.7;}
  leftArm.rotation.z=damp(leftArm.rotation.z,leftZ,dt);rightArm.rotation.z=damp(rightArm.rotation.z,rightZ,dt);
  leftArm.rotation.x=damp(leftArm.rotation.x,leftX,dt);rightArm.rotation.x=damp(rightArm.rotation.x,rightX,dt);
  forearms[0].rotation.z=damp(forearms[0].rotation.z,leftBend,dt);forearms[1].rotation.z=damp(forearms[1].rotation.z,rightBend,dt);
  const hop=moving&&['taste','chase'].includes(pose)?Math.max(0,Math.sin(Math.min(phase,2)*Math.PI*1.6))*.14:0;
  cat.position.x=damp(cat.position.x,1.30+(isChase?sin(1.3)*.20:pose==='serve'?-.20:0),dt);
  cat.position.y=damp(cat.position.y,.035+hop+(moving?sin(2.8)*.008:0),dt);
  cat.rotation.y=damp(cat.rotation.y,.16+(isChase?-.35:isCaught?-.18:pose==='sniff'?-.55:0),dt);
  cat.rotation.z=damp(cat.rotation.z,isSleep?-.07:isCaught?-.07:0,dt);
  catBody.scale.y=damp(catBody.scale.y,isSleep?.70:1,dt);catBody.scale.x=damp(catBody.scale.x,isSleep?1.18:1,dt);
  catHead.position.y=damp(catHead.position.y,isSleep?.53:.76,dt);catHead.position.x=damp(catHead.position.x,isSleep?.11:0,dt);
  catHead.rotation.z=damp(catHead.rotation.z,isSleep?.27:isCaught?.23:pose==='taste'?-.16:sin(1.6)*.05,dt);
  catHead.rotation.y=damp(catHead.rotation.y,isChase?-.35:isCaught?-.23:sin(.7)*.07,dt);
  catHead.rotation.x=damp(catHead.rotation.x,pose==='sniff'?.22:pose==='taste'?-.16:0,dt);
  catTail.rotation.z=damp(catTail.rotation.z,sin(isSleep?1.1:3)*(isSleep?.07:.30*motion),dt);catTail.rotation.y=sin(1.7)*(isSleep?.14:.45);catTail.rotation.x=damp(catTail.rotation.x,isSleep?-1.15:0,dt);
  const catBlink=moving&&time%5.2>4.96;catEyes.visible=!isSleep&&!catBlink;catSleepEyes.visible=isSleep||catBlink;
  catEars.forEach((ear,i)=>{ear.rotation.z=(i===0?-.12:.12)+(moving&&(isCaught||time%7<.65)?sin(18,i)*.12:0);});
  catPaw.position.y=damp(catPaw.position.y,isCaught?.43:.30,dt);
  catPaw.rotation.z=damp(catPaw.rotation.z,isCaught?-2.84:['chase','guard','serve'].includes(pose)?2.0+sin(5)*.22:isSleep?-.5:0,dt);
  catPaw.rotation.x=damp(catPaw.rotation.x,isCaught?-.15:pose==='serve'?-.9:0,dt);
  catMouth.scale.y=state.speaker==='cat'&&moving?.75+Math.max(0,sin(12)):.65;
  creamMoustache.visible=['taste','tease','caught'].includes(pose);
  tray.visible=['welcome','mischief','crumbs'].includes(effect);tray.position.x=damp(tray.position.x,pose==='serve'?.20:-.18,dt);tray.rotation.y=sin(.4)*.04;
  book.visible=isRead;book.rotation.z=sin(1.3)*.04;
  flowers.scale.setScalar(damp(flowers.scale.x,isGarden?1.16:.85,dt));flowers.rotation.z=isGarden?sin(2)*.045:0;
  wanderingStar.visible=isChase||isCatch;
  const starPhase=moving?phase:1.4;
  wanderingStar.position.set(isCatch?.82:1.05+Math.sin(starPhase*1.25)*.45,isCatch?1.86:.95+Math.abs(Math.sin(starPhase*1.6))*.62,.95);
  wanderingStar.scale.setScalar(isCatch?1.55:1.2);wanderingStar.quaternion.copy(camera.quaternion);wanderingStar.rotation.z=sin(1.5)*.35;wanderingStar.material.opacity=.92;
  stars.forEach((star,i)=>{const a=time*.09+i/stars.length*Math.PI*2,r=1.95;star.position.set(Math.cos(a)*r,1.1+sin(.55,i*1.6)*.36+(i%3)*.15,Math.sin(a)*r*.48-.3);star.quaternion.copy(camera.quaternion);star.rotation.z=time*.10+i;star.scale.setScalar(i%3===0?.70:.36);star.material.opacity=effect==='listening'?.09:effect==='starlight'?.23:.12+.13*(.5+.5*sin(1.0,i));});
  anchorActors();renderer.render(scene,camera);
}
function loop(t){raf=null;if(!visible||document.hidden||document.getElementById('player-sheet').open||renderLost)return;const interval=reduced.matches?200:1000/30;if(t-lastDraw>interval){lastDraw=t;draw(t);}raf=requestAnimationFrame(loop);}
function start(){if(raf!==null)cancelAnimationFrame(raf);raf=null;last=0;lastDraw=0;if(visible&&!document.hidden&&!document.getElementById('player-sheet').open&&!renderLost){draw(performance.now());raf=requestAnimationFrame(loop);}}
theatre.setWake(start);
new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;theatre.setVisible(visible);start();}).observe(host);
document.addEventListener('visibilitychange',start);document.getElementById('player-sheet').addEventListener('close',start);reduced.addEventListener('change',start);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();renderLost=true;if(raf!==null)cancelAnimationFrame(raf);theatre.enableFallback();});
resize();theme();start();
}
