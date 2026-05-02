// src/components/SummaryTab.js
import React from 'react';
import { computeBalances, computeSettlements } from '../lib/balances';
import { Avatar } from './MembersTab';

export default function SummaryTab({ members, expenses, transfers, fmt }) {
  const bal = computeBalances(members, expenses, transfers);
  const settlements = computeSettlements(members, bal);

  const totalExpenses = expenses.reduce((s, e) =>
    s + (e.type === 'refund' ? -(e.amount - e.penalty) : e.amount), 0);

  const memberName = (id) => members.find(m => m.id === id)?.name || '?';

  return (
    <div>
      {/* Metrics */}
      <div className="metric-grid">
        <div className="metric">
          <div className="metric-label">Total expenses</div>
          <div className="metric-value">{fmt(totalExpenses)}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Per person (avg)</div>
          <div className="metric-value">{fmt(totalExpenses / (members.length || 1))}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Expenses logged</div>
          <div className="metric-value">{expenses.length}</div>
        </div>
        <div className="metric">
          <div className="metric-label">Transfers</div>
          <div className="metric-value">{transfers.length}</div>
        </div>
      </div>

      {/* Per person breakdown */}
      <div className="card">
        <div className="card-title">Per person breakdown</div>
        {members.length === 0 && <div className="empty">Add members first</div>}
        {members.map(m => {
          const b = bal[m.id] || { paid: 0, share: 0, net: 0 };
          const netColor = b.net > 0.5 ? '#16a34a' : b.net < -0.5 ? '#dc2626' : '#9aa0ad';
          const netLabel = b.net > 0.5
            ? `gets back ${fmt(b.net)}`
            : b.net < -0.5
            ? `owes ${fmt(-b.net)}`
            : 'settled ✓';
          return (
            <div key={m.id} className="list-item">
              <div className="list-item-left">
                <Avatar name={m.name} members={members} size={36} />
                <div>
                  <div className="item-title">{m.name}</div>
                  <div className="item-meta">
                    paid {fmt(b.paid)} · share {fmt(b.share)}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: netColor }}>{netLabel}</div>
            </div>
          );
        })}
      </div>

      {/* Settlements */}
      <div className="card">
        <div className="card-title">Minimal settlements — who pays whom</div>
        {settlements.length === 0
          ? <div className="empty">🎉 Everyone is settled up!</div>
          : settlements.map((s, i) => (
              <div key={i} className="settle-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name={s.fromName} members={members} />
                  <span style={{ fontWeight: 500 }}>{s.fromName}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',gap: 6, color: '#5a6275', fontSize: 13 }}>
                  <span>pays</span>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#dc2626' }}>{fmt(s.amount)}</span>
                  <span>to</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center',gap: 8 }}>
                  <Avatar name={s.toName} members={members} />
                  <span style={{ fontWeight: 500 }}>{s.toName}</span>
                </div>
              </div>
            ))
        }
      </div>

      {/* Expense breakdown detail */}
      <div className="card">
        <div className="card-title">Expense log summary</div>
        {expenses.length === 0
          ? <div className="empty">No expenses yet</div>
          : expenses.map(e => {
              const net = e.type === 'refund' ? -(e.amount - e.penalty) : e.amount;
              const payer = memberName(e.payer_id);
              const splitN = (e.split_member_ids || []).length;
              const perPerson = splitN ? net / splitN : 0;
              return (
                <div key={e.id} className="list-item">
                  <div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className="item-title">{e.description}</span>
                      <span className={`badge badge-${e.type}`}>{e.type}</span>
                    </div>
                    <div className="item-meta">
                      {payer} paid · {splitN} members · {fmt(perPerson)}/person
                      {e.type === 'refund' && e.penalty > 0 && ` (incl. ${fmt(e.penalty)} penalty)`}
                    </div>
                  </div>
                  <span className="item-amount" style={{ color: net < 0 ? '#16a34a' : '#1a1d23' }}>
                    {net < 0 ? '+' : ''}{fmt(net)}
                  </span>
                </div>
              );
            })
        }
      </div>
    </div>
  );
}