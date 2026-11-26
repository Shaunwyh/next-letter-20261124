const identity={cat:'我是善逸',princess:'我是迷湖公主',castle:'这里是迷湖公主的蛋糕城堡'};

// One gesture owns a complete movement. Repeated taps add a small reaction,
// rather than resetting a jump while the cat is in the princess's arms.
const clips={
  cat:[[.45,'catNotice'],[1.9,'catHello'],[.8,'rest']],
  princess:[[.85,'curtsy'],[2.0,'princessHello'],[.7,'rest']],
  castle:[[.45,'castleSquash'],[1.05,'castleSpring'],[1.8,'castleGlow'],[.5,'rest']],
  hug:[[.8,'prepareHug'],[.85,'leapHug'],[2.7,'cuddle'],[.95,'releaseHug'],[.8,'togetherWave']],
  star:[[.9,'starDrop'],[1.0,'starCatch'],[1.2,'starShare'],[1.4,'starReturn'],[.8,'togetherWave']],
  peek:[[1.1,'hide'],[1.2,'peek'],[.75,'peekJump'],[1.5,'giggle'],[.6,'rest']],
  nightCat:[[.6,'catNotice'],[1.5,'catStretch'],[1.4,'catCurl']],
  nightPrincess:[[1.5,'princessYawn'],[1.25,'nightWave'],[1.5,'princessSleep']],
  nightCastle:[[2.8,'lightsOut'],[1.4,'nightRest']],
  nightHug:[[1.0,'prepareHug'],[1.25,'leapHug'],[1.4,'cuddle'],[1.2,'sitTogether'],[3.4,'sleepTogether']],
};

export function sampleGesture(name,elapsed){
  const clip=clips[name]||clips.hug;
  let offset=0;
  for(let index=0;index<clip.length;index++){
    const [duration,pose]=clip[index];
    if(elapsed<offset+duration)return {pose,elapsed:Math.max(0,elapsed-offset),progress:Math.max(0,(elapsed-offset)/duration),index,done:false};
    offset+=duration;
  }
  return {pose:clip.at(-1)[1],elapsed:clip.at(-1)[0],progress:1,index:clip.length-1,done:true};
}

export function createInteractions(host){
  const bubble=document.getElementById('scene-identity'),announcement=document.getElementById('scene-announcement');
  const stage=document.getElementById('scene-stage'),player=document.getElementById('player-sheet');
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null,idleTime=0,cycle=0,pulse=0,pulseTarget='all',bubbleTime=0,nightHold=0;
  let wake=()=>{},hitTest=null,visible=true,fallbackMode=false,fallbackTimer,last=performance.now();
  let wasBedtime=host.dataset.bedtime==='true';
  function showIdentity(target){
    if(!identity[target])return;
    bubble.textContent=identity[target];bubble.dataset.actor=target;bubble.hidden=false;
    bubbleTime=target==='castle'?3.2:2.5;announcement.textContent=identity[target];
  }
  function interact(target='all'){
    if(!['cat','princess','castle','all'].includes(target))target='all';
    showIdentity(target);pulse=1;pulseTarget=target;
    if(active&&(active.target===target||active.target==='all')){wake();return;}
    const night=host.dataset.bedtime==='true';
    const name=night?({cat:'nightCat',princess:'nightPrincess',castle:'nightCastle',all:'nightHug'})[target]:target==='all'?['hug','star','peek'][cycle++%3]:target;
    active={name,target,elapsed:0,night};idleTime=0;nightHold=0;
    host.dataset.interaction='active';host.dataset.gesture=name;wake();
  }
  host.addEventListener('click',event=>{
    const button=event.target.closest('[data-scene-target]');
    const target=event.detail===0&&button?button.dataset.sceneTarget:hitTest?hitTest(event):button?.dataset.sceneTarget||'all';
    interact(target);
  });
  function tick(delta){
    const night=host.dataset.bedtime==='true';
    if(night!==wasBedtime){active=null;nightHold=0;idleTime=0;bubble.hidden=true;bubbleTime=0;wasBedtime=night;}
    pulse=Math.max(0,pulse-delta*2.5);bubbleTime=Math.max(0,bubbleTime-delta);
    if(!bubbleTime)bubble.hidden=true;
    let state;
    if(active){
      active.elapsed+=delta;const sampled=sampleGesture(active.name,active.elapsed);
      state={...sampled,gesture:active.name,target:active.target,night,active:true};
      if(sampled.done){
        if(active.name==='nightHug')nightHold=Infinity;
        active=null;idleTime=0;host.dataset.interaction='idle';
      }
    }else{
      idleTime+=delta;nightHold=Math.max(0,nightHold-delta);
      const moment=idleTime%13,variation=Math.floor(idleTime/13)%3;
      let pose='rest';
      if(night)pose=nightHold?'sleepTogether':moment>9.5&&moment<11.5?'princessYawn':'nightRest';
      else if(moment>8&&moment<11)pose=['groom','adjustCrown','pet'][variation];
      state={pose,elapsed:moment,progress:(moment-8)/3,gesture:'idle',target:'none',night,active:false};
    }
    state.pulse=motion.matches?0:pulse;state.pulseTarget=pulseTarget;state.reduced=motion.matches;
    host.dataset.gesture=state.gesture;host.dataset.pose=state.pose;
    host.dataset.scene=night?'nightlight':['cuddle','togetherWave','castleGlow','giggle'].includes(state.pose)?'celebrate':'calm';
    return state;
  }
  function fallback(){
    clearTimeout(fallbackTimer);const now=performance.now();
    if(visible&&!document.hidden&&!player.open)tick(Math.min((now-last)/1000,.2));
    last=now;
    if(visible&&!document.hidden&&!player.open)fallbackTimer=setTimeout(fallback,100);
  }
  return {tick,interact,setWake(fn){wake=fn;},setHitTest(fn){hitTest=fn;},
    setVisible(value){visible=value;if(fallbackMode)fallback();},
    placeIdentity(anchors){
      if(bubble.hidden)return;
      const anchor=anchors[bubble.dataset.actor];if(!anchor)return;
      const width=bubble.offsetWidth,height=bubble.offsetHeight;
      let x=Math.max(12,Math.min(host.clientWidth-width-12,anchor.x-width/2));
      if(bubble.dataset.actor==='cat'&&anchor.faceRight+width+20<host.clientWidth)x=Math.max(x,anchor.faceRight+8);
      const note=document.getElementById('bedtime-note');
      const minY=host.dataset.bedtime==='true'?note.offsetTop+note.offsetHeight+8:54;
      const y=Math.max(minY,anchor.y-height-14);
      bubble.style.left=x+'px';bubble.style.top=y+'px';
      bubble.style.setProperty('--tail',Math.max(16,Math.min(width-16,anchor.x-x))+'px');
    },
    enableFallback(){
      if(fallbackMode)return;fallbackMode=true;host.dataset.renderer='fallback';wake=fallback;hitTest=null;
      new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;fallback();}).observe(stage);
      document.addEventListener('visibilitychange',fallback);player.addEventListener('close',fallback);
      bubble.style.left='20px';bubble.style.top='105px';fallback();
    },
  };
}
