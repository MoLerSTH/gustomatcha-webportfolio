'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  Orbit,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { FEATURED_PROJECTS, type ProjectItem } from '@/data/portfolioData';
import {
  GustoWorldEngine,
  type EngineTelemetrySnapshot,
} from '@/engine/GustoWorldEngine';
import { SATELLITE_NODE_SPECS } from '@/engine/proceduralShaders';
import { useAudioSync } from '@/hooks/useAudioSync';
import { useBlueprintTheme } from '@/hooks/useBlueprintTheme';
import { NeoBadge, NeoButton, NeoCard } from '@/components/ui/NeoBrutalPrimitives';

const INITIAL_TELEMETRY: EngineTelemetrySnapshot = {
  fps: 60,
  tier: 'high',
  activeNodeId: 'gistda-calval',
  hoveredNodeId: null,
  scrollProgress: 0,
  audioLevel: 0,
  overclockMode: false,
};

/**
 * Decoupled Pure Three.js Interactive Stage (`GustoWorldEngine` host).
 * Combines 60 FPS procedural WebGL rendering with keyboard-accessible
 * satellite node controls and real-time telemetry inspection.
 */
export function GustoCanvasStage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<GustoWorldEngine | null>(null);

  const { isOverclock, toggleOverclock } = useBlueprintTheme();
  const { audioEnabled, toggleAudioSync, sampleAudio, triggerSynthNote } =
    useAudioSync();

  const [selectedProjectId, setSelectedProjectId] =
    useState<string>('gistda-calval');
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [telemetry, setTelemetry] =
    useState<EngineTelemetrySnapshot>(INITIAL_TELEMETRY);

  // Mount Pure Three.js Engine once via useRef and dispose deterministically on unmount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const engine = new GustoWorldEngine(container, {
      onSelectProject: (projectId) => {
        setSelectedProjectId(projectId);
        triggerSynthNote(329.63, 0.18);
      },
      onHoverProject: (projectId) => {
        setHoveredProjectId(projectId);
      },
      onCoreRapidClick: () => {
        toggleOverclock();
        triggerSynthNote(523.25, 0.32);
      },
      onTelemetryUpdate: (snapshot) => {
        setTelemetry(snapshot);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [toggleOverclock, triggerSynthNote]);

  // Synchronize Blueprint / Overclock mode into 3D shader & wireframe uniforms
  useEffect(() => {
    engineRef.current?.setOverclockMode(isOverclock);
  }, [isOverclock]);

  // Feed Web Audio API frequency envelope into 3D engine only while active
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (!audioEnabled) {
      engine.setAudioPulseLevel(0);
      return;
    }

    let rafId = 0;
    const updateAudioUniform = (nowMs: number) => {
      const snap = sampleAudio(nowMs / 1000);
      engine.setAudioPulseLevel(snap.overall);
      rafId = window.requestAnimationFrame(updateAudioUniform);
    };
    rafId = window.requestAnimationFrame(updateAudioUniform);

    return () => {
      window.cancelAnimationFrame(rafId);
      engine.setAudioPulseLevel(0);
    };
  }, [audioEnabled, sampleAudio]);

  const handleSelectNode = (projectId: string) => {
    setSelectedProjectId(projectId);
    engineRef.current?.focusProjectNode(projectId);
    triggerSynthNote(293.66, 0.16);
  };

  const activeProject: ProjectItem =
    FEATURED_PROJECTS.find((p) => p.id === selectedProjectId) ??
    FEATURED_PROJECTS[0];

  const hoveredSpec = SATELLITE_NODE_SPECS.find(
    (s) => s.projectId === hoveredProjectId
  );

  return (
    <div className="space-y-5">
      <NeoCard
        variant="white"
        headerVariant={activeProject.accent}
        windowTitle="GUSTO_WORLD_ENGINE // PURE_THREEJS_PROCEDURAL"
        windowTag={`${telemetry.fps} FPS • TIER: ${telemetry.tier.toUpperCase()}`}
        bodyClassName="p-0"
      >
        {/* 3D WebGL Canvas Viewport with CSS Containment */}
        <div className="relative h-[380px] sm:h-[430px] w-full neo-stage-contain neo-grid-bg border-b-[3px] border-[var(--ui-border-color)] overflow-hidden">
          <div ref={containerRef} className="h-full w-full" />

          {/* Top-Left Live Telemetry HUD */}
          <div className="pointer-events-none absolute top-3 left-3 flex flex-wrap items-center gap-2">
            <NeoBadge variant="yellow" pulseDot dotVariant="mint">
              <span className="inline-flex items-center gap-1.5">
                <Activity className="size-3.5" aria-hidden="true" />
                {telemetry.fps} FPS // DPR &lt;= 2
              </span>
            </NeoBadge>
            <NeoBadge variant="white">
              SCROLL: {Math.round(telemetry.scrollProgress * 100)}%
            </NeoBadge>
          </div>

          {/* Top-Right Interactive Audio & Shockwave Controls */}
          <div className="absolute top-3 right-3 flex flex-wrap items-center gap-2">
            <NeoButton
              variant={audioEnabled ? 'mint' : 'white'}
              size="sm"
              onClick={() => void toggleAudioSync()}
              leftIcon={
                audioEnabled ? (
                  <Volume2 className="size-3.5" />
                ) : (
                  <VolumeX className="size-3.5" />
                )
              }
            >
              [AUDIO_SYNC: {audioEnabled ? 'ON' : 'OFF'}]
            </NeoButton>
            <NeoButton
              variant="coral"
              size="sm"
              onClick={() => {
                engineRef.current?.triggerShockwave('#FF5D8F');
                triggerSynthNote(392.0, 0.22);
              }}
              leftIcon={<Sparkles className="size-3.5" />}
            >
              PULSE_CORE
            </NeoButton>
          </div>

          {/* Bottom Hover / Raycast Status Banner */}
          <div className="pointer-events-none absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 font-mono text-xs">
            <span className="border-2 border-[var(--ui-border-color)] bg-[var(--bg-canvas)] px-2.5 py-1 font-bold shadow-[3px_3px_0px_var(--ui-shadow-color)]">
              {hoveredSpec
                ? `RAYCAST LOCK -> ${hoveredSpec.label}`
                : 'CLICK SATELLITES FOR PROJECTS // 5x CLICK CORE FOR OVERCLOCK'}
            </span>
          </div>
        </div>

        {/* Accessible Keyboard & Pointer Satellite Node Selector Bar */}
        <div className="p-4 sm:p-5 bg-[var(--bg-surface)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-xs">
            <span className="inline-flex items-center gap-1.5 font-bold">
              <Orbit className="size-4" aria-hidden="true" />
              ORBITAL PROJECT NODES (3D RAYCAST + KEYBOARD SYNC):
            </span>
            <span className="text-[var(--ink-muted)]">
              ACTIVE: {activeProject.orbitalNodeLabel}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {FEATURED_PROJECTS.map((project) => {
              const isSelected = project.id === activeProject.id;
              return (
                <NeoButton
                  key={project.id}
                  variant={isSelected ? project.accent : 'white'}
                  size="sm"
                  onClick={() => handleSelectNode(project.id)}
                  leftIcon={<Radio className="size-3.5" />}
                  className="w-full justify-start text-left"
                >
                  {`0${project.highlightOrder} // ${project.title.split('—')[0].trim()}`}
                </NeoButton>
              );
            })}
          </div>

          {/* Active Satellite Project Inspector */}
          <div
            role="status"
            aria-live="polite"
            className="neo-border bg-[var(--bg-canvas)] p-4 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <NeoBadge variant={activeProject.accent}>
                {activeProject.orbitalNodeLabel}
              </NeoBadge>
              <span className="font-mono text-xs font-bold text-[var(--ink-muted)]">
                {activeProject.role}
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {activeProject.title}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed">
                {activeProject.summary}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 font-mono text-xs">
              {activeProject.metrics.map((metric) => (
                <div
                  key={metric.label}
                  className="border-2 border-[var(--ui-border-color)] bg-[var(--bg-surface)] p-2"
                >
                  <div className="text-[10px] text-[var(--ink-muted)] truncate">
                    {metric.label}
                  </div>
                  <div className="font-bold truncate">{metric.value}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {activeProject.techStack.slice(0, 5).map((tech) => (
                  <span
                    key={tech}
                    className="border border-[var(--ui-border-color)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[11px] font-semibold"
                  >
                    {tech}
                  </span>
                ))}
              </div>
              <NeoButton
                href="#projects"
                variant={activeProject.accent}
                size="sm"
                rightIcon={<ArrowUpRight className="size-3.5" />}
              >
                INSPECT CARD
              </NeoButton>
            </div>
          </div>
        </div>
      </NeoCard>
    </div>
  );
}
