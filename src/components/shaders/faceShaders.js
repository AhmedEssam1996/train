export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntroProgress;
  uniform float uAudioAmp;
  uniform float uState;
  uniform float uGlowIntensity;
  uniform float uBlinkAmount;
  uniform vec2 uEyeTarget;
  uniform float uBreathPhase;
  
  attribute vec3 aTargetPosition;
  attribute vec3 aRandomOffset;
  attribute float aParticleType;
  attribute float aFaceRegion;
  attribute float aRandomSeed;
  attribute vec3 aIrisOffset;
  
  varying float vParticleType;
  varying float vFaceRegion;
  varying float vRandomSeed;
  varying float vDepth;
  varying float vGlow;
  varying vec3 vColor;
  varying float vSize;
  
  #define STATE_IDLE 0.0
  #define STATE_LISTENING 1.0
  #define STATE_THINKING 2.0
  #define STATE_SPEAKING 3.0
  
  vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
  }
  
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }
  
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(mix(mix(hash(n), hash(n + 1.0), f.x),
                   mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                   mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
  }
  
  void main() {
    vParticleType = aParticleType;
    vFaceRegion = aFaceRegion;
    vRandomSeed = aRandomSeed;
    
    vec3 pos = position;
    vec3 target = aTargetPosition;
    vec3 finalPos;
    
    float introEase = 1.0 - pow(1.0 - uIntroProgress, 3.0);
    
    if (uIntroProgress < 1.0) {
      float disperseAmount = 6.0 + sin(aRandomSeed * 30.0 + uTime * 0.5) * 2.0;
      vec3 dispersedPos = position + aRandomOffset * disperseAmount;
      dispersedPos.y += sin(uTime * 0.8 + aRandomSeed * 20.0) * 0.5;
      dispersedPos.x += cos(uTime * 0.6 + aRandomSeed * 15.0) * 0.3;
      
      finalPos = mix(dispersedPos, target, introEase);
    } else {
      finalPos = target;
    }
    
    float breathe = sin(uBreathPhase + aRandomSeed * 6.28) * 0.015;
    finalPos.y += breathe;
    finalPos += normalize(target + vec3(0.0, 0.1, 0.0)) * breathe * 0.5;
    
    float n = noise(target * 1.5 + vec3(uTime * 0.15, uTime * 0.1, uTime * 0.12));
    float idleDrift = (uState == STATE_IDLE) ? 0.008 : 0.003;
    finalPos += vec3(
      (n - 0.5) * idleDrift,
      (noise(target * 2.0 + vec3(uTime * 0.08)) - 0.5) * idleDrift,
      (noise(target * 1.8 + vec3(uTime * 0.1 + 100.0)) - 0.5) * idleDrift
    );
    
    if (uState == STATE_THINKING) {
      float orbitAmount = 1.5 + sin(aRandomSeed * 25.0) * 1.0;
      float orbitSpeed = 1.5 + aRandomSeed * 2.0;
      float orbitAngle = uTime * orbitSpeed + aRandomSeed * 12.566;
      float orbitHeight = sin(aRandomSeed * 18.0 + uTime * 2.0) * 1.2;
      
      vec3 orbitPos = target;
      orbitPos.x += cos(orbitAngle) * orbitAmount;
      orbitPos.z += sin(orbitAngle) * orbitAmount;
      orbitPos.y += orbitHeight;
      
      float swarmT = 0.65 + sin(aRandomSeed * 10.0 + uTime * 3.0) * 0.3;
      finalPos = mix(target, orbitPos, swarmT);
    }
    
    if (uState == STATE_LISTENING) {
      float listenPulse = sin(uTime * 4.0 + aRandomSeed * 10.0) * 0.5 + 0.5;
      float expand = listenPulse * 0.03 * uGlowIntensity;
      finalPos += normalize(target) * expand;
    }
    
    if (uState == STATE_SPEAKING) {
      float speakPulse = sin(uTime * 6.0 + aRandomSeed * 8.0) * 0.5 + 0.5;
      float expand = speakPulse * 0.025 * uGlowIntensity;
      finalPos += normalize(target) * expand;
    }
    
    bool isLowerLip = (aFaceRegion >= 9.0 && aFaceRegion <= 9.9);
    bool isUpperLip = (aFaceRegion >= 8.0 && aFaceRegion <= 8.9);
    bool isMouth = isLowerLip || isUpperLip;
    bool isJaw = (aFaceRegion >= 7.0 && aFaceRegion <= 7.9);
    
    if (isLowerLip && uAudioAmp > 0.001) {
      float jawOpen = uAudioAmp * 0.55;
      finalPos.y -= jawOpen;
      finalPos.z -= jawOpen * 0.15;
      finalPos.x += (aTargetPosition.x > 0.0 ? 1.0 : -1.0) * jawOpen * 0.05;
    }
    
    if (isUpperLip && uAudioAmp > 0.001) {
      finalPos.y += uAudioAmp * 0.05;
    }
    
    if (isJaw && uAudioAmp > 0.001) {
      finalPos.y -= uAudioAmp * 0.25;
      finalPos.z -= uAudioAmp * 0.08;
    }
    
    bool isLeftEye = (aFaceRegion >= 4.0 && aFaceRegion <= 4.9);
    bool isRightEye = (aFaceRegion >= 5.0 && aFaceRegion <= 5.9);
    bool isEye = isLeftEye || isRightEye;
    bool isIris = (aParticleType >= 2.0 && aParticleType <= 2.9);
    
    if (isEye) {
      float eyeSide = isLeftEye ? -1.0 : 1.0;
      vec3 eyeCenter = vec3(eyeSide * 0.42, 0.35, 0.82);
      vec3 toEye = finalPos - eyeCenter;
      float eyeDist = length(toEye.xy);
      
      float eyeClose = uBlinkAmount;
      if (eyeDist < 0.18) {
        toEye.y *= (1.0 - eyeClose);
        if (isIris) {
          toEye.xy += uEyeTarget * 0.04 * (1.0 - eyeClose);
        }
      }
      
      finalPos = eyeCenter + toEye;
    }
    
    vec3 mvPosition = (modelViewMatrix * vec4(finalPos, 1.0)).xyz;
    
    float baseSize = 2.8;
    float regionSize = 1.0;
    
    if (aFaceRegion >= 4.0 && aFaceRegion <= 5.9) regionSize = 1.45;
    if (isIris) regionSize = 2.1;
    if (aFaceRegion >= 8.0 && aFaceRegion <= 9.9) regionSize = 1.25;
    if (aFaceRegion >= 10.0) regionSize = 1.55;
    
    vSize = baseSize * regionSize;
    
    if (uState == STATE_LISTENING) vSize *= (1.0 + uGlowIntensity * 0.3);
    if (uState == STATE_SPEAKING) vSize *= (1.0 + uGlowIntensity * 0.25);
    if (uState == STATE_THINKING) vSize *= 0.85;
    if (uIntroProgress < 1.0) vSize *= (0.6 + introEase * 0.4);
    
    gl_PointSize = vSize * (300.0 / -mvPosition.z);
    
    vec3 idleColor = hsv2rgb(vec3(0.515, 0.92, 1.0));
    vec3 listenColor = hsv2rgb(vec3(0.505, 1.0, 1.0));
    vec3 thinkingColor = hsv2rgb(vec3(0.52, 0.90, 1.0));
    vec3 speakingColor = hsv2rgb(vec3(0.51, 0.95, 1.0));
    vec3 irisColor = hsv2rgb(vec3(0.505, 1.0, 1.0));
    vec3 lipColor = hsv2rgb(vec3(0.515, 0.88, 1.0));
    
    vec3 stateColor;
    if (uState == STATE_IDLE) stateColor = idleColor;
    else if (uState == STATE_LISTENING) stateColor = listenColor;
    else if (uState == STATE_THINKING) stateColor = thinkingColor;
    else stateColor = speakingColor;
    
    if (isIris) {
      float irisBrightness = 1.35;
      if (uState == STATE_LISTENING) irisBrightness = 2.0;
      if (uState == STATE_SPEAKING) irisBrightness = 1.7;
      vColor = irisColor * irisBrightness;
      vGlow = 3.0;
    } else if (isMouth) {
      vColor = mix(lipColor, stateColor, 0.5);
      vGlow = uState == STATE_SPEAKING ? 2.2 : 1.1;
    } else {
      float colorMix = 0.22 + uGlowIntensity * 0.55;
      float seedTint = (aRandomSeed - 0.5) * 0.025;
      vColor = mix(
        hsv2rgb(vec3(0.512 + seedTint, 0.82 + aRandomSeed * 0.12, 0.92 + aRandomSeed * 0.08)),
        stateColor,
        colorMix
      );
      vGlow = 0.75 + uGlowIntensity * 1.5;
    }
    
    if (uState == STATE_THINKING) {
      vColor = mix(vColor, hsv2rgb(vec3(0.515 + sin(uTime + aRandomSeed * 10.0) * 0.03, 0.90, 1.0)), 0.55);
      vGlow = 1.5;
    }
    
    vDepth = -mvPosition.z;
    gl_Position = projectionMatrix * vec4(mvPosition, 1.0);
  }
`;

export const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uIntroProgress;
  uniform float uAudioAmp;
  uniform float uState;
  uniform float uGlowIntensity;
  
  varying float vParticleType;
  varying float vFaceRegion;
  varying float vRandomSeed;
  varying float vDepth;
  varying float vGlow;
  varying vec3 vColor;
  varying float vSize;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) discard;
    
    float softness = 1.0 - smoothstep(0.25, 0.5, dist);
    float core = 1.0 - smoothstep(0.0, 0.22, dist);
    
    vec3 color = vColor;
    
    float glowAmount = vGlow * (0.9 + uGlowIntensity * 0.7);
    
    vec3 finalColor = color;
    float finalAlpha = softness * 0.94;
    
    float coreBrightness = 1.0 + core * glowAmount * 1.0;
    finalColor *= coreBrightness;
    
    finalColor += color * softness * glowAmount * 0.65;
    
    float depthFade = smoothstep(2.0, 8.0, vDepth);
    depthFade = mix(0.45, 1.0, depthFade);
    finalAlpha *= depthFade;
    
    if (uIntroProgress < 1.0) {
      float flicker = sin(uTime * 20.0 + vRandomSeed * 50.0) * 0.5 + 0.5;
      finalAlpha *= mix(flicker * 0.5 + 0.5, 1.0, uIntroProgress);
    }
    
    if (uState == STATE_THINKING) {
      float swirl = sin(atan(center.y, center.x) * 8.0 + uTime * 10.0 + vRandomSeed * 15.0) * 0.5 + 0.5;
      finalAlpha *= 0.72 + swirl * 0.28;
    }
    
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;
