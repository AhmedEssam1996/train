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

function Scene({ state, audioAmp, glowIntensity }) {
  return (
    <>
      <ambientLight intensity={0.25} />
      <pointLight position={[5, 5, 5]} intensity={0.6} color="#00e5ff" />
      <pointLight position={[-5, 3, 2]} intensity={0.35} color="#40c4ff" />
      <pointLight position={[0, -3, -3]} intensity={0.2} color="#00b8d4" />

      <Grid
        args={[30, 30]}
        position={[0, -2, 0]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="rgba(0, 180, 255, 0.08)"
        sectionSize={3}
        sectionThickness={1}
        sectionColor="rgba(0, 200, 255, 0.12)"
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

  const setState = useCallback((newState) => {
    appStateRef.current = newState;
    setAppState(newState);

    if (newState === 'LISTENING' || newState === 'SPEAKING') {
      ambientMusicService.duck();
    } else {
      ambientMusicService.unduck();
    }

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
  }, []);

  const addChatMessage = useCallback((role, content, language) => {
    setChatMessages(prev => [
      ...prev,
      { id: Date.now() + Math.random(), role, content, language, timestamp: new Date() }
    ]);
  }, []);

  const generateAIResponse = useCallback(async (userText, language) => {
    const detectedLang = openRouterService.detectLanguage(userText);
    const useLanguage = language.startsWith('ar') || detectedLang === 'ar' ? 'ar-EG' : 'en-US';

    addChatMessage('user', userText, useLanguage);

    setState('THINKING');

    try {
      const response = await openRouterService.chat(userText, { language: detectedLang });
      addChatMessage('assistant', response, detectedLang === 'ar' ? 'ar-EG' : 'en-US');
      return response;
    } catch (err) {
      console.error('AI Response error:', err);
      const fallback = openRouterService.getFallbackResponse(userText, detectedLang);
      addChatMessage('assistant', fallback, detectedLang === 'ar' ? 'ar-EG' : 'en-US');
      return fallback;
    }
  }, [setState, addChatMessage]);

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
      background: `radial-gradient(ellipse at 50% 35%, 
        ${appState === 'LISTENING' ? '#072029' : 
          appState === 'THINKING' ? '#120a24' :
          appState === 'SPEAKING' ? '#1e1808' : '#06101c'} 0%, 
        #050a15 55%, 
        #02050a 100%)`,
      transition: 'background 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
      fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", -apple-system, Arial, sans-serif',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 18% 82%, rgba(0, 229, 255, 0.07) 0%, transparent 48%),
          radial-gradient(circle at 82% 18%, rgba(64, 156, 255, 0.06) 0%, transparent 48%),
          radial-gradient(circle at 50% 50%, rgba(0, 200, 255, 0.035) 0%, transparent 65%)
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
          toneMappingExposure: 1.3,
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <fog attach="fog" args={['#02050a', 6, 18]} />
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
