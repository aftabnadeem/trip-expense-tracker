// src/components/AuthPage.js
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthPage() {
  const [email, setEmail]     = useState('');
  const [sent, setSent]       = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  };

  if (sent) return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon">📬</div>
        <h2>Check your email</h2>
        <p>We sent a magic link to <strong>{email}</strong>.<br />Click it to sign in — no password needed.</p>
        <button className="btn-outline" onClick={() => setSent(false)}>Use a different email</button>
      </div>
    </div>
  );

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-icon">✈</div>
        <h1 className="auth-title">TripSplit</h1>
        <p className="auth-subtitle">Track group trip expenses together</p>

        <div className="form-col" style={{ marginBottom: 10 }}>
          <label>Your email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            autoFocus
          />
        </div>

        {error && <div className="auth-error">{error}</div>}

        <button className="btn-primary btn-submit" onClick={handleLogin} disabled={loading}>
          {loading ? 'Sending…' : 'Send magic link ✉'}
        </button>

        <p className="auth-note">No password needed. We'll email you a sign-in link.</p>
      </div>
    </div>
  );
}