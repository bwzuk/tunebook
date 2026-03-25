import { useEffect, useRef, useState, useCallback } from 'react';
import abcjs from 'abcjs';
import { buildFullAbc } from '../utils/abcUtils';
import './AbcRenderer.css';

const TEMPO_OPTIONS = [
  { label: 'Very Slow', value: 50 },
  { label: 'Slow', value: 75 },
  { label: 'Normal', value: 100 },
  { label: 'Fast', value: 125 },
  { label: 'Very Fast', value: 150 },
];

export default function AbcRenderer({ tune, className = '' }) {
  const containerRef = useRef(null);
  const audioControlRef = useRef(null);
  const synthControlRef = useRef(null);
  const visualObjRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [tempo, setTempo] = useState(100);
  const [isReady, setIsReady] = useState(false);

  // Render the ABC notation
  useEffect(() => {
    if (!containerRef.current || !tune?.abc) return;

    const abc = buildFullAbc(tune);

    const visualObj = abcjs.renderAbc(containerRef.current, abc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
      foregroundColor: '#000000',
    });

    visualObjRef.current = visualObj[0];

    if (!abcjs.synth.supportsAudio()) {
      setAudioSupported(false);
    }

    // Reset state
    setIsReady(false);
    setIsPlaying(false);
    if (synthControlRef.current) {
      synthControlRef.current = null;
    }

    return () => {
      if (synthControlRef.current) {
        try {
          synthControlRef.current.pause();
        } catch (e) {}
        synthControlRef.current = null;
      }
      setIsPlaying(false);
      setIsReady(false);
    };
  }, [tune]);

  const initializeAudio = useCallback(async () => {
    if (!visualObjRef.current || !audioControlRef.current) return false;

    try {
      const synthControl = new abcjs.synth.SynthController();
      synthControlRef.current = synthControl;

      // Load with the actual DOM element
      synthControl.load(audioControlRef.current, null, {
        displayLoop: false,
        displayRestart: false,
        displayPlay: false,
        displayProgress: false,
        displayWarp: true, // Need this for setWarp to work
      });

      await synthControl.setTune(visualObjRef.current, true, {
        soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
      });

      setIsReady(true);
      return true;
    } catch (err) {
      console.error('Audio init error:', err);
      setAudioSupported(false);
      return false;
    }
  }, []);

  const handlePlay = useCallback(async () => {
    if (!audioSupported) return;

    if (isPlaying) {
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
        // Set tempo before playing
        synthControlRef.current.setWarp(tempo);
        await synthControlRef.current.play();
        setIsPlaying(true);

        // Watch for end
        const checkEnded = setInterval(() => {
          if (synthControlRef.current && !synthControlRef.current.isRunning) {
            setIsPlaying(false);
            clearInterval(checkEnded);
          }
        }, 200);
      }
    } catch (err) {
      console.error('Playback error:', err);
    }

    setIsLoading(false);
  }, [isPlaying, audioSupported, isReady, initializeAudio, tempo]);

  const handleTempoChange = useCallback((newTempo) => {
    setTempo(newTempo);
    // Apply immediately if ready
    if (synthControlRef.current && isReady) {
      try {
        synthControlRef.current.setWarp(newTempo);
      } catch (e) {
        // Ignore errors if not fully ready
      }
    }
  }, [isReady]);

  const handleStop = useCallback(() => {
    if (synthControlRef.current) {
      synthControlRef.current.pause();
      synthControlRef.current.restart();
    }
    setIsPlaying(false);
  }, []);

  if (!tune?.abc) {
    return <div className="abc-empty">No ABC notation available</div>;
  }

  return (
    <div className={`abc-renderer ${className}`}>
      {/* Hidden audio control element for SynthController */}
      <div ref={audioControlRef} className="abc-audio-control" />

      <div className="abc-controls">
        <button
          className={`abc-btn abc-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlay}
          disabled={isLoading || !audioSupported}
        >
          {isLoading ? (
            <span className="abc-btn-content">
              <span className="abc-spinner"></span>
              Loading
            </span>
          ) : isPlaying ? (
            <span className="abc-btn-content">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Stop
            </span>
          ) : (
            <span className="abc-btn-content">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Play
            </span>
          )}
        </button>

        <div className="abc-tempo-control">
          <label htmlFor="tempo-select">Tempo</label>
          <select
            id="tempo-select"
            value={tempo}
            onChange={(e) => handleTempoChange(parseInt(e.target.value))}
            className="abc-tempo-select"
          >
            {TEMPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {!audioSupported && (
          <span className="abc-audio-error">Audio not supported</span>
        )}
      </div>

      <div ref={containerRef} className="abc-notation" />
    </div>
  );
}
