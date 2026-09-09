import { useMemo } from 'react';

export default function UIOverlay({
  state = 'IDLE',
  musicEnabled = true,
  onToggleMusic,
  detectedLanguage = 'en-US',
  transcript = '',
}) {
  const stateInfo = useMemo(() => {
    switch (state) {
      case 'LISTENING':
        return {
          label: 'LISTENING',
          labelAr: 'يستمع',
          color: '#00ffc8',
          glow: 'rgba(0, 255, 200, 0.6)',
          dot: '🔵',
        };
      case 'THINKING':
        return {
          label: 'THINKING',
          labelAr: 'يفكر',
          color: '#b478ff',
          glow: 'rgba(180, 120, 255, 0.6)',
          dot: '🟣',
        };
      case 'SPEAKING':
        return {
          label: 'SPEAKING',
          labelAr: 'يتحدث',
          color: '#ffc850',
          glow: 'rgba(255, 200, 80, 0.6)',
          dot: '🟡',
        };
      default:
        return {
          label: 'IDLE',
          labelAr: 'ساكن',
          color: '#64a0dc',
          glow: 'rgba(100, 160, 220, 0.5)',
          dot: '⚪',
        };
    }
  }, [state]);

  const isArabic = detectedLanguage.startsWith('ar');

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: '"Segoe UI", "Helvetica Neue", "Noto Sans Arabic", Arial, sans-serif',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: '28px 36px',
        gap: '24px',
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          pointerEvents: 'auto',
        }}>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(18px, 2.4vw, 28px)',
            fontWeight: 700,
            letterSpacing: '3px',
            background: `linear-gradient(135deg, #00ffc8 0%, #00a8ff 40%, #b478ff 70%, #ffc850 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 25px rgba(0, 255, 200, 0.25))',
            lineHeight: 1.2,
          }}>
            HUMMUS
            <span style={{
              margin: '0 10px',
              opacity: 0.5,
              WebkitTextFillColor: 'rgba(255,255,255,0.4)',
            }}>/</span>
            <span style={{ fontFamily: '"Noto Sans Arabic", "Amiri", Arial, sans-serif' }}>
              حمصة
            </span>
          </h1>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}>
            <span style={{
              fontSize: 'clamp(10px, 1vw, 12px)',
              letterSpacing: '2px',
              color: 'rgba(160, 200, 240, 0.5)',
              fontWeight: 400,
            }}>
              BILINGUAL AI
            </span>
            <span style={{
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: stateInfo.color,
              boxShadow: `0 0 8px ${stateInfo.glow}`,
              animation: state === 'IDLE' ? 'none' : 'pulse 1.5s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: 'clamp(9px, 0.9vw, 11px)',
              color: isArabic ? 'rgba(255, 200, 150, 0.6)' : 'rgba(150, 200, 255, 0.6)',
              letterSpacing: '1px',
            }}>
              {isArabic ? 'العربية' : 'ENGLISH'}
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '16px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 18px',
            borderRadius: '50px',
            background: 'rgba(10, 15, 30, 0.75)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${stateInfo.glow}`,
            boxShadow: `0 0 30px ${stateInfo.color}15, inset 0 0 20px ${stateInfo.color}08`,
            pointerEvents: 'auto',
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: stateInfo.color,
              boxShadow: `0 0 10px ${stateInfo.glow}, 0 0 20px ${stateInfo.color}40`,
              animation: state === 'IDLE' ? 'none' : 'blink 1s ease-in-out infinite',
            }} />
            <span style={{
              fontSize: 'clamp(10px, 1.1vw, 13px)',
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: stateInfo.color,
              textShadow: `0 0 10px ${stateInfo.glow}`,
            }}>
              STATE:
            </span>
            <span style={{
              fontSize: 'clamp(10px, 1.1vw, 13px)',
              fontWeight: 700,
              letterSpacing: '2px',
              color: '#ffffff',
            }}>
              {stateInfo.label}
            </span>
            <span style={{
              fontSize: 'clamp(10px, 1.1vw, 13px)',
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              marginLeft: '2px',
            }}>
              ({stateInfo.labelAr})
            </span>
          </div>

          <button
            onClick={onToggleMusic}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              borderRadius: '50px',
              background: musicEnabled 
                ? 'rgba(0, 255, 200, 0.08)' 
                : 'rgba(100, 100, 120, 0.08)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${musicEnabled ? 'rgba(0, 255, 200, 0.35)' : 'rgba(150, 150, 180, 0.2)'}`,
              cursor: 'pointer',
              pointerEvents: 'auto',
              transition: 'all 0.3s ease',
              boxShadow: musicEnabled 
                ? '0 0 20px rgba(0, 255, 200, 0.1), inset 0 0 15px rgba(0, 255, 200, 0.05)' 
                : 'none',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = musicEnabled 
                ? 'rgba(0, 255, 200, 0.15)' 
                : 'rgba(150, 150, 180, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = musicEnabled 
                ? 'rgba(0, 255, 200, 0.08)' 
                : 'rgba(100, 100, 120, 0.08)';
            }}
          >
            <span style={{
              fontSize: '16px',
              filter: musicEnabled ? 'drop-shadow(0 0 5px rgba(0, 255, 200, 0.5))' : 'grayscale(1) opacity(0.5)',
            }}>
              {musicEnabled ? '🎵' : '🔇'}
            </span>
            <span style={{
              fontSize: 'clamp(9px, 1vw, 11px)',
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: musicEnabled ? 'rgba(0, 255, 200, 0.9)' : 'rgba(150, 150, 180, 0.5)',
              transition: 'color 0.3s ease',
            }}>
              MUSIC: {musicEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      {transcript && (
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '80%',
          padding: '12px 24px',
          borderRadius: '16px',
          background: 'rgba(10, 15, 30, 0.6)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(100, 160, 220, 0.2)',
          pointerEvents: 'none',
        }}>
          <p style={{
            margin: 0,
            fontSize: 'clamp(12px, 1.2vw, 16px)',
            color: 'rgba(200, 230, 255, 0.85)',
            textAlign: 'center',
            direction: isArabic ? 'rtl' : 'ltr',
            fontWeight: 400,
            lineHeight: 1.5,
          }}>
            "{transcript}"
          </p>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
