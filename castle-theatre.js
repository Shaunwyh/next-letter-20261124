import {STORIES,SPEAKERS,INVITATIONS,nextStory,beginStory,boostStory,advanceStory,storyProgress,idlePreview} from './castle-stories.js?v=castle-19';

export function createTheatre(host){
  const $=id=>document.getElementById(id),dialogue=$('scene-dialogue'),speech=$('scene-speech');
  const speaker=$('scene-speaker'),text=$('scene-text'),announcement=$('scene-announcement');
  const replies=$('scene-replies'),invite=$('scene-invite'),hint=$('scene-hint'),tempo=$('scene-tempo');
  const audio=$('audio'),player=$('player-sheet'),motion=matchMedia('(prefers-reduced-motion: reduce)');
  let active=null,previous='',idleStory='cake',idleElapsed=0,replyTime=0,boostTime=0,lastIndex=-1,visible=true;
  let onWake=()=>{},fallbackMode=false,fallbackTimer,lastTime=performance.now();
  const context=(includeFresh=false)=>({playing:!audio.paused&&!audio.ended,bedtime:host.dataset.bedtime==='true',fresh:includeFresh&&(window.CASTLE_LIBRARY||[]).some(t=>{const age=Date.now()-Date.parse(t.publishedAt);return age>=0&&age<6*3600*1000;})});
  function updateIdle(){
    idleStory=nextStory(context(true),previous);hint.textContent=INVITATIONS[idleStory];
    $('scene-invite-caption').textContent=context().playing?'轻点他们，看看这段小剧情':'轻点他们，看看怎么回事';
    $('scene-listen-label').textContent=context().playing?'继续听':'听一篇';
  }
  function showBeat(){
    const beat=STORIES[active.story][active.index];lastIndex=active.index;
    speaker.textContent=SPEAKERS[beat.speaker];text.textContent='';dialogue.dataset.speaker=beat.speaker;
    announcement.textContent=SPEAKERS[beat.speaker]+'：'+beat.text;
    speech.setAttribute('aria-label',announcement.textContent+'，轻点加快这段互动');
    dialogue.hidden=false;invite.hidden=true;replies.hidden=true;
    host.dataset.interaction='playing';host.dataset.story=active.story;host.dataset.beat=String(active.index);
  }
  function finish(completed=false){
    if(completed&&active)previous=active.story;
    active=null;lastIndex=-1;idleElapsed=0;replyTime=completed?14:0;boostTime=0;
    dialogue.hidden=true;tempo.hidden=true;replies.hidden=!completed;invite.hidden=completed;
    host.dataset.interaction=completed?'complete':'idle';host.dataset.speed='1';delete host.dataset.boost;
    $('scene-progress').style.width='0%';updateIdle();
  }
  function interact(){
    if(active){
      active=boostStory(active);boostTime=1.5;tempo.hidden=false;tempo.textContent='加快啦';
      host.dataset.speed=active.speed.toFixed(2);host.dataset.boost=host.dataset.boost==='a'?'b':'a';
    }else{
      active=beginStory(nextStory(context(true),previous));replyTime=0;boostTime=0;idleElapsed=0;
      host.dataset.speed='1';showBeat();
    }
    onWake();
  }
  for(const id of ['scene-princess','scene-cat','scene-trigger','scene-invite','scene-stay'])$(id).addEventListener('click',interact);
  speech.addEventListener('click',interact);
  $('scene-dismiss').addEventListener('click',()=>{finish(false);onWake();});
  $('scene-listen').addEventListener('click',()=>{finish(false);window.dispatchEvent(new CustomEvent('castle-play-request',{detail:{category:'story'}}));});
  for(const event of ['play','pause','ended'])audio.addEventListener(event,()=>{if(!active)updateIdle();onWake();});
  for(const event of ['castle-clock-change','theme-change'])window.addEventListener(event,()=>{if(!active)updateIdle();onWake();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active&&!player.open){finish(false);onWake();}});
  function tick(delta){
    const ctx=context();
    if(active){
      active=advanceStory(active,delta);
      if(active.done)finish(true);
      else{
        if(active.index!==lastIndex)showBeat();
        const beat=STORIES[active.story][active.index],count=Math.min(beat.text.length,motion.matches?beat.text.length:Math.floor(active.elapsed*16)+1);
        const visibleText=beat.text.slice(0,count);if(text.textContent!==visibleText)text.textContent=visibleText;
        $('scene-progress').style.width=(storyProgress(active)*100)+'%';
      }
    }else idleElapsed+=delta;
    replyTime=Math.max(0,replyTime-delta);boostTime=Math.max(0,boostTime-delta);
    if(!boostTime)tempo.hidden=true;
    if(!active&&!replyTime&&!replies.hidden){replies.hidden=true;invite.hidden=false;host.dataset.interaction='idle';updateIdle();}
    const beat=active?STORIES[active.story][active.index]:idlePreview(idleStory,motion.matches?0:idleElapsed);
    host.dataset.scene=beat.castle;
    return {...beat,story:active?.story||idleStory,beat:active?.index||0,elapsed:active?.elapsed||idleElapsed,progress:active?active.elapsed/beat.duration:(idleElapsed%12)/12,speed:active?.speed||1,talking:!!active,speaker:active?beat.speaker:null,playing:ctx.playing,idle:!active};
  }
  function fallback(){
    clearTimeout(fallbackTimer);const now=performance.now(),running=visible&&!document.hidden&&!player.open;
    if(running)tick(Math.min((now-lastTime)/1000,.15));lastTime=now;if(running)fallbackTimer=setTimeout(fallback,100);
  }
  return {tick,setWake(fn){onWake=fn;},setVisible(value){visible=value;if(fallbackMode)fallback();},
    enableFallback(){if(fallbackMode)return;fallbackMode=true;host.dataset.renderer='fallback';onWake=fallback;new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;fallback();}).observe(host);document.addEventListener('visibilitychange',fallback);player.addEventListener('close',fallback);fallback();},
    init(){finish(false);}
  };
}
