import * as THREE from './vendor/three.module.js';
import './castle-clock.js?v=castle-20';
import {createInteractions} from './castle-interactions.js?v=castle-20';
const canvas=document.getElementById('cake-canvas'),host=canvas.parentElement,art=document.getElementById('album-art');
const theatre=createInteractions(art);
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
const catLeftPaw=new THREE.Group();cat.add(catLeftPaw);catLeftPaw.position.set(-.11,.30,.23);
piece(new THREE.CapsuleGeometry(.049,.16,5,10),furLight,0,-.11,0,catLeftPaw);ball(.073,furLight,0,-.244,.018,catLeftPaw,[1,.68,1.15]);
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
const catMouth=ball(.018,eyeMat,0,-.139,.278,catHead,[.7,.75,.22]);
const catTail=new THREE.Group();catTail.position.set(-.21,.11,-.14);cat.add(catTail);
const tailCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(-.19,.06,0),new THREE.Vector3(-.34,.26,.02),new THREE.Vector3(-.30,.48,.03),new THREE.Vector3(-.17,.64,.04),new THREE.Vector3(-.04,.57,.04)]);
piece(new THREE.TubeGeometry(tailCurve,32,.047,9,false),fur,0,0,0,catTail);ball(.05,furLight,-.04,.57,.04,catTail);

// Merge static parts while preserving each animated joint and expression.
function bakeAroundJoints(parent,joints){const fixed=new THREE.Group();for(const child of [...parent.children])if(!joints.includes(child))fixed.add(child);parent.add(fixed);bakeStaticGroup(fixed);}
bakeAroundJoints(princess,[head,leftArm,rightArm]);bakeAroundJoints(head,[eyes,sleepyEyes,mouth,openMouth]);bakeStaticGroup(mouth);for(const arm of [leftArm,rightArm]){bakeAroundJoints(arm,[...forearms]);}for(const arm of forearms)bakeStaticGroup(arm);
bakeAroundJoints(cat,[catHead,catTail,catPaw,catLeftPaw,catBody]);bakeStaticGroup(catBody);bakeAroundJoints(catHead,[catEyes,catSleepEyes,catMouth,...catEars]);bakeStaticGroup(catTail);bakeStaticGroup(catPaw);bakeStaticGroup(catLeftPaw);

// Flowers and a small blanket share the original porcelain palette.
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
const roofStar=piece(starGeo,sparkleMaterial.clone(),0,0,0,scene);roofStar.castShadow=false;roofStar.scale.setScalar(1.3);
const wanderingStar=piece(starGeo,sparkleMaterial.clone(),0,0,0,scene);wanderingStar.castShadow=false;
const heartShape=new THREE.Shape();heartShape.moveTo(0,-.07);heartShape.bezierCurveTo(-.18,.025,-.085,.14,0,.065);heartShape.bezierCurveTo(.085,.14,.18,.025,0,-.07);
const heartGeo=new THREE.ShapeGeometry(heartShape),hearts=[];
for(let i=0;i<7;i++){const heart=piece(heartGeo,new THREE.MeshBasicMaterial({color:i%2?'#f8dfb6':'#e9a596',transparent:true,opacity:0,depthWrite:false}),0,0,0,scene);heart.castShadow=false;heart.receiveShadow=false;hearts.push(heart);}
const flagPole=new THREE.Group();cake.add(flagPole);flagPole.position.set(.08,2.12,-.20);
piece(new THREE.CylinderGeometry(.012,.012,.38,8),gold,0,.16,0,flagPole);
const flag=piece(new THREE.PlaneGeometry(.24,.12),rose.clone(),.12,.27,0,flagPole);flag.material.side=THREE.DoubleSide;
const bell=new THREE.Group();cake.add(bell);bell.position.set(.9,1.08,2.1);
piece(new THREE.CylinderGeometry(.014,.014,.20,8),gold,0,.17,0,bell);
piece(new THREE.SphereGeometry(.072,16,12,0,Math.PI*2,0,Math.PI/2),gold,0,.05,0,bell);
hoop(.07,.01,gold,0,.05,0,bell);ball(.018,gold,0,.02,0,bell);
const bellArmCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(.85,.8,.8),new THREE.Vector3(.90,1.42,1.1),new THREE.Vector3(.9,1.44,2.1)]);
piece(new THREE.TubeGeometry(bellArmCurve,20,.014,7,false),gold,0,0,0,cake);
const bellRipple=piece(new THREE.TorusGeometry(.22,.008,8,48),new THREE.MeshBasicMaterial({color:'#ffe4a9',transparent:true,opacity:0,depthWrite:false}),0,0,0,scene);bellRipple.castShadow=false;
const blanket=new THREE.Group();cat.add(blanket);blanket.position.set(0,.36,.045);
const blanketShape=new THREE.Shape();blanketShape.moveTo(-.25,.06);blanketShape.quadraticCurveTo(0,.10,.25,.06);blanketShape.lineTo(.28,-.24);blanketShape.quadraticCurveTo(.19,-.33,0,-.29);blanketShape.quadraticCurveTo(-.19,-.33,-.28,-.24);blanketShape.closePath();
piece(new THREE.ExtrudeGeometry(blanketShape,{depth:.025,bevelEnabled:true,bevelSize:.025,bevelThickness:.018,bevelSegments:3,steps:1}),gown,0,0,.20,blanket);
const stitch=new THREE.CatmullRomCurve3([new THREE.Vector3(-.22,-.22,.25),new THREE.Vector3(0,-.25,.25),new THREE.Vector3(.22,-.22,.25)]);
piece(new THREE.TubeGeometry(stitch,20,.006,5,false),cream,0,0,0,blanket);bakeStaticGroup(blanket);
const roofPosition=new THREE.Vector3();
let pointer={x:0,y:0},time=0,last=0,visible=true,raf=null,bedtime=art.dataset.bedtime==='true',lastDraw=0,renderLost=false;
const princessButton=document.getElementById('scene-princess'),catButton=document.getElementById('scene-cat'),castleButton=document.getElementById('scene-castle');
const projected=new THREE.Vector3();
const damp=(value,target,dt)=>reduced.matches?target:THREE.MathUtils.damp(value,target,11,dt||.016);
const clamp=(x)=>THREE.MathUtils.clamp(x,0,1),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
function toScreen(x,y,z,object){projected.set(x,y,z);object.localToWorld(projected);projected.project(camera);return {x:(projected.x*.5+.5)*host.clientWidth,y:(-.5*projected.y+.5)*host.clientHeight};}
function anchorActors(){
  scene.updateMatrixWorld(true);
  const anchors={};
  for(const [name,actor,button,top,left,right] of [['princess',princess,princessButton,2.13,-.48,.56],['cat',cat,catButton,1.10,-.46,.40],['castle',cake,castleButton,2.53,-1.5,1.5]]){
    const a=toScreen(left,top,.12,actor),b=toScreen(right,.05,.26,actor),foot=toScreen(0,.02,.25,actor);
    const x=Math.min(a.x,b.x),y=Math.max(0,Math.min(a.y,b.y));
    button.style.left=x+'px';button.style.top=y+'px';button.style.width=Math.max(44,Math.abs(b.x-a.x))+'px';button.style.height=Math.max(44,Math.min(host.clientHeight-y,foot.y-y+8))+'px';
    const point=toScreen(0,top,.16,actor);anchors[name]={x:point.x,y:point.y+host.offsetTop};
  }
  const faceEdge=toScreen(.38,1.6,.32,princess);anchors.cat.faceRight=faceEdge.x;
  theatre.placeIdentity(anchors);
}
const raycaster=new THREE.Raycaster(),rayPointer=new THREE.Vector2();
theatre.setHitTest(event=>{
  const rect=canvas.getBoundingClientRect();
  if(event.clientY<rect.top||event.clientY>rect.bottom)return 'all';
  rayPointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
  scene.updateMatrixWorld(true);raycaster.setFromCamera(rayPointer,camera);
  const hit=raycaster.intersectObjects([cat,princess,cake],true).find(hit=>{
    for(let node=hit.object;node;node=node.parent)if(!node.visible)return false;
    return true;
  });
  if(!hit)return 'all';
  for(let node=hit.object;node;node=node.parent){if(node===cat)return 'cat';if(node===princess)return 'princess';if(node===cake)return 'castle';}
  return 'all';
});
host.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=host.getBoundingClientRect();pointer={x:(e.clientX-r.left)/r.width-.5,y:(e.clientY-r.top)/r.height-.5};},{passive:true});
host.addEventListener('pointerleave',()=>{pointer={x:0,y:0};});
function theme(){const dark=document.documentElement.dataset.theme==='dark';key.intensity=dark?2.1:1.85;rim.intensity=dark?1.5:.8;ambient.intensity=dark?1.25:1.0;renderer.toneMappingExposure=dark?1.02:.93;skin.color.set(dark?'#e7b79a':'#cc926e');gown.color.set(dark?'#ba7c70':'#ad6c5b');shadow.material.opacity=dark?.16:.14;start();}
window.addEventListener('theme-change',theme);
function resize(){
  const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h,false);
  const extent=Math.max(1.25,2.31*h/w),halfWidth=extent*w/h;camera.left=-halfWidth;camera.right=halfWidth;camera.top=extent;camera.bottom=-extent;camera.lookAt(0,1.03,0);camera.updateProjectionMatrix();start();
}
new ResizeObserver(resize).observe(host);
window.addEventListener('castle-clock-change',e=>{bedtime=e.detail.isBedtime;start();});
function draw(t){
  if(!visible||document.hidden||document.getElementById('player-sheet').open||renderLost)return;
  const dt=last?Math.min((t-last)/1000,.25):0;last=t;time+=dt;
  const state=theatre.tick(dt),moving=!reduced.matches,pose=state.pose,night=state.night;
  const phase=state.elapsed,p=clamp(state.progress),animDt=dt;
  const sin=(rate,shift=0)=>moving?Math.sin(time*rate+shift):0;
  const localSin=rate=>moving?Math.sin(phase*rate):0;
  const arc=moving?Math.sin(p*Math.PI):0;
  let px=.43,pz=.44,py=.04,pry=.16,prz=sin(1.1)*.012,hx=0,hy=0,hz=sin(1.4)*.025;
  let leftZ=-.32,rightZ=.32,leftX=0,rightX=0,leftBend=0,rightBend=0,princessScale=1;
  let cx=1.30,cz=1.06,cy=.035,cry=.16,crz=0,chx=0,chy=sin(.7)*.06,chz=sin(1.6)*.035,headY=.76;
  let pawZ=0,pawX=0,pawY=.30,leftPawZ=0,leftPawX=0,bodyY=1,bodyX=1;
  let eyesClosed=false,catClosed=false,yawning=false,showBlanket=false;
  let castleAction=night?'nightlight':'calm',castleY=.025,castleScaleX=1,castleScaleY=1,castleTilt=0,heartAmount=0,prop='';
  const held=(amount=1)=>{
    const sway=sin(night?1.4:2.4)*(night?.018:.035);
    px=.40;pry=.05;prz=-.035+sway;hz=.12+sway;hy=.18;hx=.12;
    leftZ=.92;rightZ=-.72;leftX=-1.1;rightX=-1.24;leftBend=.38;rightBend=-.50;
    cx=.75+sway;cy=.58+sin(night?1.4:2.4)*.016;cz=.89;cry=-.48;crz=-.17+sway;
    pawZ=1.9;leftPawZ=-1.9;pawX=leftPawX=1.0;pawY=.43;
    chx=-.08;chy=-.28;chz=.14;catClosed=true;
  };
  const sleepPair=()=>{
    held();py=-.015;princessScale=.89;cx=.75;cy=.43;cz=.94;
    hx=.24;hz=.16;eyesClosed=true;catClosed=true;showBlanket=true;castleAction='nightlight';
  };
  if(night){hx=.09;hz=.09;catClosed=true;headY=.62;bodyY=.83;bodyX=1.1;chx=.08;crz=-.04;}
  if(pose==='catNotice'){headY=.84;catClosed=false;chx=-.16;chz=-.13;chy=.13;}
  if(pose==='catHello'){
    headY=.83;catClosed=false;pawZ=2.3+localSin(8)*.28;pawY=.40;
    cy+=moving?Math.abs(localSin(4))*.055:0;chz=localSin(4)*.08;heartAmount=.5;
  }
  if(pose==='curtsy'){py-=arc*.11;hx=arc*.28;leftZ=-.9;rightZ=.9;leftX=rightX=-.08;prz=-arc*.045;}
  if(pose==='princessHello'||pose==='togetherWave'){
    rightZ=2.25+localSin(8)*.20;rightX=-.23;rightBend=-.28;hz=-.1;py+=Math.abs(localSin(4))*.012;
    if(pose==='togetherWave'){pawZ=2.2+localSin(7)*.19;pawY=.39;castleAction='celebrate';heartAmount=.6;}
  }
  if(pose==='castleSquash'){castleScaleY=1-.12*ease(p);castleScaleX=1+.06*ease(p);}
  if(pose==='castleSpring'){
    castleY+=arc*.18;castleScaleY=1+localSin(8)*.065*(1-p);castleScaleX=1-localSin(8)*.025*(1-p);castleTilt=localSin(9)*.035*(1-p);castleAction='opening';
  }
  if(pose==='castleGlow'){castleAction='celebrate';castleTilt=localSin(5)*.012*(1-p);heartAmount=.8;}
  if(pose==='catStretch'){
    catClosed=p>.65;headY=.76+arc*.12;pawZ=2.6;leftPawZ=-2.6;pawX=leftPawX=-.35;bodyY=1+arc*.16;chx=-.22;chz=.09;
  }
  if(pose==='catCurl'||pose==='nightRest'){
    catClosed=true;headY=.54;bodyY=.72;bodyX=1.16;chz=.24;pawZ=-.4;leftPawZ=.4;castleAction='nightlight';
    if(pose==='nightRest'){eyesClosed=true;hx=.10;hz=.14;}
  }
  if(pose==='princessYawn'){
    hx=.14;hz=.15;rightZ=-2.2;rightX=-.18;rightBend=-.65;leftZ=-.4;eyesClosed=true;yawning=true;
  }
  if(pose==='nightWave'){rightZ=2.15+localSin(3)*.1;rightX=-.18;rightBend=-.3;hz=.13;hx=.1;}
  if(pose==='princessSleep'){rightZ=-2.05;rightX=-.1;rightBend=-.7;hz=.24;hx=.13;eyesClosed=true;}
  if(pose==='lightsOut'){castleAction='lightsOut';eyesClosed=true;}
  if(pose==='prepareHug'){
    const ready=ease(p);pry=.4;hy=.3;hx=.1;leftZ=-.9;rightZ=1.1;leftX=rightX=-.6;
    cx=1.30+localSin(16)*.025;cy-=ready*.055;bodyY=1-ready*.22;bodyX=1+ready*.12;
    cry=-.65;chx=-.22;catClosed=false;pawZ=.25;leftPawZ=-.25;
  }
  if(pose==='leapHug'){
    const travel=ease(p);held();
    cx=THREE.MathUtils.lerp(1.30,.75,travel);cz=THREE.MathUtils.lerp(1.06,.89,travel);
    cy=THREE.MathUtils.lerp(.035,.58,travel)+arc*(night?.15:.32);
    crz=-.17*travel;catClosed=false;headY=.76;bodyY=bodyX=1;
    leftZ=THREE.MathUtils.lerp(-.9,.92,travel);rightZ=THREE.MathUtils.lerp(1.1,-.72,travel);
    castleAction=night?'nightlight':'notice';
  }
  if(pose==='cuddle'){
    held();headY=.76;bodyY=bodyX=1;eyesClosed=true;castleAction=night?'nightlight':'celebrate';heartAmount=night?0:1;
    chy=-.28+localSin(4)*.15;chz=.14+localSin(4)*.07;hy=.18+localSin(2)*.06;
  }
  if(pose==='releaseHug'){
    held();headY=.76;bodyY=bodyX=1;
    const travel=ease(p);cx=THREE.MathUtils.lerp(.75,1.30,travel);cy=THREE.MathUtils.lerp(.58,.035,travel)+arc*.12;cz=THREE.MathUtils.lerp(.89,1.06,travel);
    cry=THREE.MathUtils.lerp(-.48,.16,travel);crz=-.17*(1-travel);leftZ=.92*(1-travel);rightZ=-.72*(1-travel);leftX=-1.1*(1-travel);rightX=-1.24*(1-travel);pawZ=1.9*(1-travel);leftPawZ=-pawZ;
    castleAction='warm';
  }
  if(pose==='sitTogether'){
    held();const sit=ease(p);princessScale=1-.11*sit;py=.04-.055*sit;cy=.58-.15*sit;
    hx=.12+.12*sit;eyesClosed=p>.5;showBlanket=p>.6;headY=.76;bodyY=bodyX=1;
  }
  if(pose==='sleepTogether'){sleepPair();headY=.70;bodyY=.9;bodyX=1.04;}
  if(pose==='starDrop'){
    hx=-.16;hy=-.35;pry=-.15;cry=-.4;chx=-.3;catClosed=false;castleAction='starAway';prop='fallingStar';
  }
  if(pose==='starCatch'){
    rightZ=1.4;rightX=-.5;hx=.1;hy=.3;cx=1.08;cy+=arc*.22;cry=-.3;chx=-.23;pawZ=2.4;leftPawZ=-1.6;pawY=.4;catClosed=false;castleAction='notice';prop='catchStar';
  }
  if(pose==='starShare'){
    rightZ=1.22;rightX=-.7;rightBend=-.15;hx=.16;hy=.3;cx=1.05;cry=-.2;chx=-.12;pawZ=2.3;pawY=.36;catClosed=false;castleAction='warm';prop='holdStar';
  }
  if(pose==='starReturn'){
    px=.23;pry=-.45;leftZ=-2.13;leftX=-.5;leftBend=-.2;rightZ=1.12;rightX=-.35;hx=-.1;hy=-.4;cry=-.3;chx=-.35;catClosed=false;castleAction='starHome';prop='returnStar';
  }
  if(pose==='hide'){
    const travel=ease(p);cx=THREE.MathUtils.lerp(1.30,.36,travel);cz=THREE.MathUtils.lerp(1.06,.04,travel);cry=-.55;chx=.12;cy+=Math.abs(localSin(9))*.025;pry=.25;hy=.3;castleAction='opening';
  }
  if(pose==='peek'){
    cx=.39+localSin(4)*.16;cz=.05;cry=.45;headY=.76;pry=-.15;prz=.08;hx=.23;hy=-.3;rightZ=.75;castleAction='warm';
  }
  if(pose==='peekJump'){
    const travel=ease(p);cx=THREE.MathUtils.lerp(.39,1.22,travel);cz=THREE.MathUtils.lerp(.05,1.06,travel);cy+=arc*.26;cry=.16;pawZ=1.8;leftPawZ=-1.8;prz=-arc*.07;hy=.3;rightZ=.9;castleAction='celebrate';
  }
  if(pose==='giggle'){
    eyesClosed=true;hz=-.12+localSin(4)*.05;rightZ=.85;leftZ=-.85;py+=Math.abs(localSin(6))*.018;chz=localSin(4)*.10;catClosed=true;castleAction='celebrate';heartAmount=.55;
  }
  if(pose==='groom'){pawZ=-2.4;pawY=.43;chx=.22;chz=.12+localSin(4)*.05;}
  if(pose==='adjustCrown'){rightZ=2.7;rightX=-.30;rightBend=.5;hz=-.1;hy=-.15;}
  if(pose==='pet'){
    rightZ=.8;rightX=-1.0;rightBend=-.3+localSin(3)*.12;prz=.08;hx=.17;hy=.3;
    cx=1.02;cz=.92;chx=-.13;headY=.79;catClosed=true;
  }
  // Small tap feedback stays additive, even in the middle of an embrace.
  if(moving&&state.pulse){
    if(['cat','all'].includes(state.pulseTarget))chz+=Math.sin(state.pulse*Math.PI)*.08;
    if(['princess','all'].includes(state.pulseTarget))hz-=Math.sin(state.pulse*Math.PI)*.035;
  }
  princess.position.set(damp(princess.position.x,px,animDt),damp(princess.position.y,py+sin(night?1.4:2.4)*(night?.005:.010),animDt),damp(princess.position.z,pz,animDt));
  princess.scale.set(1.04,1.04*damp(princess.scale.y/1.04,princessScale,animDt),1.04);
  princess.rotation.y=damp(princess.rotation.y,pry,animDt);princess.rotation.z=damp(princess.rotation.z,prz,animDt);
  head.rotation.x=damp(head.rotation.x,hx,animDt);head.rotation.y=damp(head.rotation.y,hy,animDt);head.rotation.z=damp(head.rotation.z,hz,animDt);
  const blink=moving&&time%4.8>4.63;eyes.visible=!eyesClosed&&!blink;sleepyEyes.visible=eyesClosed||blink;
  mouth.visible=!yawning;openMouth.visible=yawning;openMouth.scale.y=1.7;
  leftArm.rotation.set(damp(leftArm.rotation.x,leftX,animDt),0,damp(leftArm.rotation.z,leftZ,animDt));
  rightArm.rotation.set(damp(rightArm.rotation.x,rightX,animDt),0,damp(rightArm.rotation.z,rightZ,animDt));
  forearms[0].rotation.z=damp(forearms[0].rotation.z,leftBend,animDt);forearms[1].rotation.z=damp(forearms[1].rotation.z,rightBend,animDt);
  cat.position.set(damp(cat.position.x,cx,animDt),damp(cat.position.y,cy+sin(night?1.4:2.8)*(night?.004:.008),animDt),damp(cat.position.z,cz,animDt));
  cat.rotation.y=damp(cat.rotation.y,cry,animDt);cat.rotation.z=damp(cat.rotation.z,crz,animDt);
  catBody.scale.set(damp(catBody.scale.x,bodyX,animDt),damp(catBody.scale.y,bodyY+sin(night?1.4:2.8)*.012,animDt),1);
  catHead.position.y=damp(catHead.position.y,headY,animDt);catHead.rotation.x=damp(catHead.rotation.x,chx,animDt);catHead.rotation.y=damp(catHead.rotation.y,chy,animDt);catHead.rotation.z=damp(catHead.rotation.z,chz,animDt);
  catPaw.rotation.z=damp(catPaw.rotation.z,pawZ,animDt);catPaw.rotation.x=damp(catPaw.rotation.x,pawX,animDt);catPaw.position.y=damp(catPaw.position.y,pawY,animDt);
  catLeftPaw.rotation.z=damp(catLeftPaw.rotation.z,leftPawZ,animDt);catLeftPaw.rotation.x=damp(catLeftPaw.rotation.x,leftPawX,animDt);catLeftPaw.position.y=damp(catLeftPaw.position.y,pawY,animDt);
  catTail.rotation.z=damp(catTail.rotation.z,sin(catClosed?1.1:3)*(night?.05:.25),animDt);catTail.rotation.y=sin(1.7)*(night?.10:.35);catTail.rotation.x=damp(catTail.rotation.x,catClosed?-.8:0,animDt);
  const catBlink=moving&&time%5.2>4.96;catEyes.visible=!catClosed&&!catBlink;catSleepEyes.visible=catClosed||catBlink;
  catEars.forEach((ear,i)=>{ear.rotation.z=(i===0?-.12:.12)+(moving&&(pose==='catNotice'||time%9<.5)?sin(13,i)*(night?.04:.10):0);});
  bellRipple.material.opacity=0;
  blanket.visible=showBlanket;blanket.position.set(0,.39,.09);blanket.scale.setScalar(1.17);
  flowers.scale.setScalar(.85);flowers.rotation.z=sin(.8)*.012;
  cake.position.y=damp(cake.position.y,castleY,animDt);cake.scale.set(.64*castleScaleX,.64*castleScaleY,.64*castleScaleX);
  cake.rotation.y=damp(cake.rotation.y,.17+pointer.x*.04,animDt);cake.rotation.z=damp(cake.rotation.z,castleTilt,animDt);
  let door=0;
  if(castleAction==='opening')door=1.15*ease(p*2);
  if(['warm','celebrate','notice'].includes(castleAction))door=1.0;
  if(castleAction==='lightsOut')door=.65*(1-ease(p));
  doorHinge.rotation.y=damp(doorHinge.rotation.y,-door,animDt);
  const dark=document.documentElement.dataset.theme==='dark';
  castleWindows.forEach((win,i)=>{
    let light=dark?.34:.06;
    if(castleAction==='opening')light=p>i*.15?.75:.08;
    if(['warm','celebrate'].includes(castleAction))light=.7+sin(2,i)*.08;
    if(castleAction==='notice')light=.2+.6*Math.max(0,localSin(3-i));
    if(castleAction==='starAway')light=.04;
    if(castleAction==='starHome')light=p>.4+i*.12?.85:.04;
    if(castleAction==='lightsOut')light=p>(i+1)/4?(i===0?.32:.025):.6;
    if(castleAction==='nightlight')light=i===0?.32:.025;
    win.material.emissiveIntensity=damp(win.material.emissiveIntensity,light,animDt);win.material.color.set(light>.3?'#c69a57':'#83684a');
  });
  flag.rotation.y=sin(night?.9:castleAction==='celebrate'?6:2)*(night?.04:castleAction==='celebrate'?.5:.10);
  flagPole.position.y=2.12+(castleAction==='celebrate'?Math.max(0,sin(4))*.05:0);
  topBerry.rotation.z=pose==='castleSpring'?localSin(12)*.14*(1-p):sin(.8)*.008;
  bell.rotation.z=pose==='castleSpring'?localSin(10)*.3*(1-p):0;
  roofPosition.set(.06,2.51,.15);cake.localToWorld(roofPosition);roofStar.position.copy(roofPosition);roofStar.quaternion.copy(camera.quaternion);roofStar.rotation.z=sin(1.5)*.08;
  roofStar.material.opacity=night?.45:.8;roofStar.visible=!['fallingStar','catchStar','holdStar','returnStar'].includes(prop)||prop==='returnStar'&&p>.88;
  wanderingStar.visible=!!prop;
  if(prop){
    let sx=.8,sy=1.5,sz=.8;
    if(prop==='fallingStar'){const travel=ease(p);sx=THREE.MathUtils.lerp(roofPosition.x,1.12,travel);sy=THREE.MathUtils.lerp(roofPosition.y,.85,travel)+arc*.30;sz=THREE.MathUtils.lerp(roofPosition.z,1.12,travel);}
    if(prop==='catchStar'){sx=1.04;sy=.85+ease(p)*.5;sz=1.05;}
    if(prop==='holdStar'){const travel=ease(p);sx=THREE.MathUtils.lerp(1.04,.7,travel);sy=THREE.MathUtils.lerp(1.35,1.4,travel);sz=THREE.MathUtils.lerp(1.05,.8,travel);}
    if(prop==='returnStar'){const travel=ease((p-.12)/.76);sx=THREE.MathUtils.lerp(.7,roofPosition.x,travel);sy=THREE.MathUtils.lerp(1.40,roofPosition.y,travel)+Math.sin(travel*Math.PI)*.4;sz=THREE.MathUtils.lerp(.8,roofPosition.z,travel);}
    wanderingStar.position.set(sx,sy,sz);wanderingStar.quaternion.copy(camera.quaternion);wanderingStar.rotation.z=sin(2)*.2;wanderingStar.scale.setScalar(1.5);wanderingStar.material.opacity=prop==='returnStar'&&p>.88?0:.95;
  }
  hearts.forEach((heart,i)=>{
    const travel=(phase*.5+i*.137)%1,fromCastle=pose==='castleGlow';
    heart.visible=heartAmount>0&&!night&&moving;
    heart.position.set((fromCastle?-.8:.82)+Math.sin(i*2.4)*(.15+travel*.45),(fromCastle?1.3:1.35)+travel*.80,1.1);
    heart.quaternion.copy(camera.quaternion);heart.rotation.z=Math.sin(i+phase)*.18;
    heart.scale.setScalar((.45+(i%3)*.15)*(1-travel*.4));heart.material.opacity=heartAmount*Math.sin(travel*Math.PI)*.8;
  });
  stars.forEach((star,i)=>{
    const angle=time*.07+i/stars.length*Math.PI*2;
    star.position.set(Math.cos(angle)*1.9,1.0+sin(.7,i)*.42+(i%3)*.15,Math.sin(angle)*.84-.3);star.quaternion.copy(camera.quaternion);star.rotation.z=time*.1+i;star.scale.setScalar(i%3===0?.65:.35);
    star.material.opacity=night?.025:castleAction==='celebrate'?.15:.045;
  });
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
