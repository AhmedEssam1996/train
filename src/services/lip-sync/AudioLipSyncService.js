class AudioLipSyncService {
  constructor() {
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.frequencyData = null;
    this.smoothedAmplitude = 0;
    this.smoothedFrequency = 0;
    this.currentAudioAmp = 0;
    this.animationId = null;
    this.isActive = false;
    this.onAmplitudeUpdate = null;
    this.onFrequencyUpdate = null;
    this.onWaveformUpdate = null;
    this.externalStream = null;
    this.mediaStreamDestination = null;
  }

  init(audioContext) {
    this.audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.7;
    
    this.dataArray = new Uint8Array(this.analyser.fftSize);
    this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
    
    this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();
    
    return this;
  }

  connectToAudioElement(audioElement) {
    if (!this.audioContext) this.init();
    
    if (this.source) {
      try { this.source.disconnect(); } catch(e) {}
    }
    
    this.source = this.audioContext.createMediaElementSource(audioElement);
    this.source.connect(this.analyser);
    this.analyser.connect(this.audioContext.destination);
    this.analyser.connect(this.mediaStreamDestination);
    
    this.startAnalysis();
    
    return this.mediaStreamDestination.stream;
  }

  connectToStream(mediaStream) {
    if (!this.audioContext) this.init();
    
    if (this.source) {
      try { this.source.disconnect(); } catch(e) {}
    }
    
    this.externalStream = mediaStream;
    this.source = this.audioContext.createMediaStreamSource(mediaStream);
    this.source.connect(this.analyser);
    
    this.startAnalysis();
    return this;
  }

  connectToSourceNode(sourceNode) {
    if (!this.audioContext) this.init();
    
    if (this.source) {
      try { this.source.disconnect(); } catch(e) {}
    }
    
    sourceNode.connect(this.analyser);
    this.startAnalysis();
    return this;
  }

  connectToGainNode(gainNode) {
    if (!this.audioContext) this.init();
    gainNode.connect(this.analyser);
    this.startAnalysis();
    return this;
  }

  startAnalysis() {
    if (this.isActive) return;
    this.isActive = true;
    
    const analyze = () => {
      if (!this.isActive || !this.analyser) return;
      
      this.analyser.getByteTimeDomainData(this.dataArray);
      this.analyser.getByteFrequencyData(this.frequencyData);
      
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        const v = (this.dataArray[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / this.dataArray.length);
      const rawAmplitude = Math.min(rms * 2.5, 1.0);
      
      const alpha = 0.15;
      this.smoothedAmplitude = this.smoothedAmplitude * (1 - alpha) + rawAmplitude * alpha;
      this.currentAudioAmp = Math.pow(this.smoothedAmplitude, 0.85);
      
      const lowFreqStart = 2;
      const lowFreqEnd = 40;
      let lowFreqSum = 0;
      for (let i = lowFreqStart; i < lowFreqEnd && i < this.frequencyData.length; i++) {
        lowFreqSum += this.frequencyData[i];
      }
      const lowFreqAvg = lowFreqSum / (lowFreqEnd - lowFreqStart) / 255;
      
      const highFreqStart = 40;
      const highFreqEnd = 200;
      let highFreqSum = 0;
      for (let i = highFreqStart; i < highFreqEnd && i < this.frequencyData.length; i++) {
        highFreqSum += this.frequencyData[i];
      }
      const highFreqAvg = highFreqSum / (highFreqEnd - highFreqStart) / 255;
      
      const freqWeighted = lowFreqAvg * 0.6 + highFreqAvg * 0.4;
      this.smoothedFrequency = this.smoothedFrequency * (1 - alpha) + freqWeighted * alpha;
      
      if (this.onAmplitudeUpdate) {
        this.onAmplitudeUpdate(this.currentAudioAmp, this.smoothedAmplitude);
      }
      
      if (this.onFrequencyUpdate) {
        this.onFrequencyUpdate(this.smoothedFrequency, lowFreqAvg, highFreqAvg);
      }
      
      if (this.onWaveformUpdate) {
        this.onWaveformUpdate(this.dataArray, this.frequencyData, this.currentAudioAmp);
      }
      
      this.animationId = requestAnimationFrame(analyze);
    };
    
    analyze();
  }

  stopAnalysis() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.currentAudioAmp = 0;
    this.smoothedAmplitude = 0;
    this.smoothedFrequency = 0;
  }

  getAudioAmp() {
    return this.currentAudioAmp;
  }

  getSmoothedAmplitude() {
    return this.smoothedAmplitude;
  }

  getFrequencyData() {
    return this.frequencyData;
  }

  getWaveformData() {
    return this.dataArray;
  }

  getMediaStreamDestination() {
    return this.mediaStreamDestination;
  }

  disconnect() {
    this.stopAnalysis();
    if (this.source) {
      try {
        this.source.disconnect();
        this.analyser.disconnect();
      } catch(e) {}
      this.source = null;
    }
    this.externalStream = null;
  }

  setOnAmplitudeUpdate(callback) {
    this.onAmplitudeUpdate = callback;
  }

  setOnFrequencyUpdate(callback) {
    this.onFrequencyUpdate = callback;
  }

  setOnWaveformUpdate(callback) {
    this.onWaveformUpdate = callback;
  }
}

export const audioLipSyncService = new AudioLipSyncService();
export default AudioLipSyncService;
