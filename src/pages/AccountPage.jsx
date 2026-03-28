import AuthButton from '../components/AuthButton';
import { useAuth } from '../contexts/AuthContext';
import { useLibrary } from '../contexts/LibraryContext';
import './AccountPage.css';

export default function AccountPage() {
  const { user, syncing } = useAuth();
  const { tunes } = useLibrary();

  return (
    <div className="account-page">
      <h1 className="page-title">Account</h1>

      <section className="account-section">
        <h2>Sign In</h2>
        <AuthButton />
      </section>

      <section className="account-section">
        <h2>Library Stats</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{tunes.length}</span>
            <span className="stat-label">Tunes</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {tunes.filter((t) => t.lastPracticed).length}
            </span>
            <span className="stat-label">Practiced</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {tunes.filter((t) => t.tags?.length > 0).length}
            </span>
            <span className="stat-label">Tagged</span>
          </div>
        </div>
      </section>

      {user && (
        <section className="account-section">
          <h2>Cloud Sync</h2>
          <div className="sync-status">
            {syncing ? (
              <p className="sync-message syncing">Syncing your library...</p>
            ) : (
              <p className="sync-message">Your library is synced to the cloud.</p>
            )}
            <p className="sync-hint">
              Changes are automatically synced when online.
            </p>
          </div>
        </section>
      )}

      <section className="account-section">
        <h2>About</h2>
        <div className="about-info">
          <p>Tunebook is a Progressive Web App for managing your traditional music repertoire.</p>
          <p className="version">Version 2.0</p>
        </div>
      </section>
    </div>
  );
}
