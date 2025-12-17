window.UI = (function(){
  const el = (id)=>document.getElementById(id);

  function showScreen(name){
    const screens = ["screenHome","screenSpeaking","screenGrammar","screenPronunciation"];
    for(const s of screens){
      const node = el(s);
      if(node) node.hidden = (s !== name);
    }

    const active = el(name);
    if(active) active.scrollTop = 0;

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
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#39;");
  }

  function renderHero(home, counts){
    const totalSpeak = counts?.speaking?.["Tổng hợp"] ?? 0;
    const totalGram  = counts?.grammar?.["Tổng hợp"] ?? 0;
    const totalPron  = counts?.pronunciation?.["Tổng hợp"] ?? 0;

    const hero = document.createElement("div");
    hero.className = "hero";
    hero.innerHTML = `
      <div class="hero-inner">
        <div class="hero-title">Primary English Self-Study Website</div>
        <div class="hero-sub">For Do Nhat Minh • Class SN3A • Ngoc Linh Primary School (2025)</div>

        <div class="hero-chips">
          <div class="chip">🖊️ Speaking <span class="chip-num">${totalSpeak}</span></div>
          <div class="chip">🧩 Grammar <span class="chip-num">${totalGram}</span></div>
          <div class="chip">🔊 Pronunciation <span class="chip-num">${totalPron}</span></div>
        </div>

        <div class="hero-note">Tip: Add to Home Screen on iPad/iPhone for an app-like experience.</div>
      </div>
    `;
    home.appendChild(hero);
  }

  function renderHome({speakingTopics, grammarTopics, pronunciationTopics = [], counts, onStartSpeaking, onStartGrammar, onStartPronunciation}){
    const home = el("screenHome");
    home.innerHTML = "";

    // NEW: Hero intro
    renderHero(home, counts);

    const speakingSection = document.createElement("div");
    speakingSection.className = "section";
    speakingSection.innerHTML = `
      <div class="section-head">
        <div class="section-title">🖊️ Speaking</div>
        <div class="section-sub">Tap Start → Next will read the next question</div>
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
        <div class="section-sub">Choose A/B/C/D → see explanation</div>
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

    if(pronunciationTopics && pronunciationTopics.length && typeof onStartPronunciation === "function"){
      const prSection = document.createElement("div");
      prSection.className = "section";
      prSection.innerHTML = `
        <div class="section-head">
          <div class="section-title">🔊 Pronunciation</div>
          <div class="section-sub">Listen & choose (IOE style)</div>
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


// ===== FIX: iPhone/iPad header che nội dung (topbar overlap) =====
// iOS Safari + chế độ ".screen { position: fixed; }" có thể làm topbar đè lên nội dung.
// Giải pháp: đo chiều cao .topbar và set CSS var --topbar-h để .screen tự chừa khoảng trống.
(function(){
  function updateTopbarHeight(){
    const topbar = document.querySelector(".topbar");
    if(!topbar) return;
    const h = topbar.offsetHeight || 0;
    if(h>0){
      document.documentElement.style.setProperty("--topbar-h", h + "px");
    }
  }

  // iOS/Android mobile browsers đôi khi thay đổi viewport (thanh địa chỉ hiện/ẩn)
  // mà không bắn resize chuẩn → lắng nghe thêm visualViewport nếu có.
  const vv = window.visualViewport;
  if(vv){
    vv.addEventListener("resize", updateTopbarHeight);
    vv.addEventListener("scroll", updateTopbarHeight);
  }

  window.addEventListener("load", ()=>{
    // Đo ngay khi load
    updateTopbarHeight();
    // Và đo thêm vài nhịp để bắt trường hợp chữ wrap / font settle trên mobile
    requestAnimationFrame(updateTopbarHeight);
    setTimeout(updateTopbarHeight, 50);
    setTimeout(updateTopbarHeight, 200);
  });

  window.addEventListener("resize", updateTopbarHeight);
  window.addEventListener("orientationchange", updateTopbarHeight);

  // Nếu script chạy sau khi trang đã load, gọi luôn 1 lần
  updateTopbarHeight();
})();
