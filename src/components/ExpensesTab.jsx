// src/components/ExpensesTab.js
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Avatar } from './MembersTab';

const EMPTY_FORM = {
  description: '',
  type: 'expense',
  amount: '',
  penalty: '',
  payer_id: '',
  split_member_ids: [],   // populated from members on render
};

export default function ExpensesTab({ tripId, members, expenses, onRefresh, fmt }) {
  const [form, setForm] = useState({ ...EMPTY_FORM, split_member_ids: members.map(m => m.id) });
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(true);

  // Keep split_member_ids in sync when members change (if form not yet touched)
  const allIds = members.map(m => m.id);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleSplit = (id) => {
    setForm(f => ({
      ...f,
      split_member_ids: f.split_member_ids.includes(id)
        ? f.split_member_ids.filter(x => x !== id)
        : [...f.split_member_ids, id],
    }));
  };

  const save = async () => {
    const { description, type, amount, penalty, payer_id, split_member_ids } = form;
    if (!description.trim() || !amount || !payer_id || !split_member_ids.length) {
      alert('Please fill all required fields and select at least one member to split.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('expenses').insert({
      trip_id: tripId,
      description: description.trim(),
      type,
      amount: parseFloat(amount),
      penalty: parseFloat(penalty) || 0,
      payer_id,
      split_member_ids,
    });
    if (error) alert(error.message);
    else {
      setForm({ ...EMPTY_FORM, payer_id: payer_id, split_member_ids: allIds });
      onRefresh();
    }
    setSaving(false);
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    await supabase.from('expenses').delete().eq('id', id);
    onRefresh();
  };

  const memberName = (id) => members.find(m => m.id === id)?.name || '?';

  return (
    <div>
      {/* Add form */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: open ? 14 : 0 }}>
          <div className="card-title" style={{ marginBottom: 0 }}>Add expense / refund</div>
          <button className="btn-outline" style={{ fontSize: 12, padding: '4px 10px' }} onClick={() => setOpen(o => !o)}>
            {open ? 'Hide' : 'Show'}
          </button>
        </div>

        {open && (
          <>
            <div className="form-row">
              <div className="form-col" style={{ flex: 2 }}>
                <label>Description *</label>
                <input
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="e.g. Train tickets BLR–MUM"
                />
              </div>
              <div className="form-col">
                <label>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="refund">Refund / cancellation</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-col">
                <label>{form.type === 'refund' ? 'Original amount *' : 'Amount *'}</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.amount}
                  onChange={e => set('amount', e.target.value)}
                  placeholder="0"
                />
              </div>
              {form.type === 'refund' && (
                <div className="form-col">
                  <label>Penalty / charge deducted</label>
                  <input
                    type="number" min="0" step="0.01"
                    value={form.penalty}
                    onChange={e => set('penalty', e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}
              <div className="form-col">
                <label>Paid by *</label>
                <select value={form.payer_id} onChange={e => set('payer_id', e.target.value)}>
                  <option value="">— select —</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>

            {form.type === 'refund' && form.amount && (
              <div style={{ fontSize: 12, color: '#d97706', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px', marginBottom: 10 }}>
                Net refund: {fmt((parseFloat(form.amount) || 0) - (parseFloat(form.penalty) || 0))} will be subtracted from shared costs and split among selected members.
              </div>
            )}

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 500, color: '#5a6275', display: 'block', marginBottom: 6 }}>
                Split among (uncheck to exclude)
              </label>
              <div className="chip-group">
                {members.map(m => {
                  const checked = form.split_member_ids.includes(m.id);
                  return (
                    <label key={m.id} className={`chip ${checked ? 'selected' : ''}`} onClick={() => toggleSplit(m.id)}>
                      <Avatar name={m.name} members={members} size={20} />
                      {m.name}
                    </label>
                  );
                })}
              </div>
            </div>

            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Add'}
            </button>
          </>
        )}
      </div>

      {/* List */}
      {expenses.length === 0
        ? <div className="empty">No expenses yet</div>
        : expenses.map(e => {
            const net = e.type === 'refund' ? -(e.amount - e.penalty) : e.amount;
            const payer = memberName(e.payer_id);
            const splitNames = (e.split_member_ids || []).map(memberName).join(', ');
            return (
              <div className="card" key={e.id}>
                <div className="list-item" style={{ border: 'none', padding: 0 }}>
                  <div className="list-item-left">
                    <Avatar name={payer} members={members} />
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="item-title">{e.description}</span>
                        <span className={`badge badge-${e.type}`}>{e.type === 'refund' ? 'Refund' : 'Expense'}</span>
                      </div>
                      <div className="item-meta">
                        {payer} paid · split {splitNames}
                        {e.type === 'refund' && e.penalty > 0 && ` · penalty ${fmt(e.penalty)}`}
                      </div>
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className="item-amount" style={{ color: net < 0 ? '#16a34a' : '#1a1d23' }}>
                      {net < 0 ? '+' : ''}{fmt(net)}
                    </span>
                    <button className="btn-ghost" onClick={() => remove(e.id)}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}