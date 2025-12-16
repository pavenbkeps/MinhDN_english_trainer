window.UI = (function(){
  const el = (id)=>document.getElementById(id);

  function showScreen(name){
    const screens = ["screenHome","screenSpeaking","screenGrammar","screenPronunciation"];
    for(const s of screens){
      const node = el(s);
      if(node) node.hidden = (s !== name);
    }

    // Cuộn về đầu screen đang mở (ổn định hơn trên iOS)
    const active = el(name);
    if(active) active.scrollTop = 0;

    // Ép Safari bỏ vị trí cuộn cũ của page
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function setLoading(isLoading, text){
    const loading = el("loading");
    if(!loading) return;
    loading.hidden = !isLoading;
    if(text) loading.textContent = text;
  }

  function escapeHtml(str){
    return (str??"").toString()
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
  }

  function renderHome({speakingTopics, grammarTopics, pronunciationTopics = [], counts, onStartSpeaking, onStartGrammar, onStartPronunciation}){
    const home = el("screenHome");
    home.innerHTML = "";

    const speakingSection = document.createElement("div");
    speakingSection.className = "section";
    speakingSection.innerHTML = `
      <div class="section-head">
        <div class="section-title">🖊️ Speaking</div>
        <div class="section-sub">Next sẽ tự đọc Question</div>
      </div>
      <div class="grid" id="gridSpeaking"></div>
    `;
    home.appendChild(speakingSection);

    const gridSpeaking = speakingSection.querySelector("#gridSpeaking");
    for(const t of speakingTopics){
      const c = counts.speaking[t] ?? 0;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(t)}</div>
            <div class="card-count">${c} questions</div>
          </div>
          <div class="card-icon">📚</div>
        </div>
        <button class="btn blue">Start</button>
      `;
      card.querySelector("button").onclick = ()=>onStartSpeaking(t);
      gridSpeaking.appendChild(card);
    }

    const grammarSection = document.createElement("div");
    grammarSection.className = "section";
    grammarSection.innerHTML = `
      <div class="section-head">
        <div class="section-title">🧩 Grammar (MCQ)</div>
        <div class="section-sub">Next sẽ tự đọc Question</div>
      </div>
      <div class="grid" id="gridGrammar"></div>
    `;
    home.appendChild(grammarSection);

    const gridGrammar = grammarSection.querySelector("#gridGrammar");
    for(const t of grammarTopics){
      const c = counts.grammar[t] ?? 0;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <div class="card-top">
          <div>
            <div class="card-title">${escapeHtml(t)}</div>
            <div class="card-count">${c} questions</div>
          </div>
          <div class="card-icon">🧩</div>
        </div>
        <button class="btn purple">Start</button>
      `;
      card.querySelector("button").onclick = ()=>onStartGrammar(t);
      gridGrammar.appendChild(card);
    }

    // Pronunciation (IOE)
    if(pronunciationTopics && pronunciationTopics.length && typeof onStartPronunciation === "function"){
      const prSection = document.createElement("div");
      prSection.className = "section";
      prSection.innerHTML = `
        <div class="section-head">
          <div class="section-title">🔊 Pronunciation</div>
          <div class="section-sub">Nghe & chọn (IOE)</div>
        </div>
        <div class="grid" id="gridPron"></div>
      `;
      home.appendChild(prSection);

      const gridPron = prSection.querySelector("#gridPron");
      for(const t of pronunciationTopics){
        const c = counts.pronunciation?.[t] ?? 0;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="card-top">
            <div>
              <div class="card-title">${escapeHtml(t)}</div>
              <div class="card-count">${c} questions</div>
            </div>
            <div class="card-icon">🔊</div>
          </div>
          <button class="btn green">Start</button>
        `;
        card.querySelector("button").onclick = ()=>onStartPronunciation(t);
        gridPron.appendChild(card);
      }
    }
  }

  return {showScreen, setLoading, renderHome, el};
})();
