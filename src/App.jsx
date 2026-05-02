// src/App.js
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import MembersTab from './components/MembersTab';
import ExpensesTab from './components/ExpensesTab';
import TransfersTab from './components/TransfersTab';
import SummaryTab from './components/SummaryTab';
import './App.css';
import AuthPage from './components/AuthPage';

const TABS = ['Members', 'Expenses', 'Transfers', 'Summary'];

export default function App() {
  const [session, setSession] = useState(undefined);
  const [trips, setTrips]       = useState([]);
  const [tripId, setTripId]     = useState(null);
  const [trip, setTrip]         = useState(null);
  const [members, setMembers]   = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [tab, setTab]           = useState('Members');
  const [newTripName, setNewTripName] = useState('');
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  // ── fetch all trips ──────────────────────────────────────────
  const fetchTrips = useCallback(async () => {
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) { setError(error.message); return; }
    setTrips(data || []);
    if (!tripId && data?.length) setTripId(data[0].id);
    setLoading(false);
  }, [tripId]);

  // ── fetch trip data ──────────────────────────────────────────
  const fetchTripData = useCallback(async () => {
    if (!tripId) return;
    const [t, m, e, tr] = await Promise.all([
      supabase.from('trips').select('*').eq('id', tripId).single(),
      supabase.from('members').select('*').eq('trip_id', tripId).order('created_at'),
      supabase.from('expenses').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
      supabase.from('transfers').select('*').eq('trip_id', tripId).order('created_at', { ascending: false }),
    ]);
    if (t.data) setTrip(t.data);
    setMembers(m.data || []);
    setExpenses(e.data || []);
    setTransfers(tr.data || []);
  }, [tripId]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    // Listen for login/logout
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);
  useEffect(() => { if (tripId) fetchTripData(); }, [tripId, fetchTripData]);

  // ── create trip ──────────────────────────────────────────────
  const createTrip = async () => {
    const name = newTripName.trim();
    if (!name) return;
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('trips')
      .insert({ name, currency: '₹', user_id: user.id })
      .select()
      .single();
    if (error) { setError(error.message); return; }
    setTrips(prev => [data, ...prev]);
    setTripId(data.id);
    setNewTripName('');
    setTab('Members');
  };

  const fmt = (v) => {
    const sym = trip?.currency || '₹';
    return sym + Math.abs(v).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (session === undefined) return <div className="loading">Loading…</div>;
  if (!session) return <AuthPage />;
  if (loading) return <div className="loading">Connecting to Supabase…</div>;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-icon">✈</span>
            <span className="brand-name">TripSplit</span>
          </div>

          <div className="trip-selector">
            <select
              value={tripId || ''}
              onChange={e => { setTripId(e.target.value); setTab('Members'); }}
            >
              {trips.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              {!trips.length && <option value="">No trips yet</option>}
            </select>
          </div>

          <div className="new-trip-row">
            <input
              value={newTripName}
              onChange={e => setNewTripName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createTrip()}
              placeholder="New trip name…"
            />
            <button className="btn-primary" onClick={createTrip}>Create trip</button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <strong>Supabase error:</strong> {error} — check your URL and anon key in <code>src/lib/supabase.js</code>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {tripId ? (
        <main className="main">
          <nav className="tabs">
            {TABS.map(t => (
              <button
                key={t}
                className={`tab ${tab === t ? 'active' : ''}`}
                onClick={() => setTab(t)}
              >{t}</button>
            ))}
          </nav>

          <div className="panel">
            {tab === 'Members'   && <MembersTab   tripId={tripId} trip={trip} members={members}     onRefresh={fetchTripData} />}
            {tab === 'Expenses'  && <ExpensesTab  tripId={tripId} members={members} expenses={expenses}   onRefresh={fetchTripData} fmt={fmt} />}
            {tab === 'Transfers' && <TransfersTab tripId={tripId} members={members} transfers={transfers} onRefresh={fetchTripData} fmt={fmt} />}
            {tab === 'Summary'   && <SummaryTab   members={members} expenses={expenses} transfers={transfers} fmt={fmt} />}
          </div>
        </main>
      ) : (
        <div className="no-trip">Create your first trip above to get started.</div>
      )}
    </div>
  );
}