export const SPEAKERS={princess:'迷湖公主',cat:'我妻善逸'};

// Every beat directs both actors and a real prop in the same little story.
export const STORIES={
  cake:[
    {speaker:'princess',text:'我妻善逸，蛋糕怎么少了一角？',princess:'inspect',cat:'freeze',castle:'notice',prop:'cake',duration:4.6},
    {speaker:'cat',text:'……门刚才动了。会不会是城堡吃的？',princess:'lookDoor',cat:'blameDoor',castle:'rattle',prop:'cake',duration:4.8},
    {speaker:'princess',text:'那我先把“城堡”嘴边的奶油擦掉。',princess:'wipe',cat:'shy',castle:'spotlight',prop:'wipe',duration:4.6},
    {speaker:'cat',text:'好吧，是我。下一块，我们一起吃。',princess:'laugh',cat:'offer',castle:'serve',prop:'serve',duration:4.4},
    {speaker:'princess',text:'成交。也给屏幕前的你留一块。',princess:'invite',cat:'welcome',castle:'celebrate',prop:'share',duration:4.4}
  ],
  stars:[
    {speaker:'cat',text:'迷湖公主，屋顶那颗星星跑下来了！',princess:'followStar',cat:'chase',castle:'starAway',prop:'fallingStar',duration:4.6},
    {speaker:'princess',text:'你接下面，我接上面。别让它摔着。',princess:'catch',cat:'catchLow',castle:'starAway',prop:'catchStar',duration:4.4},
    {speaker:'cat',text:'接到了！可是……我够不到屋顶。',princess:'takeStar',cat:'holdStar',castle:'waiting',prop:'holdStar',duration:4.4},
    {speaker:'princess',text:'借我一下。你看，它回家了。',princess:'returnStar',cat:'lookUp',castle:'starHome',prop:'returnStar',duration:4.8},
    {speaker:'cat',text:'灯都亮了！刚才那下配合，真不错。',princess:'laugh',cat:'welcome',castle:'celebrate',prop:'roofStar',duration:4.4}
  ],
  welcome:[
    {speaker:'cat',text:'有人来啦！迷湖公主，我去敲门。',princess:'lookDoor',cat:'ringBell',castle:'bell',prop:'bell',duration:4.6},
    {speaker:'princess',text:'慢一点，门还没打开，你就蹦过去了。',princess:'reachCat',cat:'hopBack',castle:'opening',prop:'bell',duration:4.6},
    {speaker:'cat',text:'开了！灯也亮了。快进来，位置留好了。',princess:'invite',cat:'welcome',castle:'welcome',prop:'serve',duration:4.8},
    {speaker:'princess',text:'坐这儿吧。想听故事，还是先陪我们待会儿？',princess:'invite',cat:'settle',castle:'warm',prop:'share',duration:4.8}
  ],
  bedtime:[
    {speaker:'princess',text:'眼睛快睁不开了……我妻善逸，关灯吧。',princess:'yawn',cat:'lookUp',castle:'warm',prop:'none',duration:4.6},
    {speaker:'cat',text:'这一盏、这一盏……门口的留着，好不好？',princess:'nod',cat:'switchLights',castle:'lightsOut',prop:'none',duration:4.8},
    {speaker:'princess',text:'好。这样你回来，也不会找不到门。',princess:'sleep',cat:'curl',castle:'nightlight',prop:'blanket',duration:4.6},
    {speaker:'cat',text:'那我们先睡啦。你也别熬太久，晚安。',princess:'sleep',cat:'sleep',castle:'nightlight',prop:'blanket',duration:4.6}
  ],
  listening:[
    {speaker:'cat',text:'我把门轻轻关上，咱们接着听。',princess:'read',cat:'settle',castle:'closing',prop:'book',duration:4.6},
    {speaker:'princess',text:'过来一点，你趴那儿会挡住门。',princess:'beckon',cat:'scoot',castle:'warm',prop:'book',duration:4.4},
    {speaker:'cat',text:'挪好了。你听故事，我就在旁边。',princess:'read',cat:'curl',castle:'warm',prop:'book',duration:4.4}
  ],
  company:[
    {speaker:'princess',text:'我读到这里了。你也过来看看？',princess:'read',cat:'peekBook',castle:'warm',prop:'book',duration:4.6},
    {speaker:'cat',text:'我来看……不是来趴在书上的。',princess:'protectBook',cat:'leanBook',castle:'notice',prop:'book',duration:4.6},
    {speaker:'princess',text:'那就挨着坐。给你们都留点位置。',princess:'beckon',cat:'scoot',castle:'warm',prop:'book',duration:4.4},
    {speaker:'cat',text:'这回不闹了。我们慢慢待一会儿。',princess:'read',cat:'curl',castle:'warm',prop:'book',duration:4.6}
  ]
};
export const REGULAR_STORIES=['cake','stars','welcome'];

// Entry point is deliberately independent of which actor was tapped.
export function nextStory({playing=false,bedtime=false,fresh=false}={},previous=''){
  const pool=playing?['listening','company']:bedtime?['bedtime','stars']:REGULAR_STORIES;
  if(fresh&&!playing&&!bedtime&&previous!=='welcome')return 'welcome';
  return pool[(pool.indexOf(previous)+1)%pool.length];
}
export function beginStory(story){return {story,index:0,elapsed:0,speed:1,done:false};}
export function boostStory(state){return state.done?state:{...state,speed:Math.min(2.35,state.speed+.45)};}
export function advanceStory(state,delta){
  if(state.done)return state;
  let {index,elapsed}=state;const beats=STORIES[state.story];elapsed+=Math.max(0,delta)*state.speed;
  while(index<beats.length&&elapsed>=beats[index].duration){elapsed-=beats[index].duration;index++;}
  return {...state,index,elapsed,done:index>=beats.length};
}
export function storyProgress(state){
  const beats=STORIES[state.story],total=beats.reduce((sum,beat)=>sum+beat.duration,0);
  return Math.min(1,(beats.slice(0,state.index).reduce((sum,beat)=>sum+beat.duration,0)+state.elapsed)/total);
}
export function idlePreview(story,elapsed){
  const phase=elapsed%12;
  if(story==='bedtime')return {princess:'sleep',cat:phase<8?'curl':'sleep',castle:'nightlight',prop:'blanket'};
  if(story==='listening'||story==='company')return {princess:'read',cat:phase<5?'peekBook':'curl',castle:'warm',prop:'book'};
  if(story==='stars')return {princess:phase<4?'followStar':phase<8?'beckon':'neutral',cat:phase<4?'lookUp':phase<8?'tinyChase':'welcome',castle:'starTease',prop:'teaserStar'};
  if(story==='welcome')return {princess:phase<5?'lookDoor':'beckon',cat:phase<5?'teaseBell':phase<8?'hopBack':'welcome',castle:'teaseBell',prop:'bell'};
  return {princess:phase<4?'read':phase<8?'inspect':'beckon',cat:phase<4?'sneak':phase<8?'freeze':'welcome',castle:phase<4?'warm':'notice',prop:phase<4?'bookCake':'cake'};
}
export const INVITATIONS={cake:'蛋糕少了一角，谁偷吃了？',stars:'屋顶的星星，好像想下来玩。',welcome:'门铃响了，他们在等你进来。',bedtime:'陪他们说声晚安吧。',listening:'听着故事，也看看他们在忙什么。',company:'他们挤在一起，正看同一本书。'};
