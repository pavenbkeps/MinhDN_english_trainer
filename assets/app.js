(function(){
  let speakingData = [];
  let grammarData = [];
  let pronunciationData = [];
  let vocabularyData = [];
  let readingData = [];

  // ===== History navigation (minimal hook) =====
  const VALID_SCREENS = new Set([
    "screenHome",
    "screenSpeaking",
    "screenGrammar",
    "screenPronunciation",
    "screenVocabulary",
    "screenReading"
  ]);

  function normalizeScreen(s){
    if(!s) return "screenHome";
    const v = String(s);
    return VALID_SCREENS.has(v) ? v : "screenHome";
  }

  function nav(screen, opts = {}){
    // opts: { silent: boolean, replace: boolean }
    const target = normalizeScreen(screen);

    // keep existing behavior
    UI.showScreen(target);

    // update history unless silent
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
      // Fallback: hash only (shouldn't break app)
      try{ location.hash = url; }catch(_){}
    }
  }

  // Handle browser Back/Forward
  window.addEventListener("popstate", (e)=>{
    // ⬅️ THÊM DÒNG NÀY
    TTS.cancel();

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

  async function init(){
    UI.setLoading(true, "Loading Speaking + Grammar + Pronunciation + Vocabulary + Reading…");
    try{
      const [spCSV, grCSV, prCSV, vCSV, rdCSV] = await Promise.all([
        Data.fetchCSV(CFG.SPEAKING_CSV_URL),
        Data.fetchCSV(CFG.GRAMMAR_CSV_URL),
        Data.fetchCSV(CFG.PRONUNCIATION_CSV_URL),
        Data.fetchCSV(CFG.VOCABULARY_CSV_URL),
        Data.fetchCSV(CFG.READING_CSV_URL)
      ]);
      speakingData = Data.parseSpeaking(spCSV);
      grammarData  = Data.parseGrammar(grCSV);
      pronunciationData = Data.parsePronunciation(prCSV);
      vocabularyData = Data.parseVocabulary(vCSV);
      readingData = Data.parseReading(rdCSV);
    }catch(e){
      UI.setLoading(true, "Load failed. Please refresh.");
      console.error(e);
      return;
    }

    const speakingTopics = Data.topicsWithAll(speakingData);
    const grammarTopics  = Data.topicsWithAll(grammarData);
    const pronunciationTopics = Data.topicsWithAll(pronunciationData);
    const vocabularyTopics = Data.topicsWithAll(vocabularyData);
    const readingTopics = Data.topicsWithAll(readingData);

    const counts = {
      speaking: countByTopic(speakingData),
      grammar: countByTopic(grammarData),
      pronunciation: countByTopic(pronunciationData),
      vocabulary: countByTopic(vocabularyData),
      reading: countByTopic(readingData)
    };

    UI.setLoading(false);

    // Always land on Home after data loaded (and set initial history entry)
    nav("screenHome", { replace: true });

    UI.renderHome({
      speakingTopics,
      grammarTopics,
      pronunciationTopics,
      vocabularyTopics,
      readingTopics,
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
      }
    });
  }

  document.getElementById("btnHome").onclick = ()=>{
    TTS.cancel();
    nav("screenHome");
    init();
  };
  document.getElementById("btnStop").onclick = ()=> TTS.cancel();

  init();
})();
