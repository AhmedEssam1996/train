class VoiceActivityDetectionService {
  constructor() {
    this.audioContext = null;
    this.mediaStream = null;
    this.source = null;
    this.analyser = null;
    this.dataArray = null;
    this.frequencyData = null;
    this.isRunning = false;
    this.animationId = null;
    
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onAudioLevel = null;
    this.onWaveform = null;
    
    this.volumeThreshold = 0.025;
    this.frequencyThreshold = 0.15;
    this.speechStartFrames = 5;
    this.speechEndFrames = 25;
    
    this.currentSpeechFrames = 0;
    this.currentSilenceFrames = 0;
    this.isSpeechDetected = false;
    this.smoothedVolume = 0;
    this.smoothedFreqEnergy = 0;
    
    this.processingLoop = null;
  }

  async init(audioContext) {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        },
        video: false
      });
      
      this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;
      this.analyser.smoothingTimeConstant = 0.4;
      
      this.source.connect(this.analyser);
      
      this.dataArray = new Uint8Array(this.analyser.fftSize);
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      
      return true;
    } catch (e) {
      console.error('VAD Initialization Error:', e);
      throw e;
    }
  }

  start() {
    if (this.isRunning || !this.analyser) return;
    
    this.isRunning = true;
    this.currentSpeechFrames = 0;
    this.currentSilenceFrames = 0;
    this.isSpeechDetected = false;
    this.smoothedVolume = 0;
    this.smoothedFreqEnergy = 0;
    
    this.processLoop();
  }

  stop() {
    this.isRunning = false;
    if (this.processingLoop) {
      cancelAnimationFrame(this.processingLoop);
      this.processingLoop = null;
    }
    this.isSpeechDetected = false;
    this.currentSpeechFrames = 0;
    this.currentSilenceFrames = 0;
  }

  processLoop = () => {
    if (!this.isRunning) return;
    
    this.analyser.getByteTimeDomainData(this.dataArray);
    this.analyser.getByteFrequencyData(this.frequencyData);
    
    let sumSquares = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128;
      sumSquares += normalized * normalized;
    }
    const rms = Math.sqrt(sumSquares / this.dataArray.length);
    
    const speechBandStart = Math.floor(80 * this.analyser.fftSize / this.audioContext.sampleRate);
    const speechBandEnd = Math.floor(3500 * this.analyser.fftSize / this.audioContext.sampleRate);
    
    let freqEnergySum = 0;
    let freqCount = 0;
    for (let i = speechBandStart; i < speechBandEnd && i < this.frequencyData.length; i++) {
      freqEnergySum += this.frequencyData[i] / 255;
      freqCount++;
    }
    const freqEnergy = freqCount > 0 ? freqEnergySum / freqCount : 0;
    
    const volAlpha = 0.1;
    this.smoothedVolume = this.smoothedVolume * (1 - volAlpha) + rms * volAlpha;
    
    const freqAlpha = 0.12;
    this.smoothedFreqEnergy = this.smoothedFreqEnergy * (1 - freqAlpha) + freqEnergy * freqAlpha;
    
    const volumeTriggered = this.smoothedVolume > this.volumeThreshold;
    const freqTriggered = this.smoothedFreqEnergy > this.frequencyThreshold;
    const combinedScore = (this.smoothedVolume / this.volumeThreshold) * 0.4 + 
                          (this.smoothedFreqEnergy / this.frequencyThreshold) * 0.6;
    const isSpeechFrame = combinedScore > 0.7;
    
    if (isSpeechFrame) {
      this.currentSpeechFrames++;
      this.currentSilenceFrames = 0;
      
      if (!this.isSpeechDetected && this.currentSpeechFrames >= this.speechStartFrames) {
        this.isSpeechDetected = true;
        if (this.onSpeechStart) {
          this.onSpeechStart();
        }
      }
    } else {
      this.currentSilenceFrames++;
      this.currentSpeechFrames = Math.max(0, this.currentSpeechFrames - 1);
      
      if (this.isSpeechDetected && this.currentSilenceFrames >= this.speechEndFrames) {
        this.isSpeechDetected = false;
        if (this.onSpeechEnd) {
          this.onSpeechEnd();
        }
      }
    }
    
    if (this.onAudioLevel) {
      this.onAudioLevel(this.smoothedVolume, this.smoothedFreqEnergy, combinedScore);
    }
    
    if (this.onWaveform) {
      this.onWaveform(this.dataArray, this.frequencyData, this.smoothedVolume);
    }
    
    this.processingLoop = requestAnimationFrame(this.processLoop);
  };

  isSpeaking() {
    return this.isSpeechDetected;
  }

  getVolume() {
    return this.smoothedVolume;
  }

  getFrequencyEnergy() {
    return this.smoothedFreqEnergy;
  }

  getAnalyser() {
    return this.analyser;
  }

  getMediaStream() {
    return this.mediaStream;
  }

  getAudioContext() {
    return this.audioContext;
  }

  setThresholds(volumeThreshold, frequencyThreshold) {
    if (volumeThreshold !== undefined) this.volumeThreshold = volumeThreshold;
    if (frequencyThreshold !== undefined) this.frequencyThreshold = frequencyThreshold;
  }

  setFrameCounts(startFrames, endFrames) {
    if (startFrames !== undefined) this.speechStartFrames = startFrames;
    if (endFrames !== undefined) this.speechEndFrames = endFrames;
  }

  destroy() {
    this.stop();
    
    if (this.source) {
      try { this.source.disconnect(); } catch(e) {}
      this.source = null;
    }
    if (this.analyser) {
      try { this.analyser.disconnect(); } catch(e) {}
      this.analyser = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.onSpeechStart = null;
    this.onSpeechEnd = null;
    this.onAudioLevel = null;
    this.onWaveform = null;
  }
}

export const voiceActivityDetectionService = new VoiceActivityDetectionService();
export default VoiceActivityDetectionService;
