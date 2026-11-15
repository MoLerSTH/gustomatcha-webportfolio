export const CORE_VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  uniform float uPointerVelocity;
  uniform float uAudioPulse;
  uniform float uShockwave;
  uniform float uAssemblyProgress;
  uniform float uMotionScale;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    vNormal = normalize(normalMatrix * normal);

    float waveA = sin(position.x * 3.2 + uTime * 2.1) * cos(position.y * 2.8 - uTime * 1.7);
    float waveB = sin(position.z * 4.0 + uTime * 2.6 + uShockwave * 6.28318);
    float combinedWave = (waveA * 0.65 + waveB * 0.35);

    float dynamicAmplitude = (0.06 + uPointerVelocity * 0.14 + uAudioPulse * 0.18 + uShockwave * 0.22) * uMotionScale;
    float displacement = combinedWave * dynamicAmplitude * uAssemblyProgress;
    vDisplacement = displacement;

    vec3 morphedPosition = position + normal * displacement;
    vec4 worldPosition = modelMatrix * vec4(morphedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const CORE_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform vec3 uAccentColor;
  uniform vec3 uInkColor;
  uniform float uOverclockMode;
  uniform float uTime;
  uniform float uAudioPulse;
  uniform float uShockwave;

  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying float vDisplacement;

  void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vec3(0.65, 0.85, 0.75));
    vec3 viewDir = normalize(vec3(0.0, 0.0, 1.0));

    float ndotl = dot(normal, lightDir);
    float rim = 1.0 - max(0.0, dot(normal, viewDir));

    // Stepped Neo-Brutalist Cel Shading Bands
    vec3 surfaceColor = uPrimaryColor;
    if (ndotl > 0.58) {
      surfaceColor = mix(uPrimaryColor, uSecondaryColor, 0.55 + uAudioPulse * 0.35);
    } else if (ndotl < -0.15) {
      surfaceColor = mix(uAccentColor, uInkColor, 0.28);
    }

    // Displacement & Shockwave Energy Bands
    float energyBand = smoothstep(0.03, 0.14, abs(vDisplacement) + uShockwave * 0.15);
    surfaceColor = mix(surfaceColor, uSecondaryColor, energyBand * 0.65);

    if (uOverclockMode > 0.5) {
      // Blueprint / Wireframe Dimension Mode
      float scanline = step(0.45, fract(vWorldPosition.y * 7.5 - uTime * 1.8));
      vec3 blueprintBase = vec3(0.02, 0.06, 0.12);
      vec3 neonMint = vec3(0.0, 0.96, 0.83);
      vec3 electricYellow = vec3(1.0, 0.9, 0.0);

      vec3 wireGlow = mix(neonMint, electricYellow, energyBand);
      float rimEdge = step(0.56, rim);
      vec3 finalOverclock = mix(blueprintBase, wireGlow, max(rimEdge, scanline * 0.42));
      gl_FragColor = vec4(finalOverclock, 1.0);
      return;
    }

    // Hard Pitch-Black Neo-Brutalist Ink Rim Outline
    if (rim > 0.72) {
      surfaceColor = uInkColor;
    }

    gl_FragColor = vec4(surfaceColor, 1.0);
  }
`;

export interface SatelliteNodeSpec {
  projectId: string;
  highlightOrder: 1 | 2 | 3;
  label: string;
  shortTag: string;
  colorHex: string;
  orbitRadius: number;
  orbitSpeed: number;
  orbitTilt: number;
  phaseOffset: number;
  geometryType: 'octahedron' | 'dodecahedron' | 'tetrahedron';
}

export const SATELLITE_NODE_SPECS: SatelliteNodeSpec[] = [
  {
    projectId: 'gistda-calval',
    highlightOrder: 1,
    label: 'NODE_01 // THEOS_CALVAL',
    shortTag: 'GISTDA SATELLITE',
    colorHex: '#FFE600',
    orbitRadius: 2.35,
    orbitSpeed: 0.55,
    orbitTilt: 0.42,
    phaseOffset: 0.2,
    geometryType: 'octahedron',
  },
  {
    projectId: 'kbtg-anti-scam',
    highlightOrder: 2,
    label: 'NODE_02 // RISK_ENGINE',
    shortTag: 'KBTG ANTI-SCAM',
    colorHex: '#00F5D4',
    orbitRadius: 2.65,
    orbitSpeed: 0.46,
    orbitTilt: -0.52,
    phaseOffset: 2.3,
    geometryType: 'dodecahedron',
  },
  {
    projectId: 'ropa2077-assignier',
    highlightOrder: 3,
    label: 'NODE_03 // ASSIGNIER_AI',
    shortTag: 'ROPA2077 / OCR AI',
    colorHex: '#FF5D8F',
    orbitRadius: 2.5,
    orbitSpeed: 0.62,
    orbitTilt: 0.68,
    phaseOffset: 4.35,
    geometryType: 'tetrahedron',
  },
];

/**
 * Pure 3D orbital position calculator for the 3 project satellite nodes.
 */
export function computeSatelliteWorldPosition(
  spec: SatelliteNodeSpec,
  elapsedSeconds: number,
  expansionScale = 1
): { x: number; y: number; z: number } {
  const angle = elapsedSeconds * spec.orbitSpeed + spec.phaseOffset;
  const radius = spec.orbitRadius * expansionScale;

  const flatX = Math.cos(angle) * radius;
  const flatZ = Math.sin(angle) * radius;
  const y = Math.sin(angle * 1.5 + spec.phaseOffset) * Math.sin(spec.orbitTilt) * (radius * 0.48);

  return {
    x: Number(flatX.toFixed(5)),
    y: Number(y.toFixed(5)),
    z: Number(flatZ.toFixed(5)),
  };
}
