window.UI = (function(){
  const el = (id)=>document.getElementById(id);

  function showScreen(name){
    // ✅ Add screenBedtime to the list (doesn't affect existing screens)
    const screens = ["screenHome","screenSpeaking","screenGrammar","screenPronunciation","screenVocabulary","screenReading","screenBedtime"];
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
    const totalVocab = counts?.vocabulary?.["Tổng hợp"] ?? 0;
    const totalReading = counts?.reading?.["Tổng hợp"] ?? 0;

    // ✅ NEW: Bedtime total
    const totalBedtime = counts?.bedtime?.["Tổng hợp"] ?? 0;

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
          <div class="chip">📖 Vocabulary <span class="chip-num">${totalVocab}</span></div>
          <div class="chip">📘 Reading <span class="chip-num">${totalReading}</span></div>
          <div class="chip">🌙 Bedtime <span class="chip-num">${totalBedtime}</span></div>
        </div>

        <div class="hero-note">Tip: Add to Home Screen on iPad/iPhone for an app-like experience.</div>
      </div>
    `;
    home.appendChild(hero);
  }

  function renderHome({
    speakingTopics,
    grammarTopics,
    pronunciationTopics = [],
    vocabularyTopics = [],
    readingTopics = [],
    bedtimeTopics = [],              // ✅ NEW
    counts,
    onStartSpeaking,
    onStartGrammar,
    onLearnGrammar,     // ✅ thêm dòng này
    onStartPronunciation,
    onStartVocabulary,
    onStartReading,
    onStartBedtime                 // ✅ NEW
  }){
    const home = el("screenHome");
    home.innerHTML = "";

    renderHero(home, counts);

    /* ===== Speaking ===== */
    const speakingSection = document.createElement("div");
    speakingSection.className = "section";
    speakingSection.id = "secSpeaking";
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

    /* ===== Grammar ===== */
    const grammarSection = document.createElement("div");
    grammarSection.className = "section";
    grammarSection.id = "secGrammar";
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

        <div class="card-actions">
          <button class="btn purple half">Start</button>
          <button class="btn ghost half" data-learn="1">Learn</button>
        </div>
      `;
      const btnStart = card.querySelector("button.btn.purple");
      btnStart.onclick = ()=>onStartGrammar(t);

      const btnLearn = card.querySelector('button[data-learn="1"]');
      btnLearn.onclick = ()=>onLearnGrammar && onLearnGrammar(t);

      gridGrammar.appendChild(card);
    }

    /* ===== Pronunciation ===== */
    if(pronunciationTopics && pronunciationTopics.length && typeof onStartPronunciation === "function"){
      const prSection = document.createElement("div");
      prSection.className = "section";
      prSection.id = "secPronunciation";
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

    /* ===== Vocabulary ===== */
    if(vocabularyTopics && vocabularyTopics.length && typeof onStartVocabulary === "function"){
      const vSection = document.createElement("div");
      vSection.className = "section";
      vSection.id = "secVocabulary";
      vSection.innerHTML = `
        <div class="section-head">
          <div class="section-title">📖 Vocabulary (Fill blank)</div>
          <div class="section-sub">Type the missing word → must be correct to continue</div>
        </div>
        <div class="grid" id="gridVocab"></div>
      `;
      home.appendChild(vSection);

      const gridVocab = vSection.querySelector("#gridVocab");
      for(const t of vocabularyTopics){
        const c = counts.vocabulary?.[t] ?? 0;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="card-top">
            <div>
              <div class="card-title">${escapeHtml(t)}</div>
              <div class="card-count">${c} questions</div>
            </div>
            <div class="card-icon">📖</div>
          </div>
          <button class="btn teal">Start</button>
        `;
        card.querySelector("button").onclick = ()=>onStartVocabulary(t);
        gridVocab.appendChild(card);
      }
    }

    /* ===== Reading / Speech ===== */
    if(readingTopics && readingTopics.length && typeof onStartReading === "function"){
      const rSection = document.createElement("div");
      rSection.className = "section";
      rSection.id = "secReading";
      rSection.innerHTML = `
        <div class="section-head">
          <div class="section-title">📘 Reading / Speech</div>
          <div class="section-sub">Listen → follow → speak confidently</div>
        </div>
        <div class="grid" id="gridReading"></div>
      `;
      home.appendChild(rSection);

      const gridReading = rSection.querySelector("#gridReading");
      for(const t of readingTopics){
        const c = counts.reading?.[t] ?? 0;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="card-top">
            <div>
              <div class="card-title">${escapeHtml(t)}</div>
              <div class="card-count">${c} bài</div>
            </div>
            <div class="card-icon">📘</div>
          </div>
          <button class="btn blue">Start</button>
        `;
        card.querySelector("button").onclick = ()=>onStartReading(t);
        gridReading.appendChild(card);
      }
    }

    /* ===== Bedtime / Story (NEW) ===== */
    if(bedtimeTopics && bedtimeTopics.length && typeof onStartBedtime === "function"){
      const bSection = document.createElement("div");
      bSection.className = "section";
      bSection.id = "secBedtime";
      bSection.innerHTML = `
        <div class="section-head">
          <div class="section-title">🌙 Bedtime (Bilingual Stories)</div>
          <div class="section-sub">Listen EN → VI • Relax and enjoy before sleep</div>
        </div>
        <div class="grid" id="gridBedtime"></div>
      `;
      home.appendChild(bSection);

      const gridBed = bSection.querySelector("#gridBedtime");
      for(const t of bedtimeTopics){
        const c = counts.bedtime?.[t] ?? 0;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="card-top">
            <div>
              <div class="card-title">${escapeHtml(t)}</div>
              <div class="card-count">${c} lines</div>
            </div>
            <div class="card-icon">🌙</div>
          </div>
          <button class="btn purple">Start</button>
        `;
        card.querySelector("button").onclick = ()=>onStartBedtime(t);
        gridBed.appendChild(card);
      }
    }

    bindHeroNav();
  }

  function getTopbarH(){
    const v = getComputedStyle(document.documentElement).getPropertyValue("--topbar-h");
    const n = parseFloat(v);
    if(Number.isFinite(n) && n > 0) return n;
    const tb = document.querySelector(".topbar");
    return tb ? tb.offsetHeight : 0;
  }

  function scrollToSection(sectionId){
    const home = el("screenHome");
    const target = document.getElementById(sectionId);
    if(!target) return;

    const offset = getTopbarH() + 10;

    if(home){
      const st = getComputedStyle(home);
      const isScrollable = (home.scrollHeight - home.clientHeight > 5) && (st.overflowY === "auto" || st.overflowY === "scroll");
      if(isScrollable){
        const top = target.getBoundingClientRect().top - home.getBoundingClientRect().top + home.scrollTop;
        home.scrollTo({ top: Math.max(0, top - offset), behavior: "smooth" });
        return;
      }
    }

    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top - offset), behavior: "smooth" });
  }

  function bindHeroNav(){
    const home = el("screenHome");
    if(!home) return;
    const chips = home.querySelectorAll(".hero .chip");
    if(!chips || chips.length < 1) return;

    // ✅ Updated chip map to include Bedtime as the 6th chip
    const map = ["secSpeaking","secGrammar","secPronunciation","secVocabulary","secReading","secBedtime"];
    chips.forEach((chip, i)=>{
      const target = map[i];
      if(!target) return;
      chip.setAttribute("role","button");
      chip.setAttribute("tabindex","0");
      chip.onclick = ()=>scrollToSection(target);
      chip.onkeydown = (e)=>{
        if(e.key === "Enter" || e.key === " "){
          e.preventDefault();
          scrollToSection(target);
        }
      };
    });
  }

  // ✅ Make topbar brand (logo + title) behave like Home button
  function bindTopbarBrandHome(){
    const brand = document.getElementById("topbarBrand") || document.querySelector(".topbar .brand");
    const btnHome = document.getElementById("btnHome");
    if(!brand || !btnHome) return;

    brand.style.cursor = "pointer";
    brand.addEventListener("click", ()=> btnHome.click());

    brand.addEventListener("keydown", (e)=>{
      if(e.key === "Enter" || e.key === " "){
        e.preventDefault();
        btnHome.click();
      }
    });
  }

  bindTopbarBrandHome();

  return {showScreen, setLoading, renderHome, el};
})();
