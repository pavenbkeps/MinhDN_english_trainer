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

  // Repeat/Loop current line forever
  let repeatMode = false;

  // Cache for hash ids (key = en||vi)
  const idCache = new Map();

  // ===== CONFIG =====
  // If you put bedtime_audio folder at repo root: keep "bedtime_audio"
  // If you put in assets/: use "assets/bedtime_audio"
  const AUDIO_BASE = (window.BEDTIME_AUDIO_BASE || "bedtime_audio");

  // ===== UI helpers =====
  function escapeHtml(str){
    return (str??"").toString()
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
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
    if(btnPlay) btnPlay.textContent = playing ? "⏸" : "▶️";

    const btnRepeat = document.getElementById("btRepeat");
    if(btnRepeat) btnRepeat.classList.toggle("active", !!repeatMode);

    const btnPrev = document.getElementById("btPrev");
    const btnNext = document.getElementById("btNext");
    const btnNextBig = document.getElementById("btNextBig");

    const prevDisabled = (idx <= 0);
    const nextDisabled = (idx >= lines.length - 1);

    if(btnPrev) btnPrev.disabled = prevDisabled;
    if(btnNext) btnNext.disabled = nextDisabled;
    if(btnNextBig) btnNextBig.disabled = nextDisabled;
  }

  function renderLine(){
    const cur = lines[idx] || { en:"", vi:"" };
    const enEl = document.getElementById("btEn");
    const viEl = document.getElementById("btVi");
    if(enEl) enEl.textContent = cur.en || "";
    if(viEl) viEl.textContent = cur.vi || "";

    highlightActiveLine();
    setProgress();
    updateButtons();
  }

  function ensureAudioEl(){
    if(audioEl) return audioEl;
    audioEl = new Audio();
    audioEl.preload = "auto";
    return audioEl;
  }

  function safeStopAudio(){
    try{
      if(!audioEl) return;
      // IMPORTANT: remove handlers first, avoid triggering onerror -> fallback TTS
      audioEl.onended = null;
      audioEl.onerror = null;
      audioEl.pause();
      audioEl.currentTime = 0;
      // Optional: unload source without firing error handler
      audioEl.removeAttribute("src");
      audioEl.load();
    }catch(e){}
  }

  function stopPlayback(){
    playing = false;
    playToken++; // cancel pending async chain

    // stop TTS
    try{ TTS.cancel(); }catch(e){}

    // stop audio element safely (no onerror cascade)
    safeStopAudio();

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
  async function tryPlayAudioUrl(url, myToken){
    // If paused/stopped while we were called, don't do anything.
    if(!playing || myToken !== playToken) return false;

    // Attempt to play audio file. If it fails (404/CORS/etc), return false.
    // Lightweight fetch first to avoid loud error spam.
    try{
      const res = await fetch(url, { method: "GET", cache: "no-store" });
      if(!res.ok) return false;
    }catch(e){
      return false;
    }

    // Check again after fetch (user may have paused)
    if(!playing || myToken !== playToken) return false;

    return new Promise((resolve)=>{
      try{
        const a = ensureAudioEl();

        const done = (ok)=>{
          resolve(!!ok);
        };

        a.onended = ()=> done(true);
        a.onerror = ()=> done(false);
        a.src = url;

        const p = a.play();
        if(p && typeof p.then === "function"){
          p.then(()=>{}).catch(()=> done(false));
        }
      }catch(e){
        resolve(false);
      }
    });
  }

  function speakWithTTS(text, lang, myToken){
    return new Promise((resolve)=>{
      if(!playing || myToken !== playToken) return resolve(true);

      try{
        TTS.speak(text, {
          lang,
          onend: ()=> resolve(true),
          onerror: ()=> resolve(false)
        });
      }catch(e){
        resolve(false);
      }
    });
  }

  async function playLinePreferAudio(text, lang, id, which, myToken /* "en" or "vi" */){
    const t = (text || "").trim();
    if(!t) return true;

    if(id && storySlug){
      const file = `${AUDIO_BASE}/${storySlug}/${id}_${which}.mp3`;
      const ok = await tryPlayAudioUrl(file, myToken);

      // ✅ if user paused/stopped while waiting, DO NOT fallback to TTS
      if(!playing || myToken !== playToken) return true;

      if(ok) return true;
      // else fallback to TTS
    }

    if(!playing || myToken !== playToken) return true;
    return await speakWithTTS(t, lang, myToken);
  }

  // ========= Playback chain =========
  async function speakENThenVIThenMaybeNext(){
    if(!playing) return;

    const myToken = ++playToken; // token for this run
    const cur = lines[idx] || { en:"", vi:"" };
    const enText = (cur.en || "").trim();
    const viText = (cur.vi || "").trim();

    if(!enText && !viText){
      // if empty line:
      if(repeatMode){
        // repeatMode: skip empty forever would be bad -> stop
        stopPlayback();
        return;
      }
      goNext(true);
      return;
    }

    let id = "";
    try{
      id = await getHash8(enText, viText);
    }catch(e){
      id = "";
    }
    if(!playing || myToken !== playToken) return;

    const firstText = enText || viText;
    const firstLang = enText ? "en-US" : "vi-VN";
    const firstWhich = enText ? "en" : "vi";

    await playLinePreferAudio(firstText, firstLang, id, firstWhich, myToken);
    if(!playing || myToken !== playToken) return;

    await new Promise(r => setTimeout(r, 250));
    if(!playing || myToken !== playToken) return;

    if(viText){
      await playLinePreferAudio(viText, "vi-VN", id, "vi", myToken);
      if(!playing || myToken !== playToken) return;
    }

    // ===== next / repeat =====
    await new Promise(r => setTimeout(r, 250));
    if(!playing || myToken !== playToken) return;

    if(repeatMode){
      // ✅ loop the current line forever
      speakENThenVIThenMaybeNext();
      return;
    }

    if(idx < lines.length - 1){
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
          <div class="controls">
            <button class="circle blue" id="btRestart" title="Restart">🔁</button>
            <button class="circle orange" id="btHome" title="Home">🏠</button>
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

  // ========= Full story view (like Reading) =========
  function renderFullStory(){
    const list = document.getElementById("btFullList");
    if(!list) return;

    let html = "";
    for(let i=0;i<lines.length;i++){
      const en = escapeHtml(lines[i]?.en || "");
      const vi = escapeHtml(lines[i]?.vi || "");
      html += `
        <div class="bt-line" data-i="${i}">
          <div class="bt-line-en">${en}</div>
          <div class="bt-line-vi">${vi}</div>
        </div>
      `;
    }
    list.innerHTML = html;

    list.onclick = (e)=>{
      const row = e.target.closest(".bt-line");
      if(!row) return;
      const i = parseInt(row.getAttribute("data-i"), 10);
      if(Number.isNaN(i)) return;

      // Jumping should exit repeat mode
      repeatMode = false;
      stopPlayback();
      idx = i;
      renderLine();
    };

    highlightActiveLine();
  }

  function highlightActiveLine(){
    const list = document.getElementById("btFullList");
    if(!list) return;

    const prev = list.querySelector(".bt-line.active");
    if(prev) prev.classList.remove("active");

    const cur = list.querySelector(`.bt-line[data-i="${idx}"]`);
    if(cur){
      cur.classList.add("active");
      try{
        cur.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }catch(e){}
    }
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
    safeStopAudio();

    // Keep repeatMode OFF when entering a story (safer UX)
    repeatMode = false;

    const root = getScreen();
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🌙 <span id="btTitle"></span></div>
          <div class="quiz-progress" id="btProg"></div>
        </div>

        <div class="quiz-body" style="text-align:left;">
          <!-- Full story panel (Reading-like) -->
          <div style="
              border:1px solid var(--border);
              border-radius:18px;
              padding:12px;
              background:#fff;
              margin-bottom:12px;
            ">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
              <div style="font-weight:650;">📖 Full Story</div>
              <div class="muted" style="font-weight:600;">Tap a line to jump</div>
            </div>

            <div id="btFullList" style="
                margin-top:10px;
                max-height: 38vh;
                overflow:auto;
                -webkit-overflow-scrolling:touch;
                padding-right:4px;
              "></div>
          </div>

          <!-- Current line panel (per-line mode) -->
          <div style="
              border:1px dashed var(--border);
              border-radius:18px;
              padding:14px;
              background:#fff;
            ">
            <div class="big-emoji" style="text-align:center;">🌙</div>

            <div id="btEn" class="bedtime-en" style="
                font-weight: 650;
                font-size: clamp(20px, 4.2vw, 28px);
                line-height: 1.35;
                color:#1d4ed8;
                text-align:center;
              "></div>

            <div id="btVi" class="bedtime-vi" style="
                margin-top: 10px;
                font-weight: 600;
                font-size: clamp(20px, 4.2vw, 28px);
                line-height: 1.35;
                color:#111827;
                text-align:center;
              "></div>

            <div class="muted" style="margin-top:10px; text-align:center;" id="btHint">
              Tip: English → Vietnamese. Audio first, then TTS.
            </div>
          </div>

          <!-- Inline styles for full list items + repeat active (self-contained, no need edit styles.css) -->
          <style>
            #btFullList .bt-line{
              border:1px solid rgba(229,231,235,.9);
              border-radius:14px;
              padding:10px 10px;
              margin:10px 0;
              background: rgba(249,250,251,.9);
              cursor:pointer;
            }
            #btFullList .bt-line:active{ transform: scale(.99); }
            #btFullList .bt-line.active{
              outline: 3px solid rgba(124,58,237,.25);
              background: rgba(124,58,237,.08);
            }
            #btFullList .bt-line-en{
              font-weight: 650;
              color:#1d4ed8;
              font-size: 16px;
              line-height: 1.35;
            }
            #btFullList .bt-line-vi{
              margin-top:6px;
              font-weight: 600;
              color:#111827;
              font-size: 15px;
              line-height: 1.35;
              opacity: .92;
            }
            /* Repeat button pressed state */
            .controls .circle.active{
              transform: translateY(2px);
              box-shadow: inset 0 6px 14px rgba(0,0,0,.18);
              filter: brightness(0.95);
            }
          </style>
        </div>

        <!-- Controls: icon-only like Reading/Speaking -->
        <div class="bt-dock">
          <div class="controls bt-controls">
            <button class="circle orange" id="btPrev" title="Prev">⏮</button>
            <button class="circle blue" id="btRepeat" title="Repeat (loop)">🔁</button>
            <button class="circle green" id="btPlay" title="Play/Pause">▶️</button>
            <button class="circle blue" id="btNext" title="Next">⏭</button>
            <button class="circle orange" id="btHome" title="Home">🏠</button>
          </div>

          <div class="nextbar bt-nextbar">
            <button class="next" id="btNextBig">Next</button>
          </div>
        </div>


      </div>
    `;

    document.getElementById("btTitle").textContent = title;

    renderFullStory();

    document.getElementById("btPrev").onclick = ()=>{
      repeatMode = false;
      stopPlayback();
      goPrev(false);
    };

    document.getElementById("btNext").onclick = ()=>{
      repeatMode = false;
      stopPlayback();
      goNext(false);
    };

    document.getElementById("btNextBig").onclick = ()=>{
      repeatMode = false;
      stopPlayback();
      goNext(false);
    };

    // ✅ Toggle repeat (loop current line forever)
    document.getElementById("btRepeat").onclick = ()=>{
      repeatMode = !repeatMode;
      updateButtons();

      // If not playing, turning repeat ON should start playing (like reading)
      if(repeatMode && !playing){
        playing = true;
        requestWakeLock();
        updateButtons();
        speakENThenVIThenMaybeNext();
      }
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
      repeatMode = false;
      stopPlayback();
      const btnHome = document.getElementById("btnHome");
      if(btnHome) btnHome.click();
      else UI.showScreen("screenHome");
    };

    try{ TTS.warmUp(); }catch(e){}
    renderLine();
  }

  return { start, stop: stopPlayback };

})();
