window.Pronunciation = (function(){
  let items = [];
  let order = [];
  let idx = 0;
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
    const done = Math.min(idx, total);
    UI.el("prProg").textContent = `${done}/${total} • ✅ ${correctCount}`;
  }

  function speakTarget(){
    if(!current) return;
    const text = current.target || current.prompt || "";
    if(text) TTS.speak(text);
  }

  function renderQuestion(){
    locked = false;
    current = items[ order[idx] ];
    setProgress();

    UI.el("prTitle").textContent = title;

    UI.el("prPrompt").textContent = current.prompt || "";
    UI.el("prTarget").textContent = current.target || "";

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
          if(raw) TTS.speak(raw);
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
  }

  function choose(letter){
    locked = true;

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
      wrongIdxs.push(order[idx]);
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
          <div class="quiz-title">🔊 <span id="prTitle"></span></div>
          <div class="quiz-progress" id="prProg"></div>
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

  function next(){
    if(idx >= order.length){
      finish();
      return;
    }
    renderQuestion();
    idx++;
  }

  function start(topicItems, topicTitle){
    items = topicItems.slice();
    order = shuffle(items.map((_,i)=>i));
    idx = 0;
    correctCount = 0;
    wrongIdxs = [];
    current = null;
    locked = false;
    title = topicTitle;

    const root = UI.el("screenPronunciation");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🔊 <span id="prTitle"></span></div>
          <div class="quiz-progress" id="prProg"></div>
        </div>

        <div class="quiz-body">
          <div class="big-emoji">🔊</div>

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

    UI.el("prTitle").textContent = topicTitle;
    UI.el("prSay").onclick = ()=> speakTarget();

    UI.el("prNext").onclick = ()=>{
      if(!locked){
        const ex = UI.el("prExplain");
        ex.hidden = false;
        ex.innerHTML = "👉 Hãy chọn 1 đáp án trước khi bấm Next.";
        return;
      }
      next();
    };

    TTS.warmUp();
    next();
  }

  return {start};
})();
