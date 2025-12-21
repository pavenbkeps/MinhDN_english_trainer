window.Bedtime = (function(){
  let lines = [];
  let idx = 0;
  let title = "";
  let playing = false;
  let wakeLock = null;

  function escapeHtml(str){
    return (str??"").toString()
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
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
    try{ TTS.cancel(); }catch(e){}
    releaseWakeLock();
    updateButtons();
  }

  async function requestWakeLock(){
    // Best-effort only (iOS Safari may not support)
    try{
      if(!("wakeLock" in navigator)) return;
      if(wakeLock) return;
      wakeLock = await navigator.wakeLock.request("screen");
      // If the page becomes hidden, lock may be released automatically
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

  function speakENThenVIThenMaybeNext(){
    if(!playing) return;

    const cur = lines[idx] || { en:"", vi:"" };
    const enText = (cur.en || "").trim();
    const viText = (cur.vi || "").trim();

    // If empty, just move next
    if(!enText && !viText){
      goNext(true);
      return;
    }

    // read EN then VI
    TTS.speak(enText || viText, {
      lang: enText ? "en-US" : "vi-VN",
      onend: ()=>{
        if(!playing) return;

        // small pause before VI
        setTimeout(()=>{
          if(!playing) return;
          if(viText){
            TTS.speak(viText, {
              lang: "vi-VN",
              onend: ()=>{
                if(!playing) return;
                // move next if possible
                if(idx < lines.length - 1){
                  setTimeout(()=> goNext(true), 250);
                }else{
                  // finished
                  showFinish();
                }
              }
            });
          }else{
            // no VI line -> move next
            if(idx < lines.length - 1){
              setTimeout(()=> goNext(true), 200);
            }else{
              stopPlayback();
            }
          }
        }, 250);
      }
    });
  }

  function goPrev(keepPlaying=false){
    if(idx <= 0) return;
    idx--;
    renderLine();
    if(keepPlaying) speakENThenVIThenMaybeNext();
  }

  function goNext(keepPlaying=false){
    if(idx >= lines.length - 1){
      // finish
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
    // Normalize lines: expect [{en,vi}, ...]
    lines = Array.isArray(inputLines) ? inputLines.map(x=>({
      en: (x?.en ?? "").toString(),
      vi: (x?.vi ?? "").toString()
    })) : [];

    idx = 0;
    title = storyTitle || "Bedtime";
    playing = false;

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

    TTS.warmUp();
    renderLine();
  }

  return { start };
})();
