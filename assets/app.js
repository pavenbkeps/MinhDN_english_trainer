(function(){
  let speakingData = [];
  let grammarData = [];

  function countByTopic(items){
    const topics = Data.topicsWithAll(items);
    const m = {};
    for(const t of topics){
      m[t] = Data.filterByTopic(items, t).length;
    }
    return m;
  }

  async function init(){
    UI.setLoading(true, "Loading Speaking + Grammar…");
    try{
      const [spCSV, grCSV] = await Promise.all([
        Data.fetchCSV(CFG.SPEAKING_CSV_URL),
        Data.fetchCSV(CFG.GRAMMAR_CSV_URL)
      ]);
      speakingData = Data.parseSpeaking(spCSV);
      grammarData  = Data.parseGrammar(grCSV);
    }catch(e){
      UI.setLoading(true, "Load failed. Please refresh.");
      console.error(e);
      return;
    }

    const speakingTopics = Data.topicsWithAll(speakingData);
    const grammarTopics  = Data.topicsWithAll(grammarData);

    const counts = {
      speaking: countByTopic(speakingData),
      grammar: countByTopic(grammarData)
    };

    UI.setLoading(false);
    UI.showScreen("screenHome");

    UI.renderHome({
      speakingTopics,
      grammarTopics,
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
