import * as THREE from './vendor/three.module.js';

// Props and poses belong to a page of a specific story, not an endless scene reel.
export function createStoryScene(id,phase,api){
 const {g,princess,cat,castle,popup,cut,shape,rectShape,mesh,paper,line,flatDisk,colors}=api;
 const group=(x=0,z=0)=>popup(g,x,z),props={};
 const sphere=(parent,r,x,y,z,mat)=>mesh(new THREE.SphereGeometry(r,12,8),mat,parent,x,y,z);
 if(id==='rain'){
  princess.position.x=.8;cat.position.set(phase===0?2.6:1.95,.35,.9);
  const umbrella=group(phase===0?2.65:1.3,.58);
  const canopy=new THREE.Shape();canopy.moveTo(-1.2,2.68);canopy.quadraticCurveTo(-1.05,3.5,0,3.55);canopy.quadraticCurveTo(1.05,3.5,1.2,2.68);
  for(let i=0;i<4;i++){const right=1.2-i*.6;canopy.quadraticCurveTo(right-.3,2.9,right-.6,2.68);}canopy.closePath();
  cut(canopy,colors.pink,umbrella,0,0,0,.045);
  cut(shape([[0,3.55],[-.6,2.68],[0,2.82],[.6,2.68]]),colors.blush,umbrella,0,0,.055,.018);
  line([[0,3.6,.04],[0,1.1,.04],[-.1,.94,.04],[-.24,.98,.04],[-.25,1.12,.04]],colors.gold,umbrella,.022);
  for(const x of [-.6,.6])line([[0,3.54,.08],[x*.62,3.2,.08],[x,2.73,.08]],colors.ivory,umbrella,.009);
  if(phase===0){umbrella.scale.setScalar(.67);umbrella.rotation.z=.32;}
  if(phase===3){umbrella.scale.setScalar(.48);umbrella.position.x=2.8;umbrella.rotation.z=.38;}
  const rain=group(-.1,-1.0),rainMat=new THREE.MeshBasicMaterial({color:'#819888',transparent:true,opacity:.6,depthWrite:false});
  const drops=new THREE.InstancedMesh(new THREE.BoxGeometry(.018,.15,.012),rainMat,32);drops.castShadow=false;rain.add(drops);rain.visible=phase<3;
  const dummy=new THREE.Object3D();
  const puddle=flatDisk(.62,paper('#a7b5a0',{roughness:.45}),g,1.78,.39,1.55);puddle.rotation.x=-Math.PI/2;puddle.scale.y=.48;puddle.visible=phase>=2;
  const prints=group(.7,1.62);prints.visible=phase>=2;
  for(let i=0;i<6;i++){const paw=flatDisk(.055,colors.ink,prints,-.4+i*.35,.05,.1+(i%2)*.15);paw.rotation.x=-Math.PI/2;paw.scale.y=1.3;}
  if(phase===3){
   const rainbow=group(.3,-1.6);const shades=['#bd8372','#ceab70','#b2b788','#93a390'];
   shades.forEach((color,i)=>{const points=[];for(let k=0;k<=30;k++){const a=k/30*Math.PI;points.push([Math.cos(a)*(2.35-i*.13),1.55+Math.sin(a)*(1.5-i*.13),-.04-i*.01]);}line(points,paper(color),rainbow,.052);});
  }
  props.update=(t,still)=>{
   if(phase===1){umbrella.rotation.z=-.12+(still?0:Math.sin(t*.8)*.025);cat.position.x-=.12;}
   if(phase===2&&!still){cat.position.y+=Math.max(0,Math.sin(t*1.7))*.22;cat.rotation.z-=Math.sin(t*1.7)*.08;princess.rotation.z+=Math.sin(t*.85)*.025;}
   for(let i=0;i<32;i++){const travel=((still?.36:t*.48)+i*.117)%1;dummy.position.set(-3.65+(i*1.618%7.2)-travel*.13,3.9-travel*2.4,-.23+(i%3)*.11);dummy.rotation.z=-.18;dummy.updateMatrix();drops.setMatrixAt(i,dummy.matrix);}drops.instanceMatrix.needsUpdate=true;
  };
 }
 if(id==='picnic'){
  princess.position.set(.58,.35,.35);cat.position.set(2.37,.35,.4);
  const table=group(1.45,1.32);cut(rectShape(2.2,.12,.035),colors.ink,table,0,.65,0,.06);
  cut(rectShape(1.98,.62,.03),colors.ivory,table,0,0,.035,.04);
  for(let i=0;i<8;i++)cut(rectShape(.1,.62,.005),i%2?colors.blush:colors.white,table,-.85+i*.24,0,.09,.008);
  const cloth=shape([[-1.12,.75],[1.12,.75],[1.15,.53],[.88,.45],[.6,.53],[.32,.45],[.04,.53],[-.24,.45],[-.52,.53],[-.8,.45],[-1.15,.53]]);cut(cloth,colors.white,table,0,0,.12,.02);
  const plate=new THREE.Group();plate.position.y=.8;table.add(plate);
  const dish=flatDisk(.72,colors.blush,plate,0,0,.12);dish.rotation.x=-Math.PI/2;dish.scale.y=.6;
  function slice(x,scale){const c=new THREE.Group();c.position.set(x,.02,.16);c.scale.setScalar(scale);plate.add(c);
   cut(rectShape(.45,.29,.025),colors.peach,c,0,0,.01,.12);cut(rectShape(.46,.06,.01),colors.white,c,0,.12,.14,.02);cut(rectShape(.48,.07,.02),colors.white,c,0,.26,.12,.04);
   const berry=sphere(c,.07,0,.37,.12,colors.pink);berry.scale.set(.8,1.15,.5);return c;}
  const big=slice(phase<2?0:-.3,phase<2?1.7:1.1),small=slice(.42,.85);small.visible=phase===2;big.visible=phase<3;
  const berries=[];for(const x of [-.3,.35]){const berry=sphere(plate,.15,x,.16,.18,colors.pink);berry.scale.set(.6,1.2,.6);berry.visible=phase===3;berries.push(berry);cut(shape([[-.07,0],[0,.08],[.07,0]]),colors.sage,berry,0,.12,.02,.01);}
  const fork=group(.9,1.38);line([[0,.8,.14],[0,1.23,.14]],colors.gold,fork,.018);for(const x of [-.065,0,.065])line([[0,1.16,.14],[x,1.22,.14],[x,1.37,.14]],colors.gold,fork,.012);fork.visible=phase>=2;
  props.update=(t,still)=>{
   if(phase===0&&!still){cat.rotation.z+=Math.sin(t*.9)*.04;cat.rotation.y=.04+Math.sin(t*.6)*.12;}
   if(phase===1){const move=still?.22:Math.sin(t*.9)*.38;plate.position.x=move;if(!still){cat.rotation.z+=move*.16;princess.rotation.z-=move*.1;}}
   if(phase===2){const push=still?.7:(1-Math.cos(t*.75))*.5;big.position.x=-.15-push*.46;if(!still)cat.rotation.z-=push*.07;}
   if(phase===3&&!still){princess.rotation.z+=Math.sin(t*.9)*.025;cat.rotation.z-=Math.sin(t*.9)*.05;}
  };
 }
 if(id==='garden'){
  princess.position.x=.3;cat.position.set(2.6,.35,.85);
  const pot=group(1.55,1.25);cut(shape([[-.4,0],[.4,0],[.5,.58],[-.5,.58]]),colors.pink,pot,0,0,0,.06);cut(rectShape(1.04,.12,.03),colors.blush,pot,0,.51,.09,.06);
  const soil=flatDisk(.4,colors.ink,pot,0,.59,.01);soil.rotation.x=-Math.PI/2;soil.scale.y=.38;
  const blossom=new THREE.Group();blossom.position.y=.59;pot.add(blossom);blossom.visible=phase>0;
  line([[0,0,0],[-.02,.55,0],[0,1.22,0]],colors.darkSage,blossom,.025);
  cut(shape([[0,.41],[-.45,.49],[-.39,.81],[-.03,.67]]),colors.sage,blossom,0,0,.02,.018);cut(shape([[0,.58],[.39,.7],[.47,.98],[.07,.87]]),colors.sage,blossom,0,0,.035,.018);
  const petals=new THREE.Group();petals.position.y=1.29;blossom.add(petals);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,p=flatDisk(.2,i%2?colors.blush:colors.pink,petals,Math.cos(a)*.2,Math.sin(a)*.2,.05);p.scale.set(.83,1.1,1);p.rotation.z=a;}
  flatDisk(.15,colors.gold,petals,0,0,.09);petals.scale.setScalar(phase===3?1:.15);blossom.scale.setScalar(phase===1?.6:1);
  const can=group(.1,.95);cut(rectShape(.44,.33,.05),colors.sage,can,0,1.14,0,.06);cut(shape([[.19,1.24],[.5,1.48],[.55,1.42],[.25,1.13]]),colors.darkSage,can,0,0,.04,.018);line([[-.19,1.4,.05],[-.39,1.5,.05],[-.43,1.23,.05],[-.2,1.21,.05]],colors.darkSage,can,.022);can.visible=phase===1||phase===3;
  const droplets=[];for(let i=0;i<4;i++){const d=sphere(can,.025,.59+i*.06,1.4-i*.14,.1,colors.gold);d.castShadow=false;droplets.push(d);}
  if(phase===0){const seeds=group(2.3,1.4);cut(rectShape(.34,.44,.02),colors.ivory,seeds,0,.15,.05,.02);sphere(seeds,.06,-.1,.2,.14,colors.gold);line([[-.1,.4,.08],[.1,.4,.08]],colors.sage,seeds,.009);cat.rotation.z=-.12;}
  if(phase===1){const stool=group(.5,.75);cut(rectShape(.52,.08,.02),colors.blush,stool,0,.5,0,.04);for(const x of [-.18,.18])cut(rectShape(.05,.5,.01),colors.ink,stool,x,0,-.03,.03);}
  if(phase===2){const shelter=group(1.35,.03);for(const x of [-1.3,1.3])cut(rectShape(.06,2.9,.01),colors.gold,shelter,x,0,0,.03);cut(shape([[-1.5,2.65],[0,3.2],[1.5,2.65],[1.3,2.4],[0,2.93],[-1.3,2.4]]),colors.sage,shelter,0,0,.04,.025);cat.position.x=2.25;princess.position.x=.7;}
  props.update=(t,still)=>{
   if(phase===2&&!still){blossom.rotation.z=Math.sin(t*1.7)*.075;cat.rotation.z-=Math.sin(t*1.7)*.04;}
   if(phase===3){petals.scale.setScalar(still?1:.93+Math.sin(t*.6)*.07);petals.rotation.z=still?0:Math.sin(t*.6)*.045;}
   if(phase===1||phase===3){can.rotation.z=-.16+(still?0:Math.sin(t*.7)*.03);droplets.forEach((d,i)=>{const fall=((still?.4:t*.7)+i*.24)%1;d.position.y=1.38-fall*.54;d.position.x=.58+fall*.32;});}
  };
 }
 return props;
}
