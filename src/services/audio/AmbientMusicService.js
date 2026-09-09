class AmbientMusicService {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.musicGain = null;
    this.duckGain = null;
    this.oscillators = [];
    this.lfoNodes = [];
    this.timeouts = [];
    this.isPlaying = false;
    this.isInitialized = false;
    this.targetDuckLevel = 1.0;
    this.currentDuckLevel = 1.0;
    this.fadeTime = 0.3;
    this.animationId = null;
    this.musicEnabled = true;
    this.chordIndex = 0;
    this.chordIntervalId = null;
    this.shimmerNodes = [];
  }

  init() {
    if (this.isInitialized) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      try {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.55;
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

  createImpulseResponse(durationSeconds, decay, sampleRate) {
    const length = sampleRate * durationSeconds;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);
    
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      const phaseOffset = channel === 0 ? 0 : Math.PI * 0.25;
      for (let i = 0; i < length; i++) {
        const t = i / length;
        const envelope = Math.pow(1 - t, decay);
        const early = i < sampleRate * 0.08 ? Math.cos(i / (sampleRate * 0.08) * Math.PI * 0.5) : 0;
        const random = (Math.random() * 2 - 1);
        const modulated = random * (1 + Math.sin(i * 0.013 + phaseOffset) * 0.15);
        channelData[i] = modulated * envelope * (0.35 + early * 0.65);
      }
    }
    return impulse;
  }

  createChordProgression() {
    return [
      [110.00, 138.59, 164.81, 220.00, 261.63],
      [98.00, 130.81, 164.81, 196.00, 246.94],
      [123.47, 155.56, 185.00, 246.94, 293.66],
      [103.83, 130.81, 155.56, 207.65, 261.63],
    ];
  }

  createReverbChain() {
    const now = this.audioContext.currentTime;
    
    const preDelay = this.audioContext.createDelay();
    preDelay.delayTime.value = 0.035;
    
    const reverb = this.audioContext.createConvolver();
    reverb.buffer = this.createImpulseResponse(4.5, 2.8, this.audioContext.sampleRate);
    
    const reverbEQ = this.audioContext.createBiquadFilter();
    reverbEQ.type = 'lowpass';
    reverbEQ.frequency.value = 4800;
    reverbEQ.Q.value = 0.4;
    
    const reverbEQ2 = this.audioContext.createBiquadFilter();
    reverbEQ2.type = 'highpass';
    reverbEQ2.frequency.value = 180;
    
    const reverbWet = this.audioContext.createGain();
    reverbWet.gain.value = 0.48;
    
    preDelay.connect(reverb);
    reverb.connect(reverbEQ);
    reverbEQ.connect(reverbEQ2);
    reverbEQ2.connect(reverbWet);
    reverbWet.connect(this.musicGain);
    
    return { preDelay, reverbWet };
  }

  createPadLayer(frequencies, startOffset = 0) {
    const now = this.audioContext.currentTime + startOffset;
    const layerOscs = [];
    const detuneOffsets = [-12, -6, 0, 6, 12];
    const types = ['sine', 'triangle', 'sine'];
    const panPositions = [-0.55, -0.25, 0, 0.25, 0.55];
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1600;
    filter.Q.value = 0.7;
    
    const filter2 = this.audioContext.createBiquadFilter();
    filter2.type = 'highpass';
    filter2.frequency.value = 110;
    
    const dryGain = this.audioContext.createGain();
    dryGain.gain.value = 0.0;
    dryGain.gain.linearRampToValueAtTime(0.42, now + 4.5);
    
    const { preDelay, reverbWet } = this.createReverbChain();
    const reverbSendGain = this.audioContext.createGain();
    reverbSendGain.gain.value = 0.55;
    
    const filterLfo = this.audioContext.createOscillator();
    filterLfo.frequency.value = 0.035;
    const filterLfoGain = this.audioContext.createGain();
    filterLfoGain.gain.value = 550;
    filterLfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);
    filterLfo.start(now);
    this.lfoNodes.push(filterLfo);
    
    frequencies.forEach((freq, fIdx) => {
      const baseGainValue = 0.038 + (fIdx === frequencies.length - 1 ? 0.008 : 0);
      
      detuneOffsets.forEach((detune, dIdx) => {
        const type = types[(fIdx + dIdx) % types.length];
        const osc = this.audioContext.createOscillator();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune + (Math.random() - 0.5) * 3;
        
        const panner = this.audioContext.createStereoPanner();
        const panIdx = (fIdx * 2 + dIdx) % panPositions.length;
        panner.pan.value = panPositions[panIdx];
        
        const noteGain = this.audioContext.createGain();
        noteGain.gain.value = 0.0;
        const target = baseGainValue / Math.sqrt(detuneOffsets.length) * (type === 'triangle' ? 0.7 : 1.0);
        noteGain.gain.linearRampToValueAtTime(target, now + 3.5 + fIdx * 0.3);
        
        const slowLfo = this.audioContext.createOscillator();
        slowLfo.frequency.value = 0.04 + (fIdx * 0.011) + (dIdx * 0.007);
        const slowLfoGain = this.audioContext.createGain();
        slowLfoGain.gain.value = target * 0.32;
        slowLfo.connect(slowLfoGain);
        slowLfoGain.connect(noteGain.gain);
        slowLfo.start(now + fIdx * 0.7);
        this.lfoNodes.push(slowLfo);
        
        const panLfo = this.audioContext.createOscillator();
        panLfo.frequency.value = 0.025 + (dIdx * 0.008);
        const panLfoGain = this.audioContext.createGain();
        panLfoGain.gain.value = 0.18;
        panLfo.connect(panLfoGain);
        panLfoGain.connect(panner.pan);
        panLfo.start(now + dIdx * 0.9);
        this.lfoNodes.push(panLfo);
        
        osc.connect(panner);
        panner.connect(noteGain);
        noteGain.connect(filter);
        osc.start(now);
        this.oscillators.push(osc);
        layerOscs.push(osc);
      });
    });
    
    filter.connect(filter2);
    filter2.connect(dryGain);
    dryGain.connect(this.musicGain);
    filter2.connect(reverbSendGain);
    reverbSendGain.connect(preDelay);
    
    return { layerOscs, dryGain, filter };
  }

  createChorusPad(frequencies, startOffset = 0) {
    const now = this.audioContext.currentTime + startOffset;
    
    const inputMix = this.audioContext.createGain();
    inputMix.gain.value = 0.0;
    inputMix.gain.linearRampToValueAtTime(0.38, now + 5.0);
    
    const chorusDelay1 = this.audioContext.createDelay();
    chorusDelay1.delayTime.value = 0.012;
    const chorusDelay2 = this.audioContext.createDelay();
    chorusDelay2.delayTime.value = 0.017;
    
    const chorusLfo1 = this.audioContext.createOscillator();
    chorusLfo1.frequency.value = 0.11;
    const chorusLfoGain1 = this.audioContext.createGain();
    chorusLfoGain1.gain.value = 0.004;
    chorusLfo1.connect(chorusLfoGain1);
    chorusLfoGain1.connect(chorusDelay1.delayTime);
    chorusLfo1.start(now);
    
    const chorusLfo2 = this.audioContext.createOscillator();
    chorusLfo2.frequency.value = 0.08;
    const chorusLfoGain2 = this.audioContext.createGain();
    chorusLfoGain2.gain.value = 0.005;
    chorusLfo2.connect(chorusLfoGain2);
    chorusLfoGain2.connect(chorusDelay2.delayTime);
    chorusLfo2.start(now);
    this.lfoNodes.push(chorusLfo1, chorusLfo2);
    
    const chorusPan1 = this.audioContext.createStereoPanner();
    chorusPan1.pan.value = -0.5;
    const chorusPan2 = this.audioContext.createStereoPanner();
    chorusPan2.pan.value = 0.5;
    
    const chorusGain1 = this.audioContext.createGain();
    chorusGain1.gain.value = 0.5;
    const chorusGain2 = this.audioContext.createGain();
    chorusGain2.gain.value = 0.5;
    
    inputMix.connect(chorusDelay1);
    inputMix.connect(chorusDelay2);
    chorusDelay1.connect(chorusPan1);
    chorusDelay2.connect(chorusPan2);
    chorusPan1.connect(chorusGain1);
    chorusPan2.connect(chorusGain2);
    
    const outputMix = this.audioContext.createGain();
    outputMix.gain.value = 0.65;
    chorusGain1.connect(outputMix);
    chorusGain2.connect(outputMix);
    inputMix.connect(outputMix);
    
    outputMix.connect(this.musicGain);
    
    const { preDelay } = this.createReverbChain();
    const reverbSend = this.audioContext.createGain();
    reverbSend.gain.value = 0.45;
    outputMix.connect(reverbSend);
    reverbSend.connect(preDelay);
    
    const layerOscs = [];
    frequencies.forEach((freq, fIdx) => {
      [-9, 0, 9].forEach((detune, dIdx) => {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq * 2;
        osc.detune.value = detune + (Math.random() - 0.5) * 2;
        
        const oscFilter = this.audioContext.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.value = 900 + fIdx * 80;
        oscFilter.Q.value = 1.2;
        
        const oscGain = this.audioContext.createGain();
        oscGain.gain.value = 0.0;
        const target = 0.022 / 3 * (1 + Math.sin(fIdx * 0.7) * 0.2);
        oscGain.gain.linearRampToValueAtTime(target, now + 4.0 + fIdx * 0.4);
        
        const ampLfo = this.audioContext.createOscillator();
        ampLfo.frequency.value = 0.05 + fIdx * 0.012;
        const ampLfoGain = this.audioContext.createGain();
        ampLfoGain.gain.value = target * 0.35;
        ampLfo.connect(ampLfoGain);
        ampLfoGain.connect(oscGain.gain);
        ampLfo.start(now + fIdx * 0.5);
        this.lfoNodes.push(ampLfo);
        
        osc.connect(oscFilter);
        oscFilter.connect(oscGain);
        oscGain.connect(inputMix);
        osc.start(now);
        this.oscillators.push(osc);
        layerOscs.push(osc);
      });
    });
    
    return { layerOscs, inputMix };
  }

  createShimmerLayer(startOffset = 0) {
    const now = this.audioContext.currentTime + startOffset;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const shimmerGain = this.audioContext.createGain();
    shimmerGain.gain.value = 0.0;
    shimmerGain.gain.linearRampToValueAtTime(0.16, now + 6.0);
    
    const shimmerFilter = this.audioContext.createBiquadFilter();
    shimmerFilter.type = 'bandpass';
    shimmerFilter.frequency.value = 3500;
    shimmerFilter.Q.value = 0.6;
    
    const { preDelay } = this.createReverbChain();
    const shimmerReverb = this.audioContext.createGain();
    shimmerReverb.gain.value = 0.85;
    
    notes.forEach((note, i) => {
      const playShimmerNote = () => {
        if (!this.isPlaying) return;
        const nt = this.audioContext.currentTime;
        const osc = this.audioContext.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = note * (Math.random() > 0.5 ? 1 : 2);
        osc.detune.value = (Math.random() - 0.5) * 8;
        
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = (Math.random() * 2 - 1) * 0.7;
        
        const noteGain = this.audioContext.createGain();
        noteGain.gain.value = 0.0;
        noteGain.gain.linearRampToValueAtTime(0.04, nt + 0.08);
        noteGain.gain.exponentialRampToValueAtTime(0.001, nt + 4.5);
        
        osc.connect(panner);
        panner.connect(noteGain);
        noteGain.connect(shimmerGain);
        
        osc.start(nt);
        osc.stop(nt + 4.6);
        this.oscillators.push(osc);
        
        const nextDelay = 3500 + Math.random() * 6000;
        const t = setTimeout(playShimmerNote, nextDelay);
        this.timeouts.push(t);
      };
      const initialDelay = (i * 1800) + 1500 + Math.random() * 2500;
      const t = setTimeout(playShimmerNote, initialDelay);
      this.timeouts.push(t);
    });
    
    shimmerGain.connect(shimmerFilter);
    shimmerFilter.connect(this.musicGain);
    shimmerFilter.connect(shimmerReverb);
    shimmerReverb.connect(preDelay);
    
    return shimmerGain;
  }

  createArpeggioLayer(startOffset = 0) {
    const now = this.audioContext.currentTime + startOffset;
    const arpScales = [
      [329.63, 440.00, 523.25, 659.25, 783.99, 659.25, 523.25, 440.00],
      [293.66, 392.00, 493.88, 587.33, 739.99, 587.33, 493.88, 392.00],
      [329.63, 415.30, 493.88, 659.25, 739.99, 659.25, 493.88, 415.30],
      [311.13, 392.00, 466.16, 622.25, 783.99, 622.25, 466.16, 392.00],
    ];
    let noteIndex = 0;
    let scaleIndex = 0;
    
    const arpGain = this.audioContext.createGain();
    arpGain.gain.value = 0.0;
    arpGain.gain.linearRampToValueAtTime(0.28, now + 3.5);
    
    const delay = this.audioContext.createDelay();
    delay.delayTime.value = 0.28;
    
    const feedback = this.audioContext.createGain();
    feedback.gain.value = 0.5;
    
    const delayPan = this.audioContext.createStereoPanner();
    delayPan.pan.value = 0.35;
    
    const delayGain = this.audioContext.createGain();
    delayGain.gain.value = 0.42;
    
    arpGain.connect(delay);
    arpGain.connect(this.musicGain);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(delayPan);
    delayPan.connect(delayGain);
    delayGain.connect(this.musicGain);
    
    const { preDelay } = this.createReverbChain();
    const arpReverb = this.audioContext.createGain();
    arpReverb.gain.value = 0.38;
    arpGain.connect(arpReverb);
    arpReverb.connect(preDelay);
    
    const playArpNote = () => {
      if (!this.isPlaying || !this.musicEnabled) {
        const t = setTimeout(playArpNote, 300);
        this.timeouts.push(t);
        return;
      }
      
      const nt = this.audioContext.currentTime;
      const currentScale = arpScales[scaleIndex % arpScales.length];
      const noteFreq = currentScale[noteIndex % currentScale.length];
      
      [-3, 0, 3].forEach((detune, dIdx) => {
        const osc = this.audioContext.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = noteFreq;
        osc.detune.value = detune;
        
        const oscFilter = this.audioContext.createBiquadFilter();
        oscFilter.type = 'lowpass';
        oscFilter.frequency.value = 3200;
        oscFilter.Q.value = 2.5;
        
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = dIdx === 0 ? 0 : (dIdx === 1 ? -0.25 : 0.25);
        
        const noteGain = this.audioContext.createGain();
        noteGain.gain.value = 0.0;
        noteGain.gain.linearRampToValueAtTime(0.025, nt + 0.015);
        noteGain.gain.exponentialRampToValueAtTime(0.001, nt + 0.55);
        
        const filterAttack = this.audioContext.createGain();
        filterAttack.gain.value = 1200;
        const envOsc = this.audioContext.createOscillator();
        envOsc.frequency.value = 0;
        envOsc.connect(filterAttack);
        filterAttack.connect(oscFilter.frequency);
        envOsc.start(nt);
        envOsc.frequency.setValueAtTime(1, nt);
        envOsc.frequency.exponentialRampToValueAtTime(0.01, nt + 0.2);
        envOsc.stop(nt + 0.21);
        this.oscillators.push(envOsc);
        
        osc.connect(oscFilter);
        oscFilter.connect(panner);
        panner.connect(noteGain);
        noteGain.connect(arpGain);
        
        osc.start(nt);
        osc.stop(nt + 0.6);
        this.oscillators.push(osc);
      });
      
      noteIndex++;
      if (noteIndex % 64 === 0) scaleIndex++;
      
      const t = setTimeout(playArpNote, 260);
      this.timeouts.push(t);
    };
    
    const initialT = setTimeout(playArpNote, 2200 + startOffset * 1000);
    this.timeouts.push(initialT);
    
    return arpGain;
  }

  createBassLayer(startOffset = 0) {
    const now = this.audioContext.currentTime + startOffset;
    const bassNotes = [55.00, 49.00, 61.74, 51.91];
    let bassIndex = 0;
    
    const bassGain = this.audioContext.createGain();
    bassGain.gain.value = 0.0;
    bassGain.gain.linearRampToValueAtTime(0.5, now + 4.5);
    
    const bassFilter = this.audioContext.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 380;
    bassFilter.Q.value = 1.1;
    
    const saturator = this.audioContext.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = (i / 128) - 1;
      curve[i] = Math.tanh(x * 1.6);
    }
    saturator.curve = curve;
    saturator.oversample = '4x';
    
    const subGain = this.audioContext.createGain();
    subGain.gain.value = 0.65;
    
    const playBassNote = () => {
      if (!this.isPlaying) return;
      const nt = this.audioContext.currentTime;
      const freq = bassNotes[bassIndex % bassNotes.length];
      
      [
        { type: 'sine', detune: 0, gainMul: 0.7 },
        { type: 'triangle', detune: -5, gainMul: 0.25 },
        { type: 'sine', detune: 7, gainMul: 0.3 },
      ].forEach((cfg, dIdx) => {
        const osc = this.audioContext.createOscillator();
        osc.type = cfg.type;
        osc.frequency.value = freq;
        osc.detune.value = cfg.detune;
        
        const noteGain = this.audioContext.createGain();
        noteGain.gain.value = 0.0;
        const target = 0.09 * cfg.gainMul;
        noteGain.gain.linearRampToValueAtTime(target, nt + 0.12);
        noteGain.gain.linearRampToValueAtTime(target * 0.92, nt + 3.2);
        noteGain.gain.exponentialRampToValueAtTime(0.001, nt + 3.95);
        
        const panner = this.audioContext.createStereoPanner();
        panner.pan.value = dIdx === 1 ? -0.08 : (dIdx === 2 ? 0.08 : 0);
        
        osc.connect(noteGain);
        noteGain.connect(panner);
        panner.connect(bassFilter);
        
        osc.start(nt);
        osc.stop(nt + 4.0);
        this.oscillators.push(osc);
      });
      
      const subOsc = this.audioContext.createOscillator();
      subOsc.type = 'sine';
      subOsc.frequency.value = freq / 2;
      
      const subNoteGain = this.audioContext.createGain();
      subNoteGain.gain.value = 0.0;
      subNoteGain.gain.linearRampToValueAtTime(0.08, nt + 0.2);
      subNoteGain.gain.linearRampToValueAtTime(0.07, nt + 3.2);
      subNoteGain.gain.exponentialRampToValueAtTime(0.001, nt + 3.95);
      
      subOsc.connect(subNoteGain);
      subNoteGain.connect(subGain);
      subOsc.start(nt);
      subOsc.stop(nt + 4.0);
      this.oscillators.push(subOsc);
      
      bassIndex++;
      const t = setTimeout(playBassNote, 4000);
      this.timeouts.push(t);
    };
    
    bassFilter.connect(saturator);
    saturator.connect(bassGain);
    subGain.connect(bassGain);
    bassGain.connect(this.musicGain);
    
    const { preDelay } = this.createReverbChain();
    const bassReverb = this.audioContext.createGain();
    bassReverb.gain.value = 0.08;
    bassGain.connect(bassReverb);
    bassReverb.connect(preDelay);
    
    const initialT = setTimeout(playBassNote, 3000 + startOffset * 1000);
    this.timeouts.push(initialT);
    
    return bassGain;
  }

  createAmbientSynth() {
    const chords = this.createChordProgression();
    const initialChord = chords[0];
    
    this.createPadLayer(initialChord, 0);
    this.createChorusPad(initialChord, 0.4);
    this.createArpeggioLayer(1.2);
    this.createBassLayer(2.0);
    this.createShimmerLayer(3.5);
    
    this.chordIndex = 0;
    this.chordIntervalId = setInterval(() => {
      if (!this.isPlaying) return;
      this.chordIndex = (this.chordIndex + 1) % chords.length;
      const nextChord = chords[this.chordIndex];
      this.createPadLayer(nextChord, 0.2);
      this.createChorusPad(nextChord, 0.6);
    }, 18000);
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
      this.musicGain.gain.linearRampToValueAtTime(1.0, now + 2.5);
    }
  }

  stop() {
    this.isPlaying = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.chordIntervalId) {
      clearInterval(this.chordIntervalId);
      this.chordIntervalId = null;
    }
    this.timeouts.forEach(t => clearTimeout(t));
    this.timeouts = [];
    
    if (this.audioContext) {
      const now = this.audioContext.currentTime;
      this.musicGain.gain.cancelScheduledValues(now);
      this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, now);
      this.musicGain.gain.linearRampToValueAtTime(0.0, now + 1.2);
      
      setTimeout(() => {
        this.oscillators.forEach(osc => {
          try { osc.stop(); } catch(e) {}
        });
        this.oscillators = [];
        this.lfoNodes = [];
      }, 1300);
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
    this.targetDuckLevel = 0.14;
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
