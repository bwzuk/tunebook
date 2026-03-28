import { useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import { buildFullAbc } from '../utils/abcUtils';
import useAudioPlayback, { TEMPO_OPTIONS } from '../hooks/useAudioPlayback';
import './AbcRenderer.css';

export default function AbcRenderer({ tune, className = '' }) {
  const containerRef = useRef(null);
  const {
    audioControlRef,
    isPlaying,
    isLoading,
    audioSupported,
    tempo,
    setVisualObj,
    play,
    changeTempo,
  } = useAudioPlayback();

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

    setVisualObj(visualObj[0]);
  }, [tune, setVisualObj]);

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
          onClick={play}
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
            onChange={(e) => changeTempo(parseInt(e.target.value))}
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
