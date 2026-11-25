(() => {
  'use strict';
  const tracks = window.CASTLE_LIBRARY || [], $ = id => document.getElementById(id);
  const audio = $('audio'), lyrics = $('lyrics-list'), scroller = $('lyrics-scroll');
  const mobile = matchMedia('(max-width: 899px)'), motion = matchMedia('(prefers-reduced-motion: reduce)');
  const storageKey = 'little-castle-player-v1', themeKey = 'little-castle-theme';
  const title = '迷湖公主的蛋糕城堡';
  const decodeLink = value => { try { return decodeURIComponent(value); } catch (_) { return ''; } };
  let saved = {}; try { saved = JSON.parse(localStorage.getItem(storageKey) || '{}'); } catch (_) {}
  let current = null, category = 'all', query = '', queue = [], elements = [], active = -1;
  let following = true, reading = 'immersive', pendingSeek = null, seeking = false, repeat = false;
  let lastSave = 0, toastTimer, hasPlayed = false, analyser = null, audioContext = null, spectrum = null;
  let positions = saved.positions && typeof saved.positions === 'object' ? saved.positions : {};
  let speed = [0.75,1,1.25,1.5,2].includes(saved.speed) ? saved.speed : 1;
  let sortOrder = ['newest','oldest','sequence'].includes(saved.sortOrder) ? saved.sortOrder : 'newest';
  const ordered = tracks.slice().sort((a,b) => a.category === b.category ? a.sequence-b.sequence : a.category === 'letter' ? -1 : 1);
  const icon = n => `<svg class="icon" aria-hidden="true"><use href="#i-${n}"/></svg>`;
  const format = (s, round = false) => { const n = Math.max(0, round ? Math.round(s || 0) : Math.floor(s || 0)); return `${Math.floor(n/60).toString().padStart(2,'0')}:${(n%60).toString().padStart(2,'0')}`; };
  const kind = t => t.category === 'letter' ? 'letter 💌' : '故事';
  const timestamp = t => t.fileTimestamp.slice(0,19).replace('T',' ').replaceAll('-','.');
  const duration = () => Number.isFinite(audio.duration) && audio.currentSrc === new URL(current?.audio || '',location.href).href ? audio.duration : current?.duration || 0;
  const behavior = () => motion.matches ? 'auto' : 'smooth';
  const eligible = () => ordered.filter(t => category === 'all' || t.category === category).sort((a,b) => {
    if (sortOrder === 'sequence') return a.category === b.category ? a.sequence-b.sequence : a.category === 'letter' ? -1 : 1;
    return (Date.parse(a.fileTimestamp)-Date.parse(b.fileTimestamp))*(sortOrder === 'newest' ? -1 : 1) || (a.category === b.category ? a.sequence-b.sequence : a.category === 'letter' ? -1 : 1);
  });
  const visible = () => eligible().filter(t => !query || (t.title + ' ' + kind(t) + ' ' + String(t.sequence).padStart(2,'0')).toLocaleLowerCase().includes(query));
  const notify = text => { $('toast').textContent = text; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true,4000); };
  if (!tracks.length) { notify('合集未能加载，请刷新后再试。'); return; }
  audio.volume = Number.isFinite(saved.volume) ? Math.max(0,Math.min(1,saved.volume)) : 1;
  audio.defaultPlaybackRate = speed; audio.playbackRate = speed;
  document.title = title;
  let manualTheme = false; try { manualTheme = ['light','dark'].includes(localStorage.getItem(themeKey)); } catch (_) {}
  function setTheme(theme, remember = false) {
    const dark = theme === 'dark'; document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelectorAll('.theme-toggle').forEach(b => { b.setAttribute('aria-label',dark?'切换到日间模式':'切换到夜间模式'); b.setAttribute('aria-pressed',String(dark)); b.innerHTML = icon(b.classList.contains('theme-switch') ? (dark?'moon':'sun') : (dark?'sun':'moon')) + (b.classList.contains('theme-switch') ? `<span>${dark?'夜间':'日间'}</span>` : ''); });
    document.querySelector('meta[name="theme-color"]').content = dark ? '#181c19' : '#f6f3ee';
    if (remember) { manualTheme = true; try { localStorage.setItem(themeKey,theme); } catch (_) {} }
    window.dispatchEvent(new Event('castle-scene-change'));
  }
  document.querySelectorAll('.theme-toggle').forEach(b => b.addEventListener('click',() => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark',true)));
  setTheme(document.documentElement.dataset.theme);
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change',e => { if(!manualTheme) setTheme(e.matches?'dark':'light'); });
  function persist() {
    if (current && pendingSeek === null && Number.isFinite(audio.currentTime)) positions[current.id] = audio.currentTime;
    try { localStorage.setItem(storageKey,JSON.stringify({current:current?.id,positions,speed,volume:audio.volume,sortOrder})); } catch (_) {}
  }
  function renderLibrary() {
    const items = visible(), list = $('library-list'); list.replaceChildren();
    $('collection-heading').textContent = query ? '搜索结果' : category === 'all' ? '全部内容' : category === 'letter' ? 'letter 💌合集' : '故事合集';
    $('collection-count').textContent = `${items.length} 篇`;
    $('empty-search').hidden = items.length > 0; $('clear-search').hidden = !query;
    items.forEach(t => {
      const row = document.createElement('div'); row.setAttribute('role','listitem');
      const b = document.createElement('button'); b.type = 'button'; b.className = `library-track is-${t.category}`; b.dataset.track = t.id;
      b.setAttribute('aria-label',`播放${kind(t)} ${t.sequence}，《${t.title}》，${timestamp(t)}，时长 ${format(t.duration,true)}`);
      const cover = document.createElement('span'); cover.className = 'track-cover'; cover.setAttribute('aria-hidden','true'); cover.innerHTML = t.category === 'letter' ? icon('letter') : String(t.sequence).padStart(2,'0');
      const info = document.createElement('span'); info.className = 'track-info';
      const name = document.createElement('span'); name.className = 'track-title'; name.textContent = t.title;
      const detail = document.createElement('span'); detail.className = 'track-detail';
      const date = document.createElement('time'); date.dateTime = t.fileTimestamp; date.textContent = timestamp(t);
      const time = document.createElement('span'); time.className = 'track-duration'; time.textContent = format(t.duration,true); detail.append(date,time); info.append(name,detail);
      const arrow = document.createElement('span'); arrow.className = 'track-arrow'; arrow.setAttribute('aria-hidden','true'); arrow.innerHTML = icon('arrow');
      b.append(cover,info,arrow); row.append(b); list.append(row);
      b.addEventListener('click',() => { queue = eligible().map(t => t.id); if (current?.id !== t.id) selectTrack(t.id); openPlayer(true); playAudio(); });
    });
    updateLibraryState();
  }
  function updateLibraryState() {
    document.querySelectorAll('.library-track').forEach(b => {
      if (b.dataset.track === current?.id) b.setAttribute('aria-current','true'); else b.removeAttribute('aria-current');
      const arrow = b.querySelector('.track-arrow');
      arrow.innerHTML = b.dataset.track === current?.id && !audio.paused ? icon('wave') : icon('arrow');
    });
  }
  function setView(view, focus = false) {
    document.body.dataset.view = view;
    const libraryHidden = mobile.matches && view === 'player', playerHidden = mobile.matches && view === 'library';
    $('library').inert = libraryHidden; $('player-page').inert = playerHidden;
    window.dispatchEvent(new Event('castle-scene-change'));
    if(view === 'player') requestAnimationFrame(() => { layoutLyrics(); if(focus && mobile.matches) $('back-library').focus({preventScroll:true}); });
    else if(focus) { const b = $('library-list').querySelector('[aria-current=true]'); (b || $('search')).focus({preventScroll:true}); }
  }
  function openPlayer(push = true) {
    if (!current) return;
    if (mobile.matches && document.body.dataset.view !== 'player' && push) history.pushState({castlePlayer:true},'',`#listen=${encodeURIComponent(current.id)}`);
    setView('player');
  }
  function returnLibrary() {
    if (history.state?.castlePlayer && mobile.matches) history.back();
    else { history.replaceState(null,'',location.pathname+location.search); setView('library',true); }
  }
  $('back-library').addEventListener('click',returnLibrary);
  $('open-current').addEventListener('click',() => openPlayer(true));
  window.addEventListener('popstate',() => {
    const id = decodeLink(location.hash.replace(/^#listen=/,''));
    if(location.hash.startsWith('#listen=') && tracks.some(t => t.id === id)) { if(current?.id !== id) selectTrack(id); setView('player',true); }
    else setView('library',true);
  });
  mobile.addEventListener('change',() => { setView(document.body.dataset.view); if(!current && !mobile.matches) selectTrack(ordered[0].id); });
  function renderCues() {
    lyrics.replaceChildren(); elements = []; active = -1; let note = null, previousParagraph = -1;
    current.cues.forEach((c,i) => {
      let parent = lyrics;
      if(c.style === 'note') { if(!note) { note=document.createElement('div');note.className='note-group';lyrics.append(note); } parent=note; } else note=null;
      const b = document.createElement('button'); b.type='button';b.className='cue' + (c.style === 'closing'?' closing':'') + (previousParagraph !== c.paragraph?' paragraph-start':''); b.textContent=c.text; b.dataset.cue=i;
      b.setAttribute('aria-label',`${format(c.start)}，${c.text}，从这里播放`);
      b.addEventListener('click',() => { seekTo(c.start); if(reading==='immersive') setFollowing(true); playAudio(); });
      parent.append(b);elements.push(b);previousParagraph=c.paragraph;
    });
    layoutLyrics();
  }
  function cueAt(t) {
    let lo=0,hi=current.cues.length-1,result=0;
    while(lo<=hi) { const mid=(lo+hi)>>1; if(current.cues[mid].start<=t+.035) {result=mid;lo=mid+1;}else hi=mid-1; }
    return result;
  }
  function scrollCue(i, smooth=behavior()) {
    const el=elements[i];if(!el||!scroller.clientHeight)return;
    const center=reading==='full' ? scroller.clientHeight*.25 : scroller.clientHeight*.43;
    const y=el.getBoundingClientRect().top-scroller.getBoundingClientRect().top+scroller.scrollTop-center+el.offsetHeight/2;
    scroller.scrollTo({top:Math.max(0,y),behavior:smooth});
  }
  function refresh(t=pendingSeek ?? audio.currentTime, force=false, scrollBehavior=behavior()) {
    if(!current)return;
    const total=duration(),progress=total?Math.min(100,t/total*100):0;
    if(!seeking) {$('seek').max=total||1;$('seek').value=t;}
    $('elapsed').textContent=format(t);$('total').textContent=format(total,true);$('seek').style.setProperty('--progress',`${progress}%`);$('mini-progress').style.width=progress+'%';
    $('seek').setAttribute('aria-valuetext',`${format(t)}，共 ${format(total,true)}`);
    $('now-detail').textContent=`${audio.paused?'继续听':'正在播放'} · ${format(t)} / ${format(total,true)}`;
    const index=cueAt(t);
    if(index!==active||force) {
      const old=active;active=index;
      const update=new Set([old-1,old,old+1,index-1,index,index+1]);
      update.forEach(i => { const el=elements[i];if(!el)return;el.classList.toggle('is-active',i===index);el.classList.toggle('is-near',Math.abs(i-index)===1);if(i===index)el.setAttribute('aria-current','true');else el.removeAttribute('aria-current'); });
      if(following)requestAnimationFrame(() => scrollCue(index,scrollBehavior));
    }
  }
  function layoutLyrics() {
    lyrics.style.setProperty('--anchor',Math.round(scroller.clientHeight*.42)+'px');
    if(following && active>=0)scrollCue(active,'auto');
  }
  function setFollowing(value, scroll=true) {
    following=value;$('follow-toggle').setAttribute('aria-pressed',String(value));$('follow-label').textContent=value?'跟随朗读':'自由阅读';$('return-current').hidden=value||!current;
    if(value&&scroll)scrollCue(active);
  }
  function setReading(mode) {
    reading=mode;document.body.dataset.reading=mode;
    $('mode-immersive').setAttribute('aria-pressed',String(mode==='immersive'));$('mode-full').setAttribute('aria-pressed',String(mode==='full'));
    setFollowing(mode==='immersive',false);layoutLyrics();
    if(mode==='full')scrollCue(active,'auto');
    else scrollCue(active);
    window.dispatchEvent(new Event('castle-scene-change'));
  }
  $('mode-immersive').addEventListener('click',() => setReading('immersive'));
  $('mode-full').addEventListener('click',() => setReading('full'));
  $('follow-toggle').addEventListener('click',() => setFollowing(!following));$('return-current').addEventListener('click',() => setFollowing(true));
  scroller.addEventListener('wheel',() => setFollowing(false),{passive:true});scroller.addEventListener('touchmove',() => setFollowing(false),{passive:true});
  scroller.addEventListener('keydown',e => {if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key))setFollowing(false);});
  function seekTo(t) {
    if(!current)return;const target=Math.min(duration()||current.duration,Math.max(0,t));
    if(audio.readyState>0 && audio.currentSrc===new URL(current.audio,location.href).href){pendingSeek=null;audio.currentTime=target;}else pendingSeek=target;
    refresh(target,true,'auto');persist();
  }
  function selectTrack(id) {
    const t=tracks.find(t => t.id===id);if(!t)return;
    persist();audio.pause();current=t;hasPlayed=false;
    if(!queue.includes(id))queue=ordered.map(t => t.id);
    const remembered=Number(positions[id])||0;pendingSeek=remembered>=t.duration-2?0:Math.max(0,Math.min(remembered,t.duration));
    document.body.classList.add('has-current');$('mini-player').hidden=false;
    $('current-title').textContent=t.title;$('now-title').textContent=t.title;$('current-category').textContent=kind(t);$('scene-number').textContent=String(t.sequence).padStart(2,'0');
    $('current-detail').textContent=`${timestamp(t)} · ${format(t.duration,true)}`;
    $('open-current').setAttribute('aria-label',`返回《${t.title}》的播放页`);$('mini-cover').innerHTML=icon(t.category==='letter'?'letter':'moon');$('scene').dataset.kind=t.category;
    setFollowing(reading==='immersive',false);renderCues();audio.src=t.audio;audio.load();audio.playbackRate=speed;refresh(pendingSeek,true,'auto');updatePlayback();updateQueue();
    if(location.hash.startsWith('#listen='))history.replaceState(history.state,'',`#listen=${encodeURIComponent(id)}`);
    if('mediaSession' in navigator && 'MediaMetadata' in window)navigator.mediaSession.metadata=new MediaMetadata({title:t.title,artist:title,album:t.category==='letter'?'letter 💌合集':'故事合集'});
    persist();window.dispatchEvent(new Event('castle-scene-change'));
  }
  async function prepareAnalyser() {
    // Keep native mobile audio routing for reliable lock-screen and background playback.
    if(mobile.matches||motion.matches)return;
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    try {if(!audioContext)audioContext=new Context();if(audioContext.state==='suspended')await audioContext.resume();if(analyser)return;
      analyser=audioContext.createAnalyser();analyser.fftSize=128;const source=audioContext.createMediaElementSource(audio);source.connect(analyser);analyser.connect(audioContext.destination);spectrum=new Uint8Array(analyser.frequencyBinCount);
    }catch(_){}
  }
  async function playAudio() {
    if(!current){selectTrack((visible()[0]||ordered[0]).id);openPlayer(true);}
    $('toast').hidden=true;
    if(audio.error){pendingSeek=positions[current.id]||0;audio.load();}
    const requested=current.id;
    try {const playback=audio.play();prepareAnalyser();await playback;}catch(e){if(e.name!=='AbortError' && current.id===requested)notify('音频暂时无法播放，请再点一次播放。');}
  }
  function togglePlayback(){if(audio.paused)playAudio();else audio.pause();}
  function updatePlayback() {
    const playing=!audio.paused&&!audio.ended;document.body.classList.toggle('is-playing',playing);$('player').classList.toggle('is-playing',playing);
    [$('play'),$('mini-play')].forEach(b => b.setAttribute('aria-label',playing?'暂停音频':'播放音频'));
    $('scene-status').textContent=playing?'正在朗读':hasPlayed?'已暂停':'等待播放';
    if('mediaSession' in navigator)navigator.mediaSession.playbackState=playing?'playing':'paused';
    updateLibraryState();refresh();window.dispatchEvent(new Event('castle-scene-change'));
  }
  function updateQueue() {
    const i=queue.indexOf(current?.id);$('previous').disabled=queue.length<2 || (!repeat&&i===0);$('next').disabled=queue.length<2 || (!repeat&&i===queue.length-1);
  }
  function changeTrack(d) {
    const i=queue.indexOf(current?.id),target=i+d;
    if(!repeat&&(target<0||target>=queue.length))return;
    selectTrack(queue[(target+queue.length)%queue.length]);playAudio();
  }
  audio.addEventListener('loadedmetadata',() => {
    if(!current||audio.currentSrc!==new URL(current.audio,location.href).href)return;
    if(pendingSeek!==null){audio.currentTime=Math.min(pendingSeek,Math.max(0,audio.duration-.05));pendingSeek=null;}audio.playbackRate=speed;refresh(audio.currentTime,true,'auto');
  });
  audio.addEventListener('timeupdate',() => {if(!seeking)refresh();if(Date.now()-lastSave>4000){persist();lastSave=Date.now();}if('mediaSession' in navigator && navigator.mediaSession.setPositionState && Number.isFinite(audio.duration)){try{navigator.mediaSession.setPositionState({duration:audio.duration,position:audio.currentTime,playbackRate:audio.playbackRate});}catch(_){}}});
  audio.addEventListener('playing',() => {hasPlayed=true;updatePlayback();});audio.addEventListener('play',updatePlayback);audio.addEventListener('pause',() => {updatePlayback();persist();});
  audio.addEventListener('waiting',() => {if(!audio.paused)$('scene-status').textContent='正在加载';});audio.addEventListener('error',() => {if(current){updatePlayback();notify('音频加载失败，请点击播放重试。');}});
  audio.addEventListener('ended',() => {persist();const i=queue.indexOf(current.id);if(i<queue.length-1||repeat)changeTrack(1);else updatePlayback();});
  $('play').addEventListener('click',togglePlayback);$('mini-play').addEventListener('click',togglePlayback);$('previous').addEventListener('click',() => changeTrack(-1));$('next').addEventListener('click',() => changeTrack(1));
  $('rewind').addEventListener('click',() => {seekTo(audio.currentTime-15);setFollowing(true);});$('forward').addEventListener('click',() => {seekTo(audio.currentTime+15);setFollowing(true);});
  $('seek').addEventListener('pointerdown',() => seeking=true);$('seek').addEventListener('input',e => {seekTo(Number(e.target.value));setFollowing(true,false);});
  const finishSeek=() => {if(!seeking)return;seeking=false;refresh();persist();};$('seek').addEventListener('change',finishSeek);window.addEventListener('pointerup',finishSeek);window.addEventListener('pointercancel',finishSeek);
  $('search').addEventListener('input',e => {query=e.target.value.trim().toLocaleLowerCase();renderLibrary();$('library-scroll').scrollTop=0;});
  $('clear-search').addEventListener('click',() => {$('search').value='';query='';renderLibrary();$('search').focus();});
  $('sort').value=sortOrder;
  $('sort').addEventListener('change',e => {
    sortOrder=e.target.value;renderLibrary();$('library-scroll').scrollTop=0;
    const ids=eligible().map(t=>t.id);if(!current||ids.includes(current.id)){queue=ids;updateQueue();}
    persist();
  });
  document.querySelectorAll('.filter').forEach(b => b.addEventListener('click',() => {category=b.dataset.category;document.querySelectorAll('.filter').forEach(x => x.setAttribute('aria-pressed',String(x===b)));renderLibrary();$('library-scroll').scrollTop=0;}));
  function updateSpeed(){audio.defaultPlaybackRate=speed;audio.playbackRate=speed;$('speed').textContent=speed+'×';$('speed').setAttribute('aria-label',`播放速度 ${speed} 倍，点击切换`);document.querySelectorAll('[data-speed]').forEach(b => b.setAttribute('aria-pressed',String(Number(b.dataset.speed)===speed)));persist();}
  $('speed').addEventListener('click',() => {const speeds=[1,1.25,1.5,2];speed=speeds[(speeds.indexOf(speed)+1)%speeds.length];updateSpeed();});
  document.querySelectorAll('[data-speed]').forEach(b => b.addEventListener('click',() => {speed=Number(b.dataset.speed);updateSpeed();}));
  $('more').addEventListener('click',() => {$('settings').showModal();$('more').setAttribute('aria-expanded','true');});$('close-settings').addEventListener('click',() => $('settings').close());
  $('settings').addEventListener('click',e => {if(e.target===$('settings')){const r=$('settings').getBoundingClientRect();if(e.clientY<r.top||e.clientY>r.bottom||e.clientX<r.left||e.clientX>r.right)$('settings').close();}});
  $('settings').addEventListener('close',() => {$('more').setAttribute('aria-expanded','false');$('more').focus({preventScroll:true});});
  $('repeat-button').addEventListener('click',() => {repeat=!repeat;$('repeat-button').setAttribute('aria-pressed',String(repeat));updateQueue();});
  $('volume').value=audio.volume;$('volume').style.setProperty('--progress',audio.volume*100+'%');$('volume').addEventListener('input',e => {audio.volume=Number(e.target.value);e.target.style.setProperty('--progress',audio.volume*100+'%');persist();});
  if('ResizeObserver' in window)new ResizeObserver(layoutLyrics).observe(scroller);else window.addEventListener('resize',layoutLyrics);
  window.addEventListener('pagehide',persist);document.addEventListener('visibilitychange',() => {if(document.hidden)persist();});
  document.addEventListener('keydown',e => {if(e.key==='Escape' && mobile.matches && document.body.dataset.view==='player'&&!$('settings').open)returnLibrary();if($('settings').open||['INPUT','BUTTON','TEXTAREA'].includes(document.activeElement?.tagName))return;
    if(e.code==='Space'){e.preventDefault();togglePlayback();}if(e.key==='ArrowLeft'){e.preventDefault();seekTo(audio.currentTime-15);}if(e.key==='ArrowRight'){e.preventDefault();seekTo(audio.currentTime+15);}});
  if('mediaSession' in navigator)Object.entries({play:playAudio,pause:() => audio.pause(),previoustrack:() => changeTrack(-1),nexttrack:() => changeTrack(1),seekto:e => seekTo(e.seekTime),seekbackward:e => seekTo(audio.currentTime-(e.seekOffset||15)),seekforward:e => seekTo(audio.currentTime+(e.seekOffset||15))}).forEach(([key,fn]) => {try{navigator.mediaSession.setActionHandler(key,fn);}catch(_){}});
  window.CastleSceneState=() => ({playing:!audio.paused,visible:!document.hidden&&(!mobile.matches||document.body.dataset.view==='player'),full:reading==='full',category:current?.category||'letter',level:() => {if(!analyser)return 0;analyser.getByteFrequencyData(spectrum);return spectrum.reduce((a,b) => a+b,0)/spectrum.length/255;}});
  const minutes=Math.round(tracks.reduce((n,t)=>n+t.duration,0)/60);$('library-stats').textContent=`${tracks.length} 篇声音 · ${Math.floor(minutes/60)} 小时 ${minutes%60} 分钟`;
  $('all-count').textContent=tracks.length;$('letter-count').textContent=tracks.filter(t=>t.category==='letter').length;$('story-count').textContent=tracks.filter(t=>t.category==='story').length;
  renderLibrary();updateSpeed();queue=eligible().map(t=>t.id);
  const linked=location.hash.startsWith('#listen=')?decodeLink(location.hash.slice(8)):null;
  if(linked&&tracks.some(t=>t.id===linked)){selectTrack(linked);setView('player');}
  else {if(saved.current&&tracks.some(t=>t.id===saved.current))selectTrack(saved.current);else if(!mobile.matches)selectTrack(eligible()[0].id);setView('library');}
})();
