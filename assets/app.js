(function(){
  let speakingData = [];
  let grammarData = [];
  let pronunciationData = [];
  let vocabularyData = [];
  let readingData = [];
  let mathData = [];          // ✅ NEW
  let bedtimeData = {};

  const VALID_SCREENS = new Set([
    "screenHome",
    "screenSpeaking",
    "screenGrammar",
    "screenPronunciation",
    "screenVocabulary",
    "screenReading",
    "screenMath",      // ✅ NEW
    "screenBedtime"
  ]);

  function stopAllPlayback(){
    try{ TTS.cancel(); }catch(e){}
    try{ window.Bedtime && typeof Bedtime.stop === "function" && Bedtime.stop(); }catch(e){}
  }

  function normalizeScreen(s){
    if(!s) return "screenHome";
    const v = String(s);
    return VALID_SCREENS.has(v) ? v : "screenHome";
  }

  function nav(screen, opts = {}){
    const target = normalizeScreen(screen);

    stopAllPlayback();
    UI.showScreen(target);

    if(opts.silent) return;

    const url = `#${target}`;
    const state = { screen: target };

    try{
      if(opts.replace){
        history.replaceState(state, "", url);
      }else{
        history.pushState(state, "", url);
      }
    }catch(e){
      try{ location.hash = url; }catch(_){}
    }
  }

  window.addEventListener("popstate", (e)=>{
    const sFromState = e && e.state && e.state.screen;
    const sFromHash = (location.hash || "").replace("#", "");
    const target = normalizeScreen(sFromState || sFromHash || "screenHome");
    nav(target, { silent: true });
  });

  function countByTopic(items){
    const topics = Data.topicsWithAll(items);
    const m = {};
    for(const t of topics){
      m[t] = Data.filterByTopic(items, t).length;
    }
    return m;
  }

  // ✅ Inject Math level pills (1/2/3/A) onto Math cards on Home
  function injectMathLevelPillsOnHome(mathTopics){
    try{
      if(!window.UI || typeof UI.createLevelPillsCompact !== "function") return;

      const home = document.getElementById("screenHome");
      if(!home) return;

      const secMath = document.getElementById("secMath");
      if(!secMath) return;

      const grid = secMath.querySelector("#gridMath");
      if(!grid) return;

      const cards = Array.from(grid.querySelectorAll(".card"));
      if(!cards.length) return;

      for(const card of cards){
        const titleEl = card.querySelector(".card-title");
        if(!titleEl) continue;

        const topicTitle = (titleEl.textContent || "").trim();
        if(!topicTitle) continue;

        // Optional: only add pills for known topics
        if(Array.isArray(mathTopics) && mathTopics.length && !mathTopics.includes(topicTitle)) {
          // still allow because Data.topicsWithAll might include "Tổng hợp"
          // We won't block hard.
        }

        const top = card.querySelector(".card-top");
        if(!top) continue;

        // Avoid duplicates if re-rendered
        if(top.querySelector(".lvl-pills")) continue;

        // Create pills
        const pills = UI.createLevelPillsCompact({
          storageKey: `math_levels__${topicTitle}`,
          onChange: ()=>{} // MathQuiz will read from localStorage when Start
        });

        // Place pills near the icon (top-right)
        // Strategy: insert before .card-icon if exists; else append.
        const icon = top.querySelector(".card-icon");
        const wrap = document.createElement("div");
        wrap.style.display = "flex";
        wrap.style.alignItems = "center";
        wrap.style.gap = "10px";

        wrap.appendChild(pills.el);

        if(icon){
          // move icon into the same right-side wrap
          icon.parentNode.insertBefore(wrap, icon);
          wrap.appendChild(icon);
        }else{
          top.appendChild(wrap);
        }
      }
    }catch(e){
      console.warn("injectMathLevelPillsOnHome failed:", e);
    }
  }

  async function init(){
    UI.setLoading(true, "Loading Speaking + Grammar + Pronunciation + Vocabulary + Reading + Math…");
    try{
      const [spCSV, grCSV, prCSV, vCSV, rdCSV, mCSV] = await Promise.all([
        Data.fetchCSV(CFG.SPEAKING_CSV_URL),
        Data.fetchCSV(CFG.GRAMMAR_CSV_URL),
        Data.fetchCSV(CFG.PRONUNCIATION_CSV_URL),
        Data.fetchCSV(CFG.VOCABULARY_CSV_URL),
        Data.fetchCSV(CFG.READING_CSV_URL),
        Data.fetchCSV(CFG.MATH_CSV_URL)            // ✅ NEW
      ]);
      speakingData = Data.parseSpeaking(spCSV);
      grammarData  = Data.parseGrammar(grCSV);
      pronunciationData = Data.parsePronunciation(prCSV);
      vocabularyData = Data.parseVocabulary(vCSV);
      readingData = Data.parseReading(rdCSV);
      mathData = Data.parseMath(mCSV);             // ✅ NEW
    }catch(e){
      UI.setLoading(true, "Load failed. Please refresh.");
      console.error(e);
      return;
    }

    if(window.BEDTIME && typeof BEDTIME === "object"){
      bedtimeData = BEDTIME;
    }else{
      bedtimeData = {};
    }

    const speakingTopics = Data.topicsWithAll(speakingData);
    const grammarTopics  = Data.topicsWithAll(grammarData);
    const pronunciationTopics = Data.topicsWithAll(pronunciationData);
    const vocabularyTopics = Data.topicsWithAll(vocabularyData);
    const readingTopics = Data.topicsWithAll(readingData);
    const mathTopics = Data.topicsWithAll(mathData);            // ✅ NEW

    const bedtimeTopics = Object.keys(bedtimeData);

    const bedtimeCounts = bedtimeTopics.reduce((m,t)=>{
      m[t] = (bedtimeData[t] || []).length;
      return m;
    }, {});
    bedtimeCounts["Tổng hợp"] = bedtimeTopics.reduce((sum, t)=> sum + ((bedtimeData[t] || []).length), 0);

    const counts = {
      speaking: countByTopic(speakingData),
      grammar: countByTopic(grammarData),
      pronunciation: countByTopic(pronunciationData),
      vocabulary: countByTopic(vocabularyData),
      reading: countByTopic(readingData),
      math: countByTopic(mathData),                 // ✅ NEW
      bedtime: bedtimeCounts
    };

    UI.setLoading(false);
    nav("screenHome", { replace: true });

    UI.renderHome({
      speakingTopics,
      grammarTopics,
      pronunciationTopics,
      vocabularyTopics,
      readingTopics,
      mathTopics,                 // ✅ NEW
      bedtimeTopics,
      counts,

      onStartSpeaking: (topic)=>{
        const items = Data.filterByTopic(speakingData, topic);
        nav("screenSpeaking");
        Speaking.start(items, topic);
      },
      onStartGrammar: (topic)=>{
        const items = Data.filterByTopic(grammarData, topic);
        nav("screenGrammar");
        Grammar.start(items, topic);
      },

      onLearnGrammar: (topic)=>{
        nav("screenGrammar");
        try{
          if(window.Grammar && typeof Grammar.openLearn === "function"){
            const items = Data.filterByTopic(grammarData, topic);
            Grammar.openLearn(topic, items);
          }else{
            alert("Learn UI chưa sẵn sàng. Cần thêm learn_data.js và hàm Grammar.openLearn(topic).");
          }
        }catch(e){
          console.error(e);
          alert("Không mở được Learn. Xem console để biết lỗi.");
        }
      },

      onStartPronunciation: (topic)=>{
        const items = Data.filterByTopic(pronunciationData, topic);
        nav("screenPronunciation");
        Pronunciation.start(items, topic);
      },
      onStartVocabulary: (topic)=>{
        const items = Data.filterByTopic(vocabularyData, topic);
        nav("screenVocabulary");
        Vocabulary.start(items, topic);
      },
      onStartReading: (topic)=>{
        const items = Data.filterByTopic(readingData, topic);
        nav("screenReading");
        Reading.start(items, topic);
      },

      // ✅ NEW: Math
      onOpenMathTopic: (topic)=>{
        const items = Data.filterByTopic(mathData, topic);
        nav("screenMath");
        MathQuiz.start(topic, items);   // ✅ OPEN = Start luôn
      },

      onLearnMath: (topic)=>{
        const items = Data.filterByTopic(mathData, topic);
        nav("screenMath");
        MathQuiz.openLearn(topic, items);
      },

      onStartBedtime: (topic)=>{
        const items = bedtimeData[topic] || [];
        nav("screenBedtime");
        Bedtime.start(items, topic);
      }
    });

    // ✅ After renderHome, inject pills onto Math cards
    injectMathLevelPillsOnHome(mathTopics);
  }

  document.getElementById("btnHome").onclick = ()=>{
    stopAllPlayback();
    nav("screenHome");
  };

  document.getElementById("btnStop").onclick = ()=> stopAllPlayback();

  init();
})();
