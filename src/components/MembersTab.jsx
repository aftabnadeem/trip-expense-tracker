// src/components/MembersTab.js
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const COLORS = ['#3b6ff5','#16a34a','#d97706','#dc2626','#7c3aed','#0369a1','#b45309','#be123c'];

export function getAvatarStyle(name, members) {
  const idx = members.findIndex(m => m.name === name || m.id === name);
  const i = Math.max(0, idx) % COLORS.length;
  const color = COLORS[i];
  return { background: color + '20', color };
}

export function Avatar({ name, members, size = 32 }) {
  const style = getAvatarStyle(name, members);
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  return (
    <span
      className="avatar"
      style={{ ...style, width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials}
    </span>
  );
}

export default function MembersTab({ tripId, trip, members, onRefresh }) {
  const [newName, setNewName] = useState('');
  const [currency, setCurrency] = useState(trip?.currency || '₹');
  const [saving, setSaving] = useState(false);

  const addMember = async () => {
    const name = newName.trim();
    if (!name || members.find(m => m.name === name)) return;
    setSaving(true);
    await supabase.from('members').insert({ trip_id: tripId, name });
    setNewName('');
    setSaving(false);
    onRefresh();
  };

  const removeMember = async (id) => {
    if (!window.confirm('Remove member? Their expenses will be affected.')) return;
    await supabase.from('members').delete().eq('id', id);
    onRefresh();
  };

  const saveCurrency = async () => {
    await supabase.from('trips').update({ currency }).eq('id', tripId);
    onRefresh();
  };

  return (
    <div>
      {/* Currency */}
      <div className="card">
        <div className="card-title">Trip currency</div>
        <div className="form-row">
          <div className="form-col" style={{ maxWidth: 100 }}>
            <label>Symbol</label>
            <input value={currency} onChange={e => setCurrency(e.target.value)} maxLength={3} />
          </div>
          <button className="btn-outline" onClick={saveCurrency}>Save</button>
        </div>
      </div>

      {/* Members list */}
      <div className="card">
        <div className="card-title">Members ({members.length})</div>
        {members.length === 0 && <div className="empty" style={{ padding: '14px 0' }}>Add your first member below</div>}
        {members.map(m => (
          <div key={m.id} className="list-item">
            <div className="list-item-left">
              <Avatar name={m.name} members={members} />
              <span className="item-title">{m.name}</span>
            </div>
            <button className="btn-ghost" onClick={() => removeMember(m.id)}>Remove</button>
          </div>
        ))}

        <div className="form-row" style={{ marginTop: 14, marginBottom: 0 }}>
          <div className="form-col">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMember()}
              placeholder="Member name"
            />
          </div>
          <button className="btn-primary" onClick={addMember} disabled={saving}>
            {saving ? 'Adding…' : 'Add member'}
          </button>
        </div>
      </div>
    </div>
  );
}