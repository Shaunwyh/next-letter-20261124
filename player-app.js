(() => {
  'use strict';
  const tracks = window.CASTLE_LIBRARY || [];
  const $ = id => document.getElementById(id);
  const audio = $('audio'), scroller = $('lyrics-scroll'), lyrics = $('lyrics-list');
  const storageKey = 'little-castle-player-v1';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 760px)');
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
  const themePreference = matchMedia('(prefers-color-scheme: dark)');
  let manualTheme = false;
  try { manualTheme = ['light','dark'].includes(localStorage.getItem('little-castle-theme')); } catch (_) {}
  function setTheme(theme, remember = false) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('theme-toggle').setAttribute('aria-pressed', String(dark));
    $('theme-toggle').setAttribute('aria-label', dark ? '切换到日间模式' : '切换到夜间模式');
    $('theme-toggle').title = dark ? '切换到日间模式' : '切换到夜间模式';
    $('theme-label').textContent = dark ? '夜间' : '日间';
    $('theme-icon').setAttribute('href', dark ? '#i-moon' : '#i-sun');
    document.querySelector('meta[name="theme-color"]').content = dark ? '#171a18' : '#f8f6f2';
    if (remember) { manualTheme = true; try { localStorage.setItem('little-castle-theme', theme); } catch (_) {} }
  }
  setTheme(document.documentElement.dataset.theme);
  $('theme-toggle').addEventListener('click', () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark', true));
  themePreference.addEventListener('change', event => { if (!manualTheme) setTheme(event.matches ? 'dark' : 'light'); });
  const positions = saved.positions && typeof saved.positions === 'object' ? saved.positions : {};
  let current = null, category = 'all', queue = tracks.map(t => t.id);
  let cueElements = [], activeCue = -1, following = true, seeking = false;
  let pendingSeek = null, hasPlayed = false, drawerOpen = false, repeat = false;
  let lastSaved = 0, lastVolume = 1, toastTimer = null;
  let audioContext = null, analyser = null, spectrum = null, soundLevel = 0;

  const format = (seconds, round = false) => {
    const s = Math.max(0, round ? Math.round(seconds || 0) : Math.floor(seconds || 0));
    return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  };
  const categoryName = type => type === 'letter' ? 'letter 💌' : '故事';
  const coverHTML = type => `<span class="${type === 'letter' ? 'mini-envelope' : 'mini-moon'}"></span>`;
  const iconHTML = name => `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
  const currentDuration = () => current && Number.isFinite(audio.duration) && audio.currentSrc === new URL(current.audio,location.href).href ? audio.duration : (current?.duration || 0);
  const behavior = () => motion.matches ? 'auto' : 'smooth';
  const notify = text => {
    $('toast').textContent = text; $('toast').hidden = false;
    clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('toast').hidden = true; }, 4500);
  };
  if (!tracks.length) { notify('合集暂时未能加载，请刷新后再试。'); return; }

  audio.volume = typeof saved.volume === 'number' ? Math.min(1, Math.max(0, saved.volume)) : 1;
  let preferredSpeed = [1, 1.25, 1.5, 2].includes(saved.speed) ? saved.speed : 1;
  audio.defaultPlaybackRate = preferredSpeed;
  audio.playbackRate = preferredSpeed;
  const persist = () => {
    if (current && Number.isFinite(audio.currentTime) && pendingSeek === null) positions[current.id] = audio.currentTime;
    try { localStorage.setItem(storageKey, JSON.stringify({current:current?.id, positions, volume:audio.volume, speed:preferredSpeed})); } catch (_) {}
  };

  const filtered = () => tracks.filter(t => category === 'all' || t.category === category);
  function trackButton(track, className, queueTracks) {
    const button = document.createElement('button'); button.type = 'button'; button.className = className; button.dataset.track = track.id;
    button.setAttribute('aria-label', `播放《${track.title}》，${categoryName(track.category)}，${format(track.duration, true)}`);
    if (className === 'library-track') {
      const cover = document.createElement('span'); cover.className = `art-cover is-${track.category}`; cover.setAttribute('aria-hidden','true'); cover.innerHTML = coverHTML(track.category); button.append(cover);
    }
    const info = document.createElement('span'); info.className = 'track-info';
    const title = document.createElement('span'); title.className = 'track-title'; title.textContent = track.title;
    const detail = document.createElement('span'); detail.className = 'track-detail';
    const kind = document.createElement('span'); kind.textContent = categoryName(track.category);
    const duration = document.createElement('span'); duration.textContent = format(track.duration, true);
    detail.append(kind, duration); info.append(title, detail); button.append(info);
    button.addEventListener('click', () => {
      queue = queueTracks.map(t => t.id);
      if (current?.id === track.id) { updateQueueButtons(); togglePlayback(); }
      else selectTrack(track.id, {autoplay:true});
      closeDrawer();
    });
    return button;
  }
  function renderLibrary() {
    const visible = filtered(); $('library-list').replaceChildren();
    $('collection-heading').textContent = category === 'all' ? '所有内容' : category === 'letter' ? 'letter 💌合集' : categoryName(category);
    $('collection-count').textContent = visible.length + ' 篇';
    visible.forEach(track => {
      const item = document.createElement('div'); item.setAttribute('role', 'listitem');
      const button = trackButton(track, 'library-track', visible);
      item.append(button); $('library-list').append(item);
    });
    updateLibraryState();
  }
  function renderMobileCollection() {
    $('mobile-collection-count').textContent = tracks.length + ' 篇';
    tracks.forEach(track => {
      const item = document.createElement('div'); item.setAttribute('role','listitem');
      item.append(trackButton(track, 'mobile-track', tracks)); $('mobile-track-list').append(item);
    });
  }
  function revealMobileTrack() {
    if (!mobile.matches) return;
    const list = $('mobile-track-list'), selected = list.querySelector('.is-selected');
    if (!selected) return;
    const view = list.getBoundingClientRect(), item = selected.getBoundingClientRect();
    if (item.left < view.left + 20 || item.right > view.right - 20) list.scrollTo({left:list.scrollLeft + item.left - view.left - 20, behavior:behavior()});
  }
  function updateLibraryState() {
    document.querySelectorAll('.library-track,.mobile-track').forEach(button => {
      const selected = button.dataset.track === current?.id;
      button.classList.toggle('is-selected', selected);
      if (selected) button.setAttribute('aria-current','true'); else button.removeAttribute('aria-current');
      button.querySelector('.track-wave')?.remove();
      if (selected) {
        const wave = document.createElement('span'); wave.className = 'track-wave' + (!audio.paused ? ' is-playing' : ''); wave.setAttribute('aria-hidden','true'); wave.innerHTML = '<i></i><i></i><i></i>'; button.append(wave);
      }
    });
  }
  function updateQueueButtons() { $('previous').disabled = queue.length < 2; $('next').disabled = queue.length < 2; }

  function renderCues() {
    lyrics.replaceChildren(); cueElements = []; activeCue = -1;
    let note = null;
    current.cues.forEach((cue, index) => {
      let parent = lyrics;
      if (cue.style === 'note') {
        if (!note) { note = document.createElement('div'); note.className = 'note-group'; lyrics.append(note); }
        parent = note;
      } else note = null;
      const line = document.createElement('button'); line.type = 'button'; line.className = 'cue' + (cue.style === 'closing' ? ' closing' : ''); line.textContent = cue.text; line.dataset.cue = index;
      line.setAttribute('aria-label', `${format(cue.start)}，${cue.text}，点击从这里播放`);
      line.addEventListener('click', () => { setFollowing(true, false); seekTo(cue.start, 'auto'); playAudio(); });
      parent.append(line); cueElements.push(line);
    });
    lyrics.classList.remove('entering'); void lyrics.offsetWidth; lyrics.classList.add('entering');
    layoutLyrics();
  }
  function cueAt(time) {
    const cues = current.cues;
    let low = 0, high = cues.length - 1, found = 0;
    while (low <= high) { const middle = (low + high) >> 1; if (cues[middle].start <= time + .035) { found = middle; low = middle + 1; } else high = middle - 1; }
    return found;
  }
  function scrollCue(index, scrollBehavior = behavior()) {
    const element = cueElements[index]; if (!element) return;
    const top = element.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - scroller.clientHeight * .42 + element.offsetHeight / 2;
    scroller.scrollTo({top: Math.max(0,top), behavior:scrollBehavior});
  }
  function refresh(time = audio.currentTime, force = false, scrollBehavior = behavior()) {
    if (!current) return;
    const total = currentDuration();
    $('elapsed').textContent = format(time); $('total').textContent = format(total,true);
    $('seek').max = total || 1; $('seek').value = time;
    $('seek').style.setProperty('--progress', `${total ? Math.min(100,time / total * 100) : 0}%`);
    $('seek').setAttribute('aria-valuetext', `${format(time)}，共 ${format(total,true)}`);
    const index = cueAt(time);
    if (index !== activeCue || force) {
      activeCue = index;
      cueElements.forEach((element,i) => { element.classList.toggle('is-active',i === index); element.classList.toggle('is-near',Math.abs(i-index) === 1); if (i === index) element.setAttribute('aria-current','true'); else element.removeAttribute('aria-current'); });
      if (following) requestAnimationFrame(() => scrollCue(index, scrollBehavior));
    }
  }
  function layoutLyrics() {
    const previous = parseFloat(lyrics.style.getPropertyValue('--anchor')) || 0;
    const anchor = scroller.clientHeight * .42;
    lyrics.style.setProperty('--anchor', anchor + 'px');
    if (following && activeCue >= 0) requestAnimationFrame(() => scrollCue(activeCue,'auto'));
    else if (!following && previous) scroller.scrollTop += anchor - previous;
  }
  function setFollowing(value, scroll = true) {
    following = value; $('follow-toggle').setAttribute('aria-pressed',String(value)); $('follow-label').textContent = value ? '跟随朗读' : '自由阅读';
    $('follow-toggle').setAttribute('aria-label',value ? '暂停自动跟随朗读' : '恢复自动跟随朗读'); $('return-current').hidden = value;
    if (value && scroll) scrollCue(activeCue);
  }
  function seekTo(time, scrollBehavior = 'auto') {
    if (!current) return;
    const target = Math.min(currentDuration() || current.duration, Math.max(0,time));
    if (audio.readyState > 0) { pendingSeek = null; audio.currentTime = target; } else pendingSeek = target;
    refresh(target,true,scrollBehavior); persist();
  }
  function selectTrack(id, {autoplay = false} = {}) {
    const track = tracks.find(t => t.id === id); if (!track) return;
    persist(); audio.pause(); current = track; hasPlayed = false;
    const remembered = Number(positions[id]) || 0;
    pendingSeek = remembered >= track.duration - 2 ? 0 : Math.min(remembered,track.duration);
    setFollowing(true,false);
    $('current-title').textContent = track.title; $('now-title').textContent = track.title;
    $('current-category').textContent = categoryName(track.category); $('now-category').textContent = categoryName(track.category);
    $('header-duration').textContent = format(track.duration,true);
    $('now-cover').className = 'art-cover is-' + track.category; $('now-cover').innerHTML = coverHTML(track.category);
    $('scene-number').textContent = String(tracks.indexOf(track)+1).padStart(2,'0') + ' / ' + String(tracks.length).padStart(2,'0');
    $('scene').style.setProperty('--glow-one',track.palette[0]); $('scene').style.setProperty('--glow-two',track.palette[1]);
    $('scene').dataset.kind = track.category;
    document.title = track.title + ' · 迷湖公主的小城堡';
    renderCues(); refresh(pendingSeek,true,'auto'); updateQueueButtons(); updateLibraryState();
    audio.src = track.audio; audio.load(); audio.playbackRate = preferredSpeed; updateSpeed(); updatePlayback();
    revealMobileTrack();
    if ('mediaSession' in navigator && 'MediaMetadata' in window) navigator.mediaSession.metadata = new MediaMetadata({title:track.title,artist:'迷湖公主的小城堡',album:categoryName(track.category)});
    if (autoplay) playAudio();
  }
  async function prepareAudio() {
    if (motion.matches) return;
    const Context = window.AudioContext || window.webkitAudioContext; if (!Context) return;
    try {
      if (!audioContext) audioContext = new Context();
      if (audioContext.state === 'suspended') await audioContext.resume();
      if (audioContext.state !== 'running' || analyser) return;
      const candidate = audioContext.createAnalyser(); candidate.fftSize = 128;
      const source = audioContext.createMediaElementSource(audio); source.connect(candidate); candidate.connect(audioContext.destination);
      analyser = candidate; spectrum = new Uint8Array(candidate.frequencyBinCount);
    } catch (_) {}
  }
  async function playAudio() {
    const requestedId = current?.id;
    $('toast').hidden = true;
    if (audio.error) { pendingSeek = Number(positions[current.id]) || 0; audio.load(); }
    await prepareAudio();
    if (current?.id !== requestedId) return;
    try { await audio.play(); } catch (error) { if (error.name !== 'AbortError') notify('音频暂时无法播放，请再点一次播放。'); }
  }
  function togglePlayback() { if (audio.paused) playAudio(); else audio.pause(); }
  function updatePlayback() {
    const playing = !audio.paused && !audio.ended;
    $('player').classList.toggle('is-playing',playing); $('play').setAttribute('aria-label',playing ? '暂停音频' : '播放音频');
    $('scene-status').textContent = playing ? '正在朗读' : hasPlayed ? '已暂停' : '等待播放'; updateLibraryState();
  }
  function changeTrack(direction, autoplay = true) {
    if (queue.length < 2) return;
    const index = queue.indexOf(current.id); const nextId = queue[(Math.max(0,index) + direction + queue.length) % queue.length];
    selectTrack(nextId,{autoplay});
  }
  audio.addEventListener('loadedmetadata', () => {
    if (!current || audio.currentSrc !== new URL(current.audio,location.href).href) return;
    if (pendingSeek !== null) { audio.currentTime = Math.min(pendingSeek,Math.max(0,audio.duration-.1)); pendingSeek = null; }
    refresh(audio.currentTime,true,'auto');
  });
  audio.addEventListener('timeupdate', () => { if (!seeking) refresh(); if (Date.now()-lastSaved > 4000) { persist(); lastSaved = Date.now(); } });
  audio.addEventListener('play',updatePlayback);
  audio.addEventListener('playing', () => { hasPlayed = true; updatePlayback(); });
  audio.addEventListener('pause', () => { updatePlayback(); persist(); });
  audio.addEventListener('waiting', () => { if (!audio.paused) $('scene-status').textContent = '正在加载'; });
  audio.addEventListener('error', () => { updatePlayback(); notify('音频加载失败，请点击播放重试。'); });
  audio.addEventListener('ended', () => {
    positions[current.id] = audio.currentTime; persist();
    const index = queue.indexOf(current.id);
    if (index < queue.length-1) selectTrack(queue[index+1],{autoplay:true});
    else if (repeat) { if (queue.length === 1) { seekTo(0); playAudio(); } else selectTrack(queue[0],{autoplay:true}); }
    else updatePlayback();
  });
  $('play').addEventListener('click',togglePlayback);
  $('previous').addEventListener('click', () => changeTrack(-1)); $('next').addEventListener('click', () => changeTrack(1));
  $('rewind').addEventListener('click', () => { setFollowing(true,false); seekTo(audio.currentTime-15); });
  $('forward').addEventListener('click', () => { setFollowing(true,false); seekTo(audio.currentTime+15); });
  $('seek').addEventListener('pointerdown', () => { seeking = true; });
  $('seek').addEventListener('input',event => { setFollowing(true,false); seekTo(Number(event.target.value)); });
  const finishSeeking = () => { seeking = false; refresh(); persist(); };
  $('seek').addEventListener('change',finishSeeking); window.addEventListener('pointerup', () => { if (seeking) finishSeeking(); }); window.addEventListener('pointercancel',finishSeeking);
  $('follow-toggle').addEventListener('click', () => setFollowing(!following)); $('return-current').addEventListener('click', () => setFollowing(true));
  scroller.addEventListener('wheel', () => setFollowing(false),{passive:true});
  scroller.addEventListener('touchmove', () => setFollowing(false),{passive:true});
  scroller.addEventListener('pointerdown',event => { if (event.target === scroller) setFollowing(false); });
  scroller.addEventListener('keydown',event => { if (['ArrowUp','ArrowDown','PageUp','PageDown','Home','End'].includes(event.key)) setFollowing(false); });

  function updateVolume() {
    const value = audio.muted ? 0 : audio.volume; $('volume').value = value; $('volume').style.setProperty('--progress',value*100+'%'); $('volume-icon').setAttribute('href',value ? '#i-volume' : '#i-muted'); $('mute').setAttribute('aria-label',value ? '静音' : '取消静音');
  }
  $('volume').addEventListener('input',event => { audio.muted = false; audio.volume = Number(event.target.value); if (audio.volume) lastVolume = audio.volume; updateVolume(); persist(); });
  $('mute').addEventListener('click', () => { if (audio.muted || audio.volume === 0) { audio.muted = false; audio.volume = lastVolume || 1; } else { lastVolume = audio.volume; audio.muted = true; } updateVolume(); });
  function updateSpeed() { $('speed').textContent = audio.playbackRate + '×'; $('speed').setAttribute('aria-label',`播放速度 ${audio.playbackRate} 倍，点击切换`); }
  $('speed').addEventListener('click', () => { const speeds = [1,1.25,1.5,2]; preferredSpeed = speeds[(speeds.indexOf(preferredSpeed)+1)%4]; audio.defaultPlaybackRate = preferredSpeed; audio.playbackRate = preferredSpeed; updateSpeed(); persist(); });
  $('repeat-button').addEventListener('click', () => { repeat = !repeat; $('repeat-button').setAttribute('aria-pressed',String(repeat)); $('repeat-button').setAttribute('aria-label',repeat ? '取消循环合集' : '循环合集'); });
  document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
    category = button.dataset.category; document.querySelectorAll('.filter').forEach(item => item.setAttribute('aria-pressed',String(item === button))); renderLibrary();
  }));

  function openDrawer() {
    if (!mobile.matches) return;
    drawerOpen = true; document.body.classList.add('drawer-open'); $('open-library').setAttribute('aria-expanded','true'); $('sidebar').inert = false; $('sidebar').setAttribute('role','dialog'); $('sidebar').setAttribute('aria-modal','true'); $('close-library').focus();
  }
  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false; document.body.classList.remove('drawer-open'); $('open-library').setAttribute('aria-expanded','false'); $('sidebar').removeAttribute('role'); $('sidebar').removeAttribute('aria-modal'); $('sidebar').inert = mobile.matches; $('open-library').focus();
  }
  $('open-library').addEventListener('click',openDrawer); $('close-library').addEventListener('click',closeDrawer); $('library-backdrop').addEventListener('click',closeDrawer);
  mobile.addEventListener('change', () => { closeDrawer(); $('sidebar').inert = mobile.matches; revealMobileTrack(); }); $('sidebar').inert = mobile.matches;
  document.addEventListener('keydown',event => {
    if (event.key === 'Escape') closeDrawer();
    if (drawerOpen && event.key === 'Tab') {
      const buttons = Array.from($('sidebar').querySelectorAll('button:not(:disabled)'));
      const first = buttons[0], last = buttons[buttons.length-1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      return;
    }
    if (drawerOpen || ['INPUT','TEXTAREA','BUTTON'].includes(document.activeElement?.tagName)) return;
    if (event.code === 'Space') { event.preventDefault(); togglePlayback(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); seekTo(audio.currentTime-15); }
    if (event.key === 'ArrowRight') { event.preventDefault(); seekTo(audio.currentTime+15); }
  });
  if ('ResizeObserver' in window) new ResizeObserver(layoutLyrics).observe(scroller); else window.addEventListener('resize',layoutLyrics);
  lyrics.addEventListener('animationend', () => { if (following) scrollCue(activeCue,'auto'); });
  window.addEventListener('pagehide',persist);
  if ('mediaSession' in navigator) {
    const actions = {play:playAudio,pause:()=>audio.pause(),previoustrack:()=>changeTrack(-1),nexttrack:()=>changeTrack(1),seekto:event=>seekTo(event.seekTime),seekbackward:event=>seekTo(audio.currentTime-(event.seekOffset||15)),seekforward:event=>seekTo(audio.currentTime+(event.seekOffset||15))};
    Object.entries(actions).forEach(([name,handler]) => { try { navigator.mediaSession.setActionHandler(name,handler); } catch (_) {} });
  }

  const canvas = $('scene-canvas'), painter = canvas.getContext('2d');
  let canvasWidth = 800, canvasHeight = 600, frame = null, lastFrame = 0;
  const points = Array.from({length:180},(_,i) => { const y = 1-i/179*2, r = Math.sqrt(1-y*y), angle = i*Math.PI*(3-Math.sqrt(5)); return [Math.cos(angle)*r,y,Math.sin(angle)*r]; });
  const resizeScene = () => {
    canvasWidth = canvas.clientWidth; canvasHeight = canvas.clientHeight;
    const dpr = Math.min(devicePixelRatio||1,2); canvas.width = canvasWidth*dpr; canvas.height = canvasHeight*dpr; painter?.setTransform(dpr,0,0,dpr,0,0);
    if (motion.matches) drawScene(0);
  };
  function drawScene(time) {
    frame = null; if (!painter || document.hidden) return;
    if (!motion.matches) frame = requestAnimationFrame(drawScene);
    if (!motion.matches && time-lastFrame < (audio.paused ? 80 : 33)) return; lastFrame = time;
    let energy = 0;
    if (analyser && !audio.paused) { analyser.getByteFrequencyData(spectrum); for (let i=1;i<30;i++) energy+=spectrum[i]; energy/=29*255; }
    soundLevel += (energy-soundLevel)*.12;
    painter.clearRect(0,0,canvasWidth,canvasHeight);
    const x0 = canvasWidth*.72, y0 = canvasHeight*.56, radius = Math.min(canvasWidth*.34,canvasHeight*.41)*(1+soundLevel*.18), angle = motion.matches ? 0 : time*.000065;
    const project = point => { const x=point[0]*Math.cos(angle)+point[2]*Math.sin(angle),z=-point[0]*Math.sin(angle)+point[2]*Math.cos(angle),y=point[1]*.76-z*.25; return [x0+x*radius,y0+y*radius,z]; };
    const dark = document.documentElement.dataset.theme === 'dark';
    const color = dark ? (current?.category === 'story' ? '198,214,194' : '226,204,168') : '129,100,68';
    points.map(project).forEach(([x,y,z])=>{painter.fillStyle=`rgba(${color},${.13+(z+1)*.10+soundLevel*.12})`;painter.beginPath();painter.arc(x,y,.55+(z+1)*.18,0,Math.PI*2);painter.fill();});
    for(let ring=0;ring<4;ring++){painter.beginPath();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,lat=(ring-1.5)*.3+Math.sin(a*2+ring+angle)*.08,r=Math.sqrt(1-lat*lat),[x,y]=project([Math.cos(a)*r,lat,Math.sin(a)*r]);if(i===0)painter.moveTo(x,y);else painter.lineTo(x,y);}painter.strokeStyle=`rgba(${color},${.07+soundLevel*.1})`;painter.lineWidth=.65;painter.stroke();}
  }
  const startScene = () => { if(frame===null&&!document.hidden&&!motion.matches)frame=requestAnimationFrame(drawScene); };
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(frame!==null)cancelAnimationFrame(frame);frame=null;}else startScene();});
  motion.addEventListener('change',()=>{if(motion.matches){if(frame!==null)cancelAnimationFrame(frame);frame=null;drawScene(0);}else startScene();});
  if ('ResizeObserver' in window) new ResizeObserver(resizeScene).observe(canvas); else window.addEventListener('resize',resizeScene);

  $('count-all').textContent = tracks.length; $('count-letter').textContent = tracks.filter(t=>t.category==='letter').length; $('count-story').textContent = tracks.filter(t=>t.category==='story').length;
  $('library-summary').textContent = `共 ${tracks.length} 篇 · ${format(tracks.reduce((sum,t)=>sum+t.duration,0),true)}`;
  updateSpeed(); updateVolume(); renderLibrary(); renderMobileCollection();
  selectTrack(tracks.some(t=>t.id===saved.current) ? saved.current : tracks[0].id);
  resizeScene(); if(motion.matches)drawScene(0);else startScene();
})();
