window.Vocabulary = (function(){
  let items = [];
  let order = [];
  let idx = 0;
  let title = "";

  // per-question state
  let current = null;
  let attempts = 0;     // wrong attempts count for current question
  let hadWrong = false; // whether current question was ever wrong
  let solved = false;   // whether typed correctly at least once (needs 2nd Enter to advance)

  // track wrong questions for "retry wrong"
  let wrongItems = [];

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  function escapeHtml(str){
    return (str ?? "").toString()
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  }

  function normalizeInput(s){
    return (s ?? "").toString().trim();
  }

  function hasDiacritics(s){
    // Detect Vietnamese/diacritics by comparing accent-stripped form
    const n = (s ?? "").toString();
    const stripped = n.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
    return stripped !== n;
  }

  // NEW: Speak the Sentence (do NOT reveal the Answer)
  function speakSentence(sentence){
    if(!window.TTS || typeof TTS.speak !== "function") return;
    const s = (sentence ?? "").toString()
      // Replace one or more underscores block with a spoken placeholder
      .replace(/_{2,}/g, " blank ")
      .trim();
    if(!s) return;
    try{
      TTS.cancel?.();
      TTS.speak(s);
    }catch(_e){
      // keep silent if TTS fails
    }
  }

  function setProgress(){
    const total = order.length;
    const done = Math.min(idx, total);
    const wrongCount = wrongItems.length;
    const extra = wrongCount ? ` • ❌ ${wrongCount}` : "";
    UI.el("vcProg").textContent = `${done}/${total}${extra}`;
  }

  function blankMask(answer){
    const len = (answer ?? "").toString().length;
    return "_".repeat(Math.max(1, len));
  }

  function renderSentence(){
    const ans = (current.answer ?? "").toString();
    const mask = blankMask(ans);
    const sentence = (current.sentence ?? "").toString();
    // Replace first occurrence of ____ only (sheet rule: one blank)
    const rendered = sentence.replace("____", `<span class="vc-blank" aria-label="blank">${mask}</span>`);
    UI.el("vcSentence").innerHTML = rendered;
    UI.el("vcLen").textContent = `Word length: ${ans.length} letters`;
  }

  function renderFeedback(msgHtml){
    const box = UI.el("vcFeedback");
    box.hidden = !msgHtml;
    box.innerHTML = msgHtml || "";
  }

  function focusInput(){
    const inp = UI.el("vcInput");
    if(inp){
      inp.focus();
      inp.select?.();
    }
  }

  function markWrongIfNeeded(){
    if(!hadWrong){
      hadWrong = true;
      wrongItems.push(current);
    }
  }

  function checkAnswer(){
    const raw = normalizeInput(UI.el("vcInput").value);
    const ans = (current.answer ?? "").toString();

    // Invalid input cases
    if(!raw){
      renderFeedback(`<div class="muted">Bạn hãy gõ 1 từ tiếng Anh.</div>`);
      focusInput();
      return false;
    }
    if(/\s/.test(raw)){
      return wrongFlow(raw, "Bạn chỉ được gõ <strong>1 từ duy nhất</strong> (không khoảng trắng).");
    }
    if(hasDiacritics(raw)){
      return wrongFlow(raw, "Bạn đang gõ có <strong>dấu</strong>. Hãy gõ tiếng Anh <strong>không dấu</strong>.");
    }

    // Compare (case-insensitive, exact)
    if(raw.toLowerCase() === ans.toLowerCase()){
      return true;
    }
    return wrongFlow(raw, null);
  }

  function wrongFlow(raw, customMsg){
    attempts += 1;
    markWrongIfNeeded();

    const hint = (current.hint_vi ?? "").toString();
    const meaning = (current.meaning_vi ?? "").toString();
    const ans = (current.answer ?? "").toString();

    let extra = "";
    if(attempts === 1){
      extra = hint ? `<div><strong>Gợi ý:</strong> ${escapeHtml(hint)}</div>` : "";
    }else if(attempts === 2){
      extra = (hint ? `<div><strong>Gợi ý:</strong> ${escapeHtml(hint)}</div>` : "")
            + (meaning ? `<div><strong>Nghĩa:</strong> ${escapeHtml(meaning)}</div>` : "");
    }else{
      extra = (hint ? `<div><strong>Gợi ý:</strong> ${escapeHtml(hint)}</div>` : "")
            + (meaning ? `<div><strong>Nghĩa:</strong> ${escapeHtml(meaning)}</div>` : "")
            + (ans ? `<div><strong>Đáp án:</strong> <span class="vc-answer">${escapeHtml(ans)}</span></div>` : "");
    }

    const msg = customMsg
      ? `<div>❌ ${customMsg}</div>`
      : `<div>❌ Sai rồi. Hãy thử lại.</div>`;

    renderFeedback(`${msg}${extra}`);
    UI.el("vcStatus").textContent = "Type again and press Enter";
    focusInput();
    return false;
  }

  function correctFlow(){
    solved = true;

    const meaning = (current.meaning_vi ?? "").toString();
    const explain = (current.explain_vi ?? "").toString();

    const parts = [];
    parts.push(`<div>✅ <strong>Đúng rồi!</strong></div>`);
    if(meaning) parts.push(`<div><strong>Nghĩa:</strong> ${escapeHtml(meaning)}</div>`);
    if(explain) parts.push(`<div><strong>Giải thích:</strong> ${escapeHtml(explain)}</div>`);
    parts.push(`<div class="muted">Nhấn <strong>Enter</strong> lần nữa để qua câu tiếp theo.</div>`);

    renderFeedback(parts.join(""));
    UI.el("vcStatus").textContent = "Press Enter again for next";
  }

  function renderCurrent(){
    attempts = 0;
    hadWrong = false;
    solved = false;

    renderSentence();
    UI.el("vcInput").value = "";
    UI.el("vcStatus").textContent = "Type the word and press Enter";
    renderFeedback("");

    // NEW: Speak sentence on Start and on each new question
    speakSentence(current?.sentence);

    focusInput();
  }

  function finishScreen(){
    const total = order.length;
    const wrongCount = wrongItems.length;
    const hasWrong = wrongCount > 0;

    const root = UI.el("screenVocabulary");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="finish">
          <h2>✅ Finish</h2>
          <div class="muted">Topic: <strong>${escapeHtml(title)}</strong></div>
          <div class="muted">Tổng số câu: <strong>${total}</strong></div>
          <div class="muted">Số câu sai: <strong>${wrongCount}</strong></div>
        </div>
        <div class="nextbar">
          ${hasWrong ? `<button class="next" id="vcRetryWrong">Retry wrong answers</button>` : ``}
          <button class="next" id="vcBackHome">Back to Home</button>
        </div>
      </div>
    `;

    if(hasWrong){
      UI.el("vcRetryWrong").onclick = ()=> start(wrongItems, `${title} — Wrong answers`);
    }
    UI.el("vcBackHome").onclick = ()=> UI.showScreen("screenHome");
  }

  function next(){
    const total = order.length;
    if(idx >= total){
      finishScreen();
      return;
    }
    current = items[order[idx]];
    idx += 1;
    renderCurrent();
    setProgress();
  }

  function onSubmit(){
    if(!current) return;

    if(solved){
      next();
      return;
    }

    const ok = checkAnswer();
    if(ok){
      correctFlow();
    }
  }

  function start(topicItems, topicTitle){
    items = (topicItems ?? []).slice();
    order = shuffle(items.map((_,i)=>i));
    idx = 0;
    title = topicTitle || "Vocabulary";
    current = null;
    wrongItems = [];

    const root = UI.el("screenVocabulary");
    root.innerHTML = `
      <div class="quiz-wrap">
        <div class="quiz-head">
          <div class="quiz-title">📚 <span id="vcTitle"></span></div>
          <div class="quiz-progress" id="vcProg"></div>
        </div>

        <div class="quiz-body">
          <div class="qbox">
            <div id="vcSentence" class="q"></div>
            <div id="vcLen" class="muted" style="margin-top:6px"></div>
          </div>

          <div style="margin-top:10px">
            <input id="vcInput" type="text" inputmode="latin" autocomplete="off" autocapitalize="none" spellcheck="false"
              style="width:100%; padding:12px 12px; border-radius:14px; border:1px solid var(--border); font-weight:800; font-size:16px; color: rgb(34,197,94);" />
            <div id="vcStatus" class="muted" style="margin-top:6px"></div>
          </div>

          <div id="vcFeedback" class="explain" hidden style="margin-top:10px"></div>

          <div class="nextbar">
            <button class="next" id="vcSubmit">Submit (Enter)</button>
          </div>
        </div>
      </div>
    `;

    UI.el("vcTitle").textContent = title;
    UI.el("vcSubmit").onclick = onSubmit;

    const inp = UI.el("vcInput");
    inp.addEventListener("keydown", (e)=>{
      if(e.key === "Enter"){
        e.preventDefault();
        onSubmit();
      }
    });

    next();
  }

  return {start};
})();
