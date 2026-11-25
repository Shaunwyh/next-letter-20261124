(() => {
  'use strict';
  const canvas=document.getElementById('cake-canvas'),art=canvas.parentElement;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:899px)');
  let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power'});}catch(_){}
  if(!gl)return;
  const vs=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;uniform mediump float uTime;uniform float uAspect;uniform vec2 uTilt;varying vec3 vNormal;varying vec3 vColor;varying vec3 vWorld;mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}void main(){mat3 r=rx(.38+uTilt.y*.14)*ry(uTime*.23+uTilt.x*.2);vec3 p=r*aPosition;p.y+=sin(uTime*.7)*.035;vNormal=r*aNormal;vColor=aColor;vWorld=p;float d=4.2-p.z;vec2 xy=p.xy*3.5/d;xy.x/=uAspect;gl_Position=vec4(xy,-p.z*.08,1.);}`;
  const fs=`precision mediump float;varying vec3 vNormal;varying vec3 vColor;varying vec3 vWorld;uniform mediump float uTime;void main(){vec3 n=normalize(vNormal),l=normalize(vec3(-.7,1.2,1.));float d=max(dot(n,l),0.);float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),24.);vec3 c=vColor*(.58+d*.48)+vec3(1.,.97,.85)*spec*.16;if(vColor.r>.98&&vColor.b<.3)c*=1.+sin(uTime*6.)*.1;gl_FragColor=vec4(c,1.);}`;
  function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s)||'cake shader');return s;}
  let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program)||'cake program');}catch(e){console.warn('Cake scene fallback:',e.message);return;}
  const positions=[],normals=[],colors=[];
  function vertex(p,n,c){positions.push(...p);normals.push(...n);colors.push(...c);}
  function tri(a,b,c,na,nb,nc,color){vertex(a,na,color);vertex(b,nb,color);vertex(c,nc,color);}
  function cylinder(radius,y,height,color,segments=48,wave=0){
    const bottom=y-height/2,top=y+height/2;
    for(let i=0;i<segments;i++){
      const a=i/segments*Math.PI*2,b=(i+1)/segments*Math.PI*2,na=[Math.cos(a),0,Math.sin(a)],nb=[Math.cos(b),0,Math.sin(b)];
      const bottomA=bottom+wave*(.5+.5*Math.cos(a*9)),bottomB=bottom+wave*(.5+.5*Math.cos(b*9));
      const p=[radius*na[0],bottomA,radius*na[2]],q=[radius*nb[0],bottomB,radius*nb[2]],r=[radius*na[0],top,radius*na[2]],s=[radius*nb[0],top,radius*nb[2]];
      tri(p,q,r,na,nb,na,color);tri(r,q,s,na,nb,nb,color);
      tri([0,top,0],r,s,[0,1,0],[0,1,0],[0,1,0],color);
      tri([0,bottom,0],q,p,[0,-1,0],[0,-1,0],[0,-1,0],color);
    }
  }
  function sphere(center,scale,color){
    const point=(i,j)=>{const a=i/12*Math.PI,b=j/20*Math.PI*2,n=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];return [n.map((v,k)=>center[k]+v*scale[k]),n];};
    for(let i=0;i<12;i++)for(let j=0;j<20;j++){const a=point(i,j),b=point(i+1,j),c=point(i,j+1),d=point(i+1,j+1);tri(a[0],b[0],c[0],a[1],b[1],c[1],color);tri(c[0],b[0],d[0],c[1],b[1],d[1],color);}
  }
  cylinder(.82,-.54,.045,[.8,.67,.47]);
  [[.7,-.34,.34],[.52,-.025,.29],[.33,.25,.25]].forEach(([r,y,h])=>{
    cylinder(r,y,h,[.88,.77,.59]);cylinder(r+.009,y+h/2-.035,.075,[.99,.94,.82],48,.025);
    cylinder(r+.003,y-h/2+.04,.027,[.78,.62,.4]);
    for(let i=0;i<8;i++){const a=i/8*Math.PI*2;sphere([(r+.015)*Math.cos(a),y+h/2-.048,(r+.015)*Math.sin(a)],[.027,.038,.027],[.99,.94,.82]);}
  });
  cylinder(.025,.505,.24,[.95,.82,.6],18);
  sphere([0,.675,0],[.033,.072,.03],[1.,.65,.13]);
  sphere([0,.65,.004],[.018,.035,.018],[1.,.94,.55]);
  gl.useProgram(program);
  for(const [name,data] of [['aPosition',positions],['aNormal',normals],['aColor',colors]]){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);}
  const uTime=gl.getUniformLocation(program,'uTime'),uAspect=gl.getUniformLocation(program,'uAspect'),uTilt=gl.getUniformLocation(program,'uTilt');
  gl.enable(gl.DEPTH_TEST);art.classList.add('cake-webgl');
  let frame=null,last=0,clock=2,target=[0,0],tilt=[0,0],lost=false;
  const visible=()=>!document.hidden&&(!mobile.matches||document.body.dataset.view==='library');
  function draw(time){frame=null;if(!visible()||lost)return;if(last&&time-last<1000/(mobile.matches?24:30)){frame=requestAnimationFrame(draw);return;}
    const delta=last?Math.min((time-last)/1000,.1):0;last=time;if(!reduced.matches)clock+=delta;tilt=tilt.map((v,i)=>v+(target[i]-v)*.06);
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);gl.uniform1f(uTime,clock);gl.uniform1f(uAspect,canvas.width/canvas.height);gl.uniform2f(uTilt,...tilt);gl.drawArrays(gl.TRIANGLES,0,positions.length/3);
    if(!reduced.matches)frame=requestAnimationFrame(draw);
  }
  function start(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;if(visible())frame=requestAnimationFrame(draw);}
  function resize(){const dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.max(1,Math.round(art.clientWidth*dpr));canvas.height=Math.max(1,Math.round(art.clientHeight*dpr));gl.viewport(0,0,canvas.width,canvas.height);start();}
  art.addEventListener('pointermove',e=>{if(mobile.matches||reduced.matches)return;const r=art.getBoundingClientRect();target=[(e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5];},{passive:true});art.addEventListener('pointerleave',()=>target=[0,0]);
  document.addEventListener('visibilitychange',start);window.addEventListener('castle-scene-change',start);mobile.addEventListener('change',resize);reduced.addEventListener('change',start);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;if(frame!==null)cancelAnimationFrame(frame);art.classList.remove('cake-webgl');});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(art);else window.addEventListener('resize',resize);resize();
})();
