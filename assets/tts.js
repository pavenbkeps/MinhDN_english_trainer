window.TTS = (function(){
  let voices = [];
  let selectedVoice = null;
  let warmed = false;

  function loadVoices(){
    voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
    if(!voices || voices.length === 0) return;
    selectedVoice = pickBestVoice();
  }
  function pickBestVoice(){
    if(!voices || voices.length === 0) return null;
    const preferred = window.CFG?.PREFERRED_VOICES || [];
    for(const name of preferred){
      const v = voices.find(x => (x.name||"").includes(name) && (x.lang||"").startsWith("en"));
      if(v) return v;
    }
    return voices.find(x => (x.lang||"").startsWith("en")) || voices[0];
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
  function speak(text, opts={}){
    if(!window.speechSynthesis) return;
    cancel();
    const u = new SpeechSynthesisUtterance(sanitizeForSpeech(text));
    if(!voices || voices.length === 0) loadVoices();
    if(!selectedVoice) selectedVoice = pickBestVoice();
    if(selectedVoice){
      u.voice = selectedVoice;
      u.lang = selectedVoice.lang || "en-US";
    }else{
      u.lang = "en-US";
    }
    u.rate = typeof opts.rate === "number" ? opts.rate : (window.CFG?.TTS_RATE ?? 0.9);
    u.pitch = typeof opts.pitch === "number" ? opts.pitch : (window.CFG?.TTS_PITCH ?? 1.0);
    window.speechSynthesis.speak(u);
  }
  function warmUp(){
    if(warmed) return;
    warmed = true;
    speak("Ready.", {rate: 0.9});
    setTimeout(cancel, 120);
  }
  if(window.speechSynthesis && "onvoiceschanged" in window.speechSynthesis){
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }
  setTimeout(loadVoices, 50);
  return {speak, cancel, warmUp, sanitizeForSpeech};
})();
