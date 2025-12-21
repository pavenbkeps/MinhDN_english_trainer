window.TTS = (function(){
  let voices = [];
  let warmed = false;

  // cache selected voice by langPrefix, e.g. "en", "vi"
  const selectedByLang = new Map();

  function loadVoices(){
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if(!voices || voices.length === 0) return;

    // warm cache for english at least (existing behavior)
    if(!selectedByLang.get("en")){
      selectedByLang.set("en", pickBestVoiceForLang("en"));
    }
  }

  function pickBestVoiceForLang(langPrefix){
    if(!voices || voices.length === 0) return null;

    const preferred = window.CFG?.PREFERRED_VOICES || [];

    // 1) try preferred names for this language
    for(const name of preferred){
      const v = voices.find(x =>
        (x.name||"").includes(name) &&
        (x.lang||"").toLowerCase().startsWith(String(langPrefix).toLowerCase())
      );
      if(v) return v;
    }

    // 2) pick any voice matching langPrefix
    const v2 = voices.find(x => (x.lang||"").toLowerCase().startsWith(String(langPrefix).toLowerCase()));
    if(v2) return v2;

    // 3) fallback: first available
    return voices[0] || null;
  }

  function sanitizeForSpeech(text){
    let t = (text ?? "").toString();
    t = t.replace(/_{2,}/g, " ");
    t = t.replace(/\s+/g, " ").trim();
    return t;
  }

  function cancel(){
    try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){}
  }

  /**
   * speak(text, opts)
   * opts.lang: "en-US" or "vi-VN" (or "en", "vi")
   * opts.rate, opts.pitch
   * opts.onend: callback when finished
   * opts.onerror: callback on error
   */
  function speak(text, opts = {}){
    if(!window.speechSynthesis) return null;

    cancel();

    if(!voices || voices.length === 0) loadVoices();

    const rawLang = (opts.lang || "en-US").toString();
    const langPrefix = rawLang.toLowerCase().startsWith("vi") ? "vi" : "en"; // keep default EN
    if(!selectedByLang.get(langPrefix)){
      selectedByLang.set(langPrefix, pickBestVoiceForLang(langPrefix));
    }

    const u = new SpeechSynthesisUtterance(sanitizeForSpeech(text));

    const selectedVoice = selectedByLang.get(langPrefix);
    if(selectedVoice){
      u.voice = selectedVoice;
      u.lang = selectedVoice.lang || rawLang;
    }else{
      u.lang = rawLang;
    }

    u.rate  = (typeof opts.rate  === "number") ? opts.rate  : (window.CFG?.TTS_RATE  ?? 0.9);
    u.pitch = (typeof opts.pitch === "number") ? opts.pitch : (window.CFG?.TTS_PITCH ?? 1.0);

    if(typeof opts.onend === "function") u.onend = opts.onend;
    if(typeof opts.onerror === "function") u.onerror = opts.onerror;

    window.speechSynthesis.speak(u);
    return u;
  }

  function warmUp(){
    if(warmed) return;
    warmed = true;
    speak("Ready.", { rate: 0.9, lang: "en-US" });
    setTimeout(cancel, 120);
  }

  if(window.speechSynthesis && "onvoiceschanged" in window.speechSynthesis){
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  setTimeout(loadVoices, 50);

  return { speak, cancel, warmUp, sanitizeForSpeech };
})();
