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
  // THem tu day
  // ================================
  // LEARN UI (Modal)
  // ================================
  function ensureLearnCSS(){
    if(document.getElementById("learnModalCSS")) return;
    const st = document.createElement("style");
    st.id = "learnModalCSS";
    st.textContent = `
      .learn-modal{
        position: fixed; inset: 0; z-index: 9999;
        background: rgba(0,0,0,.35);
        display:flex; align-items:center; justify-content:center;
        padding: 14px;
      }
      .learn-panel{
        width: min(920px, 100%);
        max-height: min(86vh, 900px);
        overflow:auto;
        background:#fff;
        border-radius: 18px;
        border: 1px solid rgba(229,231,235,.95);
        box-shadow: 0 20px 50px rgba(0,0,0,.25);
        padding: 14px;
      }
      .learn-top{
        display:flex; align-items:flex-start; justify-content:space-between;
        gap: 10px;
      }
      .learn-badge{
        display:inline-block;
        font-weight: 900;
        font-size: 12px;
        padding: 6px 10px;
        border-radius: 999px;
        background: rgba(124,58,237,.12);
        border: 1px solid rgba(124,58,237,.25);
      }
      .learn-title{
        margin-top: 8px;
        font-weight: 950;
        font-size: 22px;
      }
      .learn-sub{
        margin-top: 4px;
        opacity: .8;
        font-weight: 650;
        font-size: 13px;
      }
      .learn-x{
        border:none; background: rgba(17,24,39,.06);
        border: 1px solid rgba(229,231,235,.95);
        width: 40px; height: 40px;
        border-radius: 12px;
        font-weight: 950;
        cursor:pointer;
      }
      .learn-card{
        margin-top: 12px;
        background: #fff;
        border: 1px solid rgba(229,231,235,.95);
        border-radius: 16px;
        padding: 12px;
      }
      .learn-card-title{
        font-weight: 950;
        font-size: 16px;
        margin-bottom: 8px;
      }
      .learn-card-points{ border-left: 6px solid rgba(34,197,94,.55); }
      .learn-card-examples{ border-left: 6px solid rgba(59,130,246,.55); }
      .learn-card-links{ border-left: 6px solid rgba(245,158,11,.55); }

      .learn-points{ margin:0; padding-left: 18px; line-height: 1.55; font-size: 16px; }
      .learn-points li{ margin: 8px 0; }

      .learn-example{
        border: 1px dashed rgba(229,231,235,.95);
        border-radius: 14px;
        padding: 10px 12px;
        margin: 10px 0;
        background: rgba(249,250,251,.9);
      }
      .learn-example .en{ font-weight: 850; color:#1d4ed8; font-size: 16px; }
      .learn-example .vi{ margin-top: 6px; opacity:.92; font-size: 15px; }

      .learn-links{ display:flex; gap:10px; flex-wrap:wrap; }
      .learn-link{
        display:inline-flex; align-items:center; gap:8px;
        padding: 10px 12px;
        border-radius: 999px;
        background: rgba(17,24,39,.04);
        border: 1px solid rgba(229,231,235,.95);
        font-weight: 850;
        text-decoration: none;
        color: #111827;
      }

      .learn-actions{
        display:flex; gap:10px; margin-top: 12px;
      }
      .learn-btn{
        flex:1 1 0;
        border:none;
        border-radius: 14px;
        padding: 12px 12px;
        font-weight: 950;
        font-size: 16px;
        cursor:pointer;
      }
      .learn-btn.primary{ background: var(--purple); color:#fff; }
      .learn-btn.secondary{
        background: rgba(17,24,39,.06);
        border: 1px solid rgba(229,231,235,.95);
        color:#111827;
      }

      @media (max-width: 520px){
        .learn-title{ font-size: 20px; }
        .learn-actions{ flex-direction: column; }
      }
    `;
    document.head.appendChild(st);
  }

  function escapeHtml(s){
    return String(s ?? "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#39;");
  }

  function closeLearn(){
    const m = document.getElementById("learnModal");
    if(m) m.remove();
  }

  function openLearn(topicTitle, topicItems){

    ensureLearnCSS();
    try{ TTS.cancel(); }catch(e){}

    const data = (window.LEARN_DATA && window.LEARN_DATA.grammar)
      ? window.LEARN_DATA.grammar[topicTitle]
      : null;

    // remove old modal if any
    closeLearn();

    const pointsHtml = data?.points?.map(p => `<li>${p}</li>`).join("") || "";
    const examplesHtml = data?.examples?.map(ex => `
      <div class="learn-example">
        <div class="en">${ex.en || ""}</div>
        <div class="vi">${ex.vi || ""}</div>
      </div>
    `).join("") || "";
    const linksHtml = data?.links?.map(l => `
      <a class="learn-link" target="_blank" rel="noopener" href="${l.url}">
        ${escapeHtml(l.label || "Open")}
      </a>
    `).join("") || "";

    const titleShow = data?.title || topicTitle;
    const summaryShow = data?.summary || "";

    document.body.insertAdjacentHTML("beforeend", `
      <div class="learn-modal" id="learnModal">
        <div class="learn-panel" role="dialog" aria-modal="true">
          <div class="learn-top">
            <div>
              <div class="learn-badge">📘 LEARN</div>
              <div class="learn-title">${escapeHtml(titleShow)}</div>
              ${summaryShow ? `<div class="learn-sub">${escapeHtml(summaryShow)}</div>` : ``}
            </div>
            <button class="learn-x" id="learnClose" type="button">✕</button>
          </div>

          ${data ? `
            <div class="learn-card learn-card-points">
              <div class="learn-card-title">✅ What to remember</div>
              <ul class="learn-points">${pointsHtml}</ul>
            </div>

            ${examplesHtml ? `
              <div class="learn-card learn-card-examples">
                <div class="learn-card-title">💡 Examples</div>
                ${examplesHtml}
              </div>
            ` : ``}

            ${linksHtml ? `
              <div class="learn-card learn-card-links">
                <div class="learn-card-title">🎬 Watch / Read</div>
                <div class="learn-links">${linksHtml}</div>
              </div>
            ` : ``}
          ` : `
            <div class="learn-card learn-card-points">
              <div class="learn-card-title">📌 Chưa có Learn cho topic này</div>
              <div style="line-height:1.55; opacity:.9">
                Bạn thêm key đúng tên topic vào <code>assets/learn_data.js</code>:<br>
                <b>${escapeHtml(topicTitle)}</b>
              </div>
            </div>
          `}

          <div class="learn-actions">
            <button class="learn-btn secondary" id="learnBack" type="button">⬅ Back</button>
            <button class="learn-btn primary" id="learnGo" type="button">▶ Continue</button>
          </div>
        </div>
      </div>
    `);

    const modal = document.getElementById("learnModal");
    const closeBtn = document.getElementById("learnClose");
    const backBtn  = document.getElementById("learnBack");
    const goBtn    = document.getElementById("learnGo");

    // ✕ : về Home
    if(closeBtn){
      closeBtn.onclick = ()=>{
        closeLearn();

        // ưu tiên click nút Home có sẵn để đồng bộ logic app.js (stop TTS, pushState...)
        const homeBtn = document.getElementById("btnHome");
        if(homeBtn && typeof homeBtn.click === "function"){
          homeBtn.click();
          return;
        }

        // fallback
        if(window.UI && typeof UI.showScreen === "function"){
          UI.showScreen("screenHome");
        }
      };
    }

    // ⬅ Back : quay lại module Grammar (màn danh sách topic)
    if(backBtn){
      backBtn.onclick = ()=>{
        closeLearn();
        if(window.UI && typeof UI.showScreen === "function"){
          UI.showScreen("screenHome"); // Home chính là nơi có danh sách topic Grammar
        }
      };
    }

    // ▶ Continue : vào Start của topic đó (chạy quiz)
    if(goBtn){
      goBtn.onclick = ()=>{
        closeLearn();

        // ƯU TIÊN dùng topicItems được truyền vào từ app.js
        if(Array.isArray(topicItems) && topicItems.length){
          start(topicItems, topicTitle);
          return;
        }

        // fallback: nếu Learn được gọi khi đang ở trong quiz (đã có items)
        if(Array.isArray(items) && items.length){
          start(items, title || topicTitle);
          return;
        }

        // fallback cuối: về Home để user bấm Start (không alert nữa)
        if(window.UI && typeof UI.showScreen === "function"){
          UI.showScreen("screenHome");
        }
      };
    }


    // click outside closes
    if(modal){
      modal.addEventListener("click", (e)=>{
        if(e.target === modal) closeLearn();
      });
    }
  }

  return { start, openLearn };
})();
