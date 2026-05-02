// src/components/AuthPage.js
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon">✈</div>
        <h1 className="auth-title">TripSplit</h1>
        <p className="auth-subtitle">Track group trip expenses together</p>

        <div className="form-col" style={{ marginBottom: 10 }}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
        </div>

        <div className="form-col" style={{ marginBottom: 14 }}>
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-primary btn-submit" onClick={handleLogin} disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </div>
    </div>
  );
}