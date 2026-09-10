import { useMemo, useRef, useEffect, useState } from 'react';

function ToggleSwitch({ enabled, onChange }) {
  return (
    <div
      onClick={onChange}
      style={{
        width: '34px',
        height: '18px',
        borderRadius: '10px',
        background: enabled
          ? 'linear-gradient(135deg, #00e5ff, #0097a7)'
          : 'rgba(55, 80, 110, 0.5)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: enabled ? '0 0 10px rgba(0, 229, 255, 0.25)' : 'none',
        border: enabled
          ? '1px solid rgba(0, 229, 255, 0.5)'
          : '1px solid rgba(90, 120, 160, 0.3)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: enabled ? '17px' : '2px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        background: enabled ? '#ffffff' : '#a0b4c8',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
      }} />
    </div>
  );
}

function MiniAudioWave({ curState }) {
  const animRef = useRef(null);
  const barsRef = useRef([]);
  const [, forceRender] = useState(0);

  useEffect(() => {
    const tick = () => {
      const bars = 32;
      const arr = [];
      for (let i = 0; i < bars; i++) {
        const base = curState === 'IDLE' ? 6 : 12;
        const noise = Math.abs(Math.sin(Date.now() / 180 + i * 0.45));
        const amp = curState === 'SPEAKING' ? 0.9 : curState === 'LISTENING' ? 0.7 : curState === 'THINKING' ? 0.5 : 0.22;
        arr.push(base + noise * 16 * amp);
      }
      barsRef.current = arr;
      forceRender((x) => x + 1);
      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [curState]);

  const bars = barsRef.current.length > 0 ? barsRef.current : Array(32).fill(8);

  return (
    <div style={{
      width: '100%',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1.5px',
      padding: '2px 0',
    }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: '3px',
          height: `${h}px`,
          minHeight: '2px',
          borderRadius: '1.5px',
          background: `linear-gradient(to top, #007a8c, #00e5ff)`,
          boxShadow: curState !== 'IDLE' ? '0 0 3px rgba(0, 229, 255, 0.35)' : 'none',
          opacity: curState === 'IDLE' ? 0.55 : 0.9,
          transition: 'height 0.08s linear',
        }} />
      ))}
    </div>
  );
}

function PanelBox({ children, extraStyle }) {
  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: '10px',
      background: 'linear-gradient(145deg, rgba(10, 22, 44, 0.72), rgba(6, 14, 30, 0.82))',
      border: '1px solid rgba(0, 180, 230, 0.15)',
      backdropFilter: 'blur(14px)',
      boxShadow: '0 4px 28px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      ...(extraStyle || {}),
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{
      fontSize: '10px',
      fontWeight: 800,
      letterSpacing: '1.8px',
      color: 'rgba(160, 200, 240, 0.9)',
      marginBottom: '10px',
      fontFamily: '"Inter", "Segoe UI", Arial, sans-serif',
      textTransform: 'uppercase',
    }}>
      {children}
    </h3>
  );
}

export default function UIOverlay(props) {
  const {
    state = 'IDLE',
    musicEnabled = true,
    onToggleMusic,
    detectedLanguage = 'en-US',
    transcript = '',
    lipSyncEnabled = true,
    onToggleLipSync,
    micInputEnabled = true,
    onToggleMic,
    fps = 60,
    particleCount = 25000,
    autoStates = { breathe: true, blink: 'auto', gaze: 'auto' },
    hasApiKey = false,
    onOpenApiKey,
  } = props;

  const stateInfo = useMemo(() => {
    switch (state) {
      case 'LISTENING':
        return { label: 'LISTENING', color: '#00e5ff', colorBg: 'rgba(0, 229, 255, 0.18)', colorBorder: 'rgba(0, 229, 255, 0.55)', textColor: '#00e5ff' };
      case 'THINKING':
        return { label: 'THINKING', color: '#5eb8ff', colorBg: 'rgba(94, 184, 255, 0.15)', colorBorder: 'rgba(94, 184, 255, 0.5)', textColor: '#7ec8ff' };
      case 'SPEAKING':
        return { label: 'SPEAKING', color: '#4fc3f7', colorBg: 'rgba(79, 195, 247, 0.15)', colorBorder: 'rgba(79, 195, 247, 0.5)', textColor: '#6fd0f8' };
      default:
        return { label: 'IDLE', color: '#4fc3f7', colorBg: 'rgba(0, 200, 240, 0.18)', colorBorder: 'rgba(0, 200, 240, 0.55)', textColor: '#00e5ff' };
    }
  }, [state]);

  const isArabic = detectedLanguage.startsWith('ar');
  const navLinks = ['FEATURES', 'SHOWCASE', 'DOCS', 'PRICING'];
  const statusButtons = ['IDLE', 'LISTENING', 'THINKING', 'SPEAKING'];

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: '"Inter", "Segoe UI", "Helvetica Neue", -apple-system, Arial, sans-serif',
    }}>
      {/* ===== TOP NAVIGATION ===== */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '72px',
        background: 'linear-gradient(180deg, rgba(6, 16, 34, 0.95) 0%, rgba(6, 16, 34, 0.7) 65%, transparent 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <svg width="36" height="36" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="50%" stopColor="#40c4ff" />
                <stop offset="100%" stopColor="#80deea" />
              </linearGradient>
            </defs>
            <g transform="translate(20,20)">
              {Array.from({ length: 14 }, (_, i) => {
                const angle = (i / 14) * Math.PI * 2;
                const r1 = 5 + (i % 4) * 2.2;
                const x = Math.cos(angle) * r1;
                const y = Math.sin(angle) * r1;
                return <circle key={i} cx={x} cy={y} r={1.5} fill="url(#logoGrad)" opacity={0.75 + (i % 3) * 0.08} />;
              })}
              <circle r="2.8" fill="url(#logoGrad)" />
            </g>
          </svg>
          <span style={{
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '1px',
            color: '#ffffff',
          }}>
            AVATARI<span style={{ color: '#ffffff', marginLeft: '1px', opacity: 0.95 }}>.IO</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '38px' }}>
          {navLinks.map((link) => (
            <a key={link} href="#" style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '1.2px',
              color: 'rgba(255, 255, 255, 0.92)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              cursor: 'pointer',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#00e5ff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255, 255, 255, 0.92)'; }}
            >
              {link}
            </a>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onOpenApiKey} style={{
            padding: '8px 14px',
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.8px',
            color: hasApiKey ? 'rgba(0, 229, 255, 0.95)' : 'rgba(180, 210, 240, 0.7)',
            background: hasApiKey ? 'rgba(0, 229, 255, 0.08)' : 'rgba(100, 140, 180, 0.06)',
            border: `1px solid ${hasApiKey ? 'rgba(0, 229, 255, 0.3)' : 'rgba(140, 170, 200, 0.15)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            outline: 'none',
          }}>
            {hasApiKey ? '🔐 API ✓' : '🔐 API Key'}
          </button>
          <button onClick={onToggleMusic} style={{
            padding: '8px 12px',
            fontSize: '15px',
            background: musicEnabled ? 'rgba(0, 229, 255, 0.08)' : 'rgba(100, 120, 140, 0.06)',
            border: `1px solid ${musicEnabled ? 'rgba(0, 229, 255, 0.25)' : 'rgba(140, 160, 180, 0.15)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
          }} title={musicEnabled ? 'Music: ON' : 'Music: OFF'}>
            {musicEnabled ? '🎵' : '🔇'}
          </button>
          <button style={{
            padding: '10px 24px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.8px',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #ff8a50 0%, #f26223 100%)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(242, 98, 35, 0.4)',
            transition: 'all 0.25s ease',
            outline: 'none',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(242, 98, 35, 0.55)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(242, 98, 35, 0.4)';
            }}
          >
            GET STARTED
          </button>
        </div>
      </div>

      {/* ===== HERO TITLE ===== */}
      <div style={{
        position: 'absolute',
        top: '96px',
        left: '50%',
        transform: 'translateX(-50%)',
        textAlign: 'center',
        width: '100%',
        maxWidth: '900px',
        padding: '0 40px',
        pointerEvents: 'none',
      }}>
        <h1 style={{
          margin: '0 0 12px',
          fontSize: 'clamp(30px, 3.8vw, 46px)',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          lineHeight: 1.1,
          color: '#ffffff',
          textTransform: 'uppercase',
          textShadow: '0 2px 40px rgba(0, 180, 230, 0.15)',
        }}>
          YOUR REAL-TIME PARTICLE
          <br />
          AVATAR — NO GLB REQUIRED
        </h1>
        <p style={{
          margin: '0 auto',
          maxWidth: '620px',
          fontSize: 'clamp(13px, 1.2vw, 15px)',
          fontWeight: 400,
          lineHeight: 1.6,
          color: 'rgba(170, 200, 230, 0.82)',
          letterSpacing: '0.2px',
        }}>
          Build High-Quality, Dynamic 3D Avatars Procedurally using Three.js,
          <br />
          React Three Fiber, ShaderMaterial, and Web Audio API.
        </p>
      </div>

      {/* ===== LEFT PANEL ===== */}
      <div style={{
        position: 'absolute',
        left: '48px',
        top: '220px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '205px',
        pointerEvents: 'auto',
      }}>
        <PanelBox>
          <SectionTitle>AVATAR STATUS</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {statusButtons.map((statusBtn) => {
              const isActive = state === statusBtn;
              return (
                <button key={statusBtn} style={{
                  padding: '7px 8px',
                  fontSize: '9.5px',
                  fontWeight: 700,
                  letterSpacing: '0.6px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  border: isActive ? `1px solid ${stateInfo.colorBorder}` : '1px solid rgba(80, 110, 150, 0.2)',
                  background: isActive ? stateInfo.colorBg : 'rgba(20, 35, 60, 0.3)',
                  color: isActive ? stateInfo.textColor : 'rgba(160, 190, 225, 0.75)',
                  boxShadow: isActive ? `0 0 10px ${stateInfo.color}22` : 'none',
                  outline: 'none',
                }}>
                  {statusBtn}
                </button>
              );
            })}
          </div>
        </PanelBox>

        <PanelBox>
          <SectionTitle>PERFORMANCE</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{
              padding: '9px 14px', borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(0, 180, 212, 0.06))',
              border: '1px solid rgba(0, 229, 255, 0.22)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(150, 190, 230, 0.72)', letterSpacing: '0.5px' }}>60 FPS</span>
              <span style={{
                fontSize: '16px', fontWeight: 800,
                color: fps >= 50 ? '#00e5ff' : fps >= 30 ? '#ffc850' : '#ff7070',
                fontFamily: '"Consolas", monospace',
                textShadow: fps >= 50 ? '0 0 8px rgba(0, 229, 255, 0.35)' : 'none',
              }}>{fps}</span>
            </div>
            <div style={{
              padding: '9px 14px', borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(0, 180, 212, 0.06))',
              border: '1px solid rgba(0, 229, 255, 0.22)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(150, 190, 230, 0.72)', letterSpacing: '0.5px' }}>25K PARTICLES</span>
              <span style={{
                fontSize: '16px', fontWeight: 800, color: '#00e5ff',
                fontFamily: '"Consolas", monospace',
                textShadow: '0 0 8px rgba(0, 229, 255, 0.35)',
              }}>{Math.round(particleCount / 1000)}K</span>
            </div>
          </div>
        </PanelBox>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div style={{
        position: 'absolute',
        right: '48px',
        top: '220px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '225px',
        pointerEvents: 'auto',
      }}>
        <PanelBox>
          <SectionTitle>LIP-SYNC CONTROL</SectionTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['ON', 'OFF'].map((opt) => {
                const on = opt === 'ON';
                const active = (on && lipSyncEnabled) || (!on && !lipSyncEnabled);
                return (
                  <button key={opt} onClick={onToggleLipSync} style={{
                    padding: '5px 15px',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '0.8px',
                    borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    border: active ? '1px solid rgba(0, 229, 255, 0.55)' : '1px solid rgba(80, 110, 150, 0.2)',
                    background: active ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.22), rgba(0, 180, 212, 0.12))' : 'rgba(20, 35, 60, 0.25)',
                    color: active ? '#00e5ff' : 'rgba(150, 180, 215, 0.6)',
                    boxShadow: active ? '0 0 10px rgba(0, 229, 255, 0.18)' : 'none',
                    outline: 'none',
                  }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            <ToggleSwitch enabled={lipSyncEnabled} onChange={onToggleLipSync} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px', color: micInputEnabled ? 'rgba(160, 200, 240, 0.88)' : 'rgba(130, 150, 180, 0.55)' }}>
              Mic Input
            </span>
            <ToggleSwitch enabled={micInputEnabled} onChange={onToggleMic} />
          </div>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.3px', color: micInputEnabled ? 'rgba(160, 200, 240, 0.88)' : 'rgba(130, 150, 180, 0.55)', marginBottom: '4px' }}>
            Audio Waveform:
          </div>
          <MiniAudioWave curState={state} />
        </PanelBox>

        <PanelBox>
          <SectionTitle>FEATURES</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {['BufferGeometry', 'ShaderMaterial', 'Audio API'].map((feat) => (
              <div key={feat} style={{
                display: 'flex', alignItems: 'center',
                padding: '7px 12px', borderRadius: '6px',
                background: 'rgba(15, 30, 55, 0.35)',
                border: '1px solid rgba(0, 229, 255, 0.08)',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(200, 225, 250, 0.9)', letterSpacing: '0.2px' }}>
                  {feat}
                </span>
              </div>
            ))}
          </div>
        </PanelBox>

        <PanelBox>
          <SectionTitle>STATES</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { name: 'Breathe', val: autoStates.breathe ? '[active]' : '[off]', active: autoStates.breathe, color: '#00e5ff' },
              { name: 'Blink', val: `[${autoStates.blink}]`, active: autoStates.blink === 'auto', color: '#00e5ff' },
              { name: 'Gaze', val: `[${autoStates.gaze}]`, active: autoStates.gaze === 'auto', color: '#00e5ff' },
            ].map((st) => (
              <div key={st.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 12px', borderRadius: '6px',
                background: st.active ? `${st.color}10` : 'transparent',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(200, 225, 250, 0.9)', letterSpacing: '0.4px' }}>
                  {st.name}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 800, letterSpacing: '0.4px',
                  color: st.active ? st.color : 'rgba(120, 145, 175, 0.55)',
                  fontFamily: '"Consolas", monospace',
                }}>
                  {st.val}
                </span>
              </div>
            ))}
          </div>
        </PanelBox>
      </div>

      {/* ===== TRANSCRIPT ===== */}
      {transcript && (
        <div style={{
          position: 'absolute',
          top: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          maxWidth: '50%',
          padding: '10px 22px',
          borderRadius: '12px',
          background: stateInfo.colorBg,
          backdropFilter: 'blur(14px)',
          border: `1px solid ${stateInfo.colorBorder}`,
          boxShadow: `0 0 30px ${stateInfo.color}22`,
          pointerEvents: 'none',
          marginTop: '140px',
        }}>
          <p style={{
            margin: 0, fontSize: 'clamp(12px, 1.15vw, 15px)',
            color: '#ffffff', textAlign: 'center',
            direction: isArabic ? 'rtl' : 'ltr',
            fontWeight: 500, lineHeight: 1.5,
          }}>
            "{transcript}"
          </p>
        </div>
      )}

      {/* ===== BOTTOM FEATURE CARDS ===== */}
      <div style={{
        position: 'absolute',
        left: '50%',
        bottom: '120px',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '18px',
        width: 'min(92%, 1020px)',
        pointerEvents: 'auto',
      }}>
        <FeatureCard
          title="PROCEDURAL FACE GENERATION"
          subtitle="How it works"
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Tag color="#00e5ff">BufferGeometry</Tag>
            <span style={{ color: 'rgba(140, 170, 200, 0.55)', fontSize: '12px' }}>&</span>
            <Tag color="#00e5ff">
              BufferGeometry
              <br />&amp; shaders
            </Tag>
          </div>
        </FeatureCard>

        <FeatureCard
          title="REAL-TIME MOUTH ANIMATION"
          subtitle="Audio analysis to displacement flow"
        >
          <svg width="100%" height="24" viewBox="0 0 120 24">
            {Array.from({ length: 20 }, (_, i) => {
              const x = i * 6 + 2;
              const h = 3 + Math.abs(Math.sin(i * 0.9 + (state !== 'IDLE' ? Date.now() / 400 : 0))) * 16;
              return <rect key={i} x={x} y={12 - h / 2} width="3" height={h} rx="1.5"
                fill={state !== 'IDLE' ? '#4fc3f7' : '#54799e'} opacity={state !== 'IDLE' ? 0.9 : 0.5} />;
            })}
          </svg>
        </FeatureCard>

        <FeatureCard
          title="GPU OPTIMIZED PERFORMANCE"
          subtitle="GPU optimized maciel performance"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <svg width="40" height="28" viewBox="0 0 40 28" fill="none">
              <circle cx="8" cy="14" r="6" stroke="#4fc3f7" strokeWidth="1.5" opacity="0.75" />
              <circle cx="19" cy="8" r="4" stroke="#00e5ff" strokeWidth="1.5" opacity="0.65" />
              <circle cx="19" cy="20" r="4" stroke="#00e5ff" strokeWidth="1.5" opacity="0.65" />
              <circle cx="31" cy="14" r="6" stroke="#4fc3f7" strokeWidth="1.5" opacity="0.75" />
              <line x1="13" y1="12" x2="16" y2="10" stroke="#54799e" strokeWidth="1" />
              <line x1="13" y1="16" x2="16" y2="18" stroke="#54799e" strokeWidth="1" />
              <line x1="22" y1="10" x2="26" y2="12" stroke="#54799e" strokeWidth="1" />
              <line x1="22" y1="18" x2="26" y2="16" stroke="#54799e" strokeWidth="1" />
            </svg>
            <span style={{
              fontSize: '20px', fontWeight: 900, margin: '0 6px',
              color: '#00e5ff',
              opacity: 0.8,
            }}>→</span>
            <svg width="46" height="28" viewBox="0 0 46 28" fill="none">
              <rect x="7" y="4" width="32" height="20" rx="3" stroke="#4fc3f7" strokeWidth="1.5" opacity="0.65" />
              <rect x="12" y="8" width="8" height="5" rx="1" fill="#4fc3f7" opacity="0.25" />
              <rect x="22" y="8" width="8" height="5" rx="1" fill="#00e5ff" opacity="0.2" />
              <rect x="12" y="15" width="22" height="6" rx="1" fill="#00e5ff" opacity="0.15" />
              <line x1="0" y1="14" x2="7" y2="14" stroke="#54799e" strokeWidth="1.5" />
              <line x1="39" y1="14" x2="46" y2="14" stroke="#54799e" strokeWidth="1.5" />
            </svg>
          </div>
        </FeatureCard>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px',
        background: 'linear-gradient(0deg, rgba(6, 16, 34, 0.92) 0%, transparent 100%)',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '26px' }}>
          {['Inter', 'Docs', 'Privacy', 'Terms'].map((f) => (
            <a key={f} href="#" style={{
              fontSize: '10.5px', fontWeight: 500,
              color: 'rgba(160, 185, 215, 0.55)',
              textDecoration: 'none', letterSpacing: '0.3px',
              transition: 'color 0.2s ease',
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(200, 225, 250, 0.8)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(160, 185, 215, 0.55)'}
            >
              {f}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <a href="#" style={{
            fontSize: '15px', color: 'rgba(160, 185, 215, 0.5)', textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00e5ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(160, 185, 215, 0.5)'}
          >↻</a>
          <a href="#" style={{
            fontSize: '15px', color: 'rgba(160, 185, 215, 0.5)', textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00e5ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(160, 185, 215, 0.5)'}
          >✕</a>
          <a href="#" style={{
            fontSize: '15px', color: 'rgba(160, 185, 215, 0.5)', textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00e5ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(160, 185, 215, 0.5)'}
          >◉</a>
          <a href="#" style={{
            fontSize: '15px', color: 'rgba(160, 185, 215, 0.5)', textDecoration: 'none',
            transition: 'color 0.2s ease',
          }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#00e5ff'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(160, 185, 215, 0.5)'}
          >▶</a>
        </div>
        <div style={{
          fontSize: '10px', color: 'rgba(140, 165, 195, 0.5)',
          letterSpacing: '0.5px', fontWeight: 500,
        }}>
          © Copyright 2022 — AVATari.io
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ title, subtitle, children }) {
  return (
    <div style={{
      flex: 1,
      padding: '18px 22px',
      borderRadius: '10px',
      background: 'linear-gradient(145deg, rgba(10, 22, 44, 0.82), rgba(6, 14, 30, 0.88))',
      border: '1px solid rgba(0, 180, 230, 0.12)',
      backdropFilter: 'blur(14px)',
      boxShadow: '0 8px 36px rgba(0, 0, 0, 0.4)',
      transition: 'all 0.3s ease',
      cursor: 'default',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 14px 52px rgba(0, 0, 0, 0.5)';
        e.currentTarget.style.borderColor = 'rgba(0, 229, 255, 0.22)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 36px rgba(0, 0, 0, 0.4)';
        e.currentTarget.style.borderColor = 'rgba(0, 180, 230, 0.12)';
      }}
    >
      <h4 style={{
        margin: '0 0 6px', fontSize: '12.5px', fontWeight: 800, letterSpacing: '0.5px',
        color: '#eaf5ff', lineHeight: 1.3,
      }}>{title}</h4>
      <p style={{
        margin: '0 0 16px', fontSize: '10.5px',
        color: 'rgba(155, 185, 215, 0.7)',
        lineHeight: 1.4, letterSpacing: '0.2px',
      }}>{subtitle}</p>
      <div style={{ minHeight: '28px', display: 'flex', alignItems: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <div style={{
      padding: '6px 11px',
      borderRadius: '5px',
      background: `${color}14`,
      border: `1px solid ${color}40`,
      fontSize: '10px',
      fontWeight: 700,
      color: color,
      letterSpacing: '0.2px',
      lineHeight: 1.2,
    }}>
      {children}
    </div>
  );
}
