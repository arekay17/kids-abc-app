import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

const MODULE_SCREEN_MUSIC = require("../../assets/audio/music/module_screen-theme-loop-v1.mp3");

export const MODULE_AUDIO_SETTINGS = {
  volume: 0.22,
  fadeInDuration: 320,
  fadeOutDuration: 300,
};

const FADE_STEP_DURATION = 40;

function pauseAndReset(player) {
  try {
    player.pause();
    return Promise.resolve(player.seekTo(0)).catch(() => undefined);
  } catch {
    return Promise.resolve();
  }
}

export default function useModuleScreenAudio() {
  const [musicPlayer] = useState(() =>
    createAudioPlayer(MODULE_SCREEN_MUSIC, { updateInterval: 250 }),
  );
  const [isMusicEnabled, setIsMusicEnabled] = useState(true);
  const isMounted = useRef(false);
  const isFocused = useRef(false);
  const musicEnabled = useRef(true);
  const isPlaying = useRef(false);
  const isStarting = useRef(false);
  const isStopping = useRef(false);
  const operation = useRef(0);
  const fadeTimer = useRef(null);

  const cancelFade = useCallback(() => {
    if (fadeTimer.current !== null) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }
  }, []);

  const fadeVolume = useCallback(
    (targetVolume, duration, operationId, onComplete) => {
      cancelFade();

      const startingVolume = musicPlayer.volume;
      const totalSteps = Math.max(1, Math.ceil(duration / FADE_STEP_DURATION));
      let completedSteps = 0;

      fadeTimer.current = setInterval(() => {
        if (!isMounted.current || operation.current !== operationId) {
          cancelFade();
          return;
        }

        completedSteps += 1;
        const progress = Math.min(completedSteps / totalSteps, 1);
        musicPlayer.volume =
          startingVolume + (targetVolume - startingVolume) * progress;

        if (progress === 1) {
          cancelFade();
          onComplete?.();
        }
      }, FADE_STEP_DURATION);
    },
    [cancelFade, musicPlayer],
  );

  const startModuleMusic = useCallback(async () => {
    if (
      !isMounted.current ||
      !isFocused.current ||
      !musicEnabled.current ||
      isStarting.current ||
      (isPlaying.current && !isStopping.current)
    ) {
      return;
    }

    const operationId = ++operation.current;
    isStarting.current = true;
    isStopping.current = false;
    cancelFade();

    try {
      // A fast Back action can refocus Home while its previous fade-out is
      // still running. Reuse the same player, but pause it before rewinding.
      if (isPlaying.current) {
        musicPlayer.pause();
      }
      isPlaying.current = false;
      musicPlayer.loop = true;
      musicPlayer.volume = 0;
      await musicPlayer.seekTo(0);

      if (
        !isMounted.current ||
        !isFocused.current ||
        !musicEnabled.current ||
        operation.current !== operationId
      ) {
        return;
      }

      musicPlayer.play();
      isPlaying.current = true;
      fadeVolume(
        MODULE_AUDIO_SETTINGS.volume,
        MODULE_AUDIO_SETTINGS.fadeInDuration,
        operationId,
      );
    } catch {
      // The module screen remains usable if audio cannot start on a device.
    } finally {
      if (operation.current === operationId) {
        isStarting.current = false;
      }
    }
  }, [cancelFade, fadeVolume, musicPlayer]);

  const stopModuleMusic = useCallback(() => {
    const operationId = ++operation.current;
    isStarting.current = false;
    cancelFade();

    if (!isMounted.current) return;

    if (!isPlaying.current) {
      isStopping.current = false;
      void pauseAndReset(musicPlayer);
      return;
    }

    isStopping.current = true;
    fadeVolume(
      0,
      MODULE_AUDIO_SETTINGS.fadeOutDuration,
      operationId,
      () => {
        if (!isMounted.current || operation.current !== operationId) return;

        isPlaying.current = false;
        isStopping.current = false;
        void pauseAndReset(musicPlayer);
      },
    );
  }, [cancelFade, fadeVolume, musicPlayer]);

  useEffect(() => {
    isMounted.current = true;
    musicPlayer.loop = true;
    musicPlayer.volume = 0;

    void setAudioModeAsync({
      allowsRecording: false,
      playsInSilentMode: true,
      shouldPlayInBackground: false,
    }).catch(() => undefined);

    return () => {
      isMounted.current = false;
      isFocused.current = false;
      operation.current += 1;
      cancelFade();
      isPlaying.current = false;
      isStarting.current = false;
      isStopping.current = false;

      void pauseAndReset(musicPlayer).finally(() => {
        try {
          musicPlayer.remove();
        } catch {
          // The native player may already be removed during a development reload.
        }
      });
    };
  }, [cancelFade, musicPlayer]);

  useFocusEffect(
    useCallback(() => {
      isFocused.current = true;

      if (musicEnabled.current) {
        void startModuleMusic();
      }

      return () => {
        isFocused.current = false;
        stopModuleMusic();
      };
    }, [startModuleMusic, stopModuleMusic]),
  );

  const toggleMusic = useCallback(() => {
    const nextEnabled = !musicEnabled.current;
    musicEnabled.current = nextEnabled;
    setIsMusicEnabled(nextEnabled);

    if (!nextEnabled) {
      stopModuleMusic();
      return;
    }

    if (isFocused.current) {
      void startModuleMusic();
    }
  }, [startModuleMusic, stopModuleMusic]);

  return { isMusicEnabled, toggleMusic };
}
