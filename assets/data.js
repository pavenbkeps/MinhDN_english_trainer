window.Data = (function(){
  function smartSplitCSVLine(line){
    return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
  }
  function stripQuotes(s){
    return (s ?? "").replace(/^"(.*)"$/s, "$1").replace(/""/g, '"').trim();
  }

  // NEW: split CSV into logical rows, preserving embedded newlines inside quoted cells
  function splitCSVRows(csvText){
    const rows = [];
    let cur = "";
    let inQuotes = false;

    for(let i=0;i<csvText.length;i++){
      const ch = csvText[i];

      if(ch === '"'){
        // Escaped quote inside a quoted field: "" -> "
        if(inQuotes && csvText[i+1] === '"'){
          cur += '"';
          i++;
          continue;
        }
        inQuotes = !inQuotes;
        cur += ch;
        continue;
      }

      if(!inQuotes && (ch === '\n' || ch === '\r')){
        // Handle CRLF
        if(ch === '\r' && csvText[i+1] === '\n') i++;
        if(cur.trim() !== "") rows.push(cur);
        cur = "";
        continue;
      }

      cur += ch;
    }
    if(cur.trim() !== "") rows.push(cur);
    return rows;
  }

  async function fetchCSV(url){
    const r = await fetch(url, {cache:"no-store"});
    if(!r.ok) throw new Error("Fetch failed: "+r.status);
    return await r.text();
  }

  function parseSpeaking(csvText){
    const rows = splitCSVRows(csvText).filter(r => r.trim().length);
    let start = 0;
    if(rows[0] && rows[0].toLowerCase().includes("topic")) start = 1;

    const items = [];

    let lastTopic = "";
    let lastImageKey = "";

    for(let i=start;i<rows.length;i++){
      const cols = smartSplitCSVLine(rows[i]);
      if(cols.length < 3) continue;

      const topic = stripQuotes(cols[0]);
      const question = stripQuotes(cols[1]);
      const answer = stripQuotes(cols[2]);

      // NEW columns
      const hint  = stripQuotes(cols[3] ?? "");   // col D
      let image   = stripQuotes(cols[4] ?? "");   // col E

      if(!topic || !question) continue;

      // Fill-down image by group; reset when topic changes
      if(topic !== lastTopic){
        lastTopic = topic;
        lastImageKey = ""; // reset to avoid leaking previous topic image
      }
      if(image){
        lastImageKey = image;
      }else{
        image = lastImageKey;
      }

      items.push({ topic, question, answer, hint, image });
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

  // NEW: Pronunciation
  function parsePronunciation(csvText){
    const rows = csvText.split(/\r?\n/).filter(Boolean);
    let start = 0;
    if(rows[0] && rows[0].toLowerCase().includes("topic")) start = 1;
    const items = [];
    for(let i=start;i<rows.length;i++){
      const cols = smartSplitCSVLine(rows[i]);
      // Expect: topic,type,prompt,target,A,B,C,D,correct,explain
      if(cols.length < 10) continue;
      const item = {
        topic: stripQuotes(cols[0]),
        type: stripQuotes(cols[1]),
        prompt: stripQuotes(cols[2]),
        target: stripQuotes(cols[3]),
        A: stripQuotes(cols[4]),
        B: stripQuotes(cols[5]),
        C: stripQuotes(cols[6]),
        D: stripQuotes(cols[7]),
        correct: stripQuotes(cols[8]).toUpperCase(),
        explain: stripQuotes(cols[9]),
      };
      if(!item.topic || !item.type || !item.prompt) continue;

      // --- Validation / normalization ---
      // Sheet "Pronunciation" currently uses two patterns:
      // 1) Most types: correct = A/B/C/D (letter)
      // 2) minimal_pair: correct = the correct WORD (not the letter)

      // Minimal pair may only have A/B
      const hasC = !!item.C;
      const hasD = !!item.D;

      // Always require at least A/B
      if(!item.A || !item.B) continue;

      if((item.type || "").toLowerCase() === "minimal_pair"){
        // If Correct column is already A/B, keep it.
        // Otherwise treat it as the correct WORD to be spoken.
        const raw = (item.correct || "").toString().trim();
        const upper = raw.toUpperCase();
        if(["A","B"].includes(upper)){
          item.correct = upper;
          item.correct_word = (item[upper] || "").toString();
        }else{
          item.correct_word = raw;
          // Map the correct WORD to a letter by matching against options.
          const norm = (s)=> (s||"").toString().replace(/\([^)]*\)/g, "").trim().toLowerCase();
          const cw = norm(raw);
          const candidates = [
            ["A", item.A],
            ["B", item.B],
          ];
          const hit = candidates.find(([_, t]) => norm(t) === cw);
          if(!hit) continue; // can't determine which option is correct
          item.correct = hit[0];
        }
        items.push(item);
        continue;
      }

      // Other types: keep existing strict validation
      const validABCD = ["A","B","C","D"].includes(item.correct);
      const validAB = ["A","B"].includes(item.correct);
      if((hasC || hasD)){
        if(!validABCD) continue;
      }else{
        if(!validAB) continue;
      }

      items.push(item);
    }
    return items;
  }

  function parseVocabulary(csvText){
    const rows = csvText.split(/\r?\n/).filter(Boolean);
    let start = 0;
    if(rows[0] && rows[0].toLowerCase().includes("topic")) start = 1;

    const items = [];
    for(let i=start;i<rows.length;i++){
      const cols = smartSplitCSVLine(rows[i]);
      if(cols.length < 4) continue;

      const topic = stripQuotes(cols[0]);
      const type = stripQuotes(cols[1]) || "fill_blank";
      const sentence = stripQuotes(cols[2]);
      const answer = stripQuotes(cols[3]);
      const hint_vi = stripQuotes(cols[4] || "");
      const meaning_vi = stripQuotes(cols[5] || "");
      const explain_vi = stripQuotes(cols[6] || "");

      if(!topic || !sentence || !answer) continue;
      items.push({ topic, type, sentence, answer, hint_vi, meaning_vi, explain_vi });
    }
    return items;
  }

  // Reading / Speech
  // Expected columns: Topic,Title,Lang,Text,Note_vi,NewWords
  function parseReading(csvText){
    const rows = splitCSVRows(csvText);
    let start = 0;
    if(rows[0] && rows[0].toLowerCase().includes("topic")) start = 1;

    const items = [];
    for(let i=start;i<rows.length;i++){
      const cols = smartSplitCSVLine(rows[i]);
      if(cols.length < 4) continue;

      const topic = stripQuotes(cols[0]);
      const title = stripQuotes(cols[1]);
      const lang = stripQuotes(cols[2]) || "en";
      const text = stripQuotes(cols[3]);

      const note_vi = stripQuotes(cols[4] || "");
      const newWords = stripQuotes(cols[5] || "");

      if(!topic || !title || !text) continue;

      items.push({
        topic,
        title,
        lang,
        text,
        note_vi,
        newWords
      });
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

  return {fetchCSV, parseSpeaking, parseGrammar, parsePronunciation, parseVocabulary, parseReading, topicsWithAll, filterByTopic};
})();
