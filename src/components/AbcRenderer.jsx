import { useEffect, useRef, useState, useCallback } from 'react';
import abcjs from 'abcjs';
import { buildFullAbc } from '../utils/abcUtils';
import './AbcRenderer.css';

const SPEED_OPTIONS = [
  { label: '0.5x', value: 0.5 },
  { label: '0.75x', value: 0.75 },
  { label: '1x', value: 1 },
  { label: '1.25x', value: 1.25 },
  { label: '1.5x', value: 1.5 },
];

export default function AbcRenderer({ tune, className = '' }) {
  const containerRef = useRef(null);
  const synthControlRef = useRef(null);
  const cursorControlRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [synthReady, setSynthReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || !tune?.abc) return;

    const abc = buildFullAbc(tune);

    // Render with explicit black coloring
    const visualObj = abcjs.renderAbc(containerRef.current, abc, {
      responsive: 'resize',
      add_classes: true,
      staffwidth: 700,
      foregroundColor: '#000000',
    });

    // Check audio support
    if (!abcjs.synth.supportsAudio()) {
      setAudioSupported(false);
      return;
    }

    // Create synth controller
    const synthControl = new abcjs.synth.SynthController();
    synthControlRef.current = synthControl;

    // Create cursor control for tracking playback
    const cursorControl = {
      onStart: () => setIsPlaying(true),
      onFinished: () => setIsPlaying(false),
      onBeat: () => {},
    };
    cursorControlRef.current = cursorControl;

    // Initialize synth
    synthControl.load('#audio-controls-' + tune.id, cursorControl, {
      displayLoop: false,
      displayRestart: false,
      displayPlay: false,
      displayProgress: false,
      displayWarp: false,
    });

    // Set up the synth with the tune
    const setupSynth = async () => {
      try {
        await synthControl.setTune(visualObj[0], false, {
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
          millisecondsPerMeasure: undefined, // Use tune's tempo
        });
        setSynthReady(true);
      } catch (err) {
        console.error('Synth setup error:', err);
        setAudioSupported(false);
      }
    };

    setupSynth();

    // Cleanup
    return () => {
      if (synthControlRef.current) {
        synthControlRef.current.pause();
      }
      setSynthReady(false);
      setIsPlaying(false);
    };
  }, [tune]);

  // Update tempo when speed changes
  useEffect(() => {
    if (synthControlRef.current && synthReady) {
      synthControlRef.current.setWarp(100 / speed);
    }
  }, [speed, synthReady]);

  const handlePlay = useCallback(async () => {
    if (!synthControlRef.current || !synthReady) return;

    if (isPlaying) {
      synthControlRef.current.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      try {
        // Prime the audio (needed for first play)
        await synthControlRef.current.play();
        setIsPlaying(true);
      } catch (err) {
        console.error('Playback error:', err);
      }
      setIsLoading(false);
    }
  }, [isPlaying, synthReady]);

  const handleStop = useCallback(() => {
    if (synthControlRef.current) {
      synthControlRef.current.pause();
      synthControlRef.current.restart();
      setIsPlaying(false);
    }
  }, []);

  if (!tune?.abc) {
    return <div className="abc-empty">No ABC notation available</div>;
  }

  return (
    <div className={`abc-renderer ${className}`}>
      <div className="abc-controls">
        <button
          className={`abc-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlay}
          disabled={isLoading || !audioSupported || !synthReady}
          title={!audioSupported ? 'Audio not supported in this browser' : ''}
        >
          {isLoading ? (
            <>Loading...</>
          ) : isPlaying ? (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
              Pause
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5,3 19,12 5,21" />
              </svg>
              Play
            </>
          )}
        </button>

        {isPlaying && (
          <button className="abc-stop-btn" onClick={handleStop} title="Stop and restart">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <rect x="4" y="4" width="16" height="16" />
            </svg>
            Stop
          </button>
        )}

        <div className="abc-speed-control">
          <label htmlFor={`speed-${tune.id}`}>Speed:</label>
          <select
            id={`speed-${tune.id}`}
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="abc-speed-select"
          >
            {SPEED_OPTIONS.map((opt) => (
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

      {/* Hidden audio controls container for abcjs */}
      <div id={`audio-controls-${tune.id}`} style={{ display: 'none' }} />

      <div ref={containerRef} className="abc-notation" />
    </div>
  );
}
