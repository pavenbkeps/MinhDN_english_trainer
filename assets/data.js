window.Data = (function(){
  function smartSplitCSVLine(line){
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  }
  function stripQuotes(s){
    return (s ?? "").replace(/^"(.*)"$/s, "$1").replace(/""/g, '"').trim();
  }
  async function fetchCSV(url){
    const r = await fetch(url, {cache:"no-store"});
    if(!r.ok) throw new Error("Fetch failed: "+r.status);
    return await r.text();
  }
  function parseSpeaking(csvText){
    const rows = csvText.split(/\r?\n/).filter(Boolean);
    let start = 0;
    if(rows[0] && rows[0].toLowerCase().includes("topic")) start = 1;
    const items = [];
    for(let i=start;i<rows.length;i++){
      const cols = smartSplitCSVLine(rows[i]);
      if(cols.length < 3) continue;
      const topic = stripQuotes(cols[0]);
      const question = stripQuotes(cols[1]);
      const answer = stripQuotes(cols[2]);
      if(!topic || !question) continue;
      items.push({topic, question, answer});
    }
    return items;
  }
  function parseGrammar(csvText){
    const rows = csvText.split(/\r?\n/).filter(Boolean);
    let start = 0;
    if(rows[0] && rows[0].toLowerCase().includes("topic")) start = 1;
    const items = [];
    for(let i=start;i<rows.length;i++){
      const cols = smartSplitCSVLine(rows[i]);
      if(cols.length < 8) continue;
      const item = {
        topic: stripQuotes(cols[0]),
        question: stripQuotes(cols[1]),
        A: stripQuotes(cols[2]),
        B: stripQuotes(cols[3]),
        C: stripQuotes(cols[4]),
        D: stripQuotes(cols[5]),
        correct: stripQuotes(cols[6]).toUpperCase(),
        explain: stripQuotes(cols[7]),
      };
      if(!item.topic || !item.question) continue;
      if(!["A","B","C","D"].includes(item.correct)) continue;
      items.push(item);
    }
    return items;
  }
  function topicsWithAll(items){
    const topics = Array.from(new Set(items.map(x=>x.topic).filter(Boolean)));
    return ["Tổng hợp", ...topics.filter(t=>t!=="Tổng hợp")];
  }
  function filterByTopic(items, topic){
    if(topic === "Tổng hợp") return items.slice();
    return items.filter(x=>x.topic === topic);
  }
  return {fetchCSV, parseSpeaking, parseGrammar, topicsWithAll, filterByTopic};
})();
