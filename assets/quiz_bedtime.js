window.Bedtime = (function(){
  let lines = [];
  let idx = 0;
  let title = "";
  let storySlug = "";
  let playing = false;
  let wakeLock = null;

  // Audio player (for file playback)
  let audioEl = null;

  // Token to cancel any pending async chain
  let playToken = 0;

  // Cache for hash ids (key = en||vi)
  const idCache = new Map();

  // ===== CONFIG =====
  // If you put bedtime_audio folder at repo root: keep "bedtime_audio"
  // If you put in assets/: use "assets/bedtime_audio"
  const AUDIO_BASE = (window.BEDTIME_AUDIO_BASE || "bedtime_audio");

  function escapeHtml(str){
    return (str??"").toString()
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"quot;").replaceAll("'","&#39;");
  }

  function getScreen(){
    return UI.el("screenBedtime");
  }

  function setProgress(){
    const total = lines.length;
    const cur = Math.min(idx + 1, total);
    const prog = document.getElementById("btProg");
    if(prog) prog.textContent = `${cur}/${total}`;
  }

  function updateButtons(){
    const btnPlay = document.getElementById("btPlay");
    if(btnPlay) btnPlay.textContent = playing ? "⏸ Pause" : "▶️ Play";

    const btnPrev = document.getElementById("btPrev");
    const btnNext = document.getElementById("btNext");
    if(btnPrev) btnPrev.disabled = (idx <= 0);
    if(btnNext) btnNext.disabled = (idx >= lines.length - 1);
  }

  function renderLine(){
    const cur = lines[idx] || { en:"", vi:"" };
    const enEl = document.getElementById("btEn");
    const viEl = document.getElementById("btVi");
    if(enEl) enEl.textContent = cur.en || "";
    if(viEl) viEl.textContent = cur.vi || "";
    setProgress();
    updateButtons();
  }

  function stopPlayback(){
    playing = false;
    playToken++; // cancel pending async chain

    // stop TTS
    try{ TTS.cancel(); }catch(e){}

    // stop audio element
    try{
      if(audioEl){
        audioEl.pause();
        audioEl.currentTime = 0;
        audioEl.src = "";
      }
    }catch(e){}

    releaseWakeLock();
    updateButtons();
  }

  async function requestWakeLock(){
    try{
      if(!("wakeLock" in navigator)) return;
      if(wakeLock) return;
      wakeLock = await navigator.wakeLock.request("screen");
      document.addEventListener("visibilitychange", ()=>{
        if(document.visibilityState === "visible" && playing){
          requestWakeLock();
        }
      }, { once: true });
    }catch(e){
      wakeLock = null;
    }
  }

  async function releaseWakeLock(){
    try{
      if(wakeLock){
        await wakeLock.release();
      }
    }catch(e){}
    wakeLock = null;
  }

  // ========= Hash + slug (match Python generator) =========
  function normText(s){
    return (s || "").toString().trim().replace(/\s+/g, " ");
  }

  function slugifyTitle(t){
    let s = (t || "").toString().trim().toLowerCase();
    // remove non-word except space/hyphen/underscore
    s = s.replace(/[^\w\s-]/g, "");
    s = s.replace(/\s+/g, "_");
    s = s.replace(/_+/g, "_").replace(/^_+|_+$/g, "");
    if(!s) s = "story";
    return s.slice(0, 80);
  }

  async function sha256Hex(input){
    const enc = new TextEncoder();
    const buf = enc.encode(input);
    const digest = await crypto.subtle.digest("SHA-256", buf);
    const bytes = new Uint8Array(digest);
    let hex = "";
    for(const b of bytes){
      hex += b.toString(16).padStart(2, "0");
    }
    return hex;
  }

  async function getHash8(en, vi){
    const key = `en:${normText(en)}||vi:${normText(vi)}`;
    if(idCache.has(key)) return idCache.get(key);
    const p = sha256Hex(key).then(h => h.slice(0, 8));
    idCache.set(key, p);
    return p;
  }

  // ========= Audio playback (prefer file) =========
  function ensureAudioEl(){
    if(audioEl) return audioEl;
    audioEl = new Audio();
    audioEl.preload = "auto";
    return audioEl;
  }

  async function tryPlayAudioUrl(url){
    // Attempt to play audio file. If it fails (404/CORS/etc), return false.
    // We do a lightweight fetch first to avoid loud error spam.
    try{
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if(!res.ok) return false;
    }catch(e){
      return false;
    }

    return new Promise((resolve)=>{
      try{
        const a = ensureAudioEl();
        a.onended = ()=> resolve(true);
        a.onerror = ()=> resolve(false);
        a.src = url;

        // iOS may reject autoplay; but user already pressed Play/Repeat so should be OK
        const p = a.play();
        if(p && typeof p.then === "function"){
          p.then(()=>{}).catch(()=> resolve(false));
        }
      }catch(e){
        resolve(false);
      }
    });
  }

  function speakWithTTS(text, lang){
    return new Promise((resolve)=>{
      try{
        TTS.speak(text, {
          lang,
          onend: ()=> resolve(true)
        });
      }catch(e){
        resolve(false);
      }
    });
  }

  async function playLinePreferAudio(text, lang, id, which /* "en" or "vi" */){
    const t = (text || "").trim();
    if(!t) return true;

    // Prefer audio file if we have id + storySlug
    if(id && storySlug){
      const file = `${AUDIO_BASE}/${storySlug}/${id}_${which}.mp3`;
      const ok = await tryPlayAudioUrl(file);
      if(ok) return true;
      // fallback to TTS
    }
    return await speakWithTTS(t, lang);
  }

  // ========= Playback chain =========
  async function speakENThenVIThenMaybeNext(){
    if(!playing) return;

    const myToken = ++playToken; // token for this run
    const cur = lines[idx] || { en:"", vi:"" };
    const enText = (cur.en || "").trim();
    const viText = (cur.vi || "").trim();

    if(!enText && !viText){
      goNext(true);
      return;
    }

    // Compute id (same as generator). Needed for both EN and VI files.
    let id = "";
    try{
      id = await getHash8(enText, viText);
    }catch(e){
      id = ""; // if crypto not available, fallback to TTS
    }
    if(!playing || myToken !== playToken) return;

    // EN first (if EN empty then read VI as EN step)
    const firstText = enText || viText;
    const firstLang = enText ? "en-US" : "vi-VN";
    const firstWhich = enText ? "en" : "vi";

    await playLinePreferAudio(firstText, firstLang, id, firstWhich);
    if(!playing || myToken !== playToken) return;

    // small pause
    await new Promise(r => setTimeout(r, 250));
    if(!playing || myToken !== playToken) return;

    // VI second
    if(viText){
      await playLinePreferAudio(viText, "vi-VN", id, "vi");
      if(!playing || myToken !== playToken) return;
    }

    // next
    if(idx < lines.length - 1){
      await new Promise(r => setTimeout(r, 250));
      if(!playing || myToken !== playToken) return;
      goNext(true);
    }else{
      showFinish();
    }
  }

  function goPrev(keepPlaying=false){
    if(idx <= 0) return;
    idx--;
    renderLine();
    if(keepPlaying) speakENThenVIThenMaybeNext();
  }

  function goNext(keepPlaying=false){
    if(idx >= lines.length - 1){
      showFinish();
      return;
    }
    idx++;
    renderLine();
    if(keepPlaying) speakENThenVIThenMaybeNext();
  }

  function showFinish(){
    stopPlayback();
    const root = getScreen();
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🌙 <span id="btTitle"></span></div>
          <div class="quiz-progress" id="btProg"></div>
        </div>
        <div class="quiz-body">
          <div class="big-emoji">🌙</div>
          <div class="qtext"><strong>Finished!</strong></div>
          <div class="muted">You listened to the whole story.</div>
          <div class="nextbar" style="gap:10px; display:flex;">
            <button class="next" id="btRestart">Restart</button>
            <button class="next" id="btHome">Home</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btTitle").textContent = title;
    document.getElementById("btProg").textContent = `${lines.length}/${lines.length}`;

    document.getElementById("btRestart").onclick = ()=>{
      start(lines, title);
    };
    document.getElementById("btHome").onclick = ()=>{
      const btnHome = document.getElementById("btnHome");
      if(btnHome) btnHome.click();
      else UI.showScreen("screenHome");
    };
  }

  function start(inputLines, storyTitle){
    lines = Array.isArray(inputLines) ? inputLines.map(x=>({
      en: (x?.en ?? "").toString(),
      vi: (x?.vi ?? "").toString()
    })) : [];

    idx = 0;
    title = storyTitle || "Bedtime";
    storySlug = slugifyTitle(title);

    playing = false;
    playToken++; // cancel any old pending async chain

    const root = getScreen();
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🌙 <span id="btTitle"></span></div>
          <div class="quiz-progress" id="btProg"></div>
        </div>

        <div class="quiz-body">
          <div class="big-emoji">🌙</div>

          <div class="qtext" style="margin-top:8px;">
            <div id="btEn" class="bedtime-en" style="font-weight:700; font-size:1.15rem;"></div>
            <div id="btVi" class="bedtime-vi" style="margin-top:10px; opacity:0.95;"></div>
          </div>

          <div class="explain" style="margin-top:14px;" id="btHint">
            Tip: Tap Play to read English → Vietnamese automatically.
            <br/>Audio files (if available) will be used first, then fallback to TTS.
          </div>
        </div>

        <div class="nextbar" style="display:flex; gap:10px; flex-wrap:wrap;">
          <button class="next" id="btPrev">⏮ Prev</button>
          <button class="next" id="btRepeat">🔁 Repeat</button>
          <button class="next" id="btPlay">▶️ Play</button>
          <button class="next" id="btNext">⏭ Next</button>
          <button class="next" id="btHome">🏠 Home</button>
        </div>
      </div>
    `;

    document.getElementById("btTitle").textContent = title;

    document.getElementById("btPrev").onclick = ()=>{ stopPlayback(); goPrev(false); };
    document.getElementById("btNext").onclick = ()=>{ stopPlayback(); goNext(false); };

    document.getElementById("btRepeat").onclick = ()=>{
      stopPlayback();
      playing = true;
      requestWakeLock();
      updateButtons();
      speakENThenVIThenMaybeNext();
    };

    document.getElementById("btPlay").onclick = ()=>{
      if(playing){
        stopPlayback();
        return;
      }
      playing = true;
      requestWakeLock();
      updateButtons();
      speakENThenVIThenMaybeNext();
    };

    document.getElementById("btHome").onclick = ()=>{
      stopPlayback();
      const btnHome = document.getElementById("btnHome");
      if(btnHome) btnHome.click();
      else UI.showScreen("screenHome");
    };

    // Warm up (keeps old behavior for TTS)
    try{ TTS.warmUp(); }catch(e){}
    renderLine();
  }

  return { start };
})();
