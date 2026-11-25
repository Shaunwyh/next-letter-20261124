(() => {
  'use strict';
  const canvas=document.getElementById('scene-canvas'),stage=document.getElementById('scene');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:899px)');
  let gl;try{gl=canvas.getContext('webgl',{alpha:true,antialias:!mobile.matches,powerPreference:'low-power',preserveDrawingBuffer:false});}catch(_){}
  if(!gl){stage.classList.add('no-webgl');return;}
  const vertex=`attribute vec3 aPosition;attribute vec3 aNormal;uniform float uTime;uniform float uScale;uniform float uAspect;uniform vec2 uPointer;uniform vec2 uCenter;varying vec3 vNormal;varying vec3 vWorld;
  mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0.,-s,0.,1.,0.,s,0.,c);}mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}
  void main(){mat3 rot=ry(uTime*.12+uPointer.x*.18)*rx(.7+sin(uTime*.14)*.18+uPointer.y*.15)*rz(-.28);vec3 p=rot*aPosition;vNormal=rot*aNormal;vWorld=p;float depth=4.4-p.z;vec2 pos=p.xy*uScale*3.4/depth;pos.x/=uAspect;gl_Position=vec4(pos+uCenter,-p.z*.07,1.);}`;
  const fragment=`precision mediump float;varying vec3 vNormal;varying vec3 vWorld;uniform vec3 uColor;uniform float uOpacity;void main(){vec3 n=normalize(vNormal);vec3 l=normalize(vec3(-.65,1.,1.));float diffuse=max(dot(n,l),0.);float rim=pow(1.-abs(n.z),2.);float spec=pow(max(dot(reflect(-l,n),vec3(0.,0.,1.)),0.),30.);vec3 c=uColor*(.45+diffuse*.6)+vec3(.98,.96,.83)*spec*.65+vec3(.7,.73,.57)*rim*.2;float bands=.04*sin(vWorld.y*36.+vWorld.x*16.);c+=bands;gl_FragColor=vec4(c,uOpacity);}`;
  function shader(type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error('scene shader');return s;}
  let program;try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('scene program');}catch(_){stage.classList.add('no-webgl');return;}
  gl.useProgram(program);
  const points=[],normals=[],indices=[],steps=mobile.matches?100:160,sides=mobile.matches?16:24;
  const center=t => {const r=.96+.18*Math.cos(3*t);return [r*Math.cos(2*t),r*Math.sin(2*t),.31*Math.sin(3*t)];};
  const normalize=v=>{const l=Math.hypot(...v)||1;return v.map(x=>x/l);};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  for(let i=0;i<=steps;i++){const t=i/steps*Math.PI*2,c=center(t),next=center(t+.001),tangent=normalize(next.map((v,j)=>v-c[j])),n=normalize(cross(tangent,[0,0,1])),b=normalize(cross(tangent,n));
    for(let j=0;j<=sides;j++){const phi=j/sides*Math.PI*2;const normal=n.map((v,k)=>v*Math.cos(phi)+b[k]*Math.sin(phi));normals.push(...normal);points.push(...c.map((v,k)=>v+normal[k]*.2));if(i<steps&&j<sides){const a=i*(sides+1)+j,d=a+sides+1;indices.push(a,d,a+1,a+1,d,d+1);}}
  }
  function attribute(name,data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);const a=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,3,gl.FLOAT,false,0,0);}
  attribute('aPosition',points);attribute('aNormal',normals);const index=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
  const uniforms={};['uTime','uScale','uAspect','uPointer','uCenter','uColor','uDark','uOpacity'].forEach(n=>uniforms[n]=gl.getUniformLocation(program,n));
  gl.enable(gl.DEPTH_TEST);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
  let frame=null,last=0,clock=0,pointer=[0,0],target=[0,0],level=0,lost=false;
  function resize(){if(!stage.clientWidth||!stage.clientHeight)return;const dpr=Math.min(devicePixelRatio||1,mobile.matches?1.25:1.75);canvas.width=Math.round(stage.clientWidth*dpr);canvas.height=Math.round(stage.clientHeight*dpr);gl.viewport(0,0,canvas.width,canvas.height);draw(0,true);}
  function draw(time,staticFrame=false){frame=null;if(lost)return;
    const state=window.CastleSceneState?.()||{visible:true,playing:false,category:'letter'};
    if(!state.visible)return;
    if(!staticFrame&&time-last<(mobile.matches?1000/30:1000/45)){frame=requestAnimationFrame(draw);return;}
    const delta=last?Math.min((time-last)/1000,.1):0;last=time;if(!reduce.matches&&state.playing)clock+=delta;
    level+=((state.level?.()||0)-level)*.12;pointer=pointer.map((v,i)=>v+(target[i]-v)*.045);
    const dark=document.documentElement.dataset.theme==='dark',aspect=canvas.width/canvas.height;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
    gl.uniform1f(uniforms.uTime,reduce.matches?3:clock+3);gl.uniform1f(uniforms.uScale,(mobile.matches?.45:.7)*(1+level*.045));gl.uniform1f(uniforms.uAspect,aspect);gl.uniform2f(uniforms.uPointer,...pointer);
    gl.uniform2f(uniforms.uCenter,mobile.matches?.72:.72,mobile.matches?.22:-.02);
    const color=state.category==='story'?[.64,.71,.55]:[.78,.68,.5];gl.uniform3f(uniforms.uColor,...color);gl.uniform1f(uniforms.uOpacity,state.full?.38:(dark?.9:.8)+Math.min(level,.3)*.18);
    gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
    if(!staticFrame&&!reduce.matches&&(state.playing||Math.abs(target[0]-pointer[0])>.002||Math.abs(target[1]-pointer[1])>.002))frame=requestAnimationFrame(draw);
  }
  function start(){if(frame!==null)cancelAnimationFrame(frame);frame=null;last=0;if(!document.hidden)frame=requestAnimationFrame(draw);}
  stage.addEventListener('pointermove',e=>{if(mobile.matches||reduce.matches)return;const r=stage.getBoundingClientRect();target=[(e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5];start();},{passive:true});
  stage.addEventListener('pointerleave',()=>{target=[0,0];start();});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(stage);else window.addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&frame!==null){cancelAnimationFrame(frame);frame=null;}else start();});
  window.addEventListener('castle-scene-change',start);reduce.addEventListener('change',start);
  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;if(frame!==null)cancelAnimationFrame(frame);stage.classList.add('no-webgl');});
  canvas.addEventListener('webglcontextrestored',()=>{location.reload();});
  resize();start();
})();
