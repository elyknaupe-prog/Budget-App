#!/usr/bin/env node
// Paper-trading journal for a $1,000 account. NEVER places real orders.
//
// Daily flow (run by the scheduled morning session):
//   1. node trader.js plan --spot <QQQ> --vix <VIX> --today <YYYY-MM-DD> --expirations <comma list from chain>
//        -> prints which put strikes/expiry to quote for a possible new entry,
//           plus the instrument ids of open positions that need quotes.
//   2. Fetch those quotes (Robinhood get_option_instruments + get_option_quotes) into snapshot.json:
//        { "date": "YYYY-MM-DD", "time": ISO, "spot": n, "vix": n, "note": "one-line market read",
//          "quotes": { "<instrument_id>": { "expiry","strike","type","bid","ask","mark",
//                      "sellFill": high_fill_rate_sell_price, "buyFill": high_fill_rate_buy_price,
//                      "delta","iv" } } }
//   3. node trader.js run snapshot.json  -> manages exits, maybe opens a new spread,
//        updates journal.json + JOURNAL.md.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { greeks } from '../src/blackScholes.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL = path.join(DIR, 'journal.json');
const REPORT = path.join(DIR, 'JOURNAL.md');

export const RULES = {
  startCash: 1000,
  targetDelta: 0.27, minDelta: 0.18, maxDelta: 0.35, // short put
  minDte: 28, maxDte: 45,
  widths: [1, 2, 3, 5],   // QQQ ~30-DTE strikes this far OTM are $5 apart, so in practice $5
  // With only $1,000 the smallest real spread risks ~$400, so: ONE spread at a time.
  // The 2x-credit stop normally limits a loser to ~$200; a gap can still cost the full max loss.
  maxRiskPerTrade: 0.45,  // of equity
  maxTotalRisk: 0.45,     // of equity, across open spreads
  minCreditPctOfWidth: 0.20,
  takeProfitPct: 0.50,    // close when 50% of the credit is captured
  stopLossMultiple: 2.0,  // close when loss reaches 2x the credit
  closeAtDte: 7,
  feePerContractLeg: 0.03, // regulatory/exchange fees, per contract per leg per side
};

export function emptyJournal(spot, date) {
  return { rules: RULES, startDate: date, cash: RULES.startCash, benchmark: { shares: RULES.startCash / spot, startSpot: spot }, open: [], closed: [], days: [] };
}

const dte = (today, expiry) => Math.round((Date.parse(expiry) - Date.parse(today)) / 86400000);
const r2 = (x) => Math.round(x * 100) / 100;

export function plan(journal, { spot, vix, today, expirations }) {
  const exp = expirations.filter((e) => dte(today, e) >= RULES.minDte && dte(today, e) <= RULES.maxDte).sort()[0] ?? null;
  const res = { openIds: journal ? journal.open.flatMap((p) => [p.shortId, p.longId]) : [], newEntry: null };
  if (!exp) return res;
  const T = dte(today, exp) / 365, iv = (vix / 100) * 1.3; // rough QQQ put IV; real deltas decide later
  let best = null;
  for (let k = Math.round(spot * 0.8); k <= spot; k++) {
    const d = Math.abs(greeks({ type: 'put', S: spot, K: k, T, r: 0.04, sigma: iv + 0.8 * Math.log(spot / k) }).delta);
    if (!best || Math.abs(d - RULES.targetDelta) < best.e) best = { k, e: Math.abs(d - RULES.targetDelta) };
  }
  const short = Math.round(best.k / 5) * 5;
  res.newEntry = { expiry: exp, type: 'put', strikes: [short + 5, short, short - 5, short - 10], note: 'quote every strike that exists; $1 strikes usually do not this far OTM' };
  return res;
}

function closeCost(p, q) { // debit per share to close the spread now (conservative fills)
  return q[p.shortId].buyFill - q[p.longId].sellFill;
}
const fees = (legs) => (legs * RULES.feePerContractLeg) ;

export function run(journal, snap) {
  const q = snap.quotes, actions = [];
  // ---- manage open positions
  for (const p of [...journal.open]) {
    const left = dte(snap.date, p.expiry);
    let debit, reason = null;
    if (left < 0) { // expired: settle at intrinsic
      debit = Math.max(0, Math.min(p.width, p.shortStrike - snap.spot));
      reason = 'expired';
    } else {
      if (!q[p.shortId] || !q[p.longId]) { actions.push(`WARN no quotes for ${p.id}, kept open`); continue; }
      debit = closeCost(p, q);
      const pnl = p.credit - debit;
      if (pnl >= p.credit * RULES.takeProfitPct) reason = 'take-profit';
      else if (-pnl >= p.credit * RULES.stopLossMultiple) reason = 'stop-loss';
      else if (left <= RULES.closeAtDte) reason = 'time-exit';
      p.lastMark = { date: snap.date, debit: r2(debit), pnl: r2((p.credit - debit) * 100 - p.fees) };
    }
    if (reason) {
      const exitFees = reason === 'expired' ? 0 : fees(2);
      journal.cash -= debit * 100 + exitFees;
      const pnl = r2((p.credit - debit) * 100 - p.fees - exitFees);
      journal.closed.push({ ...p, exitDate: snap.date, exitDebit: r2(debit), reason, pnl });
      journal.open = journal.open.filter((x) => x !== p);
      actions.push(`CLOSE ${p.id} (${reason}) pay ${debit.toFixed(2)} -> P&L $${pnl}`);
    }
  }
  // ---- equity and risk
  const equity = () => journal.cash - journal.open.reduce((a, p) => a + (p.lastMark?.debit ?? p.credit) * 100, 0);
  const riskUsed = () => journal.open.reduce((a, p) => a + p.maxLoss, 0);

  // ---- maybe open a new put credit spread
  const cands = Object.entries(q).filter(([, x]) => x.type === 'put' && !journal.open.some((p) => p.shortId === x.id));
  const byStrike = (exp) => new Map(cands.filter(([, x]) => x.expiry === exp).map(([id, x]) => [x.strike, { id, ...x }]));
  const expiries = [...new Set(cands.map(([, x]) => x.expiry))].filter((e) => dte(snap.date, e) >= RULES.minDte && dte(snap.date, e) <= RULES.maxDte);
  let opened = null, skip = 'no candidate quotes';
  for (const exp of expiries) {
    const m = byStrike(exp);
    const shorts = [...m.values()].filter((x) => Math.abs(x.delta) >= RULES.minDelta && Math.abs(x.delta) <= RULES.maxDelta && !journal.open.some((p) => p.expiry === exp && p.shortStrike === x.strike))
      .sort((a, b) => Math.abs(Math.abs(a.delta) - RULES.targetDelta) - Math.abs(Math.abs(b.delta) - RULES.targetDelta));
    if (!shorts.length) { skip = 'no short strike in delta range (or already holding it)'; continue; }
    const s = shorts[0];
    const eq = equity();
    for (const w of [...RULES.widths].reverse()) {
      const l = m.get(s.strike - w);
      if (!l) continue;
      const credit = s.sellFill - l.buyFill;
      const entryFees = fees(2);
      const maxLoss = (w - credit) * 100 + entryFees;
      if (credit < w * RULES.minCreditPctOfWidth) { skip = `credit ${credit.toFixed(2)} < ${RULES.minCreditPctOfWidth * 100}% of $${w} width after realistic fills`; continue; }
      if (maxLoss > eq * RULES.maxRiskPerTrade) { skip = `max loss $${maxLoss.toFixed(0)} > ${RULES.maxRiskPerTrade * 100}% of equity`; continue; }
      if (riskUsed() + maxLoss > eq * RULES.maxTotalRisk) { skip = `total risk would exceed ${RULES.maxTotalRisk * 100}% of equity`; break; }
      opened = { id: `QQQ ${exp} ${s.strike}/${l.strike}P`, openDate: snap.date, expiry: exp, shortStrike: s.strike, longStrike: l.strike, width: w,
        shortId: s.id, longId: l.id, shortFill: s.sellFill, longFill: l.buyFill, credit: r2(credit), maxLoss: r2(maxLoss), fees: entryFees,
        shortDelta: s.delta, spotAtEntry: snap.spot, vixAtEntry: snap.vix, breakeven: r2(s.strike - credit) };
      break;
    }
    if (opened) break;
  }
  if (opened) {
    journal.cash += opened.credit * 100 - opened.fees;
    opened.lastMark = { date: snap.date, debit: opened.credit, pnl: -opened.fees };
    journal.open.push(opened);
    actions.push(`OPEN ${opened.id}: sell ${opened.shortStrike}P @${opened.shortFill}, buy ${opened.longStrike}P @${opened.longFill}, credit $${(opened.credit * 100).toFixed(0)}, max loss $${opened.maxLoss.toFixed(0)}, breakeven ${opened.breakeven}`);
  } else actions.push(`NO NEW TRADE: ${skip}`);

  const bench = journal.benchmark.shares * snap.spot;
  journal.days.push({ date: snap.date, time: snap.time, spot: snap.spot, vix: snap.vix, equity: r2(equity()), benchmark: r2(bench), open: journal.open.length, riskUsed: r2(riskUsed()), actions, note: snap.note ?? '' });
  return { journal, actions };
}

export function report(j) {
  const last = j.days.at(-1);
  const wins = j.closed.filter((t) => t.pnl > 0).length;
  const realized = j.closed.reduce((a, t) => a + t.pnl, 0);
  const lines = [
    '# Paper-trading journal ($1,000 start, no real orders)', '',
    `Strategy: QQQ put credit spreads, short ~${RULES.targetDelta} delta, ${RULES.minDte}-${RULES.maxDte} DTE, max loss <= ${RULES.maxRiskPerTrade * 100}% of equity per trade,`,
    `<= ${RULES.maxTotalRisk * 100}% total. Exit at +${RULES.takeProfitPct * 100}% of credit, -${RULES.stopLossMultiple}x credit, or ${RULES.closeAtDte} DTE. Fills use Robinhood "high fill rate" prices + fees.`, '',
    `**As of ${last.date}:** equity **$${last.equity.toFixed(2)}** (${((last.equity / RULES.startCash - 1) * 100).toFixed(2)}%) vs buy-and-hold QQQ **$${last.benchmark.toFixed(2)}** (${((last.benchmark / RULES.startCash - 1) * 100).toFixed(2)}%).`,
    `Closed trades: ${j.closed.length} (${wins} winners), realized P&L $${realized.toFixed(2)}. Open: ${j.open.length}, risk in use $${last.riskUsed.toFixed(0)}.`, '',
    '## Open positions', '', '| Spread | Opened | Credit | Max loss | Breakeven | Last mark P&L |', '|---|---|---|---|---|---|',
    ...j.open.map((p) => `| ${p.id} | ${p.openDate} | $${(p.credit * 100).toFixed(0)} | $${p.maxLoss.toFixed(0)} | ${p.breakeven} | $${p.lastMark?.pnl ?? 0} |`), '',
    '## Closed trades', '', '| Spread | Opened | Closed | Credit | Paid to close | Reason | P&L |', '|---|---|---|---|---|---|---|',
    ...j.closed.map((t) => `| ${t.id} | ${t.openDate} | ${t.exitDate} | $${(t.credit * 100).toFixed(0)} | $${(t.exitDebit * 100).toFixed(0)} | ${t.reason} | $${t.pnl} |`), '',
    '## Daily log', '', '| Date | QQQ | VIX | Equity | Buy & hold | Actions | Note |', '|---|---|---|---|---|---|---|',
    ...[...j.days].reverse().map((d) => `| ${d.date} | ${d.spot} | ${d.vix} | $${d.equity} | $${d.benchmark} | ${d.actions.join('; ')} | ${d.note} |`), '',
  ];
  return lines.join('\n');
}

// ---------------- CLI ----------------
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const [, , cmd, ...rest] = process.argv;
  const a = {}; for (let i = 0; i < rest.length; i += 2) a[rest[i].replace(/^--/, '')] = rest[i + 1];
  const load = () => (fs.existsSync(JOURNAL) ? JSON.parse(fs.readFileSync(JOURNAL, 'utf8')) : null);
  if (cmd === 'plan') {
    console.log(JSON.stringify(plan(load(), { spot: +a.spot, vix: +a.vix, today: a.today, expirations: a.expirations.split(',') }), null, 2));
  } else if (cmd === 'run') {
    const snap = JSON.parse(fs.readFileSync(rest[0], 'utf8'));
    let j = load();
    if (j?.days.some((d) => d.date === snap.date)) { console.log(`Already ran for ${snap.date}; nothing to do.`); process.exit(0); }
    j ??= emptyJournal(snap.spot, snap.date);
    const { actions } = run(j, snap);
    fs.writeFileSync(JOURNAL, JSON.stringify(j, null, 2) + '\n');
    fs.writeFileSync(REPORT, report(j));
    console.log(actions.join('\n'));
    console.log(`Equity $${j.days.at(-1).equity} | buy&hold $${j.days.at(-1).benchmark}`);
  } else console.log('usage: plan --spot --vix --today --expirations | run snapshot.json');
}
