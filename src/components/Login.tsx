import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import './Login.css';

export const Login: React.FC = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>BaedangGraph</h1>
        <p className="subtitle">Stock Chart Visualization with Dividend Tracking</p>

        <p className="subtitle">Google 계정으로만 로그인할 수 있습니다.</p>

        {error && <div className="error-message">{error}</div>}

        <button onClick={handleGoogleSignIn} disabled={loading} className="google-btn">
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
            <path d="M16.51 8.1H9.03v3.48h4.14c-.18 1.13-.72 2.09-1.56 2.73v2.31h2.96c1.73-1.6 2.74-4.02 2.74-6.52 0-.59-.06-1.16-.16-1.71z" fill="#4285F4"></path>
            <path d="M9.03 18c2.43 0 4.47-.8 5.96-2.18l-2.96-2.31c-.8.54-1.84.88-3 .88-2.31 0-4.28-1.56-5-3.68H.92v2.38A8.997 8.997 0 009.03 18z" fill="#34A853"></path>
            <path d="M4.03 10.71c-.17-.52-.26-1.08-.26-1.65s.09-1.13.26-1.65V5.03H.92A8.997 8.997 0 000 9.06c0 1.5.37 2.9.92 4.12l3.11-2.47z" fill="#FBBC05"></path>
            <path d="M9.03 3.58c1.32 0 2.5.45 3.44 1.34l2.64-2.64C13.47.89 11.43 0 9.03 0A8.997 8.997 0 00.92 3.88l3.11 2.47c.72-2.12 2.69-3.68 5-3.68z" fill="#EA4335"></path>
          </svg>
          <span>Sign in with Google</span>
        </button>
      </div>
    </div>
  );
};
