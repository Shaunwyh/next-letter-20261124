const dateFormatter=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'});
const weekdayFormatter=new Intl.DateTimeFormat('zh-CN',{timeZone:'Asia/Shanghai',weekday:'short'});

export function clockState(date=new Date()){
  const parts=Object.fromEntries(dateFormatter.formatToParts(date).map(p=>[p.type,p.value]));
  const hour=Number(parts.hour);
  return {date:`${parts.year}.${parts.month}.${parts.day} ${weekdayFormatter.format(date)}`,time:`${parts.hour}:${parts.minute}:${parts.second}`,isBedtime:hour>=2&&hour<5,hour};
}

if(typeof document!=='undefined'){
  const host=document.getElementById('album-art'),clock=document.getElementById('castle-clock'),note=document.getElementById('bedtime-note');
  const preview=document.querySelector('meta[name="design-clock-preview"]')?.content;
  const previewEpoch=preview?Date.parse(preview):null,started=Date.now();
  let timer,lastState;
  function update(){
    const now=new Date(previewEpoch!==null?previewEpoch+Date.now()-started:Date.now()),state=clockState(now);
    clock.dateTime=now.toISOString();document.getElementById('clock-date').textContent=state.date;document.getElementById('clock-time').textContent=state.time;
    if(lastState!==state.isBedtime){
      lastState=state.isBedtime;host.dataset.bedtime=String(state.isBedtime);note.hidden=!state.isBedtime;
      window.dispatchEvent(new CustomEvent('castle-clock-change',{detail:state}));
    }
    clearTimeout(timer);if(!document.hidden)timer=setTimeout(update,1000-Date.now()%1000);
  }
  document.addEventListener('visibilitychange',()=>{clearTimeout(timer);if(!document.hidden)update();});update();
}
