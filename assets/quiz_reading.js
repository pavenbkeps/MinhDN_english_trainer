window.Reading = (function(){
  // Public API:
  //   Reading.start(items, topicTitle)
  // items: [{ topic, title, lang, text, note_vi, newWords }]
  // - If items.length > 1: show list to pick a title.
  // - If items.length === 1: open that reading immediately.

  let items = [];
  let topicTitle = "";

  // current reading
  let cur = null;
  let sentences = [];
  let si = 0;                 // sentence index
  let playing = false;        // currently speaking (auto-next enabled)
  let paused = false;         // speechSynthesis paused flag
  let autoMode = true;        // Play = auto next; Prev/Next/Click = manual (read once)
  let repeatMode = false;     // repeat current sentence at end (toggle)
  let rate = 0.95;

  let currentUtterance = null;

  // voice
  let voices = [];
  let selectedVoice = null;

  function el(id){ return document.getElementById(id); }

  function escapeHtml(str){
    return (str ?? "").toString()
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  }

  function loadVoices(){
    try{
      voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    }catch(_e){ voices = []; }
    if(!voices || voices.length === 0) return;
    selectedVoice = pickBestVoice(cur?.lang || "en");
  }

  function pickBestVoice(lang){
    const L = (lang || "en").toLowerCase();
    const preferred = window.CFG?.PREFERRED_VOICES || [];
    if(Array.isArray(preferred) && preferred.length){
      for(const name of preferred){
        const v = voices.find(x =>
          (x.name || "").includes(name) &&
          ((x.lang || "").toLowerCase().startsWith(L))
        );
        if(v) return v;
      }
    }
    return voices.find(x => ((x.lang||"").toLowerCase().startsWith(L))) || voices[0] || null;
  }

  function ttsCancel(){
    try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(_e){}
    currentUtterance = null;
  }
  function ttsPause(){
    try{ window.speechSynthesis && window.speechSynthesis.pause(); }catch(_e){}
  }

  function normalizeTextForSplit(t){
    // Keep paragraph breaks as markers, but simplify whitespace.
    return (t ?? "").toString()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function splitIntoSentences(text){
    const t = normalizeTextForSplit(text);
    if(!t) return [];

    // Split by sentence-ending punctuation .?! plus line breaks as boundaries
    // For primary level texts, this is usually sufficient.
    const parts = [];
    let buf = "";
    for(let i=0;i<t.length;i++){
      const ch = t[i];
      buf += ch;

      const isEnd = (ch === "." || ch === "?" || ch === "!");
      const isBreak = (ch === "\n");

      if(isEnd){
        // allow closing quotes/brackets after punctuation
        let j = i + 1;
        while(j < t.length && /["')\]]/.test(t[j])){ buf += t[j]; j++; i++; }
        parts.push(buf.trim());
        buf = "";
        continue;
      }

      if(isBreak){
        // Treat blank line as hard boundary; otherwise keep as space
        const next = t[i+1] || "";
        if(next === "\n"){
          parts.push(buf.replace(/\n+/g," ").trim());
          buf = "";
          // consume additional \n
          while(i+1 < t.length && t[i+1] === "\n") i++;
        }else{
          buf = buf.replace(/\n/g, " ");
        }
      }
    }
    if(buf.trim()) parts.push(buf.trim());

    return parts
      .map(s => s.replace(/\s+/g," ").trim())
      .filter(Boolean);
  }

  function parseNewWords(raw){
    const s = (raw ?? "").toString().trim();
    if(!s) return [];
    // format: word: nghĩa; word2: nghĩa2
    const items = s.split(";").map(x => x.trim()).filter(Boolean);
    const out = [];
    for(const it of items){
      const idx = it.indexOf(":");
      if(idx === -1){
        out.push({en: it.trim(), vi: ""});
      }else{
        const en = it.slice(0, idx).trim();
        const vi = it.slice(idx+1).trim();
        if(en) out.push({en, vi});
      }
    }
    return out;
  }

  function ensureStyles(){
    if(document.getElementById("readingStyles")) return;
    const st = document.createElement("style");
    st.id = "readingStyles";
    st.textContent = `
      .rd-wrap{max-width:980px;margin:0 auto;padding:14px}
      .rd-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
      .rd-card{background:rgba(255,255,255,.06);border:1px solid var(--border);border-radius:18px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
      .rd-card h3{margin:0 0 6px 0;font-size:16px}
      .rd-card .muted{opacity:.8;font-size:13px}
      .rd-card button{margin-top:10px}

      /* sticky toolbar */
      .rd-toolbar{
        position:sticky; top: calc(var(--topbar-h, 56px) + 8px);
        z-index:5;
        display:flex; flex-wrap:wrap; gap:10px;
        align-items:center; justify-content:space-between;
        background: rgba(18,18,20,.78);
        backdrop-filter: blur(10px);
        border: 1px solid var(--border);
        border-radius: 16px;
        padding: 10px 12px;
        margin-top: 10px;
      }
      .rd-group{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .rd-ibtn{
        width:42px;height:42px;border-radius:14px;border:1px solid var(--border);
        background: rgba(255,255,255,.06);
        cursor:pointer;
        font-size:18px;
        display:flex;align-items:center;justify-content:center;
        user-select:none;
      }
      .rd-ibtn:hover{background: rgba(255,255,255,.10)}
      .rd-ibtn.on{background: rgba(34,197,94,.18); border-color: rgba(34,197,94,.55)}
      .rd-rate{display:flex;align-items:center;gap:8px}
      .rd-rate input{width:140px}
      .rd-titlebar{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}
      .rd-title{font-size:18px;font-weight:800}
      .rd-meta{opacity:.85;font-size:13px;margin-top:4px}
      .rd-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
      .rd-panel{margin-top:10px;border:1px solid var(--border);border-radius:16px;padding:10px;background:rgba(255,255,255,.05)}
      .rd-words{width:100%;border-collapse:collapse;font-size:14px}
      .rd-words td{border-top:1px solid rgba(255,255,255,.08);padding:6px 4px;vertical-align:top}
      .rd-words tr:first-child td{border-top:none}
      .rd-sentences{margin-top:12px;line-height:1.7;font-size: clamp(16px, 2.2vw, 20px);}
      .rd-sent{
        padding:8px 10px;border-radius:14px;
        transition: background .15s ease;
        font-weight: 400; /* NORMAL (no bold) */
        background: transparent; /* default no highlight */
      }
      .rd-sent:hover{background: rgba(255,255,255,.06)}
      .rd-sent.active{background: rgba(59,130,246,.16); border:1px solid rgba(59,130,246,.35)}
      .rd-prefix{background: rgba(34,197,94,.22); border-radius:8px; padding:0 2px}
      .rd-status{opacity:.85;font-size:13px;margin-top:8px}
    `;
    document.head.appendChild(st);
  }

  function renderList(){
    ensureStyles();
    const root = el("screenReading");
    root.innerHTML = `
      <div class="rd-wrap">
        <div class="rd-titlebar">
          <div>
            <div class="rd-title">📘 Reading / Speech</div>
            <div class="rd-meta">Topic: <strong>${escapeHtml(topicTitle)}</strong> • ${items.length} bài</div>
          </div>
          <div class="rd-meta">Tip: Tap a card → Start</div>
        </div>

        <div class="rd-list" id="rdList"></div>
      </div>
    `;

    const list = el("rdList");
    items.forEach((it, idx)=>{
      const card = document.createElement("div");
      card.className = "rd-card";
      card.innerHTML = `
        <h3>${escapeHtml(it.title)}</h3>
        <div class="muted">${escapeHtml(it.topic)} • ${escapeHtml(it.lang || "en")}</div>
        <button class="btn blue">Start</button>
      `;
      card.querySelector("button").onclick = ()=> openReading(items[idx]);
      list.appendChild(card);
    });
  }

  function updateProgress(){
    const prog = el("rdProg");
    if(!prog) return;
    const total = sentences.length || 0;
    prog.textContent = total ? `${Math.min(si+1,total)}/${total}` : "0/0";
  }

  function setActiveSentence(index, scroll){
    for(let i=0;i<sentences.length;i++){
      const n = el("rdSent_" + i);
      if(!n) continue;
      if(i === index) n.classList.add("active"); else n.classList.remove("active");
    }
    if(scroll){
      const n = el("rdSent_" + index);
      try{ n && n.scrollIntoView({block:"center", behavior:"smooth"}); }catch(_e){}
    }
  }

  function syncRepeatUI(){
    const b = el("rdRepeat");
    if(!b) return;
    b.classList.toggle("on", !!repeatMode);
  }

  function makeUtterance(sentence, lang){
    const u = new SpeechSynthesisUtterance(sentence);
    u.rate = rate;
    u.pitch = window.CFG?.TTS_PITCH ?? 1.0;

    // pick voice
    if(!voices || voices.length === 0) loadVoices();
    if(!selectedVoice || !(selectedVoice.lang||"").toLowerCase().startsWith((lang||"en").toLowerCase())){
      selectedVoice = pickBestVoice(lang||"en");
    }
    if(selectedVoice) u.voice = selectedVoice;

    return u;
  }

  function speakSentence(index){
    if(!window.speechSynthesis) return;
    if(index < 0 || index >= sentences.length) return;

    // Reset current sentence rendering to clean HTML before boundary updates
    const node = el("rdSent_" + index);
    if(node) node.innerHTML = escapeHtml(sentences[index]);

    setActiveSentence(index, true);
    updateProgress();

    const u = makeUtterance(sentences[index], cur?.lang || "en");
    currentUtterance = u;

    u.onstart = ()=>{
      setActiveSentence(index, false);
    };

    u.onboundary = (e)=>{
      // Boundary support varies; charIndex is usually "start of current/next word".
      // We extend highlight to the end of the current word (and trailing punctuation),
      // so the last word also gets highlighted.
      const i0 = (typeof e.charIndex === "number") ? e.charIndex : -1;
      if(i0 < 0) return;

      const full = sentences[index];
      let end = Math.min(i0, full.length);

      // Extend to end of the word (until space/newline)
      while(end < full.length && full[end] !== " " && full[end] !== "\n") end++;

      // Include trailing punctuation right after the word
      while(end < full.length && /[.,!?;:")\]]/.test(full[end])) end++;

      const pre = full.slice(0, end);
      const rest = full.slice(end);

      const n = el("rdSent_" + index);
      if(!n) return;
      n.innerHTML = `<span class="rd-prefix">${escapeHtml(pre)}</span>${escapeHtml(rest)}`;
    };

    u.onend = ()=>{
      // Ensure full sentence is highlighted (fix "last word not highlighted")
      const n = el("rdSent_" + index);
      if(n) n.innerHTML = `<span class="rd-prefix">${escapeHtml(sentences[index])}</span>`;

      currentUtterance = null;

      // manual mode: stop after one sentence
      if(!autoMode){
        playing = false;
        paused = false;
        return;
      }

      if(repeatMode){
        // repeat same sentence
        speakSentence(index);
        return;
      }

      // auto next
      if(playing){
        if(index < sentences.length - 1){
          si = index + 1;
          speakSentence(si);
        }else{
          playing = false;
          paused = false;
        }
      }
    };

    u.onerror = ()=>{
      currentUtterance = null;
      playing = false;
      paused = false;
    };

    try{
      window.speechSynthesis.cancel(); // clear queue
      window.speechSynthesis.speak(u);
    }catch(_e){}
  }

  function playFrom(startIndex){
    if(!window.speechSynthesis) return;
    if(sentences.length === 0) return;

    ttsCancel();
    paused = false;
    autoMode = true;
    si = Math.max(0, Math.min(startIndex, sentences.length-1));
    playing = true;
    speakSentence(si);
  }

  function speakOnce(index){
    if(!window.speechSynthesis) return;
    if(sentences.length === 0) return;

    ttsCancel();
    paused = false;
    autoMode = false;  // manual
    playing = false;
    si = Math.max(0, Math.min(index, sentences.length-1));
    speakSentence(si);
  }

  function stop(resetToStart){
    playing = false;
    paused = false;
    autoMode = true;
    ttsCancel();

    // clear any spoken prefix highlights
    if(sentences.length){
      for(let i=0;i<sentences.length;i++){
        const n = el("rdSent_" + i);
        if(n) n.innerHTML = escapeHtml(sentences[i]);
      }
    }

    if(resetToStart){
      si = 0;
      setActiveSentence(si, true);
      updateProgress();
      const first = el("rdSent_0");
      try{ first && first.scrollIntoView({block:"center", behavior:"smooth"}); }catch(_e){}
      return;
    }
    setActiveSentence(si, false);
  }

  function renderReading(){
    ensureStyles();
    const root = el("screenReading");

    const nw = parseNewWords(cur?.newWords);
    const note = (cur?.note_vi ?? "").toString().trim();

    root.innerHTML = `
      <div class="rd-wrap">
        <div class="rd-titlebar">
          <div>
            <div class="rd-title">📘 ${escapeHtml(cur?.title || "")}</div>
            <div class="rd-meta">Topic: <strong>${escapeHtml(topicTitle)}</strong> • Lang: <strong>${escapeHtml(cur?.lang || "en")}</strong></div>
          </div>
          <div class="rd-meta">${sentences.length} sentences</div>
        </div>

        <div class="rd-actions">
          ${note ? `<button class="pill" id="rdToggleNote">👨‍👩‍👧 Ghi chú</button>` : ``}
          ${nw.length ? `<button class="pill" id="rdToggleWords">📌 Từ mới</button>` : ``}
          ${items.length > 1 ? `<button class="pill" id="rdBackList">⬅ Back</button>` : ``}
        </div>

        ${note ? `<div class="rd-panel" id="rdNote" hidden>${escapeHtml(note)}</div>` : ``}

        ${nw.length ? `
          <div class="rd-panel" id="rdWords" hidden>
            <table class="rd-words">
              ${nw.map(x => `<tr><td><strong>${escapeHtml(x.en)}</strong></td><td>${escapeHtml(x.vi)}</td></tr>`).join("")}
            </table>
          </div>
        ` : ``}

        <div class="rd-toolbar">
          <div class="rd-group">
            <button class="rd-ibtn" id="rdPlay" title="Play (auto next / resume if paused)">▶</button>
            <button class="rd-ibtn" id="rdPause" title="Pause">⏸</button>
            <button class="rd-ibtn" id="rdStop" title="Stop (back to first sentence)">⏹</button>
          </div>

          <div class="rd-group">
            <button class="rd-ibtn" id="rdPrev" title="Previous (manual read once)">⬅</button>
            <button class="rd-ibtn" id="rdNext" title="Next (manual read once)">➡</button>
            <button class="rd-ibtn" id="rdRepeat" title="Repeat current sentence (toggle)">🔁</button>
          </div>

          <div class="rd-rate" title="Speech speed">
            <span class="muted">Speed</span>
            <input id="rdRate" type="range" min="0.7" max="1.2" step="0.05">
            <span class="muted" id="rdRateVal"></span>
          </div>

          <div class="quiz-progress" id="rdProg"></div>
        </div>

        <div class="rd-sentences" id="rdSentences"></div>
        <div class="rd-status muted" id="rdStatus"></div>
      </div>
    `;

    // Panels toggles
    if(note){
      el("rdToggleNote").onclick = ()=>{
        const p = el("rdNote");
        if(!p) return;
        p.hidden = !p.hidden;
      };
    }
    if(nw.length){
      el("rdToggleWords").onclick = ()=>{
        const p = el("rdWords");
        if(!p) return;
        p.hidden = !p.hidden;
      };
    }
    if(items.length > 1){
      el("rdBackList").onclick = ()=>{
        stop(false);
        renderList();
      };
    }

    // Render sentences
    const box = el("rdSentences");
    box.innerHTML = "";
    sentences.forEach((s, idx)=>{
      const div = document.createElement("div");
      div.className = "rd-sent";
      div.id = "rdSent_" + idx;
      div.innerHTML = escapeHtml(s);
      div.onclick = ()=>{
        // click sentence: read ONCE (manual)
        speakOnce(idx);
      };
      box.appendChild(div);
    });

    // Rate
    const rateEl = el("rdRate");
    rateEl.value = rate.toFixed(2);
    el("rdRateVal").textContent = rate.toFixed(2) + "x";
    rateEl.oninput = ()=>{
      rate = parseFloat(rateEl.value) || 0.95;
      el("rdRateVal").textContent = rate.toFixed(2) + "x";

      // Apply immediately on desktop engines by restarting the current sentence
      if(window.speechSynthesis){
        const isSpeaking = window.speechSynthesis.speaking;
        const isPaused   = window.speechSynthesis.paused;

        if(isSpeaking || isPaused){
          // keep mode as-is
          const wasAuto = autoMode;
          const wasPlaying = playing;

          ttsCancel();         // cancel current utterance
          paused = false;

          // restart current sentence with new rate
          // if it was manual, it will still stop after one sentence
          // if it was auto+playing, it will continue auto-next
          autoMode = wasAuto;
          playing = wasPlaying;

          speakSentence(si);
        }
      }
    };

    // Buttons
    el("rdPlay").onclick = ()=> {
      // Play also acts as Resume if currently paused
      if(paused){
        try{ window.speechSynthesis && window.speechSynthesis.resume(); }catch(_e){}
        paused = false;
        playing = true;
        autoMode = true;
        return;
      }
      playFrom(si);
    };

    el("rdPause").onclick = ()=> {
      // Pause keeps the current position
      ttsPause();
      paused = true;
      playing = false;
    };

    el("rdStop").onclick = ()=> stop(true);

    el("rdPrev").onclick = ()=> {
      // Manual: go to previous sentence and read ONCE
      if(sentences.length === 0) return;
      ttsCancel();
      paused = false;
      playing = false;
      autoMode = false;
      si = Math.max(0, si-1);
      speakOnce(si);
    };

    el("rdNext").onclick = ()=> {
      // Manual: go to next sentence and read ONCE
      if(sentences.length === 0) return;
      ttsCancel();
      paused = false;
      playing = false;
      autoMode = false;
      si = Math.min(sentences.length-1, si+1);
      speakOnce(si);
    };

    el("rdRepeat").onclick = ()=> {
      // Toggle repeat mode (does NOT auto play)
      repeatMode = !repeatMode;
      const b = el("rdRepeat");
      if(b) b.classList.toggle("on", repeatMode);
    };
    syncRepeatUI();

    // initial
    loadVoices();
    updateProgress();
    setActiveSentence(si, true);
    el("rdStatus").textContent = "Tip: ▶ auto next • Click a sentence to read once • ⏹ returns to sentence 1";
  }

  function openReading(item){
    cur = item;
    sentences = splitIntoSentences(cur?.text || "");
    si = 0;
    playing = false;
    paused = false;
    autoMode = true;
    repeatMode = false;
    renderReading();
  }

  function start(topicItems, title){
    items = (topicItems ?? []).slice();
    topicTitle = title || "Reading";
    cur = null;
    sentences = [];
    si = 0;
    playing = false;
    paused = false;
    autoMode = true;
    repeatMode = false;

    // Init voice selection early
    try{
      if(window.speechSynthesis && "onvoiceschanged" in window.speechSynthesis){
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }catch(_e){}

    if(items.length <= 1){
      openReading(items[0] || {title:"", lang:"en", text:""});
    }else{
      renderList();
    }
  }

  return { start };
})();
