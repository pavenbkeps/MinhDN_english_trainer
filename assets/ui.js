window.UI = (function(){
  const el = (id)=>document.getElementById(id);

  function showScreen(name){
    const screens = ["screenHome","screenSpeaking","screenGrammar"];
    for(const s of screens){
      const node = el(s);
      if(node) node.hidden = (s !== name);
    }
    window.scrollTo({ top: 0, behavior: "auto" });
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

  function renderHome({speakingTopics, grammarTopics, counts, onStartSpeaking, onStartGrammar}){
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
  }

  return {showScreen, setLoading, renderHome, el};
})();
