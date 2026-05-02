// src/lib/balances.js
// Pure computation — no Supabase calls here.

/**
 * Compute per-member net balances.
 *
 * @param {object[]} members   - [{ id, name }]
 * @param {object[]} expenses  - [{ id, type, amount, penalty, payer_id, split_member_ids }]
 * @param {object[]} transfers - [{ id, from_member_id, to_member_id, amount }]
 * @returns {object} { [memberId]: { paid, share, net } }
 */
export function computeBalances(members, expenses, transfers) {
  const bal = {};
  members.forEach(m => { bal[m.id] = { paid: 0, share: 0, net: 0 }; });

  expenses.forEach(e => {
    // Net amount:  expense → positive, refund → negative net (money coming back minus penalty)
    const net = e.type === 'refund'
      ? -(e.amount - e.penalty)   // recovered amount reduces shared cost
      : e.amount;

    if (bal[e.payer_id] !== undefined) {
      bal[e.payer_id].paid += net;
    }

    const splitIds = e.split_member_ids || [];
    if (splitIds.length > 0) {
      const perPerson = net / splitIds.length;
      splitIds.forEach(id => {
        if (bal[id] !== undefined) bal[id].share += perPerson;
      });
    }
  });

  // Transfers: payer's outstanding debt shrinks; recipient's credit shrinks
  transfers.forEach(t => {
    if (bal[t.from_member_id] !== undefined) bal[t.from_member_id].net += t.amount;
    if (bal[t.to_member_id]   !== undefined) bal[t.to_member_id].net   -= t.amount;
  });

  members.forEach(m => {
    bal[m.id].net += bal[m.id].paid - bal[m.id].share;
  });

  return bal;
}

/**
 * Simplify balances into minimal set of transfer instructions.
 *
 * @param {object[]} members
 * @param {object}   bal     - output of computeBalances()
 * @returns {{ from: string, to: string, amount: number }[]}  (member IDs)
 */
export function computeSettlements(members, bal) {
  const givers = members
    .filter(m => bal[m.id] && bal[m.id].net > 0.5)
    .map(m => ({ id: m.id, name: m.name, amt: bal[m.id].net }));

  const takers = members
    .filter(m => bal[m.id] && bal[m.id].net < -0.5)
    .map(m => ({ id: m.id, name: m.name, amt: -bal[m.id].net }));

  const txns = [];
  let gi = 0, ti = 0;

  while (gi < givers.length && ti < takers.length) {
    const pay = Math.min(givers[gi].amt, takers[ti].amt);
    txns.push({ from: takers[ti].id, fromName: takers[ti].name, to: givers[gi].id, toName: givers[gi].name, amount: pay });
    givers[gi].amt -= pay;
    takers[ti].amt -= pay;
    if (givers[gi].amt < 0.5) gi++;
    if (takers[ti].amt < 0.5) ti++;
  }

  return txns;
}