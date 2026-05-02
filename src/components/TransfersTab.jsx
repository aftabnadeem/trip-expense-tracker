// src/components/TransfersTab.js
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from './MembersTab';

export default function TransfersTab({ tripId, members, transfers, onRefresh, fmt }) {
  const [from, setFrom]   = useState('');
  const [to, setTo]       = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote]   = useState('');
  const [saving, setSaving] = useState(false);

  const memberName = (id) => members.find(m => m.id === id)?.name || '?';

  const save = async () => {
    if (!from || !to || !amount || from === to) {
      alert('Select two different members and enter an amount.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('transfers').insert({
      trip_id: tripId,
      from_member_id: from,
      to_member_id: to,
      amount: parseFloat(amount),
      note: note.trim() || null,
    });
    if (error) alert(error.message);
    else { setAmount(''); setNote(''); onRefresh(); }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this transfer?')) return;
    await supabase.from('transfers').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div>
      <div className="card">
        <div className="card-title">Record a direct payment</div>
        <div className="form-row" >
          <div className="form-col">
            <label>From</label>
            <select value={from} onChange={e => setFrom(e.target.value)}>
              <option value="">— select —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={{ paddingTop: 18, fontSize: 18, color: '#9aa0ad', flexShrink: 0 }}>→</div>
          <div className="form-col">
            <label>To</label>
            <select value={to} onChange={e => setTo(e.target.value)}>
              <option value="">— select —</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-col">
            <label>Amount *</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0" />
          </div>
          <div className="form-col">
            <label>Note (optional)</label>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. settling up" />
          </div>
        </div>

        <button className="btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Record payment'}
        </button>
      </div>

      {transfers.length === 0
        ? <div className="empty">No transfers recorded yet</div>
        : transfers.map(t => {
            const fromName = memberName(t.from_member_id);
            const toName   = memberName(t.to_member_id);
            return (
              <div className="card" key={t.id}>
                <div className="list-item" style={{ border: 'none', padding: 0 }}>
                  <div className="list-item-left">
                    <Avatar name={fromName} members={members} />
                    <div style={{ fontSize: 16, color: '#9aa0ad', margin: '0 4px' }}>→</div>
                    <Avatar name={toName} members={members} />
                    <div>
                      <div className="item-title">{fromName} → {toName}</div>
                      {t.note && <div className="item-meta">{t.note}</div>}
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className="item-amount">{fmt(t.amount)}</span>
                    <span className="badge badge-transfer">Transfer</span>
                    <button className="btn-ghost" onClick={() => remove(t.id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}