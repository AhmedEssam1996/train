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
          ? 'linear-gradient(135deg, #00e5ff, #00b8d4)'
          : 'rgba(80, 100, 130, 0.4)',
        position: 'relative',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: enabled ? '0 0 12px rgba(0, 229, 255, 0.3)' : 'none',
        border: enabled
          ? '1px solid rgba(0, 229, 255, 0.4)'
          : '1px solid rgba(100, 120, 150, 0.25)',
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
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
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
        const base = curState === 'IDLE' ? 8 : 15;
        const noise = Math.abs(Math.sin(Date.now() / 200 + i * 0.5));
        const amp = curState === 'SPEAKING' ? 0.9 : curState === 'LISTENING' ? 0.7 : curState === 'THINKING' ? 0.5 : 0.25;
        arr.push(base + noise * 18 * amp);
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

  const bars = barsRef.current.length > 0 ? barsRef.current : Array(32).fill(10);

  return (
    <div style={{
      width: '100%',
      height: '36px',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      gap: '1.5px',
      padding: '4px 0',
    }}>
      {bars.map((h, i) => (
        <div key={i} style={{
          width: '3px',
          height: `${h}px`,
          minHeight: '3px',
          borderRadius: '2px',
          background: 'linear-gradient(to top, #0088aa, #00e5ff)',
          boxShadow: curState !== 'IDLE' ? '0 0 4px rgba(0, 229, 255, 0.4)' : 'none',
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
      background: 'linear-gradient(145deg, rgba(12, 22, 42, 0.75), rgba(8, 16, 32, 0.85))',
      border: '1px solid rgba(0, 229, 255, 0.12)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
      ...(extraStyle || {}),
    }}>
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return (
    <h3 style={{
      fontSize: '10.5px',
      fontWeight: 700,
      letterSpacing: '1.8px',
      color: 'rgba(150, 190, 230, 0.8)',
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
        return { label: 'LISTENING', color: '#00ffc8', colorBg: 'rgba(0, 255, 200, 0.12)', colorBorder: 'rgba(0, 255, 200, 0.5)', textColor: '#00ffc8' };
      case 'THINKING':
        return { label: 'THINKING', color: '#b478ff', colorBg: 'rgba(180, 120, 255, 0.12)', colorBorder: 'rgba(180, 120, 255, 0.5)', textColor: '#b478ff' };
      case 'SPEAKING':
        return { label: 'SPEAKING', color: '#ffc850', colorBg: 'rgba(255, 200, 80, 0.12)', colorBorder: 'rgba(255, 200, 80, 0.5)', textColor: '#ffc850' };
      default:
        return { label: 'IDLE', color: '#64a0dc', colorBg: 'rgba(100, 160, 220, 0.12)', colorBorder: 'rgba(100, 160, 220, 0.4)', textColor: '#9ec5ff' };
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
        height: '64px',
        background: 'linear-gradient(180deg, rgba(5, 12, 26, 0.9) 0%, rgba(5, 12, 26, 0.65) 60%, transparent 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
          <svg width="32" height="32" viewBox="0 0 40 40" fill="none">
            <defs>
              <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00e5ff" />
                <stop offset="50%" stopColor="#40c4ff" />
                <stop offset="100%" stopColor="#b478ff" />
              </linearGradient>
            </defs>
            <g transform="translate(20,20)">
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i / 12) * Math.PI * 2;
                const r1 = 6 + (i % 3) * 2;
                const x = Math.cos(angle) * r1;
                const y = Math.sin(angle) * r1;
                return <circle key={i} cx={x} cy={y} r={1.8} fill="url(#logoGrad)" opacity={0.8 + (i % 3) * 0.1} />;
              })}
              <circle r="3" fill="url(#logoGrad)" />
            </g>
          </svg>
          <span style={{
            fontSize: '20px',
            fontWeight: 800,
            letterSpacing: '1.5px',
            color: '#ffffff',
          }}>
            AVATARI<span style={{ color: '#00e5ff', marginLeft: '2px' }}>.IO</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
          {navLinks.map((link, idx) => (
            <a key={link} href="#" style={{
              fontSize: '12px',
              fontWeight: 600,
              letterSpacing: '1.5px',
              color: idx === 0 ? '#ffffff' : 'rgba(200, 220, 240, 0.75)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              cursor: 'pointer',
              borderBottom: idx === 0 ? '2px solid #00e5ff' : '2px solid transparent',
              paddingBottom: '4px',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = idx === 0 ? '#ffffff' : 'rgba(200, 220, 240, 0.75)'; }}
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
            background: musicEnabled ? 'rgba(0, 229, 255, 0.1)' : 'rgba(100, 120, 140, 0.08)',
            border: `1px solid ${musicEnabled ? 'rgba(0, 229, 255, 0.3)' : 'rgba(140, 160, 180, 0.15)'}`,
            borderRadius: '8px',
            cursor: 'pointer',
          }} title={musicEnabled ? 'Music: ON' : 'Music: OFF'}>
            {musicEnabled ? '🎵' : '🔇'}
          </button>
          <button style={{
            padding: '10px 22px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '1px',
            color: '#1a0a00',
            background: 'linear-gradient(135deg, #ff8c42 0%, #ff6a1f 100%)',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 4px 20px rgba(255, 120, 50, 0.35)',
            transition: 'all 0.25s ease',
            outline: 'none',
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 28px rgba(255, 120, 50, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 120, 50, 0.35)';
            }}
          >
            GET STARTED
          </button>
        </div>
      </div>

      {/* ===== LEFT PANEL ===== */}
      <div style={{
        position: 'absolute',
        left: '40px',
        top: '120px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '200px',
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
                  letterSpacing: '0.8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  border: isActive ? `1px solid ${stateInfo.colorBorder}` : '1px solid rgba(100, 130, 170, 0.2)',
                  background: isActive ? stateInfo.colorBg : 'rgba(30, 48, 78, 0.3)',
                  color: isActive ? stateInfo.textColor : 'rgba(170, 195, 225, 0.7)',
                  boxShadow: isActive ? `0 0 12px ${stateInfo.color}25` : 'none',
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
              padding: '8px 12px', borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1), rgba(0, 180, 212, 0.05))',
              border: '1px solid rgba(0, 229, 255, 0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(150, 190, 230, 0.7)', letterSpacing: '0.5px' }}>FPS</span>
              <span style={{
                fontSize: '18px', fontWeight: 800,
                color: fps >= 50 ? '#00ffc8' : fps >= 30 ? '#ffc850' : '#ff7070',
                fontFamily: '"Consolas", monospace',
                textShadow: fps >= 50 ? '0 0 10px rgba(0, 255, 200, 0.4)' : 'none',
              }}>{fps}</span>
            </div>
            <div style={{
              padding: '8px 12px', borderRadius: '8px',
              background: 'linear-gradient(135deg, rgba(180, 120, 255, 0.08), rgba(120, 80, 220, 0.04))',
              border: '1px solid rgba(180, 120, 255, 0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(150, 190, 230, 0.7)', letterSpacing: '0.5px' }}>PARTICLES</span>
              <span style={{
                fontSize: '18px', fontWeight: 800, color: '#b478ff',
                fontFamily: '"Consolas", monospace',
                textShadow: '0 0 10px rgba(180, 120, 255, 0.35)',
              }}>{(particleCount / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </PanelBox>
      </div>

      {/* ===== RIGHT PANEL ===== */}
      <div style={{
        position: 'absolute',
        right: '40px',
        top: '120px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '220px',
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
                    padding: '5px 14px',
                    fontSize: '10px', fontWeight: 700, letterSpacing: '1px',
                    borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    border: active ? '1px solid rgba(0, 229, 255, 0.5)' : '1px solid rgba(100, 130, 170, 0.2)',
                    background: active ? 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 180, 212, 0.1))' : 'rgba(30, 48, 78, 0.25)',
                    color: active ? '#00e5ff' : 'rgba(160, 185, 215, 0.6)',
                    boxShadow: active ? '0 0 10px rgba(0, 229, 255, 0.2)' : 'none',
                    outline: 'none',
                  }}>
                    {opt}
                  </button>
                );
              })}
            </div>
            <ToggleSwitch enabled={lipSyncEnabled} onChange={onToggleLipSync} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.6px', color: micInputEnabled ? 'rgba(0, 229, 255, 0.85)' : 'rgba(140, 160, 180, 0.5)' }}>
              Mic Input · Audio Waveform:
            </span>
            <ToggleSwitch enabled={micInputEnabled} onChange={onToggleMic} />
          </div>
          <MiniAudioWave curState={state} />
        </PanelBox>

        <PanelBox>
          <SectionTitle>FEATURES</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            {['BufferGeometry', 'ShaderMaterial', 'Audio API'].map((feat, i) => {
              const colors = ['#00e5ff', '#b478ff', '#ffc850'];
              return (
                <div key={feat} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '6px 10px', borderRadius: '6px',
                  background: 'rgba(20, 35, 60, 0.25)',
                  borderLeft: `2px solid ${colors[i]}55`,
                }}>
                  <div style={{
                    width: '6px', height: '6px', borderRadius: '50%', background: colors[i],
                    boxShadow: `0 0 8px ${colors[i]}99`,
                  }} />
                  <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(200, 220, 240, 0.85)', letterSpacing: '0.3px' }}>
                    {feat}
                  </span>
                </div>
              );
            })}
          </div>
        </PanelBox>

        <PanelBox>
          <SectionTitle>STATES</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { name: 'Breathe', val: autoStates.breathe ? '[active]' : '[off]', active: autoStates.breathe, color: '#00ffc8' },
              { name: 'Blink', val: `[${autoStates.blink}]`, active: autoStates.blink === 'auto', color: '#40c4ff' },
              { name: 'Gaze', val: `[${autoStates.gaze}]`, active: autoStates.gaze === 'auto', color: '#b478ff' },
            ].map((st) => (
              <div key={st.name} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '5px 10px', borderRadius: '6px',
                background: st.active ? `${st.color}12` : 'transparent',
              }}>
                <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(200, 220, 240, 0.85)', letterSpacing: '0.5px' }}>
                  {st.name}
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, letterSpacing: '0.5px',
                  color: st.active ? st.color : 'rgba(130, 150, 170, 0.5)',
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
          top: '100px',
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
        bottom: '200px',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '18px',
        width: 'min(90%, 960px)',
        pointerEvents: 'auto',
      }}>
        <FeatureCard
          title="PROCEDURAL FACE GENERATION"
          subtitle="How it works"
        >
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Tag color="#00e5ff">BufferGeometry</Tag>
            <span style={{ color: 'rgba(150, 170, 200, 0.5)', fontSize: '12px' }}>&</span>
            <Tag color="#b478ff">
              BufferGeometry
              <br />&amp; shaders
            </Tag>
          </div>
        </FeatureCard>

        <FeatureCard
          title="REAL-TIME MOUTH ANIMATION"
          subtitle="Audio analysis to displacement flow"
        >
          <svg width="100%" height="22" viewBox="0 0 120 22">
            {Array.from({ length: 20 }, (_, i) => {
              const x = i * 6 + 2;
              const h = 4 + Math.abs(Math.sin(i * 0.9)) * 14;
              return <rect key={i} x={x} y={11 - h / 2} width="3" height={h} rx="1.5"
                fill={state !== 'IDLE' ? '#ffc850' : '#64a0dc'} opacity="0.8" />;
            })}
          </svg>
        </FeatureCard>

        <FeatureCard
          title="GPU OPTIMIZED PERFORMANCE"
          subtitle="GPU optimized maciel performance"
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <svg width="38" height="28" viewBox="0 0 38 28" fill="none">
              <circle cx="8" cy="14" r="6" stroke="#40c4ff" strokeWidth="1.5" opacity="0.8" />
              <circle cx="19" cy="8" r="4" stroke="#00e5ff" strokeWidth="1.5" opacity="0.7" />
              <circle cx="19" cy="20" r="4" stroke="#00e5ff" strokeWidth="1.5" opacity="0.7" />
              <circle cx="30" cy="14" r="6" stroke="#b478ff" strokeWidth="1.5" opacity="0.8" />
              <line x1="13" y1="12" x2="16" y2="10" stroke="#64a0dc" strokeWidth="1" />
              <line x1="13" y1="16" x2="16" y2="18" stroke="#64a0dc" strokeWidth="1" />
              <line x1="22" y1="10" x2="25" y2="12" stroke="#64a0dc" strokeWidth="1" />
              <line x1="22" y1="18" x2="25" y2="16" stroke="#64a0dc" strokeWidth="1" />
            </svg>
            <span style={{
              fontSize: '20px', fontWeight: 900, margin: '0 4px',
              background: 'linear-gradient(90deg, #00e5ff, #40c4ff)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>→</span>
            <svg width="44" height="28" viewBox="0 0 44 28" fill="none">
              <rect x="6" y="4" width="32" height="20" rx="3" stroke="#00e5ff" strokeWidth="1.5" opacity="0.7" />
              <rect x="11" y="8" width="8" height="5" rx="1" fill="#00e5ff" opacity="0.3" />
              <rect x="21" y="8" width="8" height="5" rx="1" fill="#b478ff" opacity="0.3" />
              <rect x="11" y="15" width="22" height="6" rx="1" fill="#40c4ff" opacity="0.2" />
              <line x1="0" y1="14" x2="6" y2="14" stroke="#64a0dc" strokeWidth="1.5" />
              <line x1="38" y1="14" x2="44" y2="14" stroke="#64a0dc" strokeWidth="1.5" />
            </svg>
          </div>
        </FeatureCard>
      </div>

      {/* ===== FOOTER ===== */}
      <div style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 0,
        height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 40px',
        background: 'linear-gradient(0deg, rgba(5, 12, 26, 0.85) 0%, transparent 100%)',
        pointerEvents: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '22px' }}>
          {['Inter', 'Docs', 'Privacy', 'Terms'].map((f) => (
            <a key={f} href="#" style={{
              fontSize: '10.5px', fontWeight: 500,
              color: f === 'Inter' ? 'rgba(200, 220, 240, 0.5)' : 'rgba(150, 175, 205, 0.45)',
              textDecoration: 'none', letterSpacing: '0.4px',
              transition: 'color 0.2s ease',
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'rgba(200, 220, 240, 0.75)'}
              onMouseLeave={(e) => e.currentTarget.style.color = f === 'Inter' ? 'rgba(200, 220, 240, 0.5)' : 'rgba(150, 175, 205, 0.45)'}
            >
              {f}
            </a>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {['⟲', '✕', '📷', '▶'].map((ic, i) => (
            <a key={i} href="#" style={{
              fontSize: '14px', color: 'rgba(150, 175, 205, 0.45)', textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#00e5ff'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(150, 175, 205, 0.45)'}
            >{ic}</a>
          ))}
        </div>
        <div style={{
          fontSize: '10px', color: 'rgba(130, 155, 185, 0.45)',
          letterSpacing: '0.6px', fontWeight: 500,
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
      padding: '18px 20px',
      borderRadius: '10px',
      background: 'linear-gradient(145deg, rgba(12, 22, 42, 0.85), rgba(8, 16, 32, 0.9))',
      border: '1px solid rgba(0, 229, 255, 0.1)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.35)',
      transition: 'all 0.3s ease',
      cursor: 'default',
    }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 14px 48px rgba(0, 0, 0, 0.45)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.35)';
      }}
    >
      <h4 style={{
        margin: '0 0 6px', fontSize: '12.5px', fontWeight: 800, letterSpacing: '0.6px',
        color: '#e8f4ff', lineHeight: 1.3,
      }}>{title}</h4>
      <p style={{
        margin: '0 0 14px', fontSize: '10.5px',
        color: 'rgba(160, 185, 215, 0.65)',
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
      padding: '6px 10px',
      borderRadius: '5px',
      background: `${color}15`,
      border: `1px solid ${color}44`,
      fontSize: '10px',
      fontWeight: 600,
      color: color,
      letterSpacing: '0.3px',
      lineHeight: 1.2,
    }}>
      {children}
    </div>
  );
}
