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
  let rate = null;            // current speech rate
  let pitch = null;

  // voices
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
      if(!voices || voices.length === 0) return;
      selectedVoice = pickBestVoice(cur?.lang || "en");
    }catch(_e){}
  }

  function pickBestVoice(lang){
    const target = (lang || "en").toString().toLowerCase();
    const preferred = window.CFG?.PREFERRED_VOICES || [];
    if(voices && voices.length){
      for(const name of preferred){
        const v = voices.find(x => (x.name||"").includes(name) && (x.lang||"").toLowerCase().startsWith(target));
        if(v) return v;
      }
      // any matching language
      const byLang = voices.find(x => (x.lang||"").toLowerCase().startsWith(target));
      if(byLang) return byLang;
      return voices[0];
    }
    return null;
  }

  function ttsCancel(){
    try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(_e){}
  }
  function ttsPause(){
    try{ window.speechSynthesis && window.speechSynthesis.pause(); }catch(_e){}
  }
  function ttsResume(){
    try{ window.speechSynthesis && window.speechSynthesis.resume(); }catch(_e){}
  }

  function normalizeTextForSplit(t){
    // Keep paragraph breaks as markers, but simplify whitespace.
    return (t ?? "").toString()
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .trim();
  }

  function splitIntoSentences(text){
    // Child-friendly, practical splitter for English.
    // Keeps punctuation with the sentence.
    const t = normalizeTextForSplit(text);
    if(!t) return [];

    // If user already puts each sentence on its own line, respect that somewhat.
    // We'll still split lines further by punctuation.
    const lines = t.split("\n").map(x=>x.trim()).filter(Boolean);
    const out = [];

    // Common abbreviations to reduce over-splitting.
    const ABBR = new Set([
      "mr.", "mrs.", "ms.", "dr.", "st.", "jr.", "sr.",
      "u.s.", "u.k.", "e.g.", "i.e."
    ]);

    function pushSentence(s){
      const clean = s.replace(/\s+/g, " ").trim();
      if(clean) out.push(clean);
    }

    for(const line of lines){
      let buf = "";
      for(let i=0;i<line.length;i++){
        const ch = line[i];
        buf += ch;

        if(ch === "." || ch === "!" || ch === "?"){
          // Look back token
          const tail = buf.trim().toLowerCase();
          const m = tail.match(/([a-z]\.)$/i); // last "x."
          const lastWord = tail.split(/\s+/).pop() || "";
          if(ABBR.has(lastWord) || ABBR.has((lastWord + (line[i+1]||"")).toLowerCase())){
            continue;
          }
          // If next is space or end, split
          const next = line[i+1] || "";
          if(next === "" || next === " "){
            pushSentence(buf);
            buf = "";
            // skip following spaces
            while(line[i+1] === " ") i++;
          }
        }
      }
      if(buf.trim()) pushSentence(buf);
    }
    return out;
  }

  function parseNewWords(cell){
    const raw = (cell ?? "").toString().trim();
    if(!raw) return [];
    // format: "word: nghĩa; word2: nghĩa2"
    return raw.split(";")
      .map(x=>x.trim())
      .filter(Boolean)
      .map(pair=>{
        const idx = pair.indexOf(":");
        if(idx === -1) return { en: pair.trim(), vi: "" };
        return {
          en: pair.slice(0, idx).trim(),
          vi: pair.slice(idx+1).trim()
        };
      })
      .filter(x=>x.en);
  }

  function injectLocalStyles(){
    if(document.getElementById("readingStyles")) return;
    const style = document.createElement("style");
    style.id = "readingStyles";
    style.textContent = `
      .rd-meta{display:flex; gap:10px; flex-wrap:wrap; align-items:center; justify-content:space-between; margin-top:6px;}
      .rd-actions{display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:12px;}
      .rd-actions .pill{cursor:pointer}
      .rd-controls{display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:10px;}
      .rd-controls button{min-width:120px}
      .rd-sentences{margin-top:14px; text-align:left;}
      .rd-sent{display:block; padding:10px 12px; border-radius:14px; border:1px solid var(--border); background:#f9fafb; margin-bottom:10px; font-weight:800; line-height:1.55; font-size: clamp(15px, 3.6vw, 18px);}
      .rd-sent.active{outline:3px solid rgba(20,184,166,.25); background: rgba(20,184,166,.08);}
      .rd-sent .spoken{background: rgba(253,224,71,.35); border-radius:8px; padding:0 2px;}
      .rd-sent .rest{opacity:.95;}
      .rd-panel{margin-top:12px; border:1px solid var(--border); border-radius:14px; padding:12px; background:#fff;}
      .rd-panel h3{margin:0 0 8px; font-size:14px;}
      .rd-words{display:grid; grid-template-columns: 1fr 1.2fr; gap:8px; align-items:start;}
      .rd-words .w{padding:8px 10px; border:1px solid var(--border); border-radius:12px; background:#f9fafb; font-weight:800;}
      .rd-words .m{padding:8px 10px; border:1px solid var(--border); border-radius:12px; background:#fff;}
      @media (max-width: 620px){ .rd-words{grid-template-columns:1fr;} }
      .rd-list .card{min-height:unset;}
      .rd-small{font-size:12px; color: var(--muted); font-weight:700;}
    `;
    document.head.appendChild(style);
  }

  function renderList(){
    injectLocalStyles();
    const root = el("screenReading");
    root.innerHTML = "";

    const wrap = document.createElement("div");
    wrap.className = "section rd-list";
    wrap.innerHTML = `
      <div class="section-head">
        <div class="section-title">📘 Reading / Speech</div>
        <div class="section-sub">Choose a title to practice</div>
      </div>
      <div class="grid" id="rdGrid"></div>
    `;
    root.appendChild(wrap);

    const grid = wrap.querySelector("#rdGrid");
    for(const it of items){
      const card = document.createElement("div");
      card.className = "card";
      const nwCount = parseNewWords(it.newWords).length;
      const note = (it.note_vi ?? "").toString().trim();
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(it.title || "(No title)")}</div>
            <div class="card-count">${escapeHtml(it.topic || "")}</div>
            <div class="rd-small">${nwCount ? `📌 ${nwCount} new words` : ""}${(nwCount && note) ? " • " : ""}${note ? "👨‍👩‍👧 note" : ""}</div>
          </div>
          <div class="card-icon">📘</div>
        </div>
        <button class="btn teal">Start</button>
      `;
      card.querySelector("button").onclick = ()=> openReading(it);
      grid.appendChild(card);
    }
  }

  function renderReading(){
    injectLocalStyles();
    const root = el("screenReading");

    const nw = parseNewWords(cur?.newWords);
    const note = (cur?.note_vi ?? "").toString().trim();

    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">📘 <span id="rdTitle"></span></div>
          <div class="quiz-progress" id="rdProg"></div>
        </div>

        <div class="rd-meta">
          <div class="muted">Topic: <strong>${escapeHtml(topicTitle)}</strong></div>
          <div class="muted">Lang: <strong>${escapeHtml(cur?.lang || "en")}</strong></div>
        </div>

        <div class="rd-actions">
          ${note ? `<button class="pill" id="rdToggleNote">👨‍👩‍👧 Ghi chú</button>` : ``}
          ${nw.length ? `<button class="pill" id="rdToggleWords">📌 Từ mới</button>` : ``}
          ${items.length > 1 ? `<button class="pill" id="rdBackList">⬅ Back to list</button>` : ``}
        </div>

        ${note ? `<div class="rd-panel" id="rdNote" hidden>
          <h3>Ghi chú (VI)</h3>
          <div>${escapeHtml(note)}</div>
        </div>` : ``}

        ${nw.length ? `<div class="rd-panel" id="rdWords" hidden>
          <h3>Từ mới cần lưu ý</h3>
          <div class="rd-words" id="rdWordsGrid"></div>
        </div>` : ``}

        <div class="rd-controls">
          <button class="btn teal" id="rdPlay">▶ Play</button>
          <button class="btn purple" id="rdPause">⏸ Pause</button>
          <button class="btn blue" id="rdResume">⏯ Resume</button>
          <button class="btn green" id="rdStop">⏹ Stop</button>
        </div>

        <div class="rd-controls">
          <button class="pill" id="rdPrev">⬅ Prev</button>
          <button class="pill" id="rdNext">Next ➡</button>
          <button class="pill" id="rdRepeat">🔁 Repeat</button>
        </div>

        <div class="rd-meta" style="justify-content:center">
          <div class="muted">Speed:
            <input id="rdRate" type="range" min="0.7" max="1.2" step="0.05" style="vertical-align:middle; width:220px">
            <span id="rdRateVal" style="font-weight:900"></span>
          </div>
        </div>

        <div class="rd-sentences" id="rdSentences"></div>
      </div>
    `;

    el("rdTitle").textContent = cur?.title || "Reading";

    // rate defaults
    rate = typeof window.CFG?.TTS_RATE === "number" ? window.CFG.TTS_RATE : 0.9;
    pitch = typeof window.CFG?.TTS_PITCH === "number" ? window.CFG.TTS_PITCH : 1.0;

    const rateInput = el("rdRate");
    rateInput.value = rate;
    el("rdRateVal").textContent = rate.toFixed(2);
    rateInput.oninput = ()=>{
      rate = parseFloat(rateInput.value);
      el("rdRateVal").textContent = rate.toFixed(2);
    };

    // build words table
    if(nw.length){
      const grid = el("rdWordsGrid");
      grid.innerHTML = "";
      for(const w of nw){
        const a = document.createElement("div");
        a.className = "w";
        a.textContent = w.en;
        const b = document.createElement("div");
        b.className = "m";
        b.textContent = w.vi || "";
        grid.appendChild(a);
        grid.appendChild(b);
      }
    }

    // toggles
    if(note){
      el("rdToggleNote").onclick = ()=>{
        const p = el("rdNote");
        p.hidden = !p.hidden;
      };
    }
    if(nw.length){
      el("rdToggleWords").onclick = ()=>{
        const p = el("rdWords");
        p.hidden = !p.hidden;
      };
    }
    if(items.length > 1){
      el("rdBackList").onclick = ()=>{
        ttsCancel();
        playing = false;
        renderList();
      };
    }

    // Render sentences
    const cont = el("rdSentences");
    cont.innerHTML = "";
    sentences.forEach((s, i)=>{
      const div = document.createElement("div");
      div.className = "rd-sent";
      div.id = "rdSent_" + i;
      div.innerHTML = escapeHtml(s);
      div.onclick = ()=>{
        stop();
        si = i;
        updateProgress();
        setActiveSentence(si, false);
        // start speaking from clicked sentence
        playFrom(si);
      };
      cont.appendChild(div);
    });

    // Buttons
    el("rdPlay").onclick = ()=> playFrom(si);
    el("rdPause").onclick = ()=> { ttsPause(); playing = false; };
    el("rdResume").onclick = ()=> { ttsResume(); playing = true; };
    el("rdStop").onclick = ()=> stop();
    el("rdPrev").onclick = ()=> { stop(); si = Math.max(0, si-1); updateProgress(); setActiveSentence(si, true); };
    el("rdNext").onclick = ()=> { stop(); si = Math.min(sentences.length-1, si+1); updateProgress(); setActiveSentence(si, true); };
    el("rdRepeat").onclick = ()=> { stop(); playFrom(si); };

    // voices
    if(window.speechSynthesis){
      window.speechSynthesis.onvoiceschanged = ()=>{
        loadVoices();
      };
      loadVoices();
    }

    si = Math.min(si, Math.max(0, sentences.length-1));
    updateProgress();
    setActiveSentence(si, true);
  }

  function updateProgress(){
    const total = sentences.length;
    el("rdProg").textContent = `${Math.min(si+1, total)}/${total}`;
  }

  function setActiveSentence(index, scroll){
    sentences.forEach((_s,i)=>{
      const node = el("rdSent_" + i);
      if(!node) return;
      if(i === index) node.classList.add("active");
      else node.classList.remove("active");
    });
    if(scroll){
      const node = el("rdSent_" + index);
      node?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    }
  }

  function setSpokenPrefix(index, charIndex){
    // Optional word-level-ish highlight using onboundary.
    // We highlight the spoken prefix within the active sentence.
    const node = el("rdSent_" + index);
    if(!node) return;
    const s = sentences[index] || "";
    const ci = Math.max(0, Math.min(charIndex || 0, s.length));
    const prefix = s.slice(0, ci);
    const rest = s.slice(ci);
    node.innerHTML = `<span class="spoken">${escapeHtml(prefix)}</span><span class="rest">${escapeHtml(rest)}</span>`;
  }

  function makeUtterance(text, lang){
    const u = new SpeechSynthesisUtterance((text ?? "").toString().replace(/_{2,}/g, " blank "));
    if(!voices || voices.length === 0) loadVoices();
    if(!selectedVoice) selectedVoice = pickBestVoice(lang);
    if(selectedVoice){
      u.voice = selectedVoice;
      u.lang = selectedVoice.lang || (lang?.startsWith("vi") ? "vi-VN" : "en-US");
    }else{
      u.lang = (lang?.startsWith("vi") ? "vi-VN" : "en-US");
    }
    u.rate = typeof rate === "number" ? rate : (window.CFG?.TTS_RATE ?? 0.9);
    u.pitch = typeof pitch === "number" ? pitch : (window.CFG?.TTS_PITCH ?? 1.0);
    return u;
  }

  function playFrom(startIndex){
    if(!window.speechSynthesis) return;
    if(sentences.length === 0) return;
    si = Math.max(0, Math.min(startIndex, sentences.length-1));
    playing = true;
    speakSentence(si);
  }

  function speakSentence(index){
    if(!playing) return;
    if(index >= sentences.length){
      playing = false;
      return;
    }
    // Reset current sentence rendering to clean HTML before boundary updates
    const node = el("rdSent_" + index);
    if(node) node.innerHTML = escapeHtml(sentences[index]);

    setActiveSentence(index, true);
    updateProgress();

    const u = makeUtterance(sentences[index], cur?.lang || "en");

    u.onstart = ()=>{
      // ensure active highlight
      setActiveSentence(index, false);
    };
    u.onboundary = (e)=>{
      // Word boundary support is limited across browsers; fallback is sentence highlight only.
      // If supported, show spoken prefix.
      if(typeof e.charIndex === "number"){
        setSpokenPrefix(index, e.charIndex);
      }
    };
    u.onend = ()=>{
      // Restore sentence (remove prefix highlight) to keep DOM light
      const n = el("rdSent_" + index);
      if(n) n.innerHTML = escapeHtml(sentences[index]);

      if(!playing) return;
      si = index + 1;
      if(si < sentences.length){
        speakSentence(si);
      }else{
        playing = false;
        // End reached
        setActiveSentence(sentences.length-1, true);
        updateProgress();
      }
    };
    u.onerror = ()=>{
      playing = false;
    };

    // Must be initiated by user gesture at least once on iOS; Play button does that.
    ttsCancel();
    window.speechSynthesis.speak(u);
  }

  function stop(){
    playing = false;
    ttsCancel();
    // clear any spoken prefix highlights
    if(sentences.length){
      for(let i=0;i<sentences.length;i++){
        const n = el("rdSent_" + i);
        if(n) n.innerHTML = escapeHtml(sentences[i]);
      }
    }
    setActiveSentence(si, false);
  }

  function openReading(item){
    cur = item;
    sentences = splitIntoSentences(cur?.text || "");
    si = 0;
    playing = false;
    renderReading();
  }

  function start(topicItems, topic){
    items = (topicItems ?? []).slice();
    topicTitle = topic || "Reading";

    const root = el("screenReading");
    if(!root){
      console.error("screenReading not found in index.html");
      return;
    }

    // Normalize item fields
    items = items.map(it=>({
      topic: it.topic ?? topicTitle,
      title: it.title ?? it.Title ?? "",
      lang: it.lang ?? it.Lang ?? "en",
      text: it.text ?? it.Text ?? "",
      note_vi: it.note_vi ?? it.Note_vi ?? "",
      newWords: it.newWords ?? it.NewWords ?? ""
    }));

    // If only one item, open it directly; else show list by title
    if(items.length === 1){
      openReading(items[0]);
    }else{
      renderList();
    }
  }

  return { start };
})();