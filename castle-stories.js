// Curated little scenes. No chat service or recording is involved.
export const SCENES = {
  welcome: [
    {speaker:'princess',name:'迷湖公主',text:'你来啦，给你留了最好的一块。',pose:'welcome',effect:'welcome',duration:4.2},
    {speaker:'cat',name:'善逸',text:'盘子推过来了。今天也要甜一点。',pose:'serve',effect:'welcome',duration:4.2},
    {speaker:'princess',name:'小蛋糕',text:'坐近一点，要不要一起听个故事？',pose:'invite',effect:'welcome',duration:4.4}
  ],
  mischief: [
    {speaker:'cat',name:'咪了个咪',text:'我只是来检查一下甜度。',pose:'taste',effect:'mischief',duration:3.8},
    {speaker:'princess',name:'迷湖宝宝',text:'善逸，那你胡子上怎么有奶油？',pose:'tease',effect:'mischief',duration:4},
    {speaker:'cat',name:'喵',text:'这是……工作痕迹。',pose:'caught',effect:'crumbs',duration:4.2}
  ],
  starlight: [
    {speaker:'cat',name:'我妻善逸',text:'小蛋糕，月亮上班了，我也来值夜。',pose:'guard',effect:'starlight',duration:4.2},
    {speaker:'princess',name:'小迷湖',text:'把今天的心事，先放在这里吧。',pose:'yawn',effect:'starlight',duration:4.2},
    {speaker:'cat',name:'善逸',text:'我守着，你去做个好梦。',pose:'sleep',effect:'starlight',duration:4.6}
  ],
  stars: [
    {speaker:'cat',name:'喵',text:'刚刚有颗星星，落在你这里了。',pose:'chase',effect:'stars',duration:4},
    {speaker:'princess',name:'小迷湖',text:'接住啦。给你留一个小小的愿望。',pose:'catch',effect:'stars',duration:4.5}
  ],
  flowers: [
    {speaker:'princess',name:'小蛋糕',text:'今天的花开了，想先让你看看。',pose:'garden',effect:'flowers',duration:4.2},
    {speaker:'cat',name:'善逸',text:'我没碰花。我只是闻一闻。',pose:'sniff',effect:'flowers',duration:4.2}
  ],
  company: [
    {speaker:'princess',name:'小迷湖',text:'好呀，今天可以慢慢待在这里。',pose:'read',effect:'company',duration:4.2},
    {speaker:'cat',name:'善逸',text:'那我把尾巴收好，给你腾个位置。',pose:'nap',effect:'company',duration:4.5}
  ],
  listening: [
    {speaker:'cat',name:'善逸',text:'嘘，正在讲呢。我陪你一起听。',pose:'listen',effect:'listening',duration:4.5}
  ],
  listeningPrincess: [
    {speaker:'princess',name:'迷湖宝宝',text:'这段讲完，再陪我坐一会儿，好不好？',pose:'listen',effect:'listening',duration:4.5}
  ],
  fresh: [
    {speaker:'cat',name:'咪了个咪',text:'城堡收到新的故事啦，要一起听吗？',pose:'invite',effect:'welcome',duration:4.5}
  ]
};

export const IDLE_SCENES = ['read','chase','garden','nap'];

export function chooseScene(actor, {bedtime=false,night=false,playing=false,fresh=false}={}, previous='') {
  if(playing)return actor==='cat'?'listening':'listeningPrincess';
  if(bedtime)return 'starlight';
  if(actor==='cat'&&fresh&&previous!=='fresh')return 'fresh';
  const choices=actor==='princess'?['welcome','flowers','stars']:['mischief','stars',...(night?['starlight']:['welcome'])];
  return choices[(Math.max(-1,choices.indexOf(previous))+1)%choices.length];
}

// Carry time across dialogue turns, even after a slow frame, without leaving
// old scenes/timers running when the user changes characters.
export function advanceStory(scene, index, elapsed, delta) {
  const lines=SCENES[scene];
  if(!lines)return {index:0,elapsed:0,done:true};
  elapsed+=Math.max(0,delta);
  while(index<lines.length&&elapsed>=lines[index].duration){elapsed-=lines[index].duration;index++;}
  return {index,elapsed,done:index>=lines.length};
}
