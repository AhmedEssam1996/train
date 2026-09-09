class BilingualSpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    
    this.currentLanguage = 'en-US';
    this.isRecognizing = false;
    this.isSpeaking = false;
    
    this.onResult = null;
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onLanguageDetected = null;
    this.onError = null;
    
    this.finalTranscript = '';
    this.interimTranscript = '';
    
    this.ttsAudioContext = null;
    this.ttsAnalyser = null;
    this.ttsSource = null;
    this.ttsGainNode = null;
    this.onTtsAudioData = null;
    
    this.availableVoices = [];
    this.selectedArabicVoice = null;
    this.selectedEnglishVoice = null;
    
    this.initVoices();
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => this.initVoices();
    }
  }

  initVoices() {
    if (!this.synthesis) return;
    
    this.availableVoices = this.synthesis.getVoices();
    
    this.selectedArabicVoice = this.availableVoices.find(v => 
      v.lang.includes('ar') || v.lang.includes('AR')
    ) || this.availableVoices.find(v => 
      v.name.toLowerCase().includes('arab') || v.name.toLowerCase().includes('egypt')
    ) || null;
    
    this.selectedEnglishVoice = this.availableVoices.find(v => 
      v.lang.includes('en-US') || v.lang.includes('en_GB')
    ) || this.availableVoices.find(v => 
      v.lang.includes('en')
    ) || (this.availableVoices.length > 0 ? this.availableVoices[0] : null);
  }

  initRecognition(continuous = true, interimResults = true) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      console.warn('Speech Recognition API not supported in this browser');
      return false;
    }
    
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = continuous;
    this.recognition.interimResults = interimResults;
    this.recognition.maxAlternatives = 3;
    
    this.recognition.onstart = () => {
      this.isRecognizing = true;
    };
    
    this.recognition.onend = () => {
      this.isRecognizing = false;
    };
    
    this.recognition.onerror = (event) => {
      if (this.onError) {
        this.onError(event.error);
      }
      
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setTimeout(() => {
          try { this.startRecognition(); } catch(e) {}
        }, 500);
      }
    };
    
    this.recognition.onresult = (event) => {
      this.interimTranscript = '';
      let newFinal = '';
      
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        
        if (event.results[i].isFinal) {
          newFinal += transcript;
        } else {
          this.interimTranscript += transcript;
        }
      }
      
      if (newFinal) {
        this.finalTranscript += newFinal;
        const detectedLang = this.detectLanguage(newFinal);
        this.currentLanguage = detectedLang;
        
        if (this.onLanguageDetected) {
          this.onLanguageDetected(detectedLang);
        }
        
        if (this.onResult) {
          this.onResult(newFinal.trim(), detectedLang, true);
        }
      } else if (this.interimTranscript) {
        if (this.onResult) {
          this.onResult(this.interimTranscript.trim(), this.currentLanguage, false);
        }
      }
    };
    
    return true;
  }

  detectLanguage(text) {
    if (!text || text.length === 0) return this.currentLanguage;
    
    const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDCF\uFDF0-\uFDFF\uFE70-\uFEFF]/;
    const englishRegex = /[a-zA-Z]/;
    
    let arabicChars = 0;
    let englishChars = 0;
    
    for (const char of text) {
      if (arabicRegex.test(char)) arabicChars++;
      if (englishRegex.test(char)) englishChars++;
    }
    
    const total = arabicChars + englishChars;
    if (total === 0) return this.currentLanguage;
    
    const arabicRatio = arabicChars / total;
    const englishRatio = englishChars / total;
    
    if (arabicRatio > 0.4) return 'ar-EG';
    if (englishRatio > 0.4) return 'en-US';
    
    return this.currentLanguage;
  }

  startRecognition(language = null) {
    if (!this.recognition) {
      const inited = this.initRecognition();
      if (!inited) return false;
    }
    
    if (language) {
      this.currentLanguage = language;
    }
    
    this.recognition.lang = this.currentLanguage;
    this.finalTranscript = '';
    this.interimTranscript = '';
    
    try {
      this.recognition.start();
      return true;
    } catch (e) {
      console.warn('Recognition start error:', e);
      return false;
    }
  }

  stopRecognition() {
    if (this.recognition && this.isRecognizing) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  abortRecognition() {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch (e) {}
    }
  }

  setRecognitionLanguage(lang) {
    this.currentLanguage = lang;
    if (this.recognition) {
      this.recognition.lang = lang;
    }
  }

  initTtsAudioCapture(audioContext) {
    this.ttsAudioContext = audioContext;
    
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ttsAudioContext = this.ttsAudioContext || new AudioContext();
      
      this.ttsAnalyser = this.ttsAudioContext.createAnalyser();
      this.ttsAnalyser.fftSize = 512;
      this.ttsAnalyser.smoothingTimeConstant = 0.5;
      
      this.ttsGainNode = this.ttsAudioContext.createGain();
      this.ttsGainNode.gain.value = 0;
      
      this.ttsGainNode.connect(this.ttsAnalyser);
      this.ttsAnalyser.connect(this.ttsAudioContext.destination);
      
      return true;
    } catch (e) {
      console.warn('TTS Audio capture init error:', e);
      return false;
    }
  }

  getTtsAnalyser() {
    return this.ttsAnalyser;
  }

  speak(text, language = null, onStart, onEnd) {
    if (!this.synthesis) {
      console.warn('Speech Synthesis not supported');
      if (onEnd) onEnd();
      return false;
    }
    
    const speakLang = language || this.currentLanguage;
    this.initVoices();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = speakLang;
    utterance.rate = speakLang.startsWith('ar') ? 0.95 : 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    const voice = speakLang.startsWith('ar') ? this.selectedArabicVoice : this.selectedEnglishVoice;
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.ttsAudioContext && this.ttsAudioContext.state === 'suspended') {
        this.ttsAudioContext.resume();
      }
      if (onStart) onStart();
      if (this.onSpeechStart) this.onSpeechStart();
    };
    
    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onTtsAudioData) {
        this.onTtsAudioData(0);
      }
      if (onEnd) onEnd();
      if (this.onSpeechEnd) this.onSpeechEnd();
    };
    
    utterance.onerror = (e) => {
      this.isSpeaking = false;
      console.warn('TTS error:', e);
      if (onEnd) onEnd();
    };
    
    this.synthesis.speak(utterance);
    
    this.startTtsAudioSimulation();
    
    return true;
  }

  startTtsAudioSimulation() {
    if (!this.onTtsAudioData) return;
    
    const startTime = Date.now();
    const simulateAudio = () => {
      if (!this.isSpeaking) {
        this.onTtsAudioData(0);
        return;
      }
      
      const elapsed = Date.now() - startTime;
      const baseAmp = 0.3 + Math.sin(elapsed * 0.015) * 0.15;
      const variation = Math.sin(elapsed * 0.067) * 0.1 + Math.sin(elapsed * 0.113) * 0.08;
      const amp = Math.max(0, Math.min(1, baseAmp + variation));
      
      this.onTtsAudioData(amp);
      requestAnimationFrame(simulateAudio);
    };
    simulateAudio();
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
    this.isSpeaking = false;
  }

  pauseSpeaking() {
    if (this.synthesis) {
      this.synthesis.pause();
    }
  }

  resumeSpeaking() {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  isArabic(text) {
    return this.detectLanguage(text).startsWith('ar');
  }

  getArabicVoice() {
    this.initVoices();
    return this.selectedArabicVoice;
  }

  getEnglishVoice() {
    this.initVoices();
    return this.selectedEnglishVoice;
  }

  setOnTtsAudioData(callback) {
    this.onTtsAudioData = callback;
  }
}

export const bilingualSpeechService = new BilingualSpeechService();
export default BilingualSpeechService;
