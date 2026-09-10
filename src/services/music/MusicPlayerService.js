class MusicPlayerService {
  constructor() {
    this.audioContext = null;
    this.masterGain = null;
    this.songGain = null;
    this.currentSourceNodes = [];
    this.currentLfoNodes = [];
    this.currentTimeouts = [];
    this.currentIntervals = [];

    this.isPlaying = false;
    this.isPaused = false;
    this.currentSongIndex = -1;
    this.currentSong = null;
    this.playbackStartTime = 0;
    this.pausedAt = 0;
    this.elapsedBeforePause = 0;
    this.volume = 0.7;
    this.animationId = null;

    this.onSongStart = null;
    this.onSongEnd = null;
    this.onPlayStateChange = null;

    this.songLibrary = this.buildSongLibrary();
  }

  buildSongLibrary() {
    return [
      {
        id: 1, title: 'Calm Sunrise', artist: 'Ambient Dreams', genre: 'ambient', language: 'en',
        keywords: ['calm', 'sunrise', 'relax', 'ambient', 'peaceful', 'هادئ', 'استرخاء', 'شروق'],
        tempo: 72, mood: 'relaxing', scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
        baseNote: 130.81, duration: 180
      },
      {
        id: 2, title: 'Electric Dreams', artist: 'SynthWave', genre: 'electronic', language: 'en',
        keywords: ['electronic', 'synth', 'dance', 'party', 'upbeat', 'dance', 'رقص', 'موسيقى', 'حفلة'],
        tempo: 124, mood: 'energetic', scale: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00, 493.88],
        baseNote: 110.00, duration: 200
      },
      {
        id: 3, title: 'Neel Waraq', artist: 'Oriental Vibes', genre: 'arabic', language: 'ar',
        keywords: ['arabic', 'oriental', 'نيل', 'وراق', 'مصرى', 'عربي', 'تراب', 'كلاسيكى', 'موسيقى عربية'],
        tempo: 96, mood: 'melodic', scale: [261.63, 277.18, 311.13, 349.23, 392.00, 415.30, 466.16, 523.25],
        baseNote: 130.81, duration: 190
      },
      {
        id: 4, title: 'Midnight Jazz', artist: 'Blue Note Trio', genre: 'jazz', language: 'en',
        keywords: ['jazz', 'blues', 'smooth', 'cafe', 'مطعم', 'جاز', 'بليز', 'سلس'],
        tempo: 88, mood: 'chill', scale: [233.08, 261.63, 293.66, 311.13, 349.23, 392.00, 440.00, 466.16],
        baseNote: 116.54, duration: 210
      },
      {
        id: 5, title: 'Classic Serenade', artist: 'Royal Strings', genre: 'classical', language: 'en',
        keywords: ['classical', 'piano', 'strings', 'symphony', 'كلاسيكى', 'بيانو', 'موسيقى كلاسيكية'],
        tempo: 76, mood: 'elegant', scale: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25],
        baseNote: 130.81, duration: 220
      },
      {
        id: 6, title: 'Pop Rhythm', artist: 'Top Charts', genre: 'pop', language: 'en',
        keywords: ['pop', 'rhythm', 'happy', 'fun', 'بوب', 'سعيد', 'مرح', 'أغنية'],
        tempo: 112, mood: 'happy', scale: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
        baseNote: 130.81, duration: 195
      },
      {
        id: 7, title: 'Rock Anthem', artist: 'Thunder Band', genre: 'rock', language: 'en',
        keywords: ['rock', 'guitar', 'anthem', 'power', 'روك', 'جيتار', 'قوى'],
        tempo: 132, mood: 'powerful', scale: [220.00, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00],
        baseNote: 110.00, duration: 205
      },
      {
        id: 8, title: 'El Leila El Kebira', artist: 'Oriental Magic', genre: 'arabic', language: 'ar',
        keywords: ['ليلة كبيرة', 'ليلة', 'كبيرة', 'عيد', 'موسيقى عربية', 'شرقى', 'مصرى', 'تراث'],
        tempo: 104, mood: 'festive', scale: [261.63, 277.18, 311.13, 349.23, 392.00, 415.30, 466.16],
        baseNote: 146.83, duration: 200
      }
    ];
  }

  init(existingAudioContext = null, existingMasterGain = null) {
    if (this.audioContext) return Promise.resolve();
    return new Promise((resolve) => {
      this.audioContext = existingAudioContext || new (window.AudioContext || window.webkitAudioContext)();
      this.masterGain = existingMasterGain || this.audioContext.createGain();
      if (!existingMasterGain) {
        this.masterGain.connect(this.audioContext.destination);
      }
      this.songGain = this.audioContext.createGain();
      this.songGain.gain.value = 0;
      this.songGain.connect(this.masterGain);
      resolve();
    });
  }

  searchSong(query = '') {
    if (!query) return this.songLibrary;
    const q = query.toLowerCase().trim();
    if (!q) return this.songLibrary;
    return this.songLibrary.filter(song => {
      const haystack = [
        song.title, song.artist, song.genre, song.language,
        ...(song.keywords || [])
      ].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }

  findBestMatch(query) {
    const matches = this.searchSong(query);
    if (matches.length === 0) return null;
    const q = query.toLowerCase().trim();
    let best = matches[0];
    let bestScore = 0;
    for (const song of matches) {
      let score = 0;
      if (song.title.toLowerCase().includes(q)) score += 10;
      if (song.artist.toLowerCase().includes(q)) score += 8;
      if (song.genre.toLowerCase().includes(q)) score += 6;
      for (const kw of song.keywords) {
        if (q.includes(kw.toLowerCase()) || kw.toLowerCase().includes(q)) score += 4;
      }
      if (score > bestScore) {
        bestScore = score;
        best = song;
      }
    }
    return best;
  }

  getLibrary() { return this.songLibrary; }
  getCurrentSong() { return this.currentSong; }
  getIsPlaying() { return this.isPlaying; }
  getIsPaused() { return this.isPaused; }

  setVolume(v) {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.songGain && this.audioContext) {
      this.songGain.gain.setTargetAtTime(this.isPlaying && !this.isPaused ? this.volume : 0, this.audioContext.currentTime, 0.1);
    }
  }
  getVolume() { return this.volume; }

  stopAllInternal() {
    this.currentTimeouts.forEach(t => clearTimeout(t));
    this.currentTimeouts = [];
    this.currentIntervals.forEach(t => clearInterval(t));
    this.currentIntervals = [];
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    for (const node of this.currentSourceNodes) {
      try { node.stop && node.stop(); } catch (e) {}
      try { node.disconnect && node.disconnect(); } catch (e) {}
    }
    this.currentSourceNodes = [];
    for (const lfo of this.currentLfoNodes) {
      try { lfo.stop && lfo.stop(); } catch (e) {}
      try { lfo.disconnect && lfo.disconnect(); } catch (e) {}
    }
    this.currentLfoNodes = [];
  }

  async playSong(songOrQuery = null) {
    await this.init();
    if (this.audioContext.state === 'suspended') await this.audioContext.resume();
    this.stopAllInternal();

    let song;
    if (songOrQuery && typeof songOrQuery === 'object') {
      song = songOrQuery;
    } else if (songOrQuery && typeof songOrQuery === 'string') {
      song = this.findBestMatch(songOrQuery) || this.songLibrary[0];
    } else {
      song = this.songLibrary[(this.currentSongIndex + 1 + this.songLibrary.length) % this.songLibrary.length];
    }
    this.currentSong = song;
    this.currentSongIndex = this.songLibrary.findIndex(s => s.id === song.id);
    if (this.currentSongIndex === -1) this.currentSongIndex = 0;

    this.isPlaying = true;
    this.isPaused = false;
    this.playbackStartTime = this.audioContext.currentTime;
    this.elapsedBeforePause = 0;

    const now = this.audioContext.currentTime;
    this.songGain.gain.cancelScheduledValues(now);
    this.songGain.gain.setValueAtTime(0, now);
    this.songGain.gain.linearRampToValueAtTime(this.volume, now + 2.5);

    this.scheduleSong(song, now);
    this.startPlaybackTracker(song);
    if (this.onSongStart) this.onSongStart(song);
    if (this.onPlayStateChange) this.onPlayStateChange({ playing: true, paused: false, song });
    return song;
  }

  scheduleSong(song, startTime) {
    const { tempo, scale, baseNote, genre, id } = song;
    const beatDur = 60 / tempo;
    const ctx = this.audioContext;

    const reverb = this.createSimpleReverb();
    reverb.output.connect(this.songGain);

    const melodyFilter = ctx.createBiquadFilter();
    melodyFilter.type = 'lowpass';
    melodyFilter.frequency.value = genre === 'electronic' || genre === 'pop' ? 3800 : 4800;
    melodyFilter.Q.value = 0.6;
    melodyFilter.connect(this.songGain);
    melodyFilter.connect(reverb.input);

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = 420;
    bassFilter.connect(this.songGain);

    const padFilter = ctx.createBiquadFilter();
    padFilter.type = 'lowpass';
    padFilter.frequency.value = 1400;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.0;
    padGain.gain.linearRampToValueAtTime(0.22, startTime + 5);
    padFilter.connect(padGain);
    padGain.connect(this.songGain);
    padGain.connect(reverb.input);

    const chordProgression = this.getChordProgression(scale, genre);
    const notesPerChord = Math.max(2, Math.floor(8 / (beatDur > 0.6 ? 1 : 1.3)));

    for (let bar = 0; bar < 60; bar++) {
      const chordIdx = bar % chordProgression.length;
      const chord = chordProgression[chordIdx];
      const barStart = startTime + bar * beatDur * 4;

      this.playPadChord(chord, padFilter, beatDur * 4 * 1.02, barStart, genre);
      this.playBassNote(chord[0] / 2, bassFilter, beatDur * 4, barStart, genre);

      for (let i = 0; i < 16; i++) {
        const t = barStart + i * (beatDur / 2);
        const noteIdx = (i * 3 + bar * 2 + (genre === 'rock' ? 1 : 0)) % scale.length;
        const octaveShift = (i % 8 === 0) ? 2 : (i % 4 === 0 ? 1.5 : 1);
        const velocity = genre === 'rock' ? 0.32 : (genre === 'jazz' ? 0.18 : 0.24);
        const noteDur = beatDur * (genre === 'classical' ? 0.55 : 0.32) * (i % 2 === 0 ? 1.2 : 0.8);
        const noteFreq = scale[noteIdx] * octaveShift;
        this.playMelodyNote(noteFreq, melodyFilter, noteDur, t, velocity, genre, i);
      }

      for (let i = 0; i < 16; i++) {
        const t = barStart + i * (beatDur / 4);
        if (genre === 'electronic' || genre === 'pop' || genre === 'rock') {
          if (i % 4 === 0) this.playKick(t, bassFilter, beatDur, genre);
          if (i % 4 === 2) this.playSnare(t, melodyFilter, genre);
          if (i % 2 === 1 || genre === 'electronic') this.playHat(t, melodyFilter, genre);
        } else if (genre === 'arabic') {
          if (i % 2 === 0) this.playDarbuka(t, melodyFilter, i);
        } else if (genre === 'jazz') {
          if (i % 4 === 2) this.playSnare(t, melodyFilter, genre, 0.5);
          if (i % 2 === 1) this.playHat(t, melodyFilter, genre, 0.5);
        }
      }
    }
  }

  createSimpleReverb() {
    const ctx = this.audioContext;
    const input = ctx.createGain();
    const output = ctx.createGain();
    output.gain.value = 0.35;
    const delay1 = ctx.createDelay(); delay1.delayTime.value = 0.18;
    const delay2 = ctx.createDelay(); delay2.delayTime.value = 0.32;
    const delay3 = ctx.createDelay(); delay3.delayTime.value = 0.47;
    const delayGain = ctx.createGain(); delayGain.gain.value = 0.35;
    input.connect(delay1); input.connect(delay2); input.connect(delay3);
    delay1.connect(delayGain); delay2.connect(delayGain); delay3.connect(delayGain);
    delayGain.connect(output);
    return { input, output };
  }

  getChordProgression(scale, genre) {
    if (genre === 'arabic') {
      return [
        [scale[0], scale[2], scale[4]],
        [scale[3], scale[5], scale[7 % scale.length]],
        [scale[4], scale[6], scale[1] * 2],
        [scale[0], scale[2], scale[4]]
      ];
    }
    if (genre === 'jazz' || genre === 'classical') {
      return [
        [scale[0], scale[2], scale[4], scale[6]],
        [scale[3], scale[5], scale[7 % scale.length], scale[2] * 2],
        [scale[4], scale[6], scale[1] * 2, scale[3] * 2],
        [scale[0] / 2, scale[2] / 2, scale[4] / 2, scale[6] / 2]
      ];
    }
    return [
      [scale[0], scale[2], scale[4]],
      [scale[5] / 2, scale[0], scale[2]],
      [scale[3], scale[5], scale[0] * 2],
      [scale[4], scale[6], scale[1] * 2]
    ];
  }

  playMelodyNote(freq, destination, duration, when, velocity = 0.25, genre = 'pop', stepIdx = 0) {
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const type = genre === 'rock' ? 'sawtooth' : genre === 'jazz' ? 'triangle' : genre === 'electronic' ? 'square' : 'sine';
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = (Math.random() - 0.5) * 6;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = freq * 2;
    osc2.detune.value = (Math.random() - 0.5) * 8;
    const g2 = ctx.createGain();
    g2.gain.value = velocity * 0.25;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(velocity, when + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
    g2.gain.setValueAtTime(0, when);
    g2.gain.linearRampToValueAtTime(velocity * 0.25, when + 0.015);
    g2.gain.exponentialRampToValueAtTime(0.001, when + duration * 0.7);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = (genre === 'rock' ? 2400 : 3800) + Math.sin(stepIdx) * 400;
    filter.Q.value = 0.8;

    osc.connect(filter); osc2.connect(g2); g2.connect(filter); filter.connect(gain); gain.connect(destination);
    osc.start(when); osc.stop(when + duration + 0.05);
    osc2.start(when); osc2.stop(when + duration + 0.05);
    this.currentSourceNodes.push(osc, osc2);
  }

  playBassNote(freq, destination, duration, when, genre = 'pop') {
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    osc.type = genre === 'rock' ? 'sawtooth' : 'sine';
    osc.frequency.value = freq;
    const gain = ctx.createGain();
    const target = genre === 'electronic' || genre === 'rock' ? 0.38 : 0.28;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(target, when + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, when + duration * 0.92);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.value = 280; filter.Q.value = 1.5;
    osc.connect(filter); filter.connect(gain); gain.connect(destination);
    osc.start(when); osc.stop(when + duration);
    this.currentSourceNodes.push(osc);
  }

  playPadChord(notes, destination, duration, when, genre) {
    const ctx = this.audioContext;
    notes.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.value = f * (idx % 3 === 0 ? 1 : 2);
      osc.detune.value = (idx - 1) * 5 + (Math.random() - 0.5) * 3;
      const gain = ctx.createGain();
      const velocity = genre === 'ambient' || genre === 'classical' ? 0.24 : 0.18;
      gain.gain.setValueAtTime(0, when);
      gain.gain.linearRampToValueAtTime(velocity / notes.length, when + duration * 0.2);
      gain.gain.linearRampToValueAtTime(velocity / notes.length * 0.9, when + duration * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, when + duration);
      osc.connect(gain); gain.connect(destination);
      osc.start(when); osc.stop(when + duration + 0.1);
      this.currentSourceNodes.push(osc);
    });
  }

  playKick(when, destination, beatDur, genre) {
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const startF = genre === 'electronic' ? 140 : 120;
    osc.frequency.setValueAtTime(startF, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(0.7, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.28);
    osc.connect(gain); gain.connect(destination);
    osc.start(when); osc.stop(when + 0.3);
    this.currentSourceNodes.push(osc);
  }

  playSnare(when, destination, genre = 'pop', volMul = 1) {
    const ctx = this.audioContext;
    const bufferSize = Math.floor(ctx.sampleRate * 0.2);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 1200; filter.Q.value = 1.2;
    const gain = ctx.createGain();
    const target = (genre === 'rock' ? 0.32 : 0.22) * volMul;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(target, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.18);
    noise.connect(filter); filter.connect(gain); gain.connect(destination);
    noise.start(when); noise.stop(when + 0.2);
    this.currentSourceNodes.push(noise);
  }

  playHat(when, destination, genre = 'pop', volMul = 1) {
    const ctx = this.audioContext;
    const bufferSize = Math.floor(ctx.sampleRate * 0.05);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1);
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass'; filter.frequency.value = 5500;
    const gain = ctx.createGain();
    const target = (genre === 'electronic' ? 0.1 : 0.07) * volMul;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(target, when + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, when + 0.055);
    noise.connect(filter); filter.connect(gain); gain.connect(destination);
    noise.start(when); noise.stop(when + 0.06);
    this.currentSourceNodes.push(noise);
  }

  playDarbuka(when, destination, stepIdx = 0) {
    const ctx = this.audioContext;
    const isTak = stepIdx % 2 === 0;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    const freq = isTak ? 600 : 220;
    osc.frequency.setValueAtTime(freq, when);
    osc.frequency.exponentialRampToValueAtTime(isTak ? 180 : 120, when + (isTak ? 0.08 : 0.18));
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(isTak ? 0.3 : 0.38, when + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.001, when + (isTak ? 0.12 : 0.25));
    osc.connect(gain); gain.connect(destination);
    osc.start(when); osc.stop(when + 0.26);
    this.currentSourceNodes.push(osc);
  }

  startPlaybackTracker(song) {
    const total = song.duration;
    const animate = () => {
      if (!this.isPlaying) return;
      const now = this.audioContext.currentTime;
      const elapsed = this.elapsedBeforePause + (now - this.playbackStartTime);
      if (elapsed >= total) {
        this.next();
        return;
      }
      this.animationId = requestAnimationFrame(animate);
    };
    this.animationId = requestAnimationFrame(animate);
  }

  pause() {
    if (!this.isPlaying || this.isPaused) return;
    if (this.audioContext) {
      const now = this.audioContext.currentTime;
      this.elapsedBeforePause += now - this.playbackStartTime;
      this.songGain.gain.cancelScheduledValues(now);
      this.songGain.gain.setValueAtTime(this.songGain.gain.value, now);
      this.songGain.gain.linearRampToValueAtTime(0, now + 0.3);
    }
    this.isPaused = true;
    if (this.animationId) cancelAnimationFrame(this.animationId);
    this.animationId = null;
    if (this.onPlayStateChange) this.onPlayStateChange({ playing: true, paused: true, song: this.currentSong });
  }

  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    const now = this.audioContext.currentTime;
    this.playbackStartTime = now;
    this.songGain.gain.cancelScheduledValues(now);
    this.songGain.gain.setValueAtTime(this.songGain.gain.value, now);
    this.songGain.gain.linearRampToValueAtTime(this.volume, now + 0.4);
    this.isPaused = false;
    this.startPlaybackTracker(this.currentSong);
    if (this.onPlayStateChange) this.onPlayStateChange({ playing: true, paused: false, song: this.currentSong });
  }

  togglePlayPause() {
    if (!this.isPlaying || !this.currentSong) {
      return this.playSong();
    }
    if (this.isPaused) this.resume(); else this.pause();
    return this.currentSong;
  }

  stop() {
    if (this.audioContext && this.songGain) {
      const now = this.audioContext.currentTime;
      this.songGain.gain.cancelScheduledValues(now);
      this.songGain.gain.setValueAtTime(this.songGain.gain.value, now);
      this.songGain.gain.linearRampToValueAtTime(0, now + 0.6);
    }
    const endedSong = this.currentSong;
    setTimeout(() => this.stopAllInternal(), 650);
    this.isPlaying = false;
    this.isPaused = false;
    this.currentSong = null;
    this.elapsedBeforePause = 0;
    if (this.onSongEnd) this.onSongEnd(endedSong);
    if (this.onPlayStateChange) this.onPlayStateChange({ playing: false, paused: false, song: null });
  }

  next() {
    if (this.songLibrary.length === 0) return null;
    const nextIdx = (this.currentSongIndex + 1) % this.songLibrary.length;
    return this.playSong(this.songLibrary[nextIdx]);
  }

  previous() {
    if (this.songLibrary.length === 0) return null;
    const prevIdx = (this.currentSongIndex - 1 + this.songLibrary.length) % this.songLibrary.length;
    return this.playSong(this.songLibrary[prevIdx]);
  }

  formatSongInfo(song, language = 'en') {
    if (!song) return '';
    const isAr = language === 'ar';
    if (isAr) {
      const genreMap = {
        ambient: 'أمبينت هادئة', electronic: 'إلكترونيك', arabic: 'عربي/شرقي',
        jazz: 'جاز', classical: 'كلاسيكى', pop: 'بوب', rock: 'روك'
      };
      return `🎵 تم تشغيل: "${song.title}" - الفنان: ${song.artist} · النوع: ${genreMap[song.genre] || song.genre}`;
    }
    return `🎵 Now playing: "${song.title}" by ${song.artist} · Genre: ${song.genre}`;
  }
}

export const musicPlayerService = new MusicPlayerService();
export default MusicPlayerService;
