import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { vertexShader, fragmentShader } from './shaders/faceShaders';

const PARTICLE_COUNT = 25000;

function seededRandom(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateHeadGeometry() {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const targetPositions = new Float32Array(PARTICLE_COUNT * 3);
  const randomOffsets = new Float32Array(PARTICLE_COUNT * 3);
  const particleTypes = new Float32Array(PARTICLE_COUNT);
  const faceRegions = new Float32Array(PARTICLE_COUNT);
  const randomSeeds = new Float32Array(PARTICLE_COUNT);
  const irisOffsets = new Float32Array(PARTICLE_COUNT * 3);

  const CRANIUM = 1;
  const FOREHEAD = 2;
  const CHEEKBONE_L = 3;
  const CHEEKBONE_R = 3.1;
  const EYE_L = 4;
  const EYE_R = 5;
  const NOSE_BRIDGE = 6;
  const NOSE_TIP = 6.1;
  const JAW = 7;
  const UPPER_LIP = 8;
  const LOWER_LIP = 9;
  const CHIN = 10;

  const REGION_WEIGHTS = [
    { region: CRANIUM, weight: 0.22, start: 0 },
    { region: FOREHEAD, weight: 0.10, start: 0 },
    { region: CHEEKBONE_L, weight: 0.07, start: 0 },
    { region: CHEEKBONE_R, weight: 0.07, start: 0 },
    { region: EYE_L, weight: 0.08, start: 0 },
    { region: EYE_R, weight: 0.08, start: 0 },
    { region: NOSE_BRIDGE, weight: 0.05, start: 0 },
    { region: NOSE_TIP, weight: 0.04, start: 0 },
    { region: JAW, weight: 0.10, start: 0 },
    { region: UPPER_LIP, weight: 0.05, start: 0 },
    { region: LOWER_LIP, weight: 0.06, start: 0 },
    { region: CHIN, weight: 0.08, start: 0 },
  ];

  const totalWeight = REGION_WEIGHTS.reduce((s, r) => s + r.weight, 0);
  let cumulative = 0;
  REGION_WEIGHTS.forEach(r => {
    r.start = Math.floor((cumulative / totalWeight) * PARTICLE_COUNT);
    cumulative += r.weight;
  });

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const seed = i / PARTICLE_COUNT * 1000 + 1;
    const r1 = seededRandom(seed);
    const r2 = seededRandom(seed * 2.3);
    const r3 = seededRandom(seed * 3.7);
    const r4 = seededRandom(seed * 5.1);

    let region = CRANIUM;
    for (let j = REGION_WEIGHTS.length - 1; j >= 0; j--) {
      if (i >= REGION_WEIGHTS[j].start) {
        region = REGION_WEIGHTS[j].region;
        break;
      }
    }

    randomSeeds[i] = r1;
    faceRegions[i] = region;
    particleTypes[i] = 0;

    let x = 0, y = 0, z = 0;
    const isEye = (region === EYE_L || region === EYE_R);

    switch (region) {
      case CRANIUM: {
        const theta = r1 * Math.PI * 2;
        const phi = Math.acos(2 * r2 - 1);
        const headRadius = 1.15 + (r3 - 0.5) * 0.08;
        
        const phiMin = Math.PI * 0.15;
        const phiMax = Math.PI * 0.85;
        const phiAdj = phiMin + (phiMax - phiMin) * (r2 * 0.8 + r4 * 0.2);
        
        const r = headRadius * Math.sin(phiAdj);
        x = r * Math.cos(theta) * 0.95;
        y = headRadius * Math.cos(phiAdj) * 0.9 + 0.15;
        z = r * Math.sin(theta) * 0.85;
        
        if (z < -0.1) {
          z *= 0.6;
          x *= 0.9;
        }
        break;
      }
      
      case FOREHEAD: {
        const theta = (r1 - 0.5) * Math.PI * 1.2;
        const h = 0.35 + r2 * 0.35;
        const headR = 1.05 + (r3 - 0.5) * 0.06;
        x = Math.sin(theta) * headR * 0.75;
        y = h;
        z = Math.cos(theta) * headR * 0.6 + 0.35;
        break;
      }
      
      case CHEEKBONE_L:
      case CHEEKBONE_R: {
        const side = region === CHEEKBONE_L ? -1 : 1;
        const cheekX = 0.55 + r1 * 0.25;
        const cheekY = 0.0 + (r2 - 0.5) * 0.35;
        const cheekZ = 0.55 + r3 * 0.25;
        x = side * cheekX;
        y = cheekY;
        z = cheekZ;
        const puff = 0.08 * Math.sin(r1 * Math.PI);
        x += side * puff * 0.3;
        z += puff * 0.5;
        break;
      }
      
      case EYE_L:
      case EYE_R: {
        const side = region === EYE_L ? -1 : 1;
        const eyeCenterX = side * 0.42;
        const eyeCenterY = 0.35;
        const eyeCenterZ = 0.82;
        
        const angle = r1 * Math.PI * 2;
        const eyeR = Math.pow(r2, 0.5) * 0.17;
        
        x = eyeCenterX + Math.cos(angle) * eyeR * 1.15;
        y = eyeCenterY + Math.sin(angle) * eyeR;
        z = eyeCenterZ + (r3 - 0.5) * 0.04;
        
        const irisDist = eyeR;
        if (irisDist < 0.07 && r4 < 0.45) {
          const irisAngle = seededRandom(seed * 7) * Math.PI * 2;
          const irisR = seededRandom(seed * 11) * 0.062;
          x = eyeCenterX + Math.cos(irisAngle) * irisR;
          y = eyeCenterY + Math.sin(irisAngle) * irisR * 0.95;
          z = eyeCenterZ + 0.02 + r3 * 0.01;
          particleTypes[i] = 2;
        } else if (irisDist < 0.03 && r4 < 0.7) {
          particleTypes[i] = 2.1;
          z = eyeCenterZ + 0.025;
        }
        break;
      }
      
      case NOSE_BRIDGE: {
        const noseX = (r1 - 0.5) * 0.16;
        const noseY = 0.38 - r2 * 0.45;
        const noseZ = 0.88 + Math.abs(noseX) * 0.3 + (r3 - 0.5) * 0.03;
        x = noseX;
        y = noseY;
        z = noseZ;
        break;
      }
      
      case NOSE_TIP: {
        const tipX = (r1 - 0.5) * 0.22;
        const tipY = -0.02 + (r2 - 0.5) * 0.12;
        const tipZ = 1.0 + r3 * 0.08;
        const nostrilSide = r1 < 0.35 ? -1 : (r1 > 0.65 ? 1 : 0);
        if (nostrilSide !== 0 && r4 < 0.35) {
          x = nostrilSide * (0.08 + r2 * 0.05);
          y = -0.05 + r3 * 0.05;
          z = 0.95 + r2 * 0.03;
        } else {
          x = tipX;
          y = tipY;
          z = tipZ;
        }
        break;
      }
      
      case JAW: {
        const jawT = r1;
        const side = r2 < 0.5 ? -1 : 1;
        const jawY = -0.1 - jawT * 0.55;
        const jawWidth = 0.7 - jawT * 0.4;
        const jawZ = 0.55 + Math.sin(jawT * Math.PI) * 0.2;
        
        x = side * (jawWidth * (0.6 + r3 * 0.4)) + (r3 - 0.5) * 0.05;
        y = jawY + (r4 - 0.5) * 0.05;
        z = jawZ + (r3 - 0.5) * 0.04;
        break;
      }
      
      case UPPER_LIP: {
        const lipT = r1;
        const lipY = -0.32;
        const lipWidth = 0.38;
        
        const cupidHeight = Math.sin(lipT * Math.PI * 2) * 0.04;
        x = (lipT - 0.5) * 2 * lipWidth * (0.92 + r2 * 0.15);
        y = lipY + cupidHeight + (r3 - 0.5) * 0.03;
        z = 0.82 + Math.abs(x) * 0.05 + r2 * 0.04;
        break;
      }
      
      case LOWER_LIP: {
        const lipT = r1;
        const lipY = -0.42;
        const lipWidth = 0.36;
        
        const lipCurve = -Math.abs(Math.sin(lipT * Math.PI)) * 0.05;
        x = (lipT - 0.5) * 2 * lipWidth * (0.9 + r2 * 0.2);
        y = lipY + lipCurve + (r3 - 0.5) * 0.03;
        z = 0.78 + Math.abs(x) * 0.04 + r2 * 0.05;
        break;
      }
      
      case CHIN: {
        const chinT = r1;
        const side = r2 < 0.5 ? -1 : 1;
        const chinY = -0.68 - chinT * 0.15;
        const chinWidth = 0.25 - chinT * 0.18;
        
        x = side * chinWidth * (0.3 + r3 * 0.7);
        y = chinY + (r4 - 0.5) * 0.04;
        z = 0.52 + (1.0 - chinT) * 0.1 + (r3 - 0.5) * 0.03;
        
        const chinDimple = (r2 < 0.1 && chinT > 0.5) ? -0.03 : 0;
        y += chinDimple;
        z -= chinDimple;
        break;
      }
    }

    targetPositions[i3] = x;
    targetPositions[i3 + 1] = y;
    targetPositions[i3 + 2] = z;

    const disperseScale = 3.5;
    const nx = (seededRandom(seed * 13) - 0.5) * disperseScale;
    const ny = (seededRandom(seed * 17) - 0.5) * disperseScale * 1.2;
    const nz = (seededRandom(seed * 19) - 0.5) * disperseScale;

    positions[i3] = x + nx;
    positions[i3 + 1] = y + ny;
    positions[i3 + 2] = z + nz;

    randomOffsets[i3] = nx / disperseScale;
    randomOffsets[i3 + 1] = ny / disperseScale;
    randomOffsets[i3 + 2] = nz / disperseScale;

    irisOffsets[i3] = 0;
    irisOffsets[i3 + 1] = 0;
    irisOffsets[i3 + 2] = 0;
  }

  return {
    positions,
    targetPositions,
    randomOffsets,
    particleTypes,
    faceRegions,
    randomSeeds,
    irisOffsets,
  };
}

export default function ParticleFace({
  state = 'IDLE',
  audioAmp = 0,
  glowIntensity = 0,
  onReady,
}) {
  const pointsRef = useRef();
  const materialRef = useRef();
  const { camera, mouse } = useThree();
  const blinkRef = useRef(0);
  const nextBlinkRef = useRef(3 + Math.random() * 4);
  const blinkStateRef = useRef('open');
  const breathRef = useRef(0);
  const introRef = useRef(0);
  const introCompleteRef = useRef(false);

  const stateValue = useMemo(() => {
    switch (state) {
      case 'LISTENING': return 1;
      case 'THINKING': return 2;
      case 'SPEAKING': return 3;
      default: return 0;
    }
  }, [state]);

  const geometryData = useMemo(() => generateHeadGeometry(), []);

  useEffect(() => {
    if (onReady) onReady();
  }, [onReady]);

  useFrame((state, delta) => {
    if (!materialRef.current) return;

    const time = state.clock.getElapsedTime();

    if (introRef.current < 1.0) {
      introRef.current = Math.min(1.0, introRef.current + delta / 1.6);
      if (introRef.current >= 1.0 && !introCompleteRef.current) {
        introCompleteRef.current = true;
      }
    }

    breathRef.current += delta * 0.0025;

    nextBlinkRef.current -= delta;
    if (blinkStateRef.current === 'open' && nextBlinkRef.current <= 0) {
      blinkStateRef.current = 'closing';
    }

    if (blinkStateRef.current === 'closing') {
      blinkRef.current = Math.min(1.0, blinkRef.current + delta * 8);
      if (blinkRef.current >= 1.0) {
        blinkStateRef.current = 'opening';
      }
    } else if (blinkStateRef.current === 'opening') {
      blinkRef.current = Math.max(0.0, blinkRef.current - delta * 6);
      if (blinkRef.current <= 0.0) {
        blinkStateRef.current = 'open';
        nextBlinkRef.current = 2.5 + Math.random() * 4.5;
      }
    }

    if (stateValue === 1) {
      nextBlinkRef.current = Math.min(nextBlinkRef.current, 6);
    }

    const eyeTarget = new THREE.Vector2(mouse.x, -mouse.y);
    if (camera && pointsRef.current) {
      pointsRef.current.getWorldPosition(new THREE.Vector3());
    }

    const clampedAmp = Math.max(0, Math.min(1, audioAmp));
    const clampedGlow = Math.max(0, Math.min(1, glowIntensity));

    const u = materialRef.current.uniforms;
    u.uTime.value = time;
    u.uIntroProgress.value = introRef.current;
    u.uAudioAmp.value = clampedAmp;
    u.uState.value = stateValue;
    u.uGlowIntensity.value = clampedGlow;
    u.uBlinkAmount.value = blinkRef.current;
    u.uEyeTarget.value.lerp(eyeTarget, 0.08);
    u.uBreathPhase.value = breathRef.current;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={geometryData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aTargetPosition"
          count={PARTICLE_COUNT}
          array={geometryData.targetPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aRandomOffset"
          count={PARTICLE_COUNT}
          array={geometryData.randomOffsets}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aParticleType"
          count={PARTICLE_COUNT}
          array={geometryData.particleTypes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aFaceRegion"
          count={PARTICLE_COUNT}
          array={geometryData.faceRegions}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandomSeed"
          count={PARTICLE_COUNT}
          array={geometryData.randomSeeds}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aIrisOffset"
          count={PARTICLE_COUNT}
          array={geometryData.irisOffsets}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={{
          uTime: { value: 0 },
          uIntroProgress: { value: 0 },
          uAudioAmp: { value: 0 },
          uState: { value: 0 },
          uGlowIntensity: { value: 0 },
          uBlinkAmount: { value: 0 },
          uEyeTarget: { value: new THREE.Vector2(0, 0) },
          uBreathPhase: { value: 0 },
        }}
      />
    </points>
  );
}
