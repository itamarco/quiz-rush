"use client";

import { useEffect, useRef } from "react";

type BackgroundMusicType = "lobby" | "round" | null;

export function useBackgroundMusic(musicType: BackgroundMusicType) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const previousAudio = audioRef.current;

    if (!musicType) {
      if (previousAudio) {
        previousAudio.pause();
        previousAudio.currentTime = 0;
        audioRef.current = null;
      }
      return;
    }

    const musicFile =
      musicType === "lobby"
        ? "/sounds/background-music.mp3"
        : "/sounds/round.mp3";

    if (previousAudio) {
      previousAudio.pause();
      previousAudio.currentTime = 0;
    }

    const audio = new Audio(musicFile);
    audio.loop = true;
    audio.volume = 0.5;

    audio.play().catch((error) => {
      console.warn("Failed to play background music:", error);
    });

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [musicType]);

  return audioRef;
}
