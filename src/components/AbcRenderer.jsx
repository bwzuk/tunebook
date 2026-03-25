import { useEffect, useRef } from 'react';
import abcjs from 'abcjs';
import { buildFullAbc } from '../utils/abcUtils';
import './AbcRenderer.css';

export default function AbcRenderer({ tune, className = '' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current && tune?.abc) {
      const abc = buildFullAbc(tune);
      abcjs.renderAbc(containerRef.current, abc, {
        responsive: 'resize',
        add_classes: true,
        staffwidth: 700,
      });
    }
  }, [tune]);

  if (!tune?.abc) {
    return <div className="abc-empty">No ABC notation available</div>;
  }

  return (
    <div className={`abc-renderer ${className}`} ref={containerRef} />
  );
}
