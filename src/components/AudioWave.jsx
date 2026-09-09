import { useRef, useEffect } from 'react';

export default function AudioWave({
  amplitude = 0,
  frequencyData = null,
  waveformData = null,
  isActive = true,
  state = 'IDLE',
}) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const barsRef = useRef([]);
  const targetBarsRef = useRef([]);
  const timeRef = useRef(0);

  const BAR_COUNT = 96;

  useEffect(() => {
    for (let i = 0; i < BAR_COUNT; i++) {
      barsRef.current[i] = 0;
      targetBarsRef.current[i] = 0;
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      const W = rect.width;
      const H = rect.height;

      ctx.clearRect(0, 0, W, H);

      timeRef.current += 0.016;
      const t = timeRef.current;

      if (frequencyData && frequencyData.length > 0) {
        const fdLen = frequencyData.length;
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * (fdLen * 0.4));
          const val = frequencyData[idx] / 255;
          targetBarsRef.current[i] = Math.pow(val, 1.3);
        }
      } else if (waveformData && waveformData.length > 0) {
        const wfLen = waveformData.length;
        for (let i = 0; i < BAR_COUNT; i++) {
          const idx = Math.floor((i / BAR_COUNT) * wfLen);
          const val = Math.abs((waveformData[idx] - 128) / 128);
          targetBarsRef.current[i] = Math.pow(val, 1.5) * (1 + amplitude * 2);
        }
      } else {
        for (let i = 0; i < BAR_COUNT; i++) {
          const wave = Math.sin(t * 2 + i * 0.15) * 0.5 + 0.5;
          const wave2 = Math.sin(t * 3.7 + i * 0.08 + 1.3) * 0.5 + 0.5;
          targetBarsRef.current[i] = (wave * 0.6 + wave2 * 0.4) * (0.15 + amplitude * 0.85);
        }
      }

      for (let i = 0; i < BAR_COUNT; i++) {
        barsRef.current[i] += (targetBarsRef.current[i] - barsRef.current[i]) * 0.2;
      }

      const centerY = H * 0.55;
      const barSpacing = W / BAR_COUNT;
      const barWidth = barSpacing * 0.55;

      let stateColor1, stateColor2, glowColor;
      switch (state) {
        case 'LISTENING':
          stateColor1 = 'rgba(0, 255, 200,';
          stateColor2 = 'rgba(0, 180, 255,';
          glowColor = 'rgba(0, 255, 200,';
          break;
        case 'THINKING':
          stateColor1 = 'rgba(180, 120, 255,';
          stateColor2 = 'rgba(100, 80, 255,';
          glowColor = 'rgba(180, 120, 255,';
          break;
        case 'SPEAKING':
          stateColor1 = 'rgba(255, 200, 80,';
          stateColor2 = 'rgba(0, 220, 200,';
          glowColor = 'rgba(255, 200, 80,';
          break;
        default:
          stateColor1 = 'rgba(100, 160, 220,';
          stateColor2 = 'rgba(80, 120, 200,';
          glowColor = 'rgba(100, 160, 220,';
      }

      ctx.shadowBlur = 15 + amplitude * 25;
      ctx.shadowColor = glowColor + '0.5)';

      for (let i = 0; i < BAR_COUNT; i++) {
        const bar = barsRef.current[i];
        const x = i * barSpacing + barSpacing * 0.25;
        const barH = Math.max(2, bar * H * 0.7);
        const halfH = barH / 2;

        const gradient = ctx.createLinearGradient(x, centerY - halfH, x, centerY + halfH);
        gradient.addColorStop(0, stateColor1 + (0.15 + bar * 0.75) + ')');
        gradient.addColorStop(0.5, stateColor2 + (0.25 + bar * 0.65) + ')');
        gradient.addColorStop(1, stateColor1 + (0.15 + bar * 0.75) + ')');

        ctx.fillStyle = gradient;
        
        const radius = Math.min(barWidth / 2, barH * 0.35);
        
        ctx.beginPath();
        ctx.moveTo(x + radius, centerY - halfH);
        ctx.lineTo(x + barWidth - radius, centerY - halfH);
        ctx.quadraticCurveTo(x + barWidth, centerY - halfH, x + barWidth, centerY - halfH + radius);
        ctx.lineTo(x + barWidth, centerY + halfH - radius);
        ctx.quadraticCurveTo(x + barWidth, centerY + halfH, x + barWidth - radius, centerY + halfH);
        ctx.lineTo(x + radius, centerY + halfH);
        ctx.quadraticCurveTo(x, centerY + halfH, x, centerY + halfH - radius);
        ctx.lineTo(x, centerY - halfH + radius);
        ctx.quadraticCurveTo(x, centerY - halfH, x + radius, centerY - halfH);
        ctx.closePath();
        ctx.fill();
      }

      ctx.shadowBlur = 0;

      if (amplitude > 0.01 || state !== 'IDLE') {
        ctx.beginPath();
        const ringAlpha = state === 'IDLE' ? 0.1 : 0.3 + amplitude * 0.3;
        ctx.strokeStyle = glowColor + ringAlpha + ')';
        ctx.lineWidth = 1;
        
        for (let x = 0; x <= W; x += 2) {
          const normalizedX = x / W;
          const waveVal = Math.sin(t * (state === 'LISTENING' ? 8 : 4) + normalizedX * Math.PI * 6) * 
                         (5 + amplitude * 15 + (state !== 'IDLE' ? 5 : 0));
          const y = centerY - H * 0.38 + waveVal;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [frequencyData, waveformData, amplitude, state]);

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '160px',
      pointerEvents: 'none',
      zIndex: 5,
    }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
        }}
      />
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        width: '100%',
        padding: '0 20px',
        boxSizing: 'border-box',
      }}>
        <p style={{
          margin: 0,
          fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
          fontSize: 'clamp(11px, 1.3vw, 14px)',
          letterSpacing: '2px',
          color: isActive || state !== 'IDLE' 
            ? 'rgba(180, 220, 255, 0.9)' 
            : 'rgba(150, 180, 220, 0.5)',
          textShadow: state === 'LISTENING'
            ? '0 0 20px rgba(0, 255, 200, 0.6)'
            : state === 'SPEAKING'
            ? '0 0 20px rgba(255, 200, 80, 0.5)'
            : state === 'THINKING'
            ? '0 0 15px rgba(180, 120, 255, 0.5)'
            : '0 0 10px rgba(100, 160, 220, 0.3)',
          fontWeight: 300,
          transition: 'all 0.3s ease',
        }}>
          <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>
            VOICE CONTROL ACTIVE: START SPEAKING
          </span>
          <span style={{ margin: '0 12px', opacity: 0.4 }}>|</span>
          <span style={{ direction: 'rtl', unicodeBidi: 'embed' }}>
            التحكم الصوتي نشط: ابدأ التحدث
          </span>
        </p>
      </div>
    </div>
  );
}
