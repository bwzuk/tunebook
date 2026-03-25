import { useEffect, useRef, useState, useCallback } from 'react';
import abcjs from 'abcjs';
import { buildFullAbc } from '../utils/abcUtils';
import './AbcRenderer.css';

export default function AbcRenderer({ tune, className = '' }) {
  const containerRef = useRef(null);
  const synthRef = useRef(null);
  const visualObjRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioSupported, setAudioSupported] = useState(true);

  useEffect(() => {
    if (containerRef.current && tune?.abc) {
      const abc = buildFullAbc(tune);
      const visualObj = abcjs.renderAbc(containerRef.current, abc, {
        responsive: 'resize',
        add_classes: true,
        staffwidth: 700,
      });
      visualObjRef.current = visualObj[0];
    }

    // Cleanup on unmount
    return () => {
      if (synthRef.current) {
        synthRef.current.stop();
      }
    };
  }, [tune]);

  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      // Stop playback
      if (synthRef.current) {
        synthRef.current.stop();
      }
      setIsPlaying(false);
      return;
    }

    if (!visualObjRef.current) return;

    try {
      setIsLoading(true);

      // Create synth if needed
      if (!synthRef.current) {
        if (!abcjs.synth.supportsAudio()) {
          setAudioSupported(false);
          setIsLoading(false);
          return;
        }

        synthRef.current = new abcjs.synth.CreateSynth();
      }

      // Initialize and play
      await synthRef.current.init({
        visualObj: visualObjRef.current,
        options: {
          soundFontUrl: 'https://paulrosen.github.io/midi-js-soundfonts/FluidR3_GM/',
        },
      });

      await synthRef.current.prime();

      synthRef.current.start();
      setIsPlaying(true);
      setIsLoading(false);

      // Set up event listener for when playback ends
      const checkPlayback = setInterval(() => {
        if (synthRef.current && !synthRef.current.isRunning) {
          setIsPlaying(false);
          clearInterval(checkPlayback);
        }
      }, 100);

    } catch (err) {
      console.error('Audio playback error:', err);
      setIsLoading(false);
      setAudioSupported(false);
    }
  }, [isPlaying]);

  if (!tune?.abc) {
    return <div className="abc-empty">No ABC notation available</div>;
  }

  return (
    <div className={`abc-renderer ${className}`}>
      <div className="abc-controls">
        <button
          className={`abc-play-btn ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlay}
          disabled={isLoading || !audioSupported}
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
              Stop
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
        {!audioSupported && (
          <span style={{ color: '#888', fontSize: '13px' }}>Audio not supported</span>
        )}
      </div>
      <div ref={containerRef} />
    </div>
  );
}
