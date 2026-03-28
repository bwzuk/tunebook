import { useAuth } from '../contexts/AuthContext';
import './AuthButton.css';

export default function AuthButton() {
  const { user, loading, syncing, signInWithGoogle, signOut, syncNow, error } = useAuth();

  if (loading) {
    return (
      <div className="auth-button-container">
        <div className="auth-loading">Loading...</div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="auth-button-container">
        <div className="auth-user">
          {user.photoURL && (
            <img src={user.photoURL} alt="" className="auth-avatar" />
          )}
          <span className="auth-name">{user.displayName || user.email}</span>
        </div>
        <div className="auth-actions">
          <button
            className="auth-sync-btn"
            onClick={syncNow}
            disabled={syncing}
            title="Sync now"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={syncing ? 'spinning' : ''}
            >
              <path d="M23 4v6h-6M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
          <button className="auth-signout-btn" onClick={signOut}>
            Sign Out
          </button>
        </div>
        {error && <div className="auth-error">{error}</div>}
      </div>
    );
  }

  return (
    <div className="auth-button-container">
      <button className="auth-signin-btn" onClick={signInWithGoogle}>
        <svg viewBox="0 0 24 24" className="google-icon">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Sign in with Google
      </button>
      <p className="auth-hint">Sign in to sync your library across devices</p>
    </div>
  );
}
