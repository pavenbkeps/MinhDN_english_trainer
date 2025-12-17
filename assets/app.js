(function(){
  let speakingData = [];
  let grammarData = [];
  let pronunciationData = [];
  let vocabularyData = [];

  function countByTopic(items){
    const topics = Data.topicsWithAll(items);
    const m = {};
    for(const t of topics){
      m[t] = Data.filterByTopic(items, t).length;
    }
    return m;
  }

  async function init(){
    UI.setLoading(true, "Loading Speaking + Grammar + Pronunciation + Vocabulary…");
    try{
      const [spCSV, grCSV, prCSV, vCSV] = await Promise.all([
        Data.fetchCSV(CFG.SPEAKING_CSV_URL),
        Data.fetchCSV(CFG.GRAMMAR_CSV_URL),
        Data.fetchCSV(CFG.PRONUNCIATION_CSV_URL),
        Data.fetchCSV(CFG.VOCABULARY_CSV_URL)
      ]);
      speakingData = Data.parseSpeaking(spCSV);
      grammarData  = Data.parseGrammar(grCSV);
      pronunciationData = Data.parsePronunciation(prCSV);
      vocabularyData = Data.parseVocabulary(vCSV);
    }catch(e){
      UI.setLoading(true, "Load failed. Please refresh.");
      console.error(e);
      return;
    }

    const speakingTopics = Data.topicsWithAll(speakingData);
    const grammarTopics  = Data.topicsWithAll(grammarData);
    const pronunciationTopics = Data.topicsWithAll(pronunciationData);
    const vocabularyTopics = Data.topicsWithAll(vocabularyData);

    const counts = {
      speaking: countByTopic(speakingData),
      grammar: countByTopic(grammarData),
      pronunciation: countByTopic(pronunciationData),
      vocabulary: countByTopic(vocabularyData)
    };

    UI.setLoading(false);
    UI.showScreen("screenHome");

    UI.renderHome({
      speakingTopics,
      grammarTopics,
      pronunciationTopics,
      vocabularyTopics,
      counts,
      onStartSpeaking: (topic)=>{
        const items = Data.filterByTopic(speakingData, topic);
        UI.showScreen("screenSpeaking");
        Speaking.start(items, topic);
      },
      onStartGrammar: (topic)=>{
        const items = Data.filterByTopic(grammarData, topic);
        UI.showScreen("screenGrammar");
        Grammar.start(items, topic);
      },
      onStartPronunciation: (topic)=>{
        const items = Data.filterByTopic(pronunciationData, topic);
        UI.showScreen("screenPronunciation");
        Pronunciation.start(items, topic);
      },
      onStartVocabulary: (topic)=>{
        const items = Data.filterByTopic(vocabularyData, topic);
        UI.showScreen("screenVocabulary");
        Vocabulary.start(items, topic);
      }
    });
  }

  document.getElementById("btnHome").onclick = ()=>{
    TTS.cancel();
    UI.showScreen("screenHome");
    init();
  };
  document.getElementById("btnStop").onclick = ()=> TTS.cancel();

  init();
})();
