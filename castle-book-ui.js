import {clockState} from './castle-clock.js?v=castle-22';

const card = document.getElementById('album-art');
const chapters = [
  {title:'城堡里，有人在等你',description:'公主推开小小的门，猫咪已经等了好久。'},
  {title:'替你接住，一颗星星',description:'星星落下来的时候，猫咪先伸出了小爪子。'},
  {title:'小小的靠近，刚刚好',description:'猫咪绕了好大一圈，最后还是窝进公主怀里。'},
  {title:'留一盏灯，明天再见',description:'城堡慢慢安静下来，今晚的故事先讲到这里。'}
];
let bedtime = clockState().isBedtime;
let index = bedtime ? 3 : 0;

function renderChapter(next) {
  index = next;
  const chapter = chapters[index];
  card.dataset.chapter = String(index);
  card.dataset.night = String(document.documentElement.dataset.theme === 'dark' || bedtime || index === 3);
  document.getElementById('chapter-title').textContent = chapter.title;
  document.getElementById('chapter-description').textContent = chapter.description;
  document.getElementById('chapter-index').textContent = ['第一幕','第二幕','第三幕','第四幕'][index];
  document.querySelectorAll('[data-page]').forEach(button => {
    if (Number(button.dataset.page) === index) button.setAttribute('aria-current','step');
    else button.removeAttribute('aria-current');
  });
  document.getElementById('book-previous').disabled = index === 0;
  document.getElementById('book-next').disabled = index === chapters.length - 1;
  const image = document.getElementById('book-fallback-art');
  image.src = `assets/storybook/spread-${index}.webp`;
  image.alt = chapter.title;
  const copy = document.querySelector('.book-chapter-copy');
  copy.classList.remove('changing');
  requestAnimationFrame(() => copy.classList.add('changing'));
}

function appearance() {
  card.dataset.bedtime = String(bedtime);
  card.dataset.night = String(document.documentElement.dataset.theme === 'dark' || bedtime || index === 3);
  window.dispatchEvent(new CustomEvent('book-appearance',{
    detail:{night:document.documentElement.dataset.theme === 'dark' || bedtime,bedtime}
  }));
}

window.addEventListener('theme-change',appearance);
window.addEventListener('castle-clock-change',event => {
  const enteredBedtime = !bedtime && event.detail.isBedtime;
  bedtime = event.detail.isBedtime;
  appearance();
  if (enteredBedtime) window.dispatchEvent(new CustomEvent('book-request',{detail:{target:3}}));
});
window.addEventListener('book-chapter',event => {
  const changed = index !== event.detail.index;
  renderChapter(event.detail.index);
  if (changed) document.getElementById('gesture-hint').classList.add('used');
});

document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click',() => {
  window.dispatchEvent(new CustomEvent('book-request',{detail:{target:Number(button.dataset.page)}}));
}));
document.getElementById('book-previous').addEventListener('click',() => {
  window.dispatchEvent(new CustomEvent('book-request',{detail:{direction:-1}}));
});
document.getElementById('book-next').addEventListener('click',() => {
  window.dispatchEvent(new CustomEvent('book-request',{detail:{direction:1}}));
});
document.querySelectorAll('[data-book-actor]').forEach(button => button.addEventListener('click',() => {
  window.dispatchEvent(new CustomEvent('book-character',{detail:{actor:button.dataset.bookActor}}));
}));
renderChapter(index);
appearance();
