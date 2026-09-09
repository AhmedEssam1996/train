class AmbientMusicService {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.duckGain = null;
    this.oscillators = [];
    this.lfoNodes = [];
    this.isPlaying = false;
    this.isInitialized = false;
    this.targetDuckLevel = 1.0;
    this.currentDuckLevel = 1.0;
    this.fadeTime = 0.3;
    this.animationId = null;
    this.musicEnabled = true;
  }

  init() {
    if (this.isInitialized) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.5;
        this.masterGain.connect(this.audioContext.destination);
        
        this.duckGain = this.audioContext.createGain();
        this.duckGain.gain.value = 1.0;
        this.duckGain.connect(this.masterGain);
        
        this.musicGain = this.audioContext.createGain();
        this.musicGain.gain.value = 0.0;
        this.musicGain.connect(this.duckGain);
        
        this.isInitialized = true;
        resolve();
      } catch (e) {
        reject(e);
      }
    });
  }

  createAmbientSynth() {
    const now = this.audioContext.currentTime;
    
    const padOsc1 = this.audioContext.createOscillator();
    padOsc1.type = 'sine';
    padOsc1.frequency.value = 110;
    
    const padOsc2 = this.audioContext.createOscillator();
    padOsc2.type = 'sine';
    padOsc2.frequency.value = 164.81;
    
    const padOsc3 = this.audioContext.createOscillator();
    padOsc3.type = 'triangle';
    padOsc3.frequency.value = 220;
    
    const padOsc4 = this.audioContext.createOscillator();
    padOsc4.type = 'sine';
    padOsc4.frequency.value = 277.18;
    
    const padGain1 = this.audioContext.createGain();
    padGain1.gain.value = 0.0;
    padGain1.gain.linearRampToValueAtTime(0.15, now + 2.0);
    
    const padGain2 = this.audioContext.createGain();
    padGain2.gain.value = 0.0;
    padGain2.gain.linearRampToValueAtTime(0.12, now + 2.5);
    
    const padGain3 = this.audioContext.createGain();
    padGain3.gain.value = 0.0;
    padGain3.gain.linearRampToValueAtTime(0.08, now + 3.0);
    
    const padGain4 = this.audioContext.createGain();
    padGain4.gain.value = 0.0;
    padGain4.gain.linearRampToValueAtTime(0.06, now + 3.5);
    
    const lfo1 = this.audioContext.createOscillator();
    lfo1.frequency.value = 0.08;
    const lfoGain1 = this.audioContext.createGain();
    lfoGain1.gain.value = 0.03;
    lfo1.connect(lfoGain1);
    lfoGain1.connect(padGain1.gain);
    
    const lfo2 = this.audioContext.createOscillator();
    lfo2.frequency.value = 0.12;
    const lfoGain2 = this.audioContext.createGain();
    lfoGain2.gain.value = 0.025;
    lfo2.connect(lfoGain2);
    lfoGain2.connect(padGain2.gain);
    
    const lfo3 = this.audioContext.createOscillator();
    lfo3.frequency.value = 0.06;
    const lfoGain3 = this.audioContext.createGain();
    lfoGain3.gain.value = 0.02;
    lfo3.connect(lfoGain3);
    lfoGain3.connect(padGain3.gain);
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    filter.Q.value = 0.5;
    
    const filterLfo = this.audioContext.createOscillator();
    filterLfo.frequency.value = 0.04;
    const filterLfoGain = this.audioContext.createGain();
    filterLfoGain.gain.value = 400;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    
    const reverb = this.audioContext.createConvolver();
    const reverbLength = 2 * this.audioContext.sampleRate;
    const impulse = this.audioContext.createBuffer(2, reverbLength, this.audioContext.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < reverbLength; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / reverbLength, 2.5);
      }
    }
    reverb.buffer = impulse;
    
    const reverbWet = this.audioContext.createGain();
    reverbWet.gain.value = 0.3;
    
    const reverbDry = this.audioContext.createGain();
    reverbDry.gain.value = 0.7;
    
    padOsc1.connect(padGain1);
    padOsc2.connect(padGain2);
    padOsc3.connect(padGain3);
    padOsc4.connect(padGain4);
    
    padGain1.connect(filter);
    padGain2.connect(filter);
    padGain3.connect(filter);
    padGain4.connect(filter);
    
    filter.connect(reverbDry);
    filter.connect(reverb);
    reverb.connect(reverbWet);
    
    reverbDry.connect(this.musicGain);
    reverbWet.connect(this.musicGain);
    
    padOsc1.start(now);
    padOsc2.start(now);
    padOsc3.start(now);
    padOsc4.start(now);
    lfo1.start(now);
    lfo2.start(now);
    lfo3.start(now);
    filterLfo.start(now);
    
    this.oscillators.push(padOsc1, padOsc2, padOsc3, padOsc4, lfo1, lfo2, lfo3, filterLfo);
    this.lfoNodes.push(lfo1, lfo2, lfo3, filterLfo);
    
    this.createArpeggioLayer(now);
    this.createBassLayer(now);
  }

  createArpeggioLayer(now) {
    const arpNotes = [329.63, 440.00, 523.25, 659.25, 523.25, 440.00];
    const arpInterval = 600;
    let noteIndex = 0;
    
    const arpGain = this.audioContext.createGain();
    arpGain.gain.value = 0.0;
    
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.25;
    
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.4;
    
    const delayGain = this.audioContext.createGain();
    delayGain.gain.value = 0.3;
    
    arpGain.connect(delay);
    arpGain.connect(this.musicGain);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayGain);
    delayGain.connect(this.musicGain);
    
    const playArpNote = () => {
      if (!this.isPlaying || !this.musicEnabled) return;
      
      const noteTime = this.audioContext.currentTime;
      const osc = this.audioContext.createOscillator();
      osc.type = 'triangle';
      osc.frequency.value = arpNotes[noteIndex % arpNotes.length];
      
      const noteGain = this.audioContext.createGain();
      noteGain.gain.value = 0.0;
      noteGain.gain.linearRampToValueAtTime(0.06, noteTime + 0.02);
      noteGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);
      
      const oscFilter = this.audioContext.createBiquadFilter();
      oscFilter.type = 'lowpass';
      oscFilter.frequency.value = 2500;
      
      osc.connect(oscFilter);
      oscFilter.connect(noteGain);
      noteGain.connect(arpGain);
      
      osc.start(noteTime);
      osc.stop(noteTime + 0.5);
      
      noteIndex++;
      setTimeout(playArpNote, arpInterval);
    };
    
    setTimeout(playArpNote, 2000);
  }

  createBassLayer(now) {
    const bassOsc = this.audioContext.createOscillator();
    bassOsc.type = 'sine';
    bassOsc.frequency.value = 55;
    
    const bassOsc2 = this.audioContext.createOscillator();
    bassOsc2.type = 'sine';
    bassOsc2.frequency.value = 82.41;
    
    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0.0;
    bassGain.gain.linearRampToValueAtTime(0.18, now + 4.0);
    
    const bassLfo = this.audioContext.createOscillator();
    bassLfo.frequency.value = 0.1;
    const bassLfoGain = this.audioContext.createGain();
    bassLfoGain.gain.value = 0.04;
    bassLfo.connect(bassLfoGain);
    bassLfoGain.connect(bassGain.gain);
    
    bassOsc.connect(bassGain);
    bassOsc2.connect(bassGain);
    bassGain.connect(this.musicGain);
    
    bassOsc.start(now);
    bassOsc2.start(now);
    bassLfo.start(now);
    
    this.oscillators.push(bassOsc, bassOsc2, bassLfo);
  }

  async start() {
    if (!this.isInitialized) {
      await this.init();
    }
    
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    if (this.isPlaying) return;
    
    this.isPlaying = true;
    this.createAmbientSynth();
    this.startDuckAnimation();
    
    if (this.musicEnabled) {
      const now = this.audioContext.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(1.0, now + 2.0);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    if (this.audioContext) {
      const now = this.audioContext.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.0, now + 1.0);
      
      setTimeout(() => {
        this.oscillators.forEach(osc => {
          try { osc.stop(); } catch(e) {}
        });
        this.oscillators = [];
        this.lfoNodes = [];
      }, 1100);
    }
  }

  startDuckAnimation() {
    const animate = () => {
      if (!this.isPlaying) return;
      
      this.currentDuckLevel += (this.targetDuckLevel - this.currentDuckLevel) * 0.05;
      
      if (this.duckGain && this.audioContext) {
        this.duckGain.gain.setTargetAtTime(
          this.currentDuckLevel,
          this.audioContext.currentTime,
          this.fadeTime
        );
      }
      
      this.animationId = requestAnimationFrame(animate);
    };
    animate();
  }

  duck() {
    this.targetDuckLevel = 0.18;
  }

  unduck() {
    this.targetDuckLevel = 1.0;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    
    if (this.audioContext && this.musicGain) {
      const now = this.audioContext.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(
        this.musicEnabled ? 1.0 : 0.0,
        now + 1.0
      );
    }
    
    return this.musicEnabled;
  }

  getMusicEnabled() {
    return this.musicEnabled;
  }

  getAudioContext() {
    return this.audioContext;
  }

  getMasterGain() {
    return this.masterGain;
  }
}

export const ambientMusicService = new AmbientMusicService();
export default AmbientMusicService;
