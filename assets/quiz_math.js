window.MathQuiz = (function(){
  let topic = "";
  let items = [];
  let selectedLevels = new Set([1,2,3]);

  // quiz state
  let order = [];
  let idx = 0;
  let correctCount = 0;
  let locked = false;
  let current = null;
  let wrongItems = [];

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

  function normalizeKey(s){
    return String(s || "")
      .trim()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\.(png|jpg|jpeg|webp)$/i, "")
      .replace(/[^a-z0-9\/]+/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function setMathImage(imageKey){
    const img = UI.el("mTopicImg");
    const key = normalizeKey(imageKey);
    if(!img) return;

    if(!key){
      img.hidden = true;
      img.removeAttribute("src");
      return;
    }

    const base = `assets/topic_images/math/${key}`;
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

  function renderKatex(root){
    try{
      if(window.renderMathInElement && root){
        renderMathInElement(root, {
          delimiters: [
            {left: "\\(", right: "\\)", display: false},
            {left: "\\[", right: "\\]", display: true},
            {left: "$$", right: "$$", display: true},
            {left: "$", right: "$", display: false}
          ],
          throwOnError: false
        });
      }
    }catch(e){}
  }

  // ✅ NEW: load selected levels for a topic from localStorage
  // Priority:
  // 1) per-topic: math_levels__<topic>
  // 2) legacy global: mathLevels (your old selector key)
  // 3) default All [1,2,3]
  function loadSelectedLevels(topicTitle){
    const perTopicKey = `math_levels__${topicTitle}`;
    try{
      const raw = localStorage.getItem(perTopicKey);
      if(raw){
        const arr = JSON.parse(raw);
        const s = new Set((arr||[]).map(Number).filter(x=>[1,2,3].includes(x)));
        return s.size ? s : new Set([1,2,3]);
      }
    }catch(e){}

    // fallback to old key so you don't lose current data
    try{
      const raw2 = localStorage.getItem("mathLevels");
      if(raw2){
        const arr2 = JSON.parse(raw2);
        const s2 = new Set((arr2||[]).map(Number).filter(x=>[1,2,3].includes(x)));
        return s2.size ? s2 : new Set([1,2,3]);
      }
    }catch(e){}

    return new Set([1,2,3]);
  }

  // ===== Topic screen (NO BIG LEVEL SELECTOR) =====
  function openTopic(topicTitle, topicItems){
    topic = topicTitle;
    items = Array.isArray(topicItems) ? topicItems.slice() : [];

    // selectedLevels now comes from saved choice (or All by default)
    selectedLevels = loadSelectedLevels(topicTitle);

    const root = UI.el("screenMath");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🧮 <span id="mTopicTitle"></span></div>
          <div class="quiz-progress" id="mTopicMeta"></div>
        </div>

        <div class="quiz-body">
          <div class="big-emoji">🧮</div>

          <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap; margin-top:10px;">
            <button class="btn ghost" id="mLearn">Learn</button>
            <button class="btn blue" id="mStart">Start</button>
            <button class="btn ghost" id="mHome">Home</button>
          </div>
        </div>
      </div>
    `;

    UI.el("mTopicTitle").textContent = topicTitle;
    UI.el("mTopicMeta").textContent = `${items.length} questions`;

    UI.el("mLearn").onclick = ()=> openLearn(topicTitle, items);
    UI.el("mStart").onclick = ()=> startQuiz();
    UI.el("mHome").onclick = ()=> {
      const btn = document.getElementById("btnHome");
      if(btn && typeof btn.click === "function") btn.click();
      else UI.showScreen("screenHome");
    };
  }

  // ===== Learn (Math) =====
  function openLearn(topicTitle, topicItems){
    const old = document.getElementById("learnModal");
    if(old) old.remove();

    const data = (window.LEARN_DATA && window.LEARN_DATA.math)
      ? window.LEARN_DATA.math[topicTitle]
      : null;

    if(!document.getElementById("learnCssMini")){
      const st = document.createElement("style");
      st.id = "learnCssMini";
      st.textContent = `
        .learn-modal{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;padding:14px;}
        .learn-panel{background:#fff;border-radius:18px;width:min(920px,100%);max-height:86vh;overflow:auto;padding:14px;border:1px solid rgba(229,231,235,.95);}
        .learn-top{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;}
        .learn-badge{font-weight:900;opacity:.85}
        .learn-title{font-size:22px;font-weight:950;margin-top:2px}
        .learn-sub{margin-top:6px;opacity:.85;line-height:1.5}
        .learn-x{border:none;background:rgba(17,24,39,.06);border:1px solid rgba(229,231,235,.95);border-radius:12px;padding:8px 10px;cursor:pointer;font-weight:900}
        .learn-card{border:1px solid rgba(229,231,235,.95);border-radius:16px;padding:12px;margin:10px 0;background:rgba(249,250,251,.9)}
        .learn-card-title{font-weight:950;margin-bottom:8px}
        .learn-points{margin:0;padding-left:0;line-height:1.6;list-style:none}
        .learn-example{border:1px dashed rgba(229,231,235,.95);border-radius:14px;padding:10px 12px;margin:10px 0;background:rgba(249,250,251,.9)}
        .learn-example .en{font-weight:850;color:#1d4ed8;font-size:16px}
        .learn-example .vi{margin-top:6px;opacity:.92;font-size:15px}
        .learn-links{display:flex;gap:10px;flex-wrap:wrap}
        .learn-link{display:inline-flex;align-items:center;gap:8px;padding:10px 12px;border-radius:999px;background:rgba(17,24,39,.04);border:1px solid rgba(229,231,235,.95);font-weight:850;text-decoration:none;color:#111827}
        .learn-actions{display:flex;gap:10px;margin-top:12px}
        .learn-btn{flex:1 1 0;border:none;border-radius:14px;padding:12px 12px;font-weight:950;font-size:16px;cursor:pointer}
        .learn-btn.primary{background:var(--blue);color:#fff}
        .learn-btn.secondary{background:rgba(17,24,39,.06);border:1px solid rgba(229,231,235,.95);color:#111827}
      `;
      document.head.appendChild(st);
    }

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
              <div class="learn-badge">🧮 LEARN (MATH)</div>
              <div class="learn-title">${escapeHtml(titleShow)}</div>
              ${summaryShow ? `<div class="learn-sub">${summaryShow}</div>` : ``}
            </div>
            <button class="learn-x" id="learnClose" type="button">✕</button>
          </div>

          ${data ? `
            <div class="learn-card">
              <div class="learn-card-title">✅ What to remember</div>
              <ul class="learn-points">${pointsHtml}</ul>
            </div>

            ${examplesHtml ? `
              <div class="learn-card">
                <div class="learn-card-title">💡 Examples</div>
                ${examplesHtml}
              </div>
            ` : ``}

            ${linksHtml ? `
              <div class="learn-card">
                <div class="learn-card-title">🎬 Watch / Read</div>
                <div class="learn-links">${linksHtml}</div>
              </div>
            ` : ``}
          ` : `
            <div class="learn-card">
              <div class="learn-card-title">📌 Chưa có Learn cho topic này</div>
              <div style="line-height:1.55; opacity:.9">
                Bạn thêm key đúng tên topic vào <code>assets/learn_data.js</code> trong <code>window.LEARN_DATA.math</code>.
                <br><br>
                Key đang cần: <b>${escapeHtml(topicTitle)}</b>
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

    if(closeBtn){
      closeBtn.onclick = ()=>{
        modal?.remove();
        const homeBtn = document.getElementById("btnHome");
        if(homeBtn && typeof homeBtn.click === "function") homeBtn.click();
        else UI.showScreen("screenHome");
      };
    }

    // ✅ Back: go Home (as you requested)
    if(backBtn){
      backBtn.onclick = ()=>{
        modal?.remove();
        const homeBtn = document.getElementById("btnHome");
        if(homeBtn && typeof homeBtn.click === "function") homeBtn.click();
        else UI.showScreen("screenHome");
      };
    }

    // ✅ Continue: start quiz immediately (no need to choose level here)
    if(goBtn){
      goBtn.onclick = ()=>{
        modal?.remove();
        // keep selectedLevels from localStorage; fallback already All
        startQuiz();
      };
    }

    if(modal){
      modal.addEventListener("click", (e)=>{
        if(e.target === modal){
          modal.remove();

          const homeBtn = document.getElementById("btnHome");
          if(homeBtn && typeof homeBtn.click === "function"){
            homeBtn.click();
          }else if(window.UI && typeof UI.showScreen === "function"){
            UI.showScreen("screenHome");
          }
        }
      });
    }


    try{
      const panel = modal?.querySelector(".learn-panel");
      renderKatex(panel);
    }catch(e){}
  }

  // ===== Quiz =====
  function startQuiz(){
    // refresh selectedLevels from storage (so "1 2 3 A" on Home can drive it)
    selectedLevels = loadSelectedLevels(topic);

    // filter by selected levels
    const filtered = items.filter(x => selectedLevels.has(Number(x.level)));

    // if nothing (shouldn't happen), fallback to all
    const runItems = filtered.length ? filtered : items.slice();

    order = shuffle(runItems.map((_,i)=>i));
    idx = 0;
    correctCount = 0;
    wrongItems = [];
    locked = false;
    current = null;

    // store active list on items var for this run (keep existing behavior)
    items = runItems;

    const root = UI.el("screenMath");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">🧮 <span id="mTitle"></span></div>
          <div class="quiz-progress" id="mProg"></div>
        </div>

        <div class="quiz-body" id="mBody">
          <img id="mTopicImg" class="topic-img" alt="Topic image" hidden />
          <div class="big-emoji">🧮</div>
          <div class="qtext" id="mQ"></div>

          <div class="options" id="mOpts"></div>
          <div class="explain" id="mExplain" hidden></div>
        </div>

        <div class="nextbar">
          <button class="next" id="mNext">Next</button>
        </div>
      </div>
    `;

    UI.el("mTitle").textContent = topic;
    const nextBtn = UI.el("mNext");
    nextBtn.disabled = true;
    nextBtn.onclick = ()=>{
      if(!locked) return;
      next(true);
    };

    TTS.warmUp();
    next(true);
  }

  function setProgress(){
    const total = order.length;
    const done = Math.min(idx, total);
    UI.el("mProg").textContent = `${done}/${total} • ✅ ${correctCount}`;
  }

  function renderCurrent(){
    const q = UI.el("mQ");
    const opts = UI.el("mOpts");
    const explain = UI.el("mExplain");
    const body = UI.el("mBody");

    q.innerHTML = current.question || "";
    renderKatex(q);

    // image
    setMathImage(current.image);

    opts.innerHTML = "";
    locked = false;

    const nextBtn = UI.el("mNext");
    nextBtn.disabled = true;

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
      const raw = (o.text || "").toString().trim();
      // Heuristic: if it contains \frac or other latex-ish tokens, wrap with \( ... \)
      const looksLatex =
        /\\frac|\\times|\\div|\\cdot|\\sqrt|\\left|\\right|\\ge|\\le|\\neq|\\pi|\\theta|\\sum|\\int|\\[a-zA-Z]+\{/.test(raw);
      // If user already provided delimiters, keep as-is; else wrap when looksLatex
      const hasDelim = /\\\(|\\\[|\$\$|\$/.test(raw);
      const finalText = (looksLatex && !hasDelim) ? `\\(${raw}\\)` : raw;
      b.innerHTML = `${o.k}. ${finalText}`;
      renderKatex(b);      
      b.onclick = ()=> choose(o.k, b);
      opts.appendChild(b);
    }

    renderKatex(body);
  }

  function choose(k, btn){
    if(locked) return;
    locked = true;

    const buttons = Array.from(UI.el("mOpts").querySelectorAll(".opt"));
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
      const exists = wrongItems.some(x => (x.question || "") === (current.question || ""));
      if(!exists) wrongItems.push(current);
    }

    // ✅ FIX: Explain xuống dòng đúng + auto-wrap LaTeX trong explain để KaTeX render
    const explain = UI.el("mExplain");
    explain.hidden = false;

    const rawEx = (current.explain || "").toString();

    // 1) giữ <br/> nếu đã có; nếu có newline thì đổi sang <br/>
    let htmlEx = rawEx.replace(/\n/g, "<br/>");

    // 2) nếu explain có latex kiểu \frac{..}{..} nhưng chưa có delimiter thì bọc bằng \( ... \)
    const hasDelim = /\\\(|\\\[|\$\$|\$/.test(htmlEx);
    if(!hasDelim){
      htmlEx = htmlEx.replace(
        /(\\frac\{[^}]+\}\{[^}]+\}|\\times|\\div|\\cdot|\\sqrt\{[^}]+\}|\\left|\\right|\\ge|\\le|\\neq|\\approx|\\pi|\\theta|\\sum|\\int)/g,
        "\\($1\\)"
      );
    }

    explain.innerHTML = `<strong>Vì sao?</strong><br/>${htmlEx}`;
    renderKatex(explain);

    UI.el("mNext").disabled = false;

    try{
      TTS.speak((UI.el("mQ").textContent || "").trim());
    }catch(e){}

    setProgress();
  }

  function finishScreen(){
    const root = UI.el("screenMath");
    const hasWrong = wrongItems.length > 0;

    // inject CSS once (only for Math finish screen)
    if(!document.getElementById("mathFinishCss")){
      const st = document.createElement("style");
      st.id = "mathFinishCss";
      st.textContent = `
        .mfinish-wrap{max-width:920px; margin:0 auto; padding:18px;}
        .mfinish-card{
          background:rgba(255,255,255,.9);
          border:1px solid rgba(229,231,235,.95);
          border-radius:20px;
          padding:18px;
          box-shadow:0 12px 40px rgba(0,0,0,.08);
        }
        .mfinish-top{display:flex; align-items:center; justify-content:center; gap:10px;}
        .mfinish-title{font-weight:950; font-size:26px;}
        .mfinish-sub{margin-top:8px; text-align:center; opacity:.85; line-height:1.5;}
        .mfinish-stats{margin-top:12px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;}
        .mchip{
          border:1px solid rgba(229,231,235,.95);
          background:rgba(17,24,39,.04);
          padding:8px 12px;
          border-radius:999px;
          font-weight:850;
        }
        .mfinish-actions{
          margin-top:16px;
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:12px;
        }
        .mbtn{
          border:none;
          border-radius:14px;
          padding:12px 12px;
          font-weight:950;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
          gap:10px;
          font-size:16px;
        }
        .mbtn.primary{background:var(--blue); color:#fff;}
        .mbtn.ghost{
          background:rgba(17,24,39,.04);
          border:1px solid rgba(229,231,235,.95);
          color:#111827;
        }
        .mbtn.danger{
          background:rgba(239,68,68,.12);
          border:1px solid rgba(239,68,68,.25);
          color:#991b1b;
        }
        .mfinish-actions .wide{grid-column: 1 / -1;}
        @media (max-width:560px){
          .mfinish-actions{grid-template-columns: 1fr;}
          .mfinish-actions .wide{grid-column:auto;}
        }
      `;
      document.head.appendChild(st);
    }

    root.innerHTML = `
      <div class="mfinish-wrap">
        <div class="mfinish-card">
          <div class="mfinish-top">
            <div style="font-size:28px;">✅</div>
            <div class="mfinish-title">Finish</div>
          </div>

          <div class="mfinish-sub">
            Kết quả: đúng <b>${correctCount}</b> / <b>${order.length}</b> câu
            ${hasWrong ? `<br/>Câu sai: <b>${wrongItems.length}</b>` : ``}
          </div>

          <div class="mfinish-stats">
            <div class="mchip">🎯 Accuracy: <b>${order.length ? Math.round((correctCount/order.length)*100) : 0}%</b></div>
            <div class="mchip">🧠 Wrong: <b>${wrongItems.length}</b></div>
          </div>

          <div class="mfinish-actions">
            ${hasWrong ? `<button class="mbtn primary wide" id="mRetryWrong">🔁 Làm lại câu sai</button>` : ``}
            <button class="mbtn ghost" id="mRestartAll">🔄 Làm lại tất cả</button>
            <button class="mbtn ghost" id="mBackTopic">📚 Quay lại topic</button>
            <button class="mbtn danger wide" id="mGoHome">🏠 Về trang chủ</button>
          </div>
        </div>
      </div>
    `;

    if(hasWrong){
      UI.el("mRetryWrong").onclick = ()=>{
        items = wrongItems.slice();
        startQuiz();
      };
    }

    UI.el("mRestartAll").onclick = ()=>{
      // làm lại all theo đúng filter level hiện tại của topic (đã lưu trong localStorage)
      startQuiz();
    };

    UI.el("mBackTopic").onclick = ()=>{
      openTopic(topic, items);
    };

    UI.el("mGoHome").onclick = ()=>{
      const btn = document.getElementById("btnHome");
      if(btn && typeof btn.click === "function") btn.click();
      else UI.showScreen("screenHome");
    };
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
    if(autoSpeak){
      try{
        const t = (UI.el("mQ").textContent || "").trim();
        if(t) TTS.speak(t);
      }catch(e){}
    }
  }

  function start(topicTitle, topicItems){
    topic = topicTitle;
    items = Array.isArray(topicItems) ? topicItems.slice() : [];
    // ensure selected levels loaded (or All)
    selectedLevels = loadSelectedLevels(topicTitle);
    startQuiz();
  }

  return {
    openTopic,
    openLearn,
    start // ✅ NEW
  };
})();
