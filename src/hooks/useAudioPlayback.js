import { useState, useRef, useCallback, useEffect } from 'react';
import abcjs from 'abcjs';

const SOUND_FONT_URL = 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/';

export const TEMPO_OPTIONS = [
  { label: 'Very Slow', value: 50 },
  { label: 'Slow', value: 75 },
  { label: 'Normal', value: 100 },
  { label: 'Fast', value: 125 },
  { label: 'Very Fast', value: 150 },
];

export default function useAudioPlayback() {
  const audioControlRef = useRef(null);
  const synthControlRef = useRef(null);
  const visualObjRef = useRef(null);
  const checkEndedIntervalRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [tempo, setTempo] = useState(100);
  const [isReady, setIsReady] = useState(false);

  // Check audio support on mount
  useEffect(() => {
    if (!abcjs.synth.supportsAudio()) {
      setAudioSupported(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (checkEndedIntervalRef.current) {
        clearInterval(checkEndedIntervalRef.current);
      }
      if (synthControlRef.current) {
        try {
          synthControlRef.current.pause();
        } catch (e) {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const setVisualObj = useCallback((visualObj) => {
    visualObjRef.current = visualObj;
    // Reset state when visual object changes
    setIsReady(false);
    setIsPlaying(false);
    if (synthControlRef.current) {
      try {
        synthControlRef.current.pause();
      } catch (e) {
        // Ignore errors
      }
      synthControlRef.current = null;
    }
  }, []);

  const initializeAudio = useCallback(async () => {
    if (!visualObjRef.current || !audioControlRef.current) return false;

    try {
      const synthControl = new abcjs.synth.SynthController();
      synthControlRef.current = synthControl;

      synthControl.load(audioControlRef.current, null, {
        displayLoop: false,
        displayRestart: false,
        displayPlay: false,
        displayProgress: false,
        displayWarp: true,
      });

      await synthControl.setTune(visualObjRef.current, true, {
        soundFontUrl: SOUND_FONT_URL,
      });

      setIsReady(true);
      return true;
    } catch (err) {
      console.error('Audio init error:', err);
      setAudioSupported(false);
      return false;
    }
  }, []);

  const play = useCallback(async () => {
    if (!audioSupported) return;

    if (isPlaying) {
      // Pause if already playing
      if (synthControlRef.current) {
        synthControlRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);

    try {
      // Initialize on first play
      if (!isReady) {
        const success = await initializeAudio();
        if (!success) {
          setIsLoading(false);
          return;
        }
      }

      if (synthControlRef.current) {
        synthControlRef.current.setWarp(tempo);
        await synthControlRef.current.play();
        setIsPlaying(true);

        // Watch for playback end
        if (checkEndedIntervalRef.current) {
          clearInterval(checkEndedIntervalRef.current);
        }
        checkEndedIntervalRef.current = setInterval(() => {
          if (synthControlRef.current && !synthControlRef.current.isRunning) {
            setIsPlaying(false);
            clearInterval(checkEndedIntervalRef.current);
            checkEndedIntervalRef.current = null;
          }
        }, 200);
      }
    } catch (err) {
      console.error('Playback error:', err);
    }

    setIsLoading(false);
  }, [isPlaying, audioSupported, isReady, initializeAudio, tempo]);

  const stop = useCallback(() => {
    if (checkEndedIntervalRef.current) {
      clearInterval(checkEndedIntervalRef.current);
      checkEndedIntervalRef.current = null;
    }
    if (synthControlRef.current) {
      synthControlRef.current.pause();
      synthControlRef.current.restart();
    }
    setIsPlaying(false);
  }, []);

  const changeTempo = useCallback((newTempo) => {
    setTempo(newTempo);
    if (synthControlRef.current && isReady) {
      try {
        synthControlRef.current.setWarp(newTempo);
      } catch (e) {
        // Ignore errors if not fully ready
      }
    }
  }, [isReady]);

  return {
    audioControlRef,
    isPlaying,
    isLoading,
    audioSupported,
    tempo,
    isReady,
    setVisualObj,
    play,
    stop,
    changeTempo,
  };
}
