window.Speaking = (function(){
  let items = [];
  let order = [];
  let idx = 0;
  let current = null;
  let title = "";

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }
  function normalizeKey(s){
    return String(s || "")
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu
      .toLowerCase()
      .replace(/\.(png|jpg|jpeg|webp)$/i, "")          // bỏ đuôi nếu người dùng lỡ nhập
      .replace(/[^a-z0-9\/]+/g, "_")                   // cho phép cả folder con "food/pizza_1"
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function setSpeakingImage(imageKey){
    const img = UI.el("spTopicImg");
    const key = normalizeKey(imageKey);

    if(!key){
      img.hidden = true;
      img.removeAttribute("src");
      return;
    }

    const base = `assets/topic_images/speaking/${key}`;
    const exts = [".png", ".jpg", ".jpeg", ".webp"];
    let k = 0;

    function tryNext(){
      if(k >= exts.length){
        img.hidden = true;
        img.removeAttribute("src");
        return;
      }
      img.src = base + exts[k++];
    }

    img.onerror = tryNext;
    img.onload = () => { img.hidden = false; };
    tryNext();
  }

  function start(topicItems, topicTitle){
    items = topicItems.slice();
    order = shuffle(items.map((_,i)=>i));
    idx = 0;
    current = null;
    title = topicTitle;

    const root = UI.el("screenSpeaking");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🖊️ <span id="spTitle"></span></div>
          <div class="quiz-progress" id="spProg"></div>
        </div>
        <div class="quiz-body">
          <img id="spTopicImg" class="topic-img" alt="Topic image" hidden />
          <div class="big-emoji" id="spEmoji">👂</div>
          <div class="qtext" id="spQ"></div>
          <div class="kwhint" id="spHintKw" hidden></div>
          <div class="hint" id="spA" hidden></div>         
        </div>

        <div class="controls">
          <button class="circle orange" id="spSpeak" title="Repeat">🔊</button>
          <button class="circle blue" id="spShow" title="Show question">👁️</button>
          <button class="circle green" id="spHint" title="Show answer">💡</button>
        </div>

        <div class="nextbar">
          <button class="next" id="spNext">Next</button>
        </div>
      </div>
    `;

    UI.el("spTitle").textContent = topicTitle;
    UI.el("spSpeak").onclick = ()=> current && TTS.speak(current.question);
    UI.el("spShow").onclick = ()=> showQuestion();
    UI.el("spHint").onclick = ()=> showAnswer(true);
    UI.el("spNext").onclick = ()=> next(true);

    TTS.warmUp();
    next(true);
  }

  function setProgress(){
    const total = order.length;
    const done = Math.min(idx, total);
    UI.el("spProg").textContent = `${done}/${total}`;
  }


  function showQuestion(){
    if(!current) return;
    UI.el("spQ").textContent = current.question;
    UI.el("spEmoji").textContent = "📝";

    const hk = UI.el("spHintKw");
    const h = (current.hint || "").trim();
    if(h){
      hk.hidden = false;
      hk.textContent = "Hint: " + h;
    }else{
      hk.hidden = true;
      hk.textContent = "";
    }
  }

  function showAnswer(read){
    if(!current) return;
    const a = UI.el("spA");
    a.hidden = false;
    a.textContent = current.answer || "";
    if(read && current.answer) TTS.speak(current.answer);
  }

  function finishScreen(){
    const root = UI.el("screenSpeaking");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="finish">
          <h2>✅ Finish</h2>
          <div class="muted">Bạn đã làm hết câu trong chủ đề này.</div>
        </div>
        <div class="nextbar">
          <button class="next" id="spRestart">Restart</button>
        </div>
      </div>
    `;
    UI.el("spRestart").onclick = ()=> start(items, title);
  }

  function next(autoSpeak){
    const total = order.length;
    if(idx >= total){
      finishScreen();
      return;
    }
    current = items[order[idx]];
    idx += 1;

    UI.el("spEmoji").textContent = "👂";
    UI.el("spQ").textContent = "";
    // NEW: hint keywords reset
    const hk = UI.el("spHintKw");
    hk.hidden = true;
    hk.textContent = "";

    // NEW: set image for this question/group
    setSpeakingImage(current.image);

    const a = UI.el("spA");
    a.hidden = true;
    a.textContent = current.answer || "";
    setProgress();
    if(autoSpeak) TTS.speak(current.question);
  }

  return {start};
})();
