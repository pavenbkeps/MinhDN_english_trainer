window.UI = (function(){
  const el = (id)=>document.getElementById(id);

  // ==========================
  // ✅ Reusable Level Selector (Easy/Core/Hard/All)
  // - Multi-select levels 1/2/3
  // - All is derived (active when 1+2+3 selected)
  // - If empty => auto reset to All
  // - Optional localStorage persistence by key
  // ==========================
  const LEVEL_ALL = [1,2,3];

  function _normalizeLevelSet(levelSet){
    if(!(levelSet instanceof Set) || levelSet.size === 0){
      return new Set(LEVEL_ALL);
    }
    const clean = new Set();
    for(const v of levelSet){
      const n = Number(v);
      if(n === 1 || n === 2 || n === 3) clean.add(n);
    }
    return clean.size ? clean : new Set(LEVEL_ALL);
  }

  function _isAllSelected(levelSet){
    return levelSet.size === 3 && LEVEL_ALL.every(v => levelSet.has(v));
  }

  function createLevelSelector({
    defaultSelected = new Set(LEVEL_ALL),
    onChange,
    labels = { easy:"Easy", core:"Core", hard:"Hard", all:"All" },
    storageKey = null
  } = {}){
    let selected = _normalizeLevelSet(defaultSelected);

    if(storageKey){
      try{
        const raw = localStorage.getItem(storageKey);
        if(raw){
          const arr = JSON.parse(raw);
          if(Array.isArray(arr)) selected = _normalizeLevelSet(new Set(arr));
        }
      }catch(_){}
    }

    const wrap = document.createElement("div");
    wrap.style.display = "flex";
    wrap.style.gap = "8px";
    wrap.style.flexWrap = "wrap";
    wrap.style.alignItems = "center";
    wrap.style.margin = "10px 0";

    function mkBtn(text){
      const b = document.createElement("button");
      b.type = "button";
      b.className = "btn ghost";
      b.textContent = text;
      b.style.padding = "8px 12px";
      b.style.borderRadius = "999px";
      b.style.fontWeight = "700";
      return b;
    }

    const btnEasy = mkBtn(labels.easy);
    const btnCore = mkBtn(labels.core);
    const btnHard = mkBtn(labels.hard);
    const btnAll  = mkBtn(labels.all);

    function setActive(btn, active){
      btn.style.opacity = active ? "1" : "0.6";
      btn.style.transform = active ? "translateY(0px)" : "translateY(0px)";
      btn.dataset.active = active ? "1" : "0";
    }
    function setDim(btn, dim){
      btn.style.opacity = dim ? "0.45" : "1";
    }
    function persist(){
      if(!storageKey) return;
      try{
        localStorage.setItem(storageKey, JSON.stringify(Array.from(selected)));
      }catch(_){}
    }
    function emit(){
      persist();
      if(typeof onChange === "function") onChange(new Set(selected));
    }
    function render(){
      setActive(btnEasy, selected.has(1));
      setActive(btnCore, selected.has(2));
      setActive(btnHard, selected.has(3));

      const allOn = _isAllSelected(selected);
      setActive(btnAll, allOn);
      setDim(btnAll, !allOn); // All mờ khi chưa chọn đủ 1+2+3
    }
    function toggle(level){
      if(selected.has(level)) selected.delete(level);
      else selected.add(level);

      // nếu bỏ hết => quay về All
      selected = _normalizeLevelSet(selected);
      render();
      emit();
    }

    btnEasy.onclick = ()=>toggle(1);
    btnCore.onclick = ()=>toggle(2);
    btnHard.onclick = ()=>toggle(3);

    // All là reset về full
    btnAll.onclick = ()=>{
      selected = new Set(LEVEL_ALL);
      render();
      emit();
    };

    wrap.appendChild(btnEasy);
    wrap.appendChild(btnCore);
    wrap.appendChild(btnHard);
    wrap.appendChild(btnAll);

    render();
    emit();

    return {
      el: wrap,
      getSelected: ()=>new Set(selected),
      setSelected: (newSet)=>{
        selected = _normalizeLevelSet(newSet);
        render();
        emit();
      }
    };
  }

  // ==========================
  // ✅ Compact Level Pills (1/2/3/A)
  // - Designed for topic cards (Home)
  // - storageKey compatible with createLevelSelector
  // - A = All (1+2+3)
  // - Clicking pills won't trigger parent card click (stopPropagation in caller if needed)
  // ==========================
  function createLevelPillsCompact({
    storageKey,
    onChange
  } = {}){
    const KEY = storageKey || null;

    function load(){
      try{
        if(!KEY) return new Set(LEVEL_ALL);
        const raw = localStorage.getItem(KEY);
        if(!raw) return new Set(LEVEL_ALL); // default All
        const arr = JSON.parse(raw);
        if(!Array.isArray(arr)) return new Set(LEVEL_ALL);
        const s = _normalizeLevelSet(new Set(arr));
        return s;
      }catch(_){
        return new Set(LEVEL_ALL);
      }
    }

    function save(set){
      if(!KEY) return;
      try{ localStorage.setItem(KEY, JSON.stringify(Array.from(set))); }catch(_){}
    }

    let selected = load();

    // inject CSS once
    if(!document.getElementById("lvlPillsCss")){
      const st = document.createElement("style");
      st.id = "lvlPillsCss";
      st.textContent = `
        .lvl-pills{display:flex; gap:8px; align-items:center; justify-content:flex-end;}
        .lvl-pill{
          width:30px; height:30px; border-radius:10px;
          display:flex; align-items:center; justify-content:center;
          font-weight:900; cursor:pointer; user-select:none;
          border:1px solid rgba(229,231,235,.95);
          background:rgba(17,24,39,.04);
        }
        .lvl-pill.on{
          background:rgba(59,130,246,.14);
          border-color:rgba(59,130,246,.35);
        }
        .lvl-pill:active{transform:scale(.98);}
      `;
      document.head.appendChild(st);
    }

    const wrap = document.createElement("div");
    wrap.className = "lvl-pills";

    function emit(){
      save(selected);
      if(typeof onChange === "function") onChange(new Set(selected));
    }

    function render(){
      wrap.innerHTML = "";

      const mk = (label)=>{
        const b = document.createElement("div");
        b.className = "lvl-pill";
        b.textContent = label;
        return b;
      };

      const b1 = mk("1");
      const b2 = mk("2");
      const b3 = mk("3");
      const bA = mk("A");

      const allOn = _isAllSelected(selected);

      if(selected.has(1)) b1.classList.add("on");
      if(selected.has(2)) b2.classList.add("on");
      if(selected.has(3)) b3.classList.add("on");
      if(allOn) bA.classList.add("on");

      function toggle(n){
        // Nếu đang All mà bấm 1/2/3 => chuyển sang chỉ còn level đó (nhanh, đúng UX)
        if(allOn){
          selected = new Set([n]);
          render();
          emit();
          return;
        }

        if(selected.has(n)) selected.delete(n);
        else selected.add(n);

        // Không cho rỗng => auto All
        selected = _normalizeLevelSet(selected);

        // Nếu đủ 1+2+3 => All sáng tự động
        if(selected.has(1) && selected.has(2) && selected.has(3)){
          selected = new Set(LEVEL_ALL);
        }

        render();
        emit();
      }

      // stopPropagation để bấm pill không mở topic card
      b1.onclick = (e)=>{ e.stopPropagation(); toggle(1); };
      b2.onclick = (e)=>{ e.stopPropagation(); toggle(2); };
      b3.onclick = (e)=>{ e.stopPropagation(); toggle(3); };

      // A = reset All
      bA.onclick = (e)=>{
        e.stopPropagation();
        selected = new Set(LEVEL_ALL);
        render();
        emit();
      };

      wrap.append(b1,b2,b3,bA);
    }

    render();
    emit();

    return {
      el: wrap,
      getSelected: ()=>new Set(selected),
      setSelected: (newSet)=>{
        selected = _normalizeLevelSet(newSet);
        render();
        emit();
      },
      setAll: ()=>{
        selected = new Set(LEVEL_ALL);
        render();
        emit();
      }
    };
  }

  function showScreen(name){
    // ✅ Add screenMath to the list (doesn't affect existing screens)
    const screens = [
      "screenHome",
      "screenSpeaking",
      "screenGrammar",
      "screenPronunciation",
      "screenVocabulary",
      "screenReading",
      "screenMath",     // ✅ NEW
      "screenBedtime"
    ];
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
    const totalMath = counts?.math?.["Tổng hợp"] ?? 0;           // ✅ NEW
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
          <div class="chip">🧮 Math <span class="chip-num">${totalMath}</span></div>
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
    mathTopics = [],                     // ✅ NEW
    bedtimeTopics = [],
    counts,
    onStartSpeaking,
    onStartGrammar,
    onLearnGrammar,
    onStartPronunciation,
    onStartVocabulary,
    onStartReading,

    // ✅ NEW: Math callbacks
    onOpenMathTopic,
    onLearnMath,

    onStartBedtime
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
      card.querySelector("button.btn.purple").onclick = ()=>onStartGrammar(t);
      card.querySelector('button[data-learn="1"]').onclick = ()=>onLearnGrammar && onLearnGrammar(t);
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

    /* ===== Math (NEW) ===== */
    if(mathTopics && mathTopics.length && typeof onOpenMathTopic === "function"){
      const mSection = document.createElement("div");
      mSection.className = "section";
      mSection.id = "secMath";
      mSection.innerHTML = `
        <div class="section-head">
          <div class="section-title">🧮 Math (in English)</div>
          <div class="section-sub">Learn → choose level → Start (with pictures + KaTeX)</div>
        </div>
        <div class="grid" id="gridMath"></div>
      `;
      home.appendChild(mSection);

      const gridMath = mSection.querySelector("#gridMath");
      for(const t of mathTopics){
        const c = counts.math?.[t] ?? 0;
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="card-top">
            <div>
              <div class="card-title">${escapeHtml(t)}</div>
              <div class="card-count">${c} questions</div>
            </div>
            <div class="card-icon">🧮</div>
          </div>

          <div class="card-actions">
            <button class="btn blue half">Start</button>
            <button class="btn ghost half" data-learn="1">Learn</button>
          </div>
        `;
        card.querySelector("button.btn.blue").onclick = ()=>onOpenMathTopic(t);
        card.querySelector('button[data-learn="1"]').onclick = ()=>onLearnMath && onLearnMath(t);
        gridMath.appendChild(card);
      }
    }

    /* ===== Bedtime / Story ===== */
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

    // ✅ Updated chip map: add Math before Bedtime
    const map = ["secSpeaking","secGrammar","secPronunciation","secVocabulary","secReading","secMath","secBedtime"];
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

  return {
    showScreen,
    setLoading,
    renderHome,
    el,

    // ✅ NEW export (future-proof for Grammar/Reading later)
    createLevelSelector,
    createLevelPillsCompact, // ✅ NEW
    LEVEL_ALL
  };
})();
