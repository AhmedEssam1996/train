import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

import ParticleFace from './components/ParticleFace';
import UIOverlay from './components/UIOverlay';
import AudioWave from './components/AudioWave';
import { ambientMusicService } from './services/audio/AmbientMusicService';
import { voiceActivityDetectionService as vadService } from './services/speech/VoiceActivityDetectionService';
import { bilingualSpeechService } from './services/speech/BilingualSpeechService';
import { audioLipSyncService } from './services/lip-sync/AudioLipSyncService';

function Scene({ state, audioAmp, glowIntensity }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#00ffc8" />
      <pointLight position={[-5, 3, 2]} intensity={0.3} color="#b478ff" />
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
        minPolarAngle={Math.PI * 0.3}
        maxPolarAngle={Math.PI * 0.7}
        autoRotate={state === 'THINKING'}
        autoRotateSpeed={state === 'THINKING' ? 1.5 : 0.5}
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

  const appStateRef = useRef('IDLE');
  const thinkingTimeoutRef = useRef(null);
  const speechEndTimeoutRef = useRef(null);
  const transcriptTimeoutRef = useRef(null);

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

  const generateAIResponse = useCallback((userText, language) => {
    const isArabic = language.startsWith('ar');
    
    const responses = isArabic ? [
      `أهلاً بك! أنا حمصة، كيف يمكنني مساعدتك اليوم؟`,
      `سؤال رائع! اسمي حمصة وأنا هنا للدردشة معك.`,
      `أنا أحب التحدث مع الناس! أخبرني المزيد عن نفسك.`,
      `هذا مثير للاهتمام. هل يمكنك إخبارني المزيد؟`,
      `فهمتك تماماً. شكراً لمشاركتك هذه الأفكار معي.`,
      `أنا دائماً هنا للاستماع. ما الذي يدور في بالك؟`,
      `سعيد جداً لسماع ذلك! كيف كان يومك؟`,
      `أجابة ممتازة! هل هناك شيء آخر تريد مناقشته؟`,
    ] : [
      `Hi there! I'm Hummus. How can I help you today?`,
      `Great question! I'm Hummus and I'm here to chat.`,
      `I love talking with people! Tell me more about yourself.`,
      `That's interesting. Can you tell me more?`,
      `I completely understand. Thanks for sharing that with me.`,
      `I'm always here to listen. What's on your mind?`,
      `Wonderful to hear! How has your day been?`,
      `Excellent! Is there anything else you'd like to discuss?`,
    ];

    const personalResponses = [];
    const lowerText = userText.toLowerCase();
    
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('مرحبا') || lowerText.includes('أهلا')) {
      personalResponses.push(isArabic 
        ? `أهلاً وسهلاً بك! أنا حمصة، مساعدتك الافتراضية. كيف يمكنني أن أكون في خدمتك اليوم؟`
        : `Hello and welcome! I'm Hummus, your virtual assistant. How can I be of service today?`
      );
    }
    if (lowerText.includes('name') || lowerText.includes('اسمك') || lowerText.includes('من أنت')) {
      personalResponses.push(isArabic
        ? `اسمي حمصة، وأنا مساعد ذكاء اصطناعي ثنائي اللغة. تم تصميمي لأحدث معك باللغتين العربية والإنجليزية!`
        : `My name is Hummus, and I'm a bilingual AI assistant. I'm designed to chat with you in both Arabic and English!`
      );
    }
    if (lowerText.includes('how are you') || lowerText.includes('كيف حالك')) {
      personalResponses.push(isArabic
        ? `أنا بخير شكراً لك! وأنت؟ كيف حالك اليوم؟`
        : `I'm doing great, thank you! And you? How are you doing today?`
      );
    }
    if (lowerText.includes('thank') || lowerText.includes('شكر')) {
      personalResponses.push(isArabic
        ? `عفواً! أنا هنا دائماً لمساعدتك في أي وقت.`
        : `You're welcome! I'm always here to help you anytime.`
      );
    }
    if (lowerText.includes('bye') || lowerText.includes('goodbye') || lowerText.includes('وداعا')) {
      personalResponses.push(isArabic
        ? `وداعاً! كنت سعيدة جداً بالدردشة معك. أراك قريباً!`
        : `Goodbye! It was lovely chatting with you. See you soon!`
      );
    }

    if (personalResponses.length > 0) {
      return personalResponses[Math.floor(Math.random() * personalResponses.length)];
    }

    if (userText.length < 10) {
      return responses[0];
    }

    return responses[Math.floor(Math.random() * responses.length)];
  }, []);

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
      const amp = Math.max(0, Math.min(1, base + var1 + var2));
      
      setAudioAmp(amp);
      audioAnimFrame = requestAnimationFrame(simulateLipSync);
    };
    simulateLipSync();

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
  }, [setState]);

  const processUserSpeech = useCallback((text, language) => {
    setState('THINKING');

    const thinkingTime = 1200 + Math.random() * 1400;

    thinkingTimeoutRef.current = setTimeout(() => {
      const response = generateAIResponse(text, language);
      handleSpeakResponse(response, language);
    }, thinkingTime);
  }, [setState, generateAIResponse, handleSpeakResponse]);

  const initializeApp = useCallback(async () => {
    try {
      await ambientMusicService.init();
      ambientMusicService.start();
      setMusicEnabled(ambientMusicService.getMusicEnabled());

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
              const currentText = transcript || '';
              if (currentText.trim().length > 1) {
                processUserSpeech(currentText.trim(), detectedLanguage);
              } else {
                setState('IDLE');
              }
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
        };

        setTimeout(() => {
          bilingualSpeechService.startRecognition(detectedLanguage);
        }, 500);
      }

      audioLipSyncService.init(ambientMusicService.getAudioContext());
      audioLipSyncService.connectToGainNode(ambientMusicService.getMasterGain());

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
  }, [setState, processUserSpeech, detectedLanguage, transcript]);

  const handleToggleMusic = useCallback(() => {
    const enabled = ambientMusicService.toggleMusic();
    setMusicEnabled(enabled);
  }, []);

  useEffect(() => {
    return () => {
      if (thinkingTimeoutRef.current) clearTimeout(thinkingTimeoutRef.current);
      if (speechEndTimeoutRef.current) clearTimeout(speechEndTimeoutRef.current);
      if (transcriptTimeoutRef.current) clearTimeout(transcriptTimeoutRef.current);
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

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: `radial-gradient(ellipse at 50% 40%, 
        ${appState === 'LISTENING' ? '#0a1f2a' : 
          appState === 'THINKING' ? '#1a0f2a' :
          appState === 'SPEAKING' ? '#2a1f10' : '#0a0f1a'} 0%, 
        #05080f 50%, 
        #000000 100%)`,
      transition: 'background 1.2s ease',
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `
          radial-gradient(circle at 20% 80%, rgba(0, 255, 200, 0.06) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, rgba(180, 120, 255, 0.05) 0%, transparent 50%),
          radial-gradient(circle at 50% 50%, rgba(100, 160, 255, 0.04) 0%, transparent 60%)
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
          toneMappingExposure: 1.2,
        }}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      >
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
      />

      <AudioWave
        amplitude={visualizerAmp}
        frequencyData={frequencyData}
        waveformData={waveformData}
        isActive={isInitialized}
        state={appState}
      />

      {showInitScreen && (
        <div style={{
          position: 'absolute',
          inset: 0,
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(5, 8, 15, 0.95)',
          backdropFilter: 'blur(20px)',
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
        }}>
          <div style={{
            maxWidth: '520px',
            padding: '48px',
            borderRadius: '24px',
            background: 'rgba(15, 22, 40, 0.85)',
            border: '1px solid rgba(0, 255, 200, 0.25)',
            boxShadow: '0 0 80px rgba(0, 255, 200, 0.15), 0 25px 100px rgba(0,0,0,0.5)',
            textAlign: 'center',
          }}>
            <h1 style={{
              margin: 0,
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 800,
              letterSpacing: '4px',
              background: `linear-gradient(135deg, #00ffc8 0%, #00a8ff 40%, #b478ff 70%, #ffc850 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              filter: 'drop-shadow(0 0 30px rgba(0, 255, 200, 0.3))',
            }}>
              HUMMUS
            </h1>
            <h2 style={{
              margin: '8px 0 32px',
              fontSize: 'clamp(20px, 3vw, 32px)',
              fontWeight: 600,
              color: 'rgba(0, 255, 200, 0.8)',
              fontFamily: '"Noto Sans Arabic", "Amiri", Arial, sans-serif',
            }}>
              حمصة
            </h2>
            <p style={{
              margin: '0 0 16px',
              fontSize: 'clamp(13px, 1.4vw, 15px)',
              color: 'rgba(180, 210, 240, 0.7)',
              lineHeight: 1.7,
              fontWeight: 400,
            }}>
              Welcome to Hummus — your hands-free, bilingual 3D AI Avatar.
            </p>
            <p style={{
              margin: '0 0 32px',
              fontSize: 'clamp(12px, 1.2vw, 14px)',
              color: 'rgba(160, 190, 220, 0.5)',
              lineHeight: 1.7,
              direction: 'rtl',
              fontFamily: '"Noto Sans Arabic", "Amiri", Arial, sans-serif',
            }}>
              مرحباً بك في حمصة - مساعدك الذكي ثلاثي الأبعاد ثنائي اللغة بدون الحاجة إلى النقر.
            </p>
            <button
              onClick={initializeApp}
              style={{
                padding: '16px 48px',
                fontSize: 'clamp(14px, 1.5vw, 16px)',
                fontWeight: 700,
                letterSpacing: '2px',
                color: '#000',
                background: 'linear-gradient(135deg, #00ffc8 0%, #00a8ff 100%)',
                border: 'none',
                borderRadius: '50px',
                cursor: 'pointer',
                boxShadow: '0 0 40px rgba(0, 255, 200, 0.4), 0 8px 30px rgba(0, 255, 200, 0.25)',
                transition: 'all 0.3s ease',
                outline: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = '0 0 60px rgba(0, 255, 200, 0.55), 0 12px 40px rgba(0, 255, 200, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 0 40px rgba(0, 255, 200, 0.4), 0 8px 30px rgba(0, 255, 200, 0.25)';
              }}
            >
              START / ابدأ
            </button>
            <p style={{
              margin: '20px 0 0',
              fontSize: '11px',
              color: 'rgba(140, 170, 200, 0.4)',
              letterSpacing: '1px',
            }}>
              🎤 Microphone access required | الوصول إلى الميكروفون مطلوب
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
