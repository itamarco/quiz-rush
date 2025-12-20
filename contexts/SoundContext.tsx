"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";

type SoundKey =
  | "click"
  | "transition"
  | "questionStart"
  | "questionEnd"
  | "correctAnswer"
  | "incorrectAnswer"
  | "leaderboard"
  | "gameStart"
  | "timerTick";

const soundFiles: Record<SoundKey, string> = {
  click: "/sounds/ui-click.wav",
  transition: "/sounds/ui-transition.wav",
  questionStart: "/sounds/ui-question-start.wav",
  questionEnd: "/sounds/ui-question-end.wav",
  correctAnswer: "/sounds/ui-correct.wav",
  incorrectAnswer: "/sounds/ui-incorrect.wav",
  leaderboard: "/sounds/applause.mp3",
  gameStart: "/sounds/ui-game-start.wav",
  timerTick: "/sounds/ui-timer-tick.wav",
};

const soundVolumes: Partial<Record<SoundKey, number>> = {
  click: 0.4,
  transition: 0.5,
  questionStart: 0.6,
  questionEnd: 0.55,
  correctAnswer: 0.65,
  incorrectAnswer: 0.65,
  leaderboard: 0.6,
  gameStart: 0.65,
  timerTick: 0.5,
};

type Tone = {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  delay?: number;
};

interface SoundContextValue {
  playSound: (sound: SoundKey) => Promise<void>;
  enabled: boolean;
  toggleSound: () => void;
  setEnabled: (enabled: boolean) => void;
}

const soundPresets: Record<SoundKey, Tone[]> = {
  click: [{ frequency: 520, duration: 0.08, type: "square", gain: 0.14 }],
  transition: [
    { frequency: 520, duration: 0.12, gain: 0.16 },
    { frequency: 660, duration: 0.12, gain: 0.14, delay: 0.08 },
  ],
  questionStart: [
    { frequency: 640, duration: 0.18, gain: 0.18 },
    { frequency: 760, duration: 0.16, gain: 0.14, delay: 0.1 },
  ],
  questionEnd: [
    { frequency: 420, duration: 0.16, gain: 0.18 },
    { frequency: 320, duration: 0.12, gain: 0.14, delay: 0.08 },
  ],
  correctAnswer: [
    { frequency: 760, duration: 0.16, gain: 0.18 },
    { frequency: 920, duration: 0.14, gain: 0.16, delay: 0.08 },
  ],
  incorrectAnswer: [
    { frequency: 240, duration: 0.12, type: "sawtooth", gain: 0.18 },
    {
      frequency: 180,
      duration: 0.16,
      type: "sawtooth",
      gain: 0.14,
      delay: 0.08,
    },
  ],
  leaderboard: [
    { frequency: 680, duration: 0.14, gain: 0.16 },
    { frequency: 540, duration: 0.12, gain: 0.14, delay: 0.08 },
    { frequency: 780, duration: 0.12, gain: 0.12, delay: 0.16 },
  ],
  gameStart: [
    { frequency: 520, duration: 0.14, gain: 0.18 },
    { frequency: 640, duration: 0.14, gain: 0.16, delay: 0.1 },
    { frequency: 760, duration: 0.14, gain: 0.14, delay: 0.2 },
  ],
  timerTick: [{ frequency: 440, duration: 0.08, gain: 0.16 }],
};

const SoundContext = createContext<SoundContextValue | undefined>(undefined);

const getAudioContextClass = () => {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
};

const playTone = (ctx: AudioContext, tone: Tone, startAt: number) => {
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = tone.type || "sine";
  oscillator.frequency.setValueAtTime(tone.frequency, startAt);

  const gainValue = tone.gain ?? 0.16;
  gainNode.gain.setValueAtTime(0.0001, startAt);
  gainNode.gain.exponentialRampToValueAtTime(gainValue, startAt + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startAt + tone.duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(startAt);
  oscillator.stop(startAt + tone.duration + 0.05);
};

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(true);
  const contextRef = useRef<AudioContext | null>(null);
  const bufferCacheRef = useRef<Map<SoundKey, AudioBuffer>>(new Map());
  const pathname = usePathname();
  const initialPathRef = useRef<string | null>(null);

  const ensureContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;

    const AudioContextClass = getAudioContextClass();
    if (!AudioContextClass) return null;

    const ctx = new AudioContextClass();
    contextRef.current = ctx;
    return ctx;
  }, []);

  const loadBuffer = useCallback(async (sound: SoundKey, ctx: AudioContext) => {
    const cached = bufferCacheRef.current.get(sound);
    if (cached) return cached;

    const url = soundFiles[sound];
    if (!url) return null;

    try {
      const response = await fetch(url);
      const data = await response.arrayBuffer();
      const buffer = await ctx.decodeAudioData(data.slice(0));
      bufferCacheRef.current.set(sound, buffer);
      return buffer;
    } catch (error) {
      console.warn("Failed to load sound buffer", { sound, error });
      return null;
    }
  }, []);

  const playSound = useCallback(
    async (sound: SoundKey) => {
      if (!enabled) return;

      const tones = soundPresets[sound];
      if (!tones?.length) return;

      const ctx = ensureContext();
      if (!ctx) return;

      if (ctx.state === "suspended") {
        try {
          await ctx.resume();
        } catch (error) {
          console.error("Unable to resume audio context", error);
          return;
        }
      }

      const buffer = await loadBuffer(sound, ctx);
      if (buffer) {
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gainNode = ctx.createGain();
        const gain = soundVolumes[sound] ?? 0.5;
        gainNode.gain.setValueAtTime(gain, ctx.currentTime);
        source.connect(gainNode);
        gainNode.connect(ctx.destination);
        source.start();
        return;
      }

      const now = ctx.currentTime;
      tones?.forEach((tone) => {
        const startAt = now + (tone.delay ?? 0);
        playTone(ctx, tone, startAt);
      });
    },
    [enabled, ensureContext, loadBuffer]
  );

  useEffect(() => {
    if (initialPathRef.current === null) {
      initialPathRef.current = pathname;
      return;
    }
    playSound("transition");
  }, [pathname, playSound]);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const actionable =
        target.closest("button") ||
        target.closest("a[href]") ||
        target.closest('[role="button"]');

      if (actionable) {
        playSound("click");
      }
    };

    window.addEventListener("pointerdown", handlePointer, { capture: true });
    return () =>
      window.removeEventListener("pointerdown", handlePointer, {
        capture: true,
      });
  }, [playSound]);

  const value = useMemo(
    () => ({
      playSound,
      enabled,
      toggleSound: () => setEnabled((prev) => !prev),
      setEnabled,
    }),
    [playSound, enabled]
  );

  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error("useSound must be used within a SoundProvider");
  }
  return context;
}
