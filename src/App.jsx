import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';

import ParticleFace from './components/ParticleFace';
import UIOverlay from './components/UIOverlay';
import AudioWave from './components/AudioWave';
import ChatPanel from './components/ChatPanel';
import ApiKeyModal from './components/ApiKeyModal';
import { ambientMusicService } from './services/audio/AmbientMusicService';
import { voiceActivityDetectionService as vadService } from './services/speech/VoiceActivityDetectionService';
import { bilingualSpeechService } from './services/speech/BilingualSpeechService';
import { audioLipSyncService } from './services/lip-sync/AudioLipSyncService';
import { openRouterService } from './services/ai/OpenRouterService';
import { weatherService } from './services/weather/WeatherService';
import { musicPlayerService } from './services/music/MusicPlayerService';

function Scene({ state, audioAmp, glowIntensity }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.7} color="#00e5ff" />
      <pointLight position={[-5, 3, 2]} intensity={0.4} color="#26c6da" />
      <pointLight position={[0, -3, -3]} intensity={0.25} color="#00bcd4" />

      <Grid
        args={[30, 30]}
        position={[0, -2, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="rgba(0, 200, 230, 0.06)"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="rgba(0, 220, 240, 0.09)"
        fadeDistance={25}
        fadeStrength={1.5}
        followCamera={false}
        infiniteGrid={true}
      />

      <ParticleFace
        state={state}
        audioAmp={audioAmp}
        glowIntensity={glowIntensity}
      />
      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2.5}
        maxDistance={10}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
        autoRotate={state === 'THINKING'}
        autoRotateSpeed={state === 'THINKING' ? 1.2 : 0.4}
        enableDamping={true}
        dampingFactor={0.08}
      />
    </>
  );
}

export default function App() {
  const [appState, setAppState] = useState('IDLE');
  const [audioAmp, setAudioAmp] = useState(0);
  const [userAudioAmp, setUserAudioAmp] = useState(0);
  const [glowIntensity, setGlowIntensity] = useState(0);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [detectedLanguage, setDetectedLanguage] = useState('en-US');
  const [transcript, setTranscript] = useState('');
  const [frequencyData, setFrequencyData] = useState(null);
  const [waveformData, setWaveformData] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [showInitScreen, setShowInitScreen] = useState(true);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [lipSyncEnabled, setLipSyncEnabled] = useState(true);
  const [micInputEnabled, setMicInputEnabled] = useState(true);
  const [chatMessages, setChatMessages] = useState([]);
  const [fps, setFps] = useState(60);
  const [particleCount] = useState(25000);
  const [autoStates, setAutoStates] = useState({ breathe: true, blink: 'auto', gaze: 'auto' });

  const appStateRef = useRef('IDLE');
  const thinkingTimeoutRef = useRef(null);
  const speechEndTimeoutRef = useRef(null);
  const transcriptTimeoutRef = useRef(null);
  const fpsFramesRef = useRef(0);
  const fpsLastTimeRef = useRef(performance.now());
  const fpsIntervalRef = useRef(null);
  const userMusicPlayingRef = useRef(false);

  const applyAudioDucking = useCallback(() => {
    const st = appStateRef.current;
    if (userMusicPlayingRef.current) {
      ambientMusicService.duck();
      if (typeof ambientMusicService.setDuckLevel === 'function') {
        ambientMusicService.setDuckLevel(0.05);
      }
      if (st === 'SPEAKING' && typeof musicPlayerService.setVolume === 'function') {
        const base = musicPlayerService._baseVolume ?? 0.7;
        musicPlayerService.setVolume(Math.max(0.18, base * 0.45));
      } else if (typeof musicPlayerService.setVolume === 'function') {
        const stored = musicPlayerService._baseVolume ?? 0.7;
        musicPlayerService.setVolume(stored);
      }
    } else {
      if (typeof ambientMusicService.setDuckLevel === 'function') {
        ambientMusicService.setDuckLevel(0.25);
      }
      if (st === 'LISTENING' || st === 'SPEAKING') {
        ambientMusicService.duck();
      } else {
        ambientMusicService.unduck();
      }
    }
  }, []);

  const setState = useCallback((newState) => {
    appStateRef.current = newState;
    setAppState(newState);
    applyAudioDucking();

    switch (newState) {
      case 'LISTENING':
        setGlowIntensity(1.0);
        break;
      case 'THINKING':
        setGlowIntensity(0.6);
        break;
      case 'SPEAKING':
        setGlowIntensity(0.9);
        break;
      default:
        setGlowIntensity(0.15);
    }
  }, [applyAudioDucking]);

  const addChatMessage = useCallback((role, content, language) => {
    setChatMessages(prev => [
      ...prev,
      { id: Date.now() + Math.random(), role, content, language, timestamp: new Date() }
    ]);
  }, []);

  const handleMusicControlConfirm = useCallback((action, isAr) => {
    const actionMapAr = {
      pause: 'تم إيقاف الموسيقى مؤقتاً.',
      resume: 'تم استئناف الموسيقى.',
      stop: 'تم إيقاف الموسيقى تماماً.',
      next: 'تم تشغيل الأغنية التالية.',
      prev: 'تم تشغيل الأغنية السابقة.',
    };
    const actionMapEn = {
      pause: 'Music paused.',
      resume: 'Music resumed.',
      stop: 'Music stopped completely.',
      next: 'Playing next song.',
      prev: 'Playing previous song.',
    };
    return isAr ? (actionMapAr[action] || 'تم التحكم في الموسيقى.') : (actionMapEn[action] || 'Music control executed.');
  }, []);

  const executeToolCalls = useCallback(async (toolCalls, detectedLang) => {
    const isAr = detectedLang === 'ar';
    const results = [];
    for (const tool of toolCalls) {
      try {
        const name = tool.name;
        const params = tool.parameters || {};
        if (name === 'get_weather') {
          const weatherData = await weatherService.getCurrentWeather(params.city || (isAr ? 'القاهرة' : 'Cairo'), detectedLang);
          const report = weatherService.formatWeatherReport(weatherData, detectedLang);
          results.push({ tool: name, result: report });
        } else if (name === 'play_music') {
          if (params.action && params.action !== 'play') {
            if (params.action === 'pause') musicPlayerService.pause();
            else if (params.action === 'resume') musicPlayerService.resume();
            else if (params.action === 'stop') { musicPlayerService.stop(); userMusicPlayingRef.current = false; }
            else if (params.action === 'next') await musicPlayerService.next();
            else if (params.action === 'prev') await musicPlayerService.previous();
            results.push({ tool: name, result: handleMusicControlConfirm(params.action, isAr) });
          } else {
            const song = await musicPlayerService.playSong(params.query || null);
            userMusicPlayingRef.current = true;
            musicPlayerService._baseVolume = musicPlayerService.getVolume ? musicPlayerService.getVolume() : 0.7;
            applyAudioDucking();
            results.push({ tool: name, result: musicPlayerService.formatSongInfo(song, detectedLang) });
          }
        } else if (name === 'control_music') {
          const a = params.action;
          if (a === 'pause') musicPlayerService.pause();
          else if (a === 'resume') musicPlayerService.resume();
          else if (a === 'stop') { musicPlayerService.stop(); userMusicPlayingRef.current = false; }
          else if (a === 'next') await musicPlayerService.next();
          else if (a === 'prev') await musicPlayerService.previous();
          results.push({ tool: name, result: handleMusicControlConfirm(a, isAr) });
        }
      } catch (e) {
        console.warn('Tool exec error:', tool.name, e);
      }
    }
    return results;
  }, [applyAudioDucking, handleMusicControlConfirm]);

  const generateAIResponse = useCallback(async (userText, language) => {
    const detectedLang = openRouterService.detectLanguage(userText);
    const useLanguage = language.startsWith('ar') || detectedLang === 'ar' ? 'ar-EG' : 'en-US';
    const isAr = useLanguage.startsWith('ar');

    addChatMessage('user', userText, useLanguage);
    setState('THINKING');

    const localIntent = openRouterService.detectIntentLocally(userText, detectedLang);

    if (localIntent.intent === 'weather') {
      try {
        const weatherData = await weatherService.getCurrentWeather(localIntent.city, isAr ? 'ar' : 'en');
        const report = weatherService.formatWeatherReport(weatherData, isAr ? 'ar' : 'en');
        addChatMessage('assistant', report, useLanguage);
        return report;
      } catch (e) {
        console.error('Weather error:', e);
        const fb = openRouterService.getFallbackResponse(userText, detectedLang);
        addChatMessage('assistant', fb, useLanguage);
        return fb;
      }
    }

    if (localIntent.intent === 'play_music') {
      try {
        const song = await musicPlayerService.playSong(localIntent.query || null);
        userMusicPlayingRef.current = true;
        musicPlayerService._baseVolume = 0.7;
        applyAudioDucking();
        const spoken = musicPlayerService.formatSongInfo(song, isAr ? 'ar' : 'en');
        addChatMessage('assistant', spoken, useLanguage);
        return spoken;
      } catch (e) {
        console.error('Music play error:', e);
        const fb = openRouterService.getFallbackResponse(userText, detectedLang);
        addChatMessage('assistant', fb, useLanguage);
        return fb;
      }
    }

    if (localIntent.intent === 'control_music') {
      try {
        const a = localIntent.action;
        if (a === 'pause') musicPlayerService.pause();
        else if (a === 'resume') musicPlayerService.resume();
        else if (a === 'stop') { musicPlayerService.stop(); userMusicPlayingRef.current = false; applyAudioDucking(); }
        else if (a === 'next') await musicPlayerService.next();
        else if (a === 'prev') await musicPlayerService.previous();
        const confirm = handleMusicControlConfirm(a, isAr);
        addChatMessage('assistant', confirm, useLanguage);
        return confirm;
      } catch (e) {
        console.error('Music control error:', e);
        const fb = openRouterService.getFallbackResponse(userText, detectedLang);
        addChatMessage('assistant', fb, useLanguage);
        return fb;
      }
    }

    try {
      const response = await openRouterService.chat(userText, { language: detectedLang });
      const toolCalls = openRouterService.parseToolCallsFromText(response);
      let finalText = openRouterService.stripToolCalls(response);

      if (toolCalls.length > 0) {
        const toolResults = await executeToolCalls(toolCalls, detectedLang);
        if (toolResults.length > 0) {
          const primaryResult = toolResults[0].result;
          if (primaryResult) finalText = primaryResult;
        }
      }

      addChatMessage('assistant', finalText, useLanguage);
      return finalText;
    } catch (err) {
      console.error('AI Response error:', err);
      const fallback = openRouterService.getFallbackResponse(userText, detectedLang);
      addChatMessage('assistant', fallback, useLanguage);
      return fallback;
    }
  }, [setState, addChatMessage, applyAudioDucking, executeToolCalls, handleMusicControlConfirm]);

  const handleSpeakResponse = useCallback((responseText, language) => {
    setState('SPEAKING');

    const startTime = Date.now();
    let audioAnimFrame;

    const simulateLipSync = () => {
      if (appStateRef.current !== 'SPEAKING') return;

      const elapsed = Date.now() - startTime;
      const base = 0.35 + Math.sin(elapsed * 0.018) * 0.2;
      const var1 = Math.sin(elapsed * 0.072) * 0.15;
      const var2 = Math.sin(elapsed * 0.043) * 0.1;
      const amp = lipSyncEnabled ? Math.max(0, Math.min(1, base + var1 + var2)) : 0;

      setAudioAmp(amp);
      audioAnimFrame = requestAnimationFrame(simulateLipSync);
    };
    simulateLipSync();

    bilingualSpeechService.setOnTtsAudioData((amp) => {
      if (lipSyncEnabled) {
        setAudioAmp(amp);
      }
    });

    bilingualSpeechService.speak(
      responseText,
      language,
      () => {
        console.log('TTS started');
      },
      () => {
        if (audioAnimFrame) cancelAnimationFrame(audioAnimFrame);
        setAudioAmp(0);

        setTimeout(() => {
          if (appStateRef.current === 'SPEAKING') {
            setState('IDLE');
          }
        }, 400);
      }
    );
  }, [setState, lipSyncEnabled]);

  const processUserSpeech = useCallback(async (text, language) => {
    if (thinkingTimeoutRef.current) {
      clearTimeout(thinkingTimeoutRef.current);
      thinkingTimeoutRef.current = null;
    }

    setState('THINKING');

    try {
      const response = await generateAIResponse(text, language);
      const responseLang = openRouterService.detectLanguage(response) === 'ar' ? 'ar-EG' : 'en-US';
      handleSpeakResponse(response, responseLang);
    } catch (e) {
      console.error('Process speech error:', e);
      setState('IDLE');
    }
  }, [setState, generateAIResponse, handleSpeakResponse]);

  const processTextMessage = useCallback(async (text) => {
    if (!text.trim()) return;
    const language = openRouterService.detectLanguage(text);
    try {
      const response = await generateAIResponse(text, language === 'ar' ? 'ar-EG' : 'en-US');
      const responseLang = openRouterService.detectLanguage(response) === 'ar' ? 'ar-EG' : 'en-US';
      handleSpeakResponse(response, responseLang);
    } catch (e) {
      console.error('Text message error:', e);
      setState('IDLE');
    }
  }, [generateAIResponse, handleSpeakResponse, setState]);

  const initializeApp = useCallback(async () => {
    try {
      openRouterService.init();
      setHasApiKey(openRouterService.hasApiKey());

      await ambientMusicService.init();
      ambientMusicService.start();
      setMusicEnabled(ambientMusicService.getMusicEnabled());

      await musicPlayerService.init(
        ambientMusicService.getAudioContext ? ambientMusicService.getAudioContext() : null,
        ambientMusicService.getMasterGain ? ambientMusicService.getMasterGain() : null
      );
      musicPlayerService.onSongEnd = () => {
        userMusicPlayingRef.current = false;
        applyAudioDucking();
      };
      musicPlayerService.onPlayStateChange = (st) => {
        if (st?.playing === false) {
          userMusicPlayingRef.current = false;
        } else if (st?.playing === true) {
          userMusicPlayingRef.current = true;
        }
        applyAudioDucking();
      };
      musicPlayerService._baseVolume = 0.7;

      if (micInputEnabled) {
        try {
          await vadService.init(ambientMusicService.getAudioContext());

          vadService.onSpeechStart = () => {
            if (appStateRef.current === 'IDLE' || appStateRef.current === 'LISTENING') {
              setState('LISTENING');
              if (speechEndTimeoutRef.current) {
                clearTimeout(speechEndTimeoutRef.current);
                speechEndTimeoutRef.current = null;
              }
            }
          };

          vadService.onSpeechEnd = () => {
            if (appStateRef.current === 'LISTENING') {
              speechEndTimeoutRef.current = setTimeout(() => {
                if (appStateRef.current === 'LISTENING') {
                  setTranscript(prev => {
                    const currentText = prev || '';
                    if (currentText.trim().length > 1) {
                      processUserSpeech(currentText.trim(), detectedLanguage);
                    } else {
                      setState('IDLE');
                    }
                    return prev;
                  });
                }
              }, 700);
            }
          };

          vadService.onAudioLevel = (vol, freq, combined) => {
            const scaledVol = Math.min(1, vol * 12);
            setUserAudioAmp(scaledVol);

            if (appStateRef.current === 'LISTENING') {
              setAudioAmp(scaledVol * 0.6);
            }
          };

          vadService.onWaveform = (wf, fd, vol) => {
            setWaveformData(new Uint8Array(wf));
            setFrequencyData(new Uint8Array(fd));
          };

          vadService.start();

          const recognitionInited = bilingualSpeechService.initRecognition(true, true);

          if (recognitionInited) {
            bilingualSpeechService.onLanguageDetected = (lang) => {
              setDetectedLanguage(lang);
            };

            bilingualSpeechService.onResult = (text, lang, isFinal) => {
              setTranscript(text);

              if (transcriptTimeoutRef.current) {
                clearTimeout(transcriptTimeoutRef.current);
              }

              transcriptTimeoutRef.current = setTimeout(() => {
                setTranscript('');
              }, 8000);

              if (isFinal && text.trim().length > 1) {
                setTimeout(() => {
                  if (appStateRef.current === 'LISTENING' || appStateRef.current === 'IDLE') {
                    processUserSpeech(text.trim(), lang);
                  }
                }, 300);
              }
            };

            setTimeout(() => {
              bilingualSpeechService.startRecognition(detectedLanguage);
            }, 500);
          }

          audioLipSyncService.init(ambientMusicService.getAudioContext());
          audioLipSyncService.connectToGainNode(ambientMusicService.getMasterGain());
        } catch (micErr) {
          console.warn('Mic/VAD init skipped:', micErr);
        }
      }

      fpsIntervalRef.current = setInterval(() => {
        const now = performance.now();
        const delta = (now - fpsLastTimeRef.current) / 1000;
        if (delta > 0) {
          const currentFps = Math.round(fpsFramesRef.current / delta);
          setFps(Math.min(60, currentFps));
        }
        fpsFramesRef.current = 0;
        fpsLastTimeRef.current = now;
      }, 1000);

      setIsInitialized(true);
      setShowInitScreen(false);
      setState('IDLE');

    } catch (err) {
      console.error('Initialization error:', err);
      alert(
        'Failed to initialize. Please allow microphone access.\n\n' +
        'فشل التهيئة. يرجى السماح بالوصول إلى الميكروفون.'
      );
      setShowInitScreen(false);
      setIsInitialized(true);
      setState('IDLE');
    }
  }, [setState, processUserSpeech, detectedLanguage, micInputEnabled]);

  useEffect(() => {
    let animFrame;
    const fpsTick = () => {
      fpsFramesRef.current++;
      animFrame = requestAnimationFrame(fpsTick);
    };
    fpsTick();
    return () => cancelAnimationFrame(animFrame);
  }, []);

  const handleToggleMusic = useCallback(() => {
    const enabled = ambientMusicService.toggleMusic();
    setMusicEnabled(enabled);
  }, []);

  const handleToggleLipSync = useCallback(() => {
    setLipSyncEnabled(prev => !prev);
  }, []);

  const handleToggleMic = useCallback(() => {
    setMicInputEnabled(prev => {
      const newVal = !prev;
      if (newVal && isInitialized) {
        vadService.start();
        bilingualSpeechService.startRecognition(detectedLanguage);
      } else {
        vadService.stop();
        bilingualSpeechService.stopRecognition();
      }
      return newVal;
    });
  }, [isInitialized, detectedLanguage]);

  const handleSaveApiKey = useCallback((key) => {
    openRouterService.setApiKey(key);
    setHasApiKey(!!key);
    setShowApiKeyModal(false);
  }, []);

  useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
      if (speechEndTimeoutRef.current) clearTimeout(speechEndTimeoutRef.current);
      if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current);
      vadService.destroy();
      audioLipSyncService.disconnect();
      bilingualSpeechService.stopSpeaking();
      bilingualSpeechService.stopRecognition();
      try { musicPlayerService.stop(); } catch (e) {}
      ambientMusicService.stop();
    };
  }, []);

  const visualizerAmp = appState === 'LISTENING'
    ? userAudioAmp
    : appState === 'SPEAKING'
    ? audioAmp
    : 0.05 + userAudioAmp * 0.3;

  const isArabic = detectedLanguage.startsWith('ar');

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: `radial-gradient(ellipse at 50% 40%, 
        ${appState === 'LISTENING' ? '#07252f' : 
          appState === 'THINKING' ? '#0c1a2e' :
          appState === 'SPEAKING' ? '#0c1e2a' : '#061522'} 0%, 
        #040e18 55%, 
        #02070d 100%)`,
      transition: 'background 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", -apple-system, Arial, sans-serif',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(0, 229, 255, 0.08) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(0, 188, 212, 0.07) 0%, transparent 50%),
          radial-gradient(circle at 50% 55%, rgba(0, 220, 240, 0.04) 0%, transparent 70%)
        `,
        pointerEvents: 'none',
      }} />

      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 45, near: 0.1, far: 100 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.25,
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <fog attach="fog" args={['#02070d', 6, 18]} />
        <Scene
          state={appState}
          audioAmp={audioAmp}
          glowIntensity={glowIntensity}
        />
      </Canvas>

      <UIOverlay
        state={appState}
        musicEnabled={musicEnabled}
        onToggleMusic={handleToggleMusic}
        detectedLanguage={detectedLanguage}
        transcript={transcript}
        lipSyncEnabled={lipSyncEnabled}
        onToggleLipSync={handleToggleLipSync}
        micInputEnabled={micInputEnabled}
        onToggleMic={handleToggleMic}
        fps={fps}
        particleCount={particleCount}
        autoStates={autoStates}
        hasApiKey={hasApiKey}
        onOpenApiKey={() => setShowApiKeyModal(true)}
        onOpenChat={() => {}}
      />

      <AudioWave
        amplitude={visualizerAmp}
        frequencyData={frequencyData}
        waveformData={waveformData}
        isActive={isInitialized}
        state={appState}
      />

      <ChatPanel
        messages={chatMessages}
        onSendMessage={processTextMessage}
        isSpeaking={appState === 'SPEAKING'}
        isThinking={appState === 'THINKING'}
        isListening={appState === 'LISTENING'}
        transcript={transcript}
        isArabic={isArabic}
      />

      {showApiKeyModal && (
        <ApiKeyModal
          currentKey={openRouterService.getApiKey()}
          onSave={handleSaveApiKey}
          onClose={() => setShowApiKeyModal(false)}
        />
      )}

      {showInitScreen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'radial-gradient(ellipse at center, rgba(6, 15, 30, 0.97) 0%, rgba(2, 5, 10, 0.99) 100%)',
          backdropFilter: 'blur(24px)',
        }}>
          <div style={{
            maxWidth: '620px',
            width: '90%',
            padding: '56px 48px',
            borderRadius: '20px',
            background: 'linear-gradient(145deg, rgba(10, 20, 38, 0.9), rgba(6, 12, 24, 0.95))',
            border: '1px solid rgba(0, 229, 255, 0.2)',
            boxShadow: '0 0 120px rgba(0, 229, 255, 0.12), 0 30px 90px rgba(0,0,0,0.6)',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: '-50%',
              left: '-50%',
              width: '200%',
              height: '200%',
              background: 'conic-gradient(from 0deg, transparent, rgba(0, 229, 255, 0.05), transparent, rgba(64, 156, 255, 0.05), transparent)',
              animation: 'spin 20s linear infinite',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{
                fontSize: '56px',
                marginBottom: '8px',
                filter: 'drop-shadow(0 0 30px rgba(0, 229, 255, 0.4))',
              }}>
                🌌
              </div>
              <h1 style={{
                margin: 0,
                fontSize: 'clamp(36px, 6vw, 56px)',
                fontWeight: 800,
                letterSpacing: '6px',
                background: 'linear-gradient(135deg, #00e5ff 0%, #40c4ff 30%, #26c6da 60%, #00bcd4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 40px rgba(0, 229, 255, 0.35))',
              }}>
                AVATARI
              </h1>
              <div style={{
                fontSize: '12px',
                fontWeight: 500,
                color: 'rgba(0, 200, 255, 0.55)',
                letterSpacing: '4px',
                marginTop: '-4px',
                marginBottom: '28px',
              }}>
                . IO / HUMMUS
              </div>
              <h2 style={{
                margin: '0 0 32px',
                fontSize: 'clamp(22px, 3.4vw, 34px)',
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#e8f6ff',
              }}>
                YOUR REAL-TIME PARTICLE
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #00e5ff, #b478ff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>AVATAR</span> — NO GLB REQUIRED
              </h2>
              <p style={{
                margin: '0 0 12px',
                fontSize: '15px',
                color: 'rgba(170, 200, 230, 0.75)',
                lineHeight: 1.7,
                fontWeight: 400,
              }}>
                Build High-Quality, Dynamic 3D Avatars Procedurally using Three.js,
              </p>
              <p style={{
                margin: '0 0 40px',
                fontSize: '15px',
                color: 'rgba(170, 200, 230, 0.75)',
                lineHeight: 1.7,
                fontWeight: 400,
              }}>
                React Three Fiber, ShaderMaterial, and Web Audio API.
              </p>
              <div style={{
                display: 'flex',
                gap: '14px',
                justifyContent: 'center',
                flexWrap: 'wrap',
                marginBottom: '32px',
              }}>
                <button
                  onClick={initializeApp}
                  style={{
                    padding: '16px 52px',
                    fontSize: '15px',
                    fontWeight: 700,
                    letterSpacing: '2px',
                    color: '#00141a',
                    background: 'linear-gradient(135deg, #00e5ff 0%, #00b8d4 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    boxShadow: '0 0 50px rgba(0, 229, 255, 0.4), 0 10px 30px rgba(0, 229, 255, 0.3)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    outline: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.03)';
                    e.currentTarget.style.boxShadow = '0 0 70px rgba(0, 229, 255, 0.55), 0 14px 45px rgba(0, 229, 255, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 0 50px rgba(0, 229, 255, 0.4), 0 10px 30px rgba(0, 229, 255, 0.3)';
                  }}
                >
                  🚀  GET STARTED
                </button>
              </div>
              <p style={{
                margin: 0,
                fontSize: '11px',
                color: 'rgba(140, 170, 210, 0.5)',
                letterSpacing: '1.2px',
              }}>
                🎤 Microphone access recommended · الوصول إلى الميكروفون مستحسن
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
