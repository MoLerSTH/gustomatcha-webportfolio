'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  AudioReactiveController,
  type AudioFrequencySnapshot,
} from '@/engine/AudioReactiveController';

const AUDIO_EVENT = 'gusto:audio-sync-change';

let sharedController: AudioReactiveController | null = null;

export function getSharedAudioController(): AudioReactiveController {
  if (!sharedController) {
    sharedController = new AudioReactiveController();
  }
  return sharedController;
}

/**
 * Synchronized hook connecting navbar and 3D stage `[AUDIO_SYNC: ON/OFF]`
 * controls to the singleton `AudioReactiveController`.
 */
export function useAudioSync() {
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    const syncState = () => {
      setAudioEnabled(getSharedAudioController().isEnabled());
    };
    syncState();
    window.addEventListener(AUDIO_EVENT, syncState);
    return () => window.removeEventListener(AUDIO_EVENT, syncState);
  }, []);

  const toggleAudioSync = useCallback(async () => {
    const controller = getSharedAudioController();
    const next = await controller.toggle();
    if (next) {
      controller.triggerSynthPulse(261.63, 0.22);
    }
    window.dispatchEvent(new Event(AUDIO_EVENT));
    return next;
  }, []);

  const sampleAudio = useCallback(
    (elapsedSeconds: number): AudioFrequencySnapshot => {
      return getSharedAudioController().sampleFrequencies(elapsedSeconds);
    },
    []
  );

  const triggerSynthNote = useCallback(
    (freqHz = 220, durationSec = 0.22, waveform: OscillatorType = 'sawtooth') => {
      getSharedAudioController().triggerSynthPulse(freqHz, durationSec, waveform);
    },
    []
  );

  return {
    audioEnabled,
    toggleAudioSync,
    sampleAudio,
    triggerSynthNote,
  };
}
