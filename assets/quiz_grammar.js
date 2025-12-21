window.Grammar = (function(){
  let items = [];
  let order = [];
  let idx = 0;
  let correctCount = 0;
  let current = null;

  // "locked" = đã trả lời câu hiện tại hay chưa
  let locked = false;
  let title = "";

  // store wrong questions for "retry wrong" after finish
  let wrongItems = [];

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

    // reset wrong set each run
    wrongItems = [];

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

    // ✅ (YÊU CẦU 1) Chỉ cho Next khi đã chọn đáp án
    const nextBtn = UI.el("grNext");
    nextBtn.disabled = true;
    nextBtn.onclick = () => {
      // chặn an toàn: chưa chọn thì không cho đi tiếp
      if(!locked) return;
      next(true);
    };

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

  // ✅ (YÊU CẦU 2) Tạo câu đã trám đáp án vào chỗ trống
  function filledSentence(question, fillWord){
    const q = (question || "").toString();

    // các dạng blank phổ biến: ___, __, ____
    const reBlank = /_{2,}/g;
    if(reBlank.test(q)){
      // thay toàn bộ cụm gạch dưới bằng đáp án
      return q.replace(reBlank, fillWord);
    }

    // Nếu không có blank, fallback: đọc nguyên câu (KHÔNG đọc đáp án ở cuối)
    return q;
  }

  function renderCurrent(){
    UI.el("grQ").textContent = current.question;

    const opts = UI.el("grOpts");
    opts.innerHTML = "";

    // câu mới => chưa trả lời
    locked = false;

    // ✅ (YÊU CẦU 1) reset Next về trạng thái disabled
    const nextBtn = UI.el("grNext");
    nextBtn.disabled = true;

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
    // đã trả lời rồi thì bỏ qua
    if(locked) return;

    // đánh dấu đã trả lời
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

      // remember wrong question (avoid duplicates by question text)
      const exists = wrongItems.some(x => (x.question || "") === (current.question || ""));
      if(!exists) wrongItems.push(current);
    }

    const explain = UI.el("grExplain");
    explain.hidden = false;
    explain.innerHTML = `<strong>Vì sao?</strong><br>${escapeHtml(current.explain || "")}`;

    // ✅ enable Next sau khi đã chọn
    UI.el("grNext").disabled = false;

    // ✅ (YÊU CẦU 2) TTS đọc câu đã trám đáp án đúng vào blank
    const correctObj = ({A:current.A,B:current.B,C:current.C,D:current.D})[correctKey] || "";
    const toSpeak = filledSentence(current.question, correctObj);
    TTS.speak(toSpeak);

    setProgress();
  }

  // ✅ helper: quay về Home (không phá flow hiện tại)
  function goHomeSafe(){
    // Ưu tiên: bấm nút Home nếu trang có sẵn
    const btn = document.getElementById("btnHome");
    if(btn && typeof btn.click === "function"){
      btn.click();
      return;
    }
    // Fallback: nếu UI có hàm showScreen
    if(window.UI && typeof UI.showScreen === "function"){
      UI.showScreen("screenHome");
      return;
    }
    // Fallback cuối: reload (rất hiếm khi cần)
    // location.reload();
  }

  function finishScreen(){
    const root = UI.el("screenGrammar");
    const hasWrong = wrongItems.length > 0;

    // ✅ (YÊU CẦU 3) Nếu đúng hết: không hiện Restart kiểu “làm lại câu đã đúng”
    // => hiển thị rõ: "Làm lại tất cả" và "Về trang chủ"
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="finish">
          <h2>✅ Finish</h2>
          <div class="muted">Kết quả: đúng <strong>${correctCount}</strong> / ${order.length} câu</div>
          ${hasWrong ? `<div class="muted">Câu sai: <strong>${wrongItems.length}</strong></div>` : ``}
        </div>
        <div class="nextbar">
          ${hasWrong ? `<button class="next" id="grRetryWrong">Làm lại câu sai</button>` : ``}
          <button class="next" id="grRestartAll">Làm lại tất cả</button>
          <button class="next" id="grGoHome">Về trang chủ</button>
        </div>
      </div>
    `;

    if(hasWrong){
      UI.el("grRetryWrong").onclick = ()=> start(wrongItems, `${title} — Câu sai`);
    }
    UI.el("grRestartAll").onclick = ()=> start(items, title);
    UI.el("grGoHome").onclick = ()=> goHomeSafe();
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
