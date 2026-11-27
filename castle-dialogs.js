// One page lock is shared by stacked native dialogs. Browser chrome is outside
// the page's control; freezing the dialog frame prevents its resize from reflowing content.
let snapshot=null;
const root=document.documentElement;
function frameHeight(){
 if(!CSS.supports('height','100svh'))return Math.round(innerHeight);
 const probe=document.createElement('div');probe.style.cssText='position:fixed;height:100svh;width:0;visibility:hidden;pointer-events:none';document.body.append(probe);
 const stableHeight=probe.getBoundingClientRect().height;probe.remove();return Math.round(Math.min(innerHeight,stableHeight));
}
function lockPage(){
 if(snapshot)return;
 snapshot={x:window.scrollX,y:window.scrollY,width:window.innerWidth,scrollBehavior:root.style.scrollBehavior};
 root.style.setProperty('--dialog-frame-height',`${frameHeight()}px`);
 root.style.setProperty('--dialog-page-top',`${-snapshot.y}px`);
 root.style.setProperty('--dialog-scrollbar-gap',`${Math.max(0,innerWidth-root.clientWidth)}px`);
 root.style.scrollBehavior='auto';root.classList.add('dialog-open');
}
function unlockPage(){
 if(!snapshot||document.querySelector('dialog[open]'))return;
 const saved=snapshot;snapshot=null;root.classList.remove('dialog-open');
 root.style.removeProperty('--dialog-page-top');root.style.removeProperty('--dialog-scrollbar-gap');root.style.removeProperty('--dialog-frame-height');
 window.scrollTo(saved.x,saved.y);requestAnimationFrame(()=>{if(!snapshot)root.style.scrollBehavior=saved.scrollBehavior;});
}
export function showDialog(dialog){
 if(dialog.open)return;
 lockPage();try{dialog.showModal();}catch(error){unlockPage();throw error;}
}
for(const dialog of document.querySelectorAll('dialog')){
 dialog.addEventListener('close',()=>queueMicrotask(unlockPage));
 // Prevent scroll chaining and elastic page movement at the edges on older iOS.
 let touch=null;
 dialog.addEventListener('touchstart',event=>{touch=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
 dialog.addEventListener('touchmove',event=>{
  if(!touch||event.touches.length!==1)return;
  const point=event.touches[0],dy=point.clientY-touch.y,dx=point.clientX-touch.x;touch={x:point.clientX,y:point.clientY};
  if(Math.abs(dx)>Math.abs(dy)||event.target.closest('input,textarea,[contenteditable="true"]'))return;
  for(let el=event.target;el&&dialog.contains(el);el=el.parentElement){
   if(el.scrollHeight>el.clientHeight+1&&/(auto|scroll)/.test(getComputedStyle(el).overflowY)){
    if(dy>0&&el.scrollTop>1||dy<0&&el.scrollTop+el.clientHeight<el.scrollHeight-1)return;
   }
  }
  if(event.cancelable)event.preventDefault();
 },{passive:false});
 dialog.addEventListener('touchend',()=>touch=null,{passive:true});dialog.addEventListener('touchcancel',()=>touch=null,{passive:true});
}
// A real rotation/width change gets a new frame; toolbar-only height changes do not.
window.addEventListener('resize',()=>{
 if(!snapshot||Math.abs(innerWidth-snapshot.width)<2)return;
 snapshot.width=innerWidth;root.style.setProperty('--dialog-frame-height',`${frameHeight()}px`);
},{passive:true});
