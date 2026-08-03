import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAudioPlayer,
  setAudioModeAsync,
  useAudioPlayerStatus,
} from "expo-audio";

const WELCOME_MUSIC = require("../../assets/audio/music/welcome-theme-loop-v1.mp3");
const KAK_LIMAU_GREETING = require("../../assets/audio/voice/kak-limau-welcome-v1.mp3");

export const WELCOME_AUDIO_SETTINGS = {
  musicVolume: 0.24,
  speechMusicVolume: 0.1,
  voiceVolume: 1,
  greetingDelay: 700,
  musicFadeInDuration: 320,
  musicFadeOutDuration: 400,
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

function disposePlayer(player) {
  void pauseAndReset(player).finally(() => {
    try {
      player.remove();
    } catch {
      // The player may already have been removed during a development reload.
    }
  });
}

export default function useWelcomeAudio() {
  // These players are manually owned so cleanup can stop and reset them before
  // releasing their native resources. The sources are bundled local assets.
  const [musicPlayer] = useState(() =>
    createAudioPlayer(WELCOME_MUSIC, { updateInterval: 250 }),
  );
  const [voicePlayer] = useState(() =>
    createAudioPlayer(KAK_LIMAU_GREETING, { updateInterval: 100 }),
  );
  const voiceStatus = useAudioPlayerStatus(voicePlayer);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const isMounted = useRef(false);
  const soundEnabled = useRef(true);
  const isLeaving = useRef(false);
  const greetingTimer = useRef(null);
  const greetingStarted = useRef(false);
  const greetingCompleted = useRef(false);
  const fadeTimer = useRef(null);
  const fadeResolver = useRef(null);
  const exitPromise = useRef(null);

  const cancelGreeting = useCallback(() => {
    if (greetingTimer.current !== null) {
      clearTimeout(greetingTimer.current);
      greetingTimer.current = null;
    }
  }, []);

  const cancelMusicFade = useCallback(() => {
    if (fadeTimer.current !== null) {
      clearInterval(fadeTimer.current);
      fadeTimer.current = null;
    }

    if (fadeResolver.current) {
      const resolve = fadeResolver.current;
      fadeResolver.current = null;
      resolve(false);
    }
  }, []);

  const fadeMusicTo = useCallback(
    (targetVolume, duration) => {
      cancelMusicFade();

      if (!isMounted.current) {
        return Promise.resolve(false);
      }

      const startingVolume = musicPlayer.volume;
      const totalSteps = Math.max(1, Math.ceil(duration / FADE_STEP_DURATION));
      let completedSteps = 0;

      return new Promise((resolve) => {
        fadeResolver.current = resolve;
        fadeTimer.current = setInterval(() => {
          if (!isMounted.current) {
            cancelMusicFade();
            return;
          }

          completedSteps += 1;
          const progress = Math.min(completedSteps / totalSteps, 1);
          musicPlayer.volume =
            startingVolume + (targetVolume - startingVolume) * progress;

          if (progress === 1) {
            clearInterval(fadeTimer.current);
            fadeTimer.current = null;
            fadeResolver.current = null;
            resolve(true);
          }
        }, FADE_STEP_DURATION);
      });
    },
    [cancelMusicFade, musicPlayer],
  );

  const playMusicFromStart = useCallback(async () => {
    try {
      musicPlayer.loop = true;
      musicPlayer.volume = WELCOME_AUDIO_SETTINGS.musicVolume;
      await musicPlayer.seekTo(0);

      if (isMounted.current && soundEnabled.current && !isLeaving.current) {
        musicPlayer.play();
      }
    } catch {
      // Keep the welcome screen usable if a device cannot start audio.
    }
  }, [musicPlayer]);

  const startGreeting = useCallback(async () => {
    greetingTimer.current = null;

    if (
      !isMounted.current ||
      !soundEnabled.current ||
      isLeaving.current ||
      greetingStarted.current ||
      greetingCompleted.current
    ) {
      return;
    }

    greetingStarted.current = true;
    cancelMusicFade();
    musicPlayer.volume = WELCOME_AUDIO_SETTINGS.speechMusicVolume;

    try {
      voicePlayer.loop = false;
      voicePlayer.volume = WELCOME_AUDIO_SETTINGS.voiceVolume;
      await voicePlayer.seekTo(0);

      if (isMounted.current && soundEnabled.current && !isLeaving.current) {
        voicePlayer.play();
      }
    } catch {
      greetingCompleted.current = true;

      if (isMounted.current && soundEnabled.current && !isLeaving.current) {
        void fadeMusicTo(
          WELCOME_AUDIO_SETTINGS.musicVolume,
          WELCOME_AUDIO_SETTINGS.musicFadeInDuration,
        );
      }
    }
  }, [cancelMusicFade, fadeMusicTo, musicPlayer, voicePlayer]);

  const scheduleGreeting = useCallback(() => {
    cancelGreeting();

    if (
      !greetingStarted.current &&
      !greetingCompleted.current &&
      soundEnabled.current &&
      !isLeaving.current
    ) {
      greetingTimer.current = setTimeout(
        startGreeting,
        WELCOME_AUDIO_SETTINGS.greetingDelay,
      );
    }
  }, [cancelGreeting, startGreeting]);

  useEffect(() => {
    isMounted.current = true;
    musicPlayer.loop = true;
    voicePlayer.loop = false;
    voicePlayer.volume = WELCOME_AUDIO_SETTINGS.voiceVolume;

    async function prepareWelcomeAudio() {
      try {
        // Playback-only settings require no microphone permission and prevent
        // the welcome audio from continuing while the app is backgrounded.
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
          shouldPlayInBackground: false,
        });

        if (!isMounted.current || !soundEnabled.current || isLeaving.current) {
          return;
        }

        await playMusicFromStart();
        scheduleGreeting();
      } catch {
        // Visual navigation remains available even if audio setup fails.
      }
    }

    void prepareWelcomeAudio();

    return () => {
      isMounted.current = false;
      isLeaving.current = true;
      cancelGreeting();
      cancelMusicFade();
      disposePlayer(voicePlayer);
      disposePlayer(musicPlayer);
    };
  }, [
    cancelGreeting,
    cancelMusicFade,
    musicPlayer,
    playMusicFromStart,
    scheduleGreeting,
    voicePlayer,
  ]);

  useEffect(() => {
    if (!voiceStatus.didJustFinish || greetingCompleted.current) return;

    greetingCompleted.current = true;
    void voicePlayer.seekTo(0).catch(() => undefined);

    if (soundEnabled.current && !isLeaving.current) {
      void fadeMusicTo(
        WELCOME_AUDIO_SETTINGS.musicVolume,
        WELCOME_AUDIO_SETTINGS.musicFadeInDuration,
      );
    }
  }, [fadeMusicTo, voicePlayer, voiceStatus.didJustFinish]);

  const toggleSound = useCallback(() => {
    if (isLeaving.current) return;

    const nextEnabled = !soundEnabled.current;
    soundEnabled.current = nextEnabled;
    setIsSoundEnabled(nextEnabled);

    if (!nextEnabled) {
      cancelGreeting();
      cancelMusicFade();

      if (greetingStarted.current) {
        // An interrupted greeting is considered consumed and is not replayed.
        greetingCompleted.current = true;
      }

      void pauseAndReset(voicePlayer);
      void pauseAndReset(musicPlayer);
      return;
    }

    void playMusicFromStart();
    scheduleGreeting();
  }, [
    cancelGreeting,
    cancelMusicFade,
    musicPlayer,
    playMusicFromStart,
    scheduleGreeting,
    voicePlayer,
  ]);

  const stopWelcomeAudio = useCallback(() => {
    if (exitPromise.current) return exitPromise.current;

    isLeaving.current = true;
    cancelGreeting();
    const voiceReset = pauseAndReset(voicePlayer);

    exitPromise.current = (async () => {
      if (musicPlayer.playing && musicPlayer.volume > 0) {
        await fadeMusicTo(
          0,
          WELCOME_AUDIO_SETTINGS.musicFadeOutDuration,
        );
      } else {
        cancelMusicFade();
        musicPlayer.volume = 0;
      }

      await Promise.all([voiceReset, pauseAndReset(musicPlayer)]);
    })();

    return exitPromise.current;
  }, [
    cancelGreeting,
    cancelMusicFade,
    fadeMusicTo,
    musicPlayer,
    voicePlayer,
  ]);

  return {
    isSoundEnabled,
    toggleSound,
    stopWelcomeAudio,
  };
}
