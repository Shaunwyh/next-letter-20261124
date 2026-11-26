import {SCENES, IDLE_SCENES, chooseScene, advanceStory} from './castle-stories.js?v=castle-18';

export function createTheatre(host) {
  const dialogue=document.getElementById('scene-dialogue'),speech=document.getElementById('scene-speech');
  const speaker=document.getElementById('scene-speaker'),text=document.getElementById('scene-text');
  const replies=document.getElementById('scene-replies'),hint=document.getElementById('scene-hint');
  const audio=document.getElementById('audio'),player=document.getElementById('player-sheet');
  const actors={princess:document.getElementById('scene-princess'),cat:document.getElementById('scene-cat')};
  const names={princess:'迷湖公主',cat:'我妻善逸'};
  const last={princess:'',cat:''};
  let active=null,line=0,elapsed=0,clock=0,idleIndex=0,idleElapsed=0,replyTime=0,lastTap=-1;
  let onWake=()=>{},visible=true;
  const context=(includeFresh=false)=>({bedtime:host.dataset.bedtime==='true',night:document.documentElement.dataset.theme==='dark',playing:!audio.paused&&!audio.ended,fresh:includeFresh&&(window.CASTLE_LIBRARY||[]).some(t=>Date.now()-Date.parse(t.publishedAt)>=0&&Date.now()-Date.parse(t.publishedAt)<6*3600*1000)});
  function updateHint(){hint.textContent=context().playing?'他们在陪你一起听':'轻点公主或猫咪，说说话';}
  function showLine(){
    const turn=SCENES[active][line];
    dialogue.dataset.speaker=turn.speaker;speaker.textContent=turn.name||names[turn.speaker];text.textContent=turn.text;
    speech.setAttribute('aria-label',names[turn.speaker]+'：'+turn.text+' 继续对话');
    host.dataset.scene=turn.effect;host.dataset.speaker=turn.speaker;host.dataset.talking='true';
    dialogue.hidden=false;hint.hidden=true;replies.hidden=true;
    for(const [actor,button] of Object.entries(actors))button.setAttribute('aria-pressed',String(actor===turn.speaker));
  }
  function stop(withReplies=false){
    active=null;elapsed=0;replyTime=withReplies?14:0;
    dialogue.hidden=true;replies.hidden=!withReplies;hint.hidden=withReplies;host.dataset.talking='false';
    for(const button of Object.values(actors))button.setAttribute('aria-pressed','false');
    host.dataset.scene=context().playing?'listening':context().bedtime?'starlight':'idle';updateHint();
    document.getElementById('scene-listen-label').textContent=context().playing?'继续听':'听一篇';
  }
  function begin(actor){
    if(clock-lastTap<.28)return;lastTap=clock;
    const next=chooseScene(actor,context(true),last[actor]);last[actor]=next;
    active=next;line=0;elapsed=0;replyTime=0;idleElapsed=0;showLine();onWake();
  }
  function nextLine(){if(!active)return;line++;elapsed=0;if(line>=SCENES[active].length)stop(true);else showLine();onWake();}
  for(const [actor,button] of Object.entries(actors))button.addEventListener('click',()=>begin(actor));
  speech.addEventListener('click',nextLine);
  document.getElementById('scene-dismiss').addEventListener('click',()=>{stop();idleElapsed=0;onWake();});
  document.getElementById('scene-stay').addEventListener('click',()=>{active='company';line=0;elapsed=0;idleIndex=3;idleElapsed=0;showLine();onWake();});
  document.getElementById('scene-listen').addEventListener('click',()=>{stop();window.dispatchEvent(new CustomEvent('castle-play-request',{detail:{category:'story'}}));});
  for(const event of ['play','pause','ended'])audio.addEventListener(event,()=>{if(event==='play'||!active)stop();updateHint();onWake();});
  window.addEventListener('castle-clock-change',()=>{stop();idleElapsed=0;onWake();});
  window.addEventListener('theme-change',()=>{if(!active)stop();onWake();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&!player.open){stop();onWake();}});
  function tick(delta){
    clock+=delta;
    if(active){const state=advanceStory(active,line,elapsed,delta);elapsed=state.elapsed;if(state.done)stop(true);else if(state.index!==line){line=state.index;showLine();}}
    else {idleElapsed+=delta;if(idleElapsed>12){idleElapsed=0;idleIndex=(idleIndex+1)%IDLE_SCENES.length;}}
    replyTime=Math.max(0,replyTime-delta);
    if(!replyTime&&!replies.hidden){replies.hidden=true;hint.hidden=false;}
    const ctx=context(),turn=active?SCENES[active][line]:null;
    return {pose:turn?.pose||(ctx.playing?'listen':ctx.bedtime?'sleep':IDLE_SCENES[idleIndex]),effect:turn?.effect||(ctx.bedtime?'starlight':ctx.playing?'listening':'idle'),speaker:turn?.speaker||null,elapsed:active?elapsed:idleElapsed,talking:!!active};
  }
  // Rendering supplies elapsed visible time. If WebGL is unavailable, the
  // fallback clock still lets the same accessible dialogue buttons work.
  let fallbackTimer,fallbackMode=false,lastTime=performance.now();
  function fallback(){
    clearTimeout(fallbackTimer);const now=performance.now(),running=visible&&!document.hidden&&!player.open;
    if(running)tick(Math.min((now-lastTime)/1000,.15));lastTime=now;
    if(running)fallbackTimer=setTimeout(fallback,100);
  }
  return {
    tick,setWake(fn){onWake=fn;},setVisible(value){visible=value;if(fallbackMode)fallback();},
    enableFallback(){
      if(fallbackMode)return;fallbackMode=true;host.dataset.renderer='fallback';onWake=fallback;
      new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;fallback();}).observe(host);
      document.addEventListener('visibilitychange',fallback);player.addEventListener('close',fallback);fallback();
    },init(){stop();}
  };
}
