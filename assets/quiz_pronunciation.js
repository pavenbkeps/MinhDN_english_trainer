window.Pronunciation = (function(){
  let items = [];
  let order = [];
  let qIndex = 0; // index câu hiện tại (0-based)
  let correctCount = 0;
  let wrongIdxs = [];
  let current = null;
  let locked = false;
  let title = "";

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  function escapeHtml(str){
    return (str??"").toString()
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  }
  function stripParenText(s){
    // Bỏ mọi đoạn trong ngoặc tròn: ( ... )
    return (s ?? "").toString().replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
  }

  function formatWithParen(s){
    // Hiển thị: phần trước ngoặc in đậm, phần trong ngoặc nhỏ hơn
    const raw = (s ?? "").toString();
    const m = raw.match(/^([^()]*)\(([^)]*)\)\s*$/);
    if(!m) return `<span class="en-strong">${escapeHtml(raw)}</span>`;
    const en = (m[1] ?? "").trim();
    const vi = (m[2] ?? "").trim();
    return `
      <span class="en-strong">${escapeHtml(en)}</span>
      <span class="vi-paren">(${escapeHtml(vi)})</span>
    `;
  }

  function buildOption(letter, text){
    const safe = escapeHtml(text || "");
    return `
      <div class="opt-line">
        <div class="opt-text"><strong>${letter}.</strong> ${safe}</div>
        <button class="opt-say" data-say="${escapeHtml(text||"")}">🔊</button>
      </div>
    `;
  }

  function getOptions(item){
    const opts = [];
    if(item.A) opts.push(["A", item.A]);
    if(item.B) opts.push(["B", item.B]);
    if(item.C) opts.push(["C", item.C]);
    if(item.D) opts.push(["D", item.D]);
    return opts;
  }

  function setProgress(){
    const total = order.length;
    const cur = Math.min(qIndex + 1, total);
    UI.el("prProg").textContent = `${cur}/${total} • ✅ ${correctCount}`;
  }


  function speakTarget(){
    if(!current) return;

    // Special case: minimal_pair (Nghe và chọn từ đúng)
    // We want the 🔊 button to speak the correct WORD (column "Correct"),
    // but never show that word as text on screen.
    const t = (current.type || "").toString().toLowerCase();
    if(t === "minimal_pair"){
      const word = current.correct_word || "";
      const speak = stripParenText(word);
      if(speak) TTS.speak(speak);
      return;
    }

    const text = current.target || current.prompt || "";
    const speak = stripParenText(text);
    if(speak) TTS.speak(speak);

  }

  function renderQuestion(){
    locked = false;
    current = items[ order[qIndex] ];
    setProgress();

    UI.el("prTitle").textContent = title;

    UI.el("prPrompt").innerHTML = formatWithParen(current.prompt || "");
    UI.el("prTarget").innerHTML = formatWithParen(current.target || "");

    const optsEl = UI.el("prOpts");
    optsEl.innerHTML = "";

    const opts = getOptions(current);
    for(const [letter, text] of opts){
      const btn = document.createElement("button");
      btn.className = "opt";
      btn.type = "button";
      btn.dataset.letter = letter;
      btn.innerHTML = buildOption(letter, text);

      btn.addEventListener("click", (ev)=>{
        const sayBtn = ev.target && ev.target.closest && ev.target.closest(".opt-say");
        if(sayBtn){
          ev.preventDefault();
          ev.stopPropagation();
          const raw = sayBtn.getAttribute("data-say") || "";
          const speak = stripParenText(raw);
          if(speak) TTS.speak(speak);          
          return;
        }
        if(locked) return;
        choose(letter);
      });

      optsEl.appendChild(btn);
    }

    const ex = UI.el("prExplain");
    ex.hidden = true;
    ex.innerHTML = "";
    UI.el("screenPronunciation").dataset.answered = "0";
  }

  function choose(letter){
    locked = true;
    UI.el("screenPronunciation").dataset.answered = "1";

    const correct = current.correct;
    const opts = UI.el("prOpts").querySelectorAll(".opt");
    opts.forEach(b=>{
      const l = b.dataset.letter;
      if(l === correct) b.classList.add("correct");
      if(l === letter && l !== correct) b.classList.add("wrong");
    });

    if(letter === correct){
      correctCount++;
    }else{
      wrongIdxs.push(order[qIndex]);
    }

    const ex = UI.el("prExplain");
    ex.hidden = false;
    const expl = current.explain || "";
    ex.innerHTML = expl ? escapeHtml(expl).replace(/\n/g,"<br>") : "✅ Good job!";

    setProgress();
  }

  function finish(){
    const root = UI.el("screenPronunciation");
    const wrongCount = wrongIdxs.length;
    const hasWrong = wrongCount > 0;

    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-progress" id="prProg"></div>
          <span id="prTitle" style="display:none"></span>          
        </div>

        <div class="quiz-body">
          <div class="big-emoji">🏁</div>
          <div class="qtext"><strong>Finished!</strong></div>

          <div class="finish-box">
            <div>✅ Correct: <strong>${correctCount}</strong></div>
            <div>❌ Wrong: <strong>${wrongCount}</strong></div>
          </div>

          <div class="finish-actions">
            <button class="btn green" id="prRedoWrong" ${hasWrong ? "" : "disabled"}>Làm lại câu sai</button>
            <button class="btn blue" id="prRestart">Làm lại từ đầu</button>
            <button class="btn purple" id="prBackHome">Về Home</button>
          </div>
        </div>
      </div>
    `;

    UI.el("prTitle").textContent = title;
    UI.el("prProg").textContent = `${order.length}/${order.length} • ✅ ${correctCount}`;

    UI.el("prRestart").onclick = ()=> start(items, title);
    UI.el("prBackHome").onclick = ()=> UI.showScreen("screenHome");

    UI.el("prRedoWrong").onclick = ()=>{
      if(!hasWrong) return;
      const wrongItems = wrongIdxs.map(i=>items[i]);
      start(wrongItems, `${title} (Câu sai)`);
    };
  }


  function goNext(){
    qIndex++;
    if(qIndex >= order.length){
      finish();
      return;
    }
    renderQuestion();
  }

  function startFirst(){
    qIndex = 0;
    renderQuestion();
  }

  function start(topicItems, topicTitle){
    items = topicItems.slice();
    order = shuffle(items.map((_,i)=>i));
    qIndex = 0;
    correctCount = 0;
    wrongIdxs = [];
    current = null;
    locked = false;
    title = topicTitle;

    const root = UI.el("screenPronunciation");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-progress" id="prProg"></div>
          <span id="prTitle" style="display:none"></span>
        </div>

        <div class="quiz-body">

          <div class="qtext" id="prPrompt"></div>
          <div class="hint" id="prTarget"></div>

          <div class="controls">
            <button class="circle blue" id="prSay">🔊</button>
          </div>

          <div class="options" id="prOpts"></div>
          <div class="explain" id="prExplain" hidden></div>
        </div>

        <div class="nextbar">
          <button class="next" id="prNext">Next</button>
        </div>
      </div>
    `;
    UI.el("screenPronunciation").dataset.answered = "0";
    UI.el("prTitle").textContent = topicTitle;
    UI.el("prSay").onclick = ()=> speakTarget();
    
    UI.el("prNext").onclick = ()=>{
      const answered = UI.el("screenPronunciation").dataset.answered === "1";
      if(!answered){
        const ex = UI.el("prExplain");
        ex.hidden = false;
        ex.innerHTML = "👉 Hãy chọn 1 đáp án trước khi bấm Next.";
        return;
      }
      goNext();
    };


    TTS.warmUp();
    startFirst();
  }

  return {start};
})();
