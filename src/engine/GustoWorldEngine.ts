import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  computeQualityProfile,
  RollingFpsMonitor,
  type EngineQualityProfile,
  type PerformanceTier,
} from './AdaptivePerformanceManager';
import {
  CORE_FRAGMENT_SHADER,
  CORE_VERTEX_SHADER,
  SATELLITE_NODE_SPECS,
  computeSatelliteWorldPosition,
  type SatelliteNodeSpec,
} from './proceduralShaders';

export interface ScrollChoreographyState {
  cameraZ: number;
  cameraY: number;
  coreRotationY: number;
  coreRotationX: number;
  wireframeScale: number;
  ringExpansion: number;
}

export interface AssemblyVisualState {
  coreScale: number;
  wireframeExpansion: number;
  ringAssemblyScale: number;
  satelliteOrbitFactor: number;
  solidFillMix: number;
}

export interface EngineTelemetrySnapshot {
  fps: number;
  tier: PerformanceTier;
  activeNodeId: string | null;
  hoveredNodeId: string | null;
  scrollProgress: number;
  audioLevel: number;
  overclockMode: boolean;
  assemblyProgress: number;
}

export interface GustoEngineCallbacks {
  onSelectProject?: (projectId: string) => void;
  onHoverProject?: (projectId: string | null) => void;
  onCoreRapidClick?: () => void;
  onTelemetryUpdate?: (telemetry: EngineTelemetrySnapshot) => void;
}

export interface GustoEngineOptions {
  initialAssemblyProgress?: number;
}

function clampUnit(value: number): number {
  const safe = Number.isFinite(value) ? value : 0;
  return Math.max(0, Math.min(1, safe));
}

/**
 * Detects N rapid clicks within a rolling millisecond window (used for the
 * 5x central core click trigger that unlocks GUSTO_OVERCLOCK).
 */
export class RapidClickDetector {
  private readonly requiredClicks: number;
  private readonly windowMs: number;
  private readonly onTrigger: () => void;
  private clickTimestamps: number[] = [];

  constructor(requiredClicks = 5, windowMs = 1800, onTrigger: () => void = () => {}) {
    this.requiredClicks = Math.max(2, requiredClicks);
    this.windowMs = Math.max(200, windowMs);
    this.onTrigger = onTrigger;
  }

  public registerClick(nowMs = Date.now()): boolean {
    this.clickTimestamps = this.clickTimestamps.filter(
      (timestamp) => nowMs - timestamp <= this.windowMs
    );
    this.clickTimestamps.push(nowMs);

    if (this.clickTimestamps.length >= this.requiredClicks) {
      this.clickTimestamps = [];
      this.onTrigger();
      return true;
    }
    return false;
  }

  public reset(): void {
    this.clickTimestamps = [];
  }
}

/**
 * Pure mathematical scroll choreography mapper translating normalized page scroll [0..1]
 * into camera depth, elevation, core rotation, and orbital ring disassembly.
 */
export function computeScrollChoreographyState(
  scrollProgress01: number
): ScrollChoreographyState {
  const clamped = Math.max(0, Math.min(1, Number.isFinite(scrollProgress01) ? scrollProgress01 : 0));
  const smooth = clamped * clamped * (3 - 2 * clamped);

  return {
    cameraZ: Number((5.6 - Math.sin(smooth * Math.PI) * 0.65 + smooth * 0.45).toFixed(4)),
    cameraY: Number((Math.sin(smooth * Math.PI * 2) * 0.35).toFixed(4)),
    coreRotationY: Number((smooth * Math.PI * 1.65).toFixed(4)),
    coreRotationX: Number((smooth * Math.PI * 0.75).toFixed(4)),
    wireframeScale: Number((1 + Math.sin(smooth * Math.PI) * 0.24).toFixed(4)),
    ringExpansion: Number((1 + smooth * 0.42).toFixed(4)),
  };
}

/**
 * Pure wireframe-to-solid assembly choreography mapper translating [0..1]
 * boot progress into core scale, wireframe shell contraction, orbital ring
 * convergence, satellite pull-in, and fragment solid-fill mix.
 */
export function computeAssemblyVisualState(
  assemblyProgress01: number
): AssemblyVisualState {
  const clamped = Math.max(
    0,
    Math.min(1, Number.isFinite(assemblyProgress01) ? assemblyProgress01 : 0)
  );
  const smooth = clamped * clamped * (3 - 2 * clamped);

  return {
    coreScale: Number((0.38 + 0.62 * smooth).toFixed(4)),
    wireframeExpansion: Number((1.55 - 0.55 * smooth).toFixed(4)),
    ringAssemblyScale: Number((0.55 + 0.45 * smooth).toFixed(4)),
    satelliteOrbitFactor: Number((1.45 - 0.45 * smooth).toFixed(4)),
    solidFillMix: Number(smooth.toFixed(4)),
  };
}

export type StageCursorState = 'crosshair' | 'pointer';

/**
 * Synchronizes 3D stage cursor feedback via `data-cursor` instead of inline
 * `style.cursor` so CSS theme tokens and High Contrast rules stay authoritative.
 */
export function applyContainerCursorState(
  container: Partial<Pick<HTMLElement, 'dataset'>> | null | undefined,
  state: StageCursorState | null
): void {
  const dataset = container?.dataset;
  if (!dataset) return;
  if (state === null) {
    delete dataset.cursor;
  } else {
    dataset.cursor = state;
  }
}

interface ContentVisibilityEvent extends Event {
  readonly skipped?: boolean;
}

/**
 * Decoupled 100% Procedural Pure Three.js Engine (`GustoWorldEngine`).
 * Mounted via `useRef` outside React's render loop to maintain a locked 60 FPS.
 */
export class GustoWorldEngine {
  private readonly container: HTMLElement;
  private readonly callbacks: GustoEngineCallbacks;
  private quality: EngineQualityProfile;
  private readonly fpsMonitor = new RollingFpsMonitor(45);
  private readonly coreClickDetector: RapidClickDetector;

  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  private sculptureRoot: THREE.Group | null = null;
  private coreMesh: THREE.Mesh<THREE.IcosahedronGeometry, THREE.ShaderMaterial> | null = null;
  private wireframeGroup: THREE.Group | null = null;
  private wireframeLinesMat: THREE.LineBasicMaterial | null = null;
  private orbitalRings: THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>[] = [];
  private satelliteNodes: Map<
    string,
    {
      spec: SatelliteNodeSpec;
      group: THREE.Group;
      hullMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial>;
      outlineLines: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
      orbiterMesh: THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>;
    }
  > = new Map();
  private interactiveMeshes: THREE.Object3D[] = [];
  private particlePoints: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> | null = null;

  private readonly raycaster = new THREE.Raycaster();
  private readonly pointerNdc = new THREE.Vector2(0, 0);
  private readonly smoothedPointer = new THREE.Vector2(0, 0);
  private pointerVelocity = 0;
  private hasPointerInside = false;

  private cachedRect: DOMRect | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  private scrollTriggerInstance: ScrollTrigger | null = null;

  private rafId: number | null = null;
  private isPaused = false;
  private isDisposed = false;
  private lastFrameTimeMs = 0;
  private elapsedSeconds = 0;
  private lastTelemetryEmitMs = 0;

  private assemblyProgress = 1;
  private overclockMode = false;
  private audioPulseLevel = 0;
  private shockwaveIntensity = 0;
  private scrollProgress = 0;
  private selectedProjectId: string | null = 'gistda-calval';
  private hoveredProjectId: string | null = null;

  public constructor(
    container: HTMLElement,
    callbacks: GustoEngineCallbacks = {},
    options: GustoEngineOptions = {}
  ) {
    this.container = container;
    this.callbacks = callbacks;
    applyContainerCursorState(this.container, 'crosshair');
    this.setAssemblyProgress(options.initialAssemblyProgress ?? 1);
    this.quality = computeQualityProfile();
    this.coreClickDetector = new RapidClickDetector(5, 1800, () => {
      this.triggerShockwave('#00F5D4');
      this.callbacks.onCoreRapidClick?.();
    });

    if (typeof window !== 'undefined') {
      this.initEngine();
    }
  }

  private initEngine(): void {
    const width = Math.max(1, this.container.clientWidth || 640);
    const height = Math.max(1, this.container.clientHeight || 480);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 5.6);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: this.quality.tier !== 'low',
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    const gl = renderer.getContext();
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const gpuRenderer = debugInfo
      ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '')
      : '';
    this.quality = computeQualityProfile({ gpuRenderer });

    renderer.setPixelRatio(this.quality.pixelRatio);
    renderer.setSize(width, height, false);
    renderer.domElement.className = 'block w-full h-full select-none touch-pan-y';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    this.container.appendChild(renderer.domElement);

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.buildLighting(scene);
    this.buildProceduralSculpture(scene);
    this.updateCachedBounds();
    this.bindEvents();
    this.setupScrollChoreography();

    const isRootOverclock =
      document.documentElement.getAttribute('data-theme') === 'overclock';
    if (isRootOverclock) {
      this.setOverclockMode(true);
    }

    this.lastFrameTimeMs = performance.now();
    this.startLoop();
  }

  private buildLighting(scene: THREE.Scene): void {
    const ambientLight = new THREE.AmbientLight('#FFFFFF', 1.35);
    const keyLight = new THREE.DirectionalLight('#FFFFFF', 2.2);
    keyLight.position.set(4, 6, 5);

    const rimLight = new THREE.DirectionalLight('#00F5D4', 1.25);
    rimLight.position.set(-5, -3, 2);

    scene.add(ambientLight, keyLight, rimLight);
  }

  private buildProceduralSculpture(scene: THREE.Scene): void {
    const root = new THREE.Group();
    scene.add(root);
    this.sculptureRoot = root;

    // 1. Central Morphing Icosahedron Core (Custom GLSL ShaderMaterial)
    const coreGeo = new THREE.IcosahedronGeometry(1.08, this.quality.coreSubdivisions);
    const coreMat = new THREE.ShaderMaterial({
      vertexShader: CORE_VERTEX_SHADER,
      fragmentShader: CORE_FRAGMENT_SHADER,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uPointerVelocity: { value: 0 },
        uAudioPulse: { value: 0 },
        uShockwave: { value: 0 },
        uAssemblyProgress: { value: this.assemblyProgress },
        uMotionScale: { value: this.quality.motionScale },
        uPrimaryColor: { value: new THREE.Color('#FFE600') },
        uSecondaryColor: { value: new THREE.Color('#00F5D4') },
        uAccentColor: { value: new THREE.Color('#FF5D8F') },
        uInkColor: { value: new THREE.Color('#0A0A0A') },
        uOverclockMode: { value: 0 },
      },
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.userData = { role: 'core' };
    root.add(coreMesh);
    this.coreMesh = coreMesh;
    this.interactiveMeshes.push(coreMesh);

    // 2. Outer Brutalist Wireframe Cage + Vertex Anchor Nodes
    const wireGroup = new THREE.Group();
    const cageSourceGeo = new THREE.IcosahedronGeometry(
      1.42,
      this.quality.wireframeSubdivisions
    );
    const cageEdgesGeo = new THREE.EdgesGeometry(cageSourceGeo);
    cageSourceGeo.dispose();

    const wireMat = new THREE.LineBasicMaterial({
      color: '#0A0A0A',
      linewidth: 2,
    });
    const wireSegments = new THREE.LineSegments(cageEdgesGeo, wireMat);
    wireGroup.add(wireSegments);
    root.add(wireGroup);
    this.wireframeGroup = wireGroup;
    this.wireframeLinesMat = wireMat;

    // 3. Gyroscopic Orbital Rings
    const ringConfigs = [
      { radius: 1.78, tube: 0.022, color: '#0A0A0A', rotX: 1.1, rotY: 0.2 },
      { radius: 2.08, tube: 0.02, color: '#3A86FF', rotX: -0.65, rotY: 0.85 },
      { radius: 2.38, tube: 0.018, color: '#FF5D8F', rotX: 0.35, rotY: -1.1 },
    ];

    ringConfigs.forEach((cfg) => {
      const torusGeo = new THREE.TorusGeometry(
        cfg.radius,
        cfg.tube,
        12,
        this.quality.torusTubularSegments
      );
      const torusMat = new THREE.MeshBasicMaterial({ color: cfg.color });
      const ringMesh = new THREE.Mesh(torusGeo, torusMat);
      ringMesh.rotation.set(cfg.rotX, cfg.rotY, 0);
      root.add(ringMesh);
      this.orbitalRings.push(ringMesh);
    });

    // 4. Three Clickable Satellite Project Nodes
    SATELLITE_NODE_SPECS.forEach((spec) => {
      const satGroup = new THREE.Group();
      satGroup.userData = {
        role: 'satellite',
        projectId: spec.projectId,
        label: spec.label,
      };

      const hullGeo =
        spec.geometryType === 'octahedron'
          ? new THREE.OctahedronGeometry(0.28, 0)
          : spec.geometryType === 'dodecahedron'
            ? new THREE.DodecahedronGeometry(0.26, 0)
            : new THREE.TetrahedronGeometry(0.3, 0);

      const hullMat = new THREE.MeshStandardMaterial({
        color: spec.colorHex,
        roughness: 0.25,
        metalness: 0.15,
        emissive: spec.colorHex,
        emissiveIntensity: 0.18,
      });
      const hullMesh = new THREE.Mesh(hullGeo, hullMat);
      hullMesh.userData = {
        role: 'satellite',
        projectId: spec.projectId,
        label: spec.label,
      };

      const hullEdges = new THREE.EdgesGeometry(hullGeo);
      const outlineMat = new THREE.LineBasicMaterial({ color: '#0A0A0A' });
      const outlineLines = new THREE.LineSegments(hullEdges, outlineMat);
      hullMesh.add(outlineLines);

      const orbiterGeo = new THREE.BoxGeometry(0.11, 0.11, 0.11);
      const orbiterMat = new THREE.MeshBasicMaterial({ color: '#0A0A0A' });
      const orbiterMesh = new THREE.Mesh(orbiterGeo, orbiterMat);
      orbiterMesh.position.set(0.42, 0, 0);
      orbiterMesh.userData = {
        role: 'satellite',
        projectId: spec.projectId,
        label: spec.label,
      };

      satGroup.add(hullMesh, orbiterMesh);
      const initialPos = computeSatelliteWorldPosition(spec, 0, 1);
      satGroup.position.set(initialPos.x, initialPos.y, initialPos.z);

      root.add(satGroup);
      this.satelliteNodes.set(spec.projectId, {
        spec,
        group: satGroup,
        hullMesh,
        outlineLines,
        orbiterMesh,
      });
      this.interactiveMeshes.push(hullMesh, orbiterMesh);
    });

    // 5. Procedural Telemetry Point Cloud
    const count = this.quality.particleCount;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = (i / count) * Math.PI * 2 * 7;
      const phi = Math.acos(1 - (2 * (i + 0.5)) / count);
      const r = 2.75 + (i % 5) * 0.22;
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: '#0A0A0A',
      size: 0.045,
    });
    const points = new THREE.Points(particleGeo, particleMat);
    root.add(points);
    this.particlePoints = points;
  }

  private updateCachedBounds = (): void => {
    if (this.isDisposed || !this.renderer) return;
    this.cachedRect = this.container.getBoundingClientRect();
  };

  private handleResize = (): void => {
    if (this.isDisposed || !this.renderer || !this.camera) return;
    this.updateCachedBounds();
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.isDisposed) return;
    const rect = this.cachedRect ?? this.container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const nextX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const nextY = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    const dx = nextX - this.pointerNdc.x;
    const dy = nextY - this.pointerNdc.y;
    const speed = Math.sqrt(dx * dx + dy * dy);

    this.pointerVelocity = Math.min(1.5, this.pointerVelocity + speed * 2.2);
    this.pointerNdc.set(nextX, nextY);
    this.hasPointerInside = true;

    this.updateRaycastHover();
  };

  private handlePointerLeave = (): void => {
    if (this.isDisposed) return;
    this.hasPointerInside = false;
    applyContainerCursorState(this.container, 'crosshair');
    if (this.hoveredProjectId !== null) {
      this.hoveredProjectId = null;
      this.callbacks.onHoverProject?.(null);
    }
  };

  private handleClick = (event: MouseEvent): void => {
    if (this.isDisposed || !this.camera) return;
    const rect = this.cachedRect ?? this.container.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    this.pointerNdc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveMeshes, false);

    if (hits.length === 0) return;
    const topHit = hits[0].object;
    const role = topHit.userData?.role as string | undefined;

    if (role === 'satellite') {
      const projectId = topHit.userData?.projectId as string | undefined;
      if (projectId) {
        this.focusProjectNode(projectId);
        const node = this.satelliteNodes.get(projectId);
        this.triggerShockwave(node?.spec.colorHex ?? '#FFE600');
        this.callbacks.onSelectProject?.(projectId);
      }
      return;
    }

    if (role === 'core') {
      this.triggerShockwave('#FFE600');
      this.coreClickDetector.registerClick(Date.now());
    }
  };

  private updateRaycastHover(): void {
    if (!this.camera || !this.hasPointerInside) return;

    this.raycaster.setFromCamera(this.pointerNdc, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactiveMeshes, false);

    let nextHoveredId: string | null = null;
    let isInteractiveHit = false;

    if (hits.length > 0) {
      const hitObj = hits[0].object;
      isInteractiveHit = true;
      if (hitObj.userData?.role === 'satellite') {
        nextHoveredId = (hitObj.userData.projectId as string) ?? null;
      }
    }

    applyContainerCursorState(this.container, isInteractiveHit ? 'pointer' : 'crosshair');

    if (nextHoveredId !== this.hoveredProjectId) {
      this.hoveredProjectId = nextHoveredId;
      this.callbacks.onHoverProject?.(nextHoveredId);
    }
  }

  private handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.pause();
    } else {
      this.resume();
    }
  };

  private handleContentVisibilityAutoState = (event: Event): void => {
    const cvEvent = event as ContentVisibilityEvent;
    if (cvEvent.skipped) {
      this.pause();
    } else {
      this.resume();
    }
  };

  private bindEvents(): void {
    this.container.addEventListener('pointermove', this.handlePointerMove, {
      passive: true,
    });
    this.container.addEventListener('pointerleave', this.handlePointerLeave, {
      passive: true,
    });
    this.container.addEventListener('click', this.handleClick);
    this.container.addEventListener(
      'contentvisibilityautostatechange',
      this.handleContentVisibilityAutoState
    );

    window.addEventListener('scroll', this.updateCachedBounds, { passive: true });
    window.addEventListener('resize', this.handleResize, { passive: true });
    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.container);
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.resume();
            } else {
              this.pause();
            }
          }
        },
        { rootMargin: '200px' }
      );
      this.intersectionObserver.observe(this.container);
    }
  }

  private setupScrollChoreography(): void {
    try {
      gsap.registerPlugin(ScrollTrigger);
      this.scrollTriggerInstance = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          this.scrollProgress = Number(self.progress.toFixed(4));
        },
      });
    } catch {
      // Fallback if ScrollTrigger cannot attach in non-DOM environments
    }
  }

  private startLoop(): void {
    if (this.rafId !== null || this.isDisposed) return;
    this.lastFrameTimeMs = performance.now();
    const tick = (nowMs: number) => {
      if (this.isDisposed || this.isPaused) {
        this.rafId = null;
        return;
      }
      this.rafId = window.requestAnimationFrame(tick);
      this.renderFrame(nowMs);
    };
    this.rafId = window.requestAnimationFrame(tick);
  }

  private renderFrame(nowMs: number): void {
    if (!this.renderer || !this.scene || !this.camera || !this.sculptureRoot) {
      return;
    }

    const deltaMs = Math.min(100, Math.max(1, nowMs - this.lastFrameTimeMs));
    this.lastFrameTimeMs = nowMs;
    const deltaSec = deltaMs / 1000;
    this.elapsedSeconds += deltaSec * this.quality.motionScale;

    this.fpsMonitor.recordFrame(deltaMs);
    if (this.fpsMonitor.shouldDowngrade() && this.quality.pixelRatio > 1) {
      this.quality = { ...this.quality, pixelRatio: 1, tier: 'low' };
      this.renderer.setPixelRatio(1);
      this.fpsMonitor.reset();
    }

    // Smooth pointer parallax & velocity decay
    const targetX = this.hasPointerInside ? this.pointerNdc.x : 0;
    const targetY = this.hasPointerInside ? this.pointerNdc.y : 0;
    this.smoothedPointer.x += (targetX - this.smoothedPointer.x) * 0.08;
    this.smoothedPointer.y += (targetY - this.smoothedPointer.y) * 0.08;
    this.pointerVelocity = Math.max(0, this.pointerVelocity * 0.92);
    this.shockwaveIntensity = Math.max(0, this.shockwaveIntensity * 0.91);

    // Scroll & assembly choreography states
    const scrollState = computeScrollChoreographyState(this.scrollProgress);
    const assemblyState = computeAssemblyVisualState(this.assemblyProgress);

    this.camera.position.z += (scrollState.cameraZ - this.camera.position.z) * 0.08;
    this.camera.position.y += (scrollState.cameraY - this.camera.position.y) * 0.08;
    this.camera.lookAt(0, 0, 0);

    // Root rotation combining time, scroll choreography, and pointer parallax
    this.sculptureRoot.rotation.y =
      this.elapsedSeconds * 0.28 +
      scrollState.coreRotationY +
      this.smoothedPointer.x * 0.45 * this.quality.motionScale;
    this.sculptureRoot.rotation.x =
      scrollState.coreRotationX -
      this.smoothedPointer.y * 0.35 * this.quality.motionScale;

    // Core uniforms & audio reactive scale
    if (this.coreMesh) {
      const uniforms = this.coreMesh.material.uniforms;
      uniforms.uTime.value = this.elapsedSeconds;
      uniforms.uPointerVelocity.value = this.pointerVelocity;
      uniforms.uAudioPulse.value = this.audioPulseLevel;
      uniforms.uShockwave.value = this.shockwaveIntensity;
      uniforms.uAssemblyProgress.value = assemblyState.solidFillMix;

      const coreScale =
        assemblyState.coreScale *
        (1 + this.audioPulseLevel * 0.14 + this.shockwaveIntensity * 0.1);
      this.coreMesh.scale.setScalar(coreScale);
    }

    // Counter-rotating outer wireframe shell
    if (this.wireframeGroup) {
      this.wireframeGroup.rotation.y = -this.elapsedSeconds * 0.42;
      this.wireframeGroup.rotation.z = this.elapsedSeconds * 0.21;
      const wireScale =
        scrollState.wireframeScale *
        assemblyState.wireframeExpansion *
        (1 + this.audioPulseLevel * 0.08);
      this.wireframeGroup.scale.setScalar(wireScale);
    }

    // Gyroscopic orbital rings
    this.orbitalRings.forEach((ring, idx) => {
      const dir = idx % 2 === 0 ? 1 : -1;
      ring.rotation.z += deltaSec * 0.38 * dir * this.quality.motionScale;
      ring.rotation.x += deltaSec * 0.16 * dir * this.quality.motionScale;
      ring.scale.setScalar(
        scrollState.ringExpansion *
          assemblyState.ringAssemblyScale *
          (1 + this.audioPulseLevel * 0.06 * (idx + 1))
      );
    });

    // Update 3 orbiting Satellite Project Nodes
    this.satelliteNodes.forEach((node, projectId) => {
      const pos = computeSatelliteWorldPosition(
        node.spec,
        this.elapsedSeconds,
        scrollState.ringExpansion * assemblyState.satelliteOrbitFactor
      );
      node.group.position.set(pos.x, pos.y, pos.z);
      node.hullMesh.rotation.y += deltaSec * 1.2 * this.quality.motionScale;
      node.hullMesh.rotation.x += deltaSec * 0.8 * this.quality.motionScale;

      const orbAngle = this.elapsedSeconds * 2.6 + node.spec.phaseOffset;
      node.orbiterMesh.position.set(
        Math.cos(orbAngle) * 0.44,
        Math.sin(orbAngle * 1.3) * 0.18,
        Math.sin(orbAngle) * 0.44
      );

      const isHovered = this.hoveredProjectId === projectId;
      const isSelected = this.selectedProjectId === projectId;
      const targetScale = isHovered ? 1.38 : isSelected ? 1.18 : 1.0;
      const currentScale = node.group.scale.x;
      node.group.scale.setScalar(currentScale + (targetScale - currentScale) * 0.16);
    });

    if (this.particlePoints) {
      this.particlePoints.rotation.y = -this.elapsedSeconds * 0.09;
    }

    this.renderer.render(this.scene, this.camera);

    if (nowMs - this.lastTelemetryEmitMs >= 250) {
      this.lastTelemetryEmitMs = nowMs;
      this.callbacks.onTelemetryUpdate?.({
        fps: this.fpsMonitor.getAverageFps(),
        tier: this.quality.tier,
        activeNodeId: this.selectedProjectId,
        hoveredNodeId: this.hoveredProjectId,
        scrollProgress: this.scrollProgress,
        audioLevel: this.audioPulseLevel,
        overclockMode: this.overclockMode,
        assemblyProgress: this.assemblyProgress,
      });
    }
  }

  public getAssemblyProgress(): number {
    return this.assemblyProgress;
  }

  public setAssemblyProgress(progress01: number): void {
    this.assemblyProgress = clampUnit(progress01);
  }

  public setOverclockMode(enabled: boolean): void {
    this.overclockMode = enabled;
    if (this.coreMesh) {
      this.coreMesh.material.uniforms.uOverclockMode.value = enabled ? 1.0 : 0.0;
    }
    if (this.wireframeLinesMat) {
      this.wireframeLinesMat.color.set(enabled ? '#00F5D4' : '#0A0A0A');
    }
    if (this.particlePoints) {
      this.particlePoints.material.color.set(enabled ? '#00F5D4' : '#0A0A0A');
    }
    if (this.orbitalRings[0]) {
      this.orbitalRings[0].material.color.set(enabled ? '#FFE600' : '#0A0A0A');
    }
    this.satelliteNodes.forEach((node) => {
      node.outlineLines.material.color.set(enabled ? '#00F5D4' : '#0A0A0A');
      node.orbiterMesh.material.color.set(enabled ? '#FFE600' : '#0A0A0A');
    });
  }

  public setAudioPulseLevel(level01: number): void {
    this.audioPulseLevel = clampUnit(level01);
  }

  public triggerShockwave(accentHex?: string): void {
    this.shockwaveIntensity = 1.0;
    if (accentHex && this.coreMesh) {
      this.coreMesh.material.uniforms.uPrimaryColor.value.set(accentHex);
    }
  }

  public focusProjectNode(projectId: string | null): void {
    this.selectedProjectId = projectId;
    if (projectId) {
      const node = this.satelliteNodes.get(projectId);
      if (node) {
        this.triggerShockwave(node.spec.colorHex);
      }
    }
  }

  public pause(): void {
    this.isPaused = true;
    if (this.rafId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  public resume(): void {
    if (this.isDisposed || !this.isPaused) return;
    this.isPaused = false;
    this.startLoop();
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;
    this.pause();
    applyContainerCursorState(this.container, null);

    this.scrollTriggerInstance?.kill();
    this.scrollTriggerInstance = null;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.intersectionObserver?.disconnect();
    this.intersectionObserver = null;

    if (typeof window !== 'undefined') {
      this.container.removeEventListener('pointermove', this.handlePointerMove);
      this.container.removeEventListener('pointerleave', this.handlePointerLeave);
      this.container.removeEventListener('click', this.handleClick);
      this.container.removeEventListener(
        'contentvisibilityautostatechange',
        this.handleContentVisibilityAutoState
      );
      window.removeEventListener('scroll', this.updateCachedBounds);
      window.removeEventListener('resize', this.handleResize);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }

    if (this.scene) {
      this.scene.traverse((obj) => {
        const meshLike = obj as THREE.Mesh;
        if (meshLike.geometry) {
          meshLike.geometry.dispose();
        }
        if (meshLike.material) {
          if (Array.isArray(meshLike.material)) {
            meshLike.material.forEach((mat) => mat.dispose());
          } else {
            meshLike.material.dispose();
          }
        }
      });
    }

    if (this.renderer) {
      this.renderer.dispose();
      if (this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement);
      }
    }

    this.satelliteNodes.clear();
    this.orbitalRings = [];
    this.interactiveMeshes = [];
    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
