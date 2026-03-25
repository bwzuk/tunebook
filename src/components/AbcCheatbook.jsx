import { useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import { extractFirstBars, buildFullAbc } from '../utils/abcUtils';
import './AbcCheatbook.css';

export default function AbcCheatbook({ tune, barCount = 8, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && tune?.abc) {
      const fullAbc = buildFullAbc(tune);
      const truncatedAbc = extractFirstBars(fullAbc, barCount);
      abcjs.renderAbc(containerRef.current, truncatedAbc, {
        responsive: 'resize',
        add_classes: true,
        staffwidth: 400,
        scale: 0.8,
        foregroundColor: '#000000',
      });
    }
  }, [tune, barCount]);

  if (!tune?.abc) {
    return null;
  }

  return (
    <div className={`abc-cheatbook ${className}`}>
      <div className="abc-cheatbook-header">
        <span className="abc-cheatbook-name">{tune.name}</span>
        <span className="abc-cheatbook-key">{tune.key}</span>
      </div>
      <div className="abc-cheatbook-notation" ref={containerRef} />
    </div>
  );
}
