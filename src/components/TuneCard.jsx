import './TuneCard.css';

export default function TuneCard({
  tune,
  onClick,
  actions,
  showType = true,
  practiceIndicator,
  practiceText,
  tags,
}) {
  return (
    <div
      className={`tune-card ${practiceIndicator === 'needs-practice' ? 'needs-practice' : ''}`}
      onClick={onClick}
    >
      <div className="tune-card-content">
        <div className="tune-card-title-row">
          <h3 className="tune-card-name">{tune.name}</h3>
          {practiceIndicator === 'needs-practice' && (
            <span className="tune-card-practice-indicator" title="Needs practice">!</span>
          )}
        </div>
        <div className="tune-card-details-row">
          <div className="tune-card-meta">
            {showType && <span className="tune-card-type">{tune.type}</span>}
            <span className="tune-card-key">{tune.key}</span>
            {tune.meter && <span className="tune-card-meter">{tune.meter}</span>}
            {practiceText && (
              <span className="tune-card-practice-text">{practiceText}</span>
            )}
          </div>
          {actions && (
            <div className="tune-card-actions" onClick={(e) => e.stopPropagation()}>
              {actions}
            </div>
          )}
        </div>
        {tags && tags.length > 0 && (
          <div className="tune-card-tags">
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} className="tune-card-tag">{tag}</span>
            ))}
            {tags.length > 3 && (
              <span className="tune-card-tag-more">+{tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
