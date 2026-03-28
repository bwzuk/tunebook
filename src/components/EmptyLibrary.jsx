import './EmptyLibrary.css';

export default function EmptyLibrary({ message, submessage }) {
  return (
    <div className="empty-library-state">
      <div className="empty-library-illustration">
        <svg viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Book stack */}
          <rect x="50" y="100" width="100" height="15" rx="2" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5"/>
          <rect x="45" y="85" width="110" height="15" rx="2" fill="#c7d2fe" stroke="#a5b4fc" strokeWidth="1.5"/>
          <rect x="55" y="70" width="90" height="15" rx="2" fill="#e0e7ff" stroke="#a5b4fc" strokeWidth="1.5"/>

          {/* Open book on top */}
          <path d="M60 65 Q100 55, 100 65 L100 30 Q100 20, 60 30 Z" fill="#fef3c7" stroke="#fbbf24" strokeWidth="1.5"/>
          <path d="M140 65 Q100 55, 100 65 L100 30 Q100 20, 140 30 Z" fill="#fef9c3" stroke="#fbbf24" strokeWidth="1.5"/>

          {/* Staff lines on book */}
          <line x1="68" y1="38" x2="92" y2="35" stroke="#6366f1" strokeWidth="0.8" opacity="0.4"/>
          <line x1="68" y1="43" x2="92" y2="40" stroke="#6366f1" strokeWidth="0.8" opacity="0.4"/>
          <line x1="68" y1="48" x2="92" y2="45" stroke="#6366f1" strokeWidth="0.8" opacity="0.4"/>

          <line x1="108" y1="35" x2="132" y2="38" stroke="#6366f1" strokeWidth="0.8" opacity="0.4"/>
          <line x1="108" y1="40" x2="132" y2="43" stroke="#6366f1" strokeWidth="0.8" opacity="0.4"/>
          <line x1="108" y1="45" x2="132" y2="48" stroke="#6366f1" strokeWidth="0.8" opacity="0.4"/>

          {/* Music notes floating */}
          <g opacity="0.6">
            <ellipse cx="35" cy="45" rx="5" ry="3.5" fill="#6366f1" transform="rotate(-20 35 45)"/>
            <line x1="39" y1="43" x2="39" y2="28" stroke="#6366f1" strokeWidth="2"/>
            <path d="M39 28 Q46 30, 46 36 Q46 42, 39 39" fill="#6366f1"/>
          </g>

          <g opacity="0.4">
            <ellipse cx="165" cy="50" rx="5" ry="3.5" fill="#6366f1" transform="rotate(-20 165 50)"/>
            <line x1="169" y1="48" x2="169" y2="33" stroke="#6366f1" strokeWidth="2"/>
            <path d="M169 33 Q176 35, 176 41 Q176 47, 169 44" fill="#6366f1"/>
          </g>

          <g opacity="0.5">
            <ellipse cx="155" cy="25" rx="4" ry="3" fill="#a78bfa" transform="rotate(-20 155 25)"/>
            <line x1="158" y1="23" x2="158" y2="12" stroke="#a78bfa" strokeWidth="1.5"/>
          </g>

          {/* Sparkles */}
          <circle cx="45" cy="25" r="2" fill="#fbbf24"/>
          <circle cx="160" cy="70" r="1.5" fill="#fbbf24"/>
          <circle cx="30" cy="75" r="1.5" fill="#a78bfa"/>
          <circle cx="175" cy="40" r="2" fill="#a78bfa"/>
        </svg>
      </div>
      <p className="empty-library-message">{message}</p>
      {submessage && <p className="empty-library-submessage">{submessage}</p>}
    </div>
  );
}
