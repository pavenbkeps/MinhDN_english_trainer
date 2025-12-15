window.Grammar = (function(){
  let items = [];
  let order = [];
  let idx = 0;
  let correctCount = 0;
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

  function start(topicItems, topicTitle){
    items = topicItems.slice();
    order = shuffle(items.map((_,i)=>i));
    idx = 0;
    correctCount = 0;
    current = null;
    locked = false;
    title = topicTitle;

    const root = UI.el("screenGrammar");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🧩 <span id="grTitle"></span></div>
          <div class="quiz-progress" id="grProg"></div>
        </div>

        <div class="quiz-body">
          <div class="big-emoji">🧩</div>
          <div class="qtext" id="grQ"></div>

          <div class="options" id="grOpts"></div>
          <div class="explain" id="grExplain" hidden></div>
        </div>

        <div class="nextbar">
          <button class="next" id="grNext">Next</button>
        </div>
      </div>
    `;
    UI.el("grTitle").textContent = topicTitle;
    UI.el("grNext").onclick = ()=> next(true);

    TTS.warmUp();
    next(true);
  }

  function setProgress(){
    const total = order.length;
    const done = Math.min(idx, total);
    UI.el("grProg").textContent = `${done}/${total} • ✅ ${correctCount}`;
  }

  function escapeHtml(str){
    return (str??"").toString()
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  }

  function renderCurrent(){
    UI.el("grQ").textContent = current.question;
    const opts = UI.el("grOpts");
    opts.innerHTML = "";
    locked = false;

    const explain = UI.el("grExplain");
    explain.hidden = true;
    explain.textContent = "";

    const original = [
      {k:"A", text: current.A},
      {k:"B", text: current.B},
      {k:"C", text: current.C},
      {k:"D", text: current.D},
    ];
    const shuffled = shuffle(original.slice());

    for(const o of shuffled){
      const b = document.createElement("button");
      b.className = "opt";
      b.type = "button";
      b.textContent = `${o.k}. ${o.text}`;
      b.onclick = ()=> choose(o.k, b);
      opts.appendChild(b);
    }
  }

  function choose(k, btn){
    if(locked) return;
    locked = true;

    const buttons = Array.from(UI.el("grOpts").querySelectorAll(".opt"));
    const correctKey = current.correct;

    for(const b of buttons){
      const label = (b.textContent || "").trim().slice(0,1).toUpperCase();
      if(label === correctKey) b.classList.add("correct");
    }

    if(k === correctKey){
      correctCount += 1;
      btn.classList.add("correct");
    }else{
      btn.classList.add("wrong");
    }

    const explain = UI.el("grExplain");
    explain.hidden = false;
    explain.innerHTML = `<strong>Vì sao?</strong><br>${escapeHtml(current.explain || "")}`;

    const correctObj = ({A:current.A,B:current.B,C:current.C,D:current.D})[correctKey] || "";
    TTS.speak(`${current.question} ${correctObj}`);
    setProgress();
  }

  function finishScreen(){
    const root = UI.el("screenGrammar");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="finish">
          <h2>✅ Finish</h2>
          <div class="muted">Kết quả: đúng <strong>${correctCount}</strong> / ${order.length} câu</div>
        </div>
        <div class="nextbar">
          <button class="next" id="grRestart">Restart</button>
        </div>
      </div>
    `;
    UI.el("grRestart").onclick = ()=> start(items, title);
  }

  function next(autoSpeak){
    const total = order.length;
    if(idx >= total){
      finishScreen();
      return;
    }
    current = items[order[idx]];
    idx += 1;
    renderCurrent();
    setProgress();
    if(autoSpeak) TTS.speak(current.question);
  }

  return {start};
})();
