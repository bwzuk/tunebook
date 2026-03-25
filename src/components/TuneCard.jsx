import './TuneCard.css';

export default function TuneCard({ tune, onClick, actions, showType = true }) {
  return (
    <div className="tune-card" onClick={onClick}>
      <div className="tune-card-content">
        <div className="tune-card-header">
          <h3 className="tune-card-name">{tune.name}</h3>
          {showType && <span className="tune-card-type">{tune.type}</span>}
        </div>
        <div className="tune-card-meta">
          <span className="tune-card-key">{tune.key}</span>
          {tune.meter && <span className="tune-card-meter">{tune.meter}</span>}
        </div>
      </div>
      {actions && (
        <div className="tune-card-actions" onClick={(e) => e.stopPropagation()}>
          {actions}
        </div>
      )}
    </div>
  );
}
