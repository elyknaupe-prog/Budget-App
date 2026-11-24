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
import { makeMarket } from '../src/historicalBacktest.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const JOURNAL = path.join(DIR, 'journal.json');
const REPORT = path.join(DIR, 'JOURNAL.md');

export const RULES = {
  startCash: 1000,
  // v2 rules (2026-11-24), chosen by src/runOptimize.js on 2011-2019 and confirmed on unseen 2020-2026:
  // ~45 DTE, ~0.20 delta short put, HOLD TO EXPIRATION, no stop-loss. Early take-profits and stops
  // lost money in both periods (they pay the bid/ask again and cut winners that would have expired).
  targetDelta: 0.20, minDelta: 0.13, maxDelta: 0.27, // short put
  minDte: 35, maxDte: 52,
  widths: [1, 2, 3, 5],   // QQQ strikes this far OTM are $5 apart, so in practice $5
  // With only $1,000 the smallest real spread risks ~$400, so: ONE spread at a time.
  maxRiskPerTrade: 0.45,  // of equity
  maxTotalRisk: 0.45,     // of equity, across open spreads
  minCreditPctOfWidth: 0.10,
  takeProfitPct: null,    // hold to expiry
  stopLossMultiple: null, // no stop
  closeAtDte: 0,
  expiryCushion: 0.02,    // on expiration morning: let expire if QQQ >= short strike +2%, else close at market
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

// ---- analytics helpers ----
// Greeks of one quoted leg; falls back to Black-Scholes from the leg's IV if Robinhood omitted any.
function legGreeks(x, spot, daysLeft) {
  const bs = x.iv ? greeks({ type: 'put', S: spot, K: x.strike, T: Math.max(daysLeft, 0.5) / 365, r: 0.04, sigma: x.iv }) : {};
  return { delta: x.delta ?? bs.delta ?? 0, gamma: x.gamma ?? bs.gamma ?? 0, theta: x.theta ?? bs.theta ?? 0, vega: x.vega ?? bs.vega ?? 0 };
}
// Position Greeks in dollars for 1 spread (short leg counts negative): delta = $ per $1 QQQ move,
// theta = $ per day, vega = $ per 1 vol point, gamma = change in delta per $1.
export function positionGreeks(p, q, spot, daysLeft) {
  const s = legGreeks(q[p.shortId], spot, daysLeft), l = legGreeks(q[p.longId], spot, daysLeft);
  const net = (k) => Math.round((l[k] - s[k]) * 100 * 10000) / 10000;
  const g = { delta: net('delta'), gamma: net('gamma'), theta: net('theta'), vega: net('vega') };
  return { delta: r2(g.delta), gamma: Math.round(g.gamma * 10000) / 10000, theta: r2(g.theta), vega: r2(g.vega) };
}
// Distance above the short strike, in % and in "expected moves" (1 std-dev to expiry implied by IV).
export function cushion(p, q, spot, daysLeft) {
  const iv = q[p.shortId]?.iv ?? 0.3;
  const em = spot * iv * Math.sqrt(Math.max(daysLeft, 1) / 365);
  const sd = (spot - p.shortStrike) / em;
  const status = spot <= p.shortStrike ? 'DANGER (short strike breached)' : sd < 0.5 ? 'DANGER' : sd < 1 ? 'WATCH' : 'OK';
  return { pct: r2((spot / p.shortStrike - 1) * 100), sd: r2(sd), expectedMove: r2(em), status };
}
export function realizedVol(closes) {
  if (!closes || closes.length < 21) return null;
  const c = closes.slice(-21);
  let t = 0; for (let i = 1; i < c.length; i++) t += Math.log(c[i] / c[i - 1]) ** 2;
  return Math.sqrt((t / 20) * 252);
}
// Compare the backtest's option model (IV = VIX x 1.2 with skew) to real quotes at entry, so we learn
// whether the historical results were priced realistically.
function modelCheck(snap, exp, s, l) {
  const m = makeMarket();
  const row = { date: snap.date, c: snap.spot, vix: snap.vix };
  const T = dte(snap.date, exp) / 365;
  const model = m.opt(row, 'put', s.strike, T) - m.opt(row, 'put', l.strike, T);
  const real = (s.bid + s.ask) / 2 - (l.bid + l.ask) / 2;
  return { modelCredit: r2(model), realMidCredit: r2(real), ratio: real ? r2(model / real) : null };
}

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
      if (left === 0 && snap.spot >= p.shortStrike * (1 + RULES.expiryCushion)) { debit = 0; reason = 'expired-worthless'; }
      else if (left === 0) reason = 'expiry-day-close';
      else if (RULES.takeProfitPct != null && pnl >= p.credit * RULES.takeProfitPct) reason = 'take-profit';
      else if (RULES.stopLossMultiple != null && -pnl >= p.credit * RULES.stopLossMultiple) reason = 'stop-loss';
      else if (left <= RULES.closeAtDte) reason = 'time-exit';
      p.lastMark = { date: snap.date, debit: r2(debit), pnl: r2((p.credit - debit) * 100 - p.fees),
        greeks: positionGreeks(p, q, snap.spot, left), cushion: cushion(p, q, snap.spot, left), dte: left };
      if (!reason && p.lastMark.cushion.status !== 'OK') actions.push(`${p.lastMark.cushion.status}: ${p.id} QQQ ${p.lastMark.cushion.pct}% above short strike (${p.lastMark.cushion.sd} expected moves); no stop by rule, holding`);
    }
    if (reason) {
      const exitFees = reason.startsWith('expired') ? 0 : fees(2);
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
        shortDelta: s.delta, shortIv: s.iv, spotAtEntry: snap.spot, vixAtEntry: snap.vix, breakeven: r2(s.strike - credit),
        modelCheck: modelCheck(snap, exp, s, l) };
      break;
    }
    if (opened) break;
  }
  if (opened) {
    journal.cash += opened.credit * 100 - opened.fees;
    const d0 = dte(snap.date, opened.expiry);
    opened.lastMark = { date: snap.date, debit: opened.credit, pnl: -opened.fees, greeks: positionGreeks(opened, q, snap.spot, d0), cushion: cushion(opened, q, snap.spot, d0), dte: d0 };
    journal.open.push(opened);
    actions.push(`OPEN ${opened.id}: sell ${opened.shortStrike}P @${opened.shortFill}, buy ${opened.longStrike}P @${opened.longFill}, credit $${(opened.credit * 100).toFixed(0)}, max loss $${opened.maxLoss.toFixed(0)}, breakeven ${opened.breakeven}`);
  } else actions.push(`NO NEW TRADE: ${skip}`);

  const bench = journal.benchmark.shares * snap.spot;
  const rv = realizedVol(snap.recentCloses);
  const ivAtm = Object.values(q).filter((x) => x.iv).sort((a, b) => Math.abs(a.strike - snap.spot) - Math.abs(b.strike - snap.spot))[0]?.iv ?? null;
  journal.days.push({ date: snap.date, time: snap.time, spot: snap.spot, vix: snap.vix, rv20: rv && r2(rv * 100), ivRv: rv && ivAtm ? r2(ivAtm / rv) : null, equity: r2(equity()), benchmark: r2(bench), open: journal.open.length, riskUsed: r2(riskUsed()), actions, note: snap.note ?? '' });
  return { journal, actions };
}

function maxDD(xs) { let pk = -Infinity, dd = 0; for (const x of xs) { pk = Math.max(pk, x); dd = Math.max(dd, 1 - x / pk); } return dd; }
function stats(j) {
  const t = j.closed, wins = t.filter((x) => x.pnl > 0), losses = t.filter((x) => x.pnl <= 0);
  const avg = (a) => (a.length ? a.reduce((acc, x) => acc + x.pnl, 0) / a.length : 0);
  const mc = [...j.open, ...j.closed].map((p) => p.modelCheck?.ratio).filter((x) => x);
  return [
    '| Metric | Value |', '|---|---|',
    `| Trades closed | ${t.length} |`,
    `| Win rate | ${t.length ? ((wins.length / t.length) * 100).toFixed(0) + '%' : 'n/a'} (backtest: ~91-97%) |`,
    `| Avg win / avg loss | $${avg(wins).toFixed(2)} / $${avg(losses).toFixed(2)} |`,
    `| Max drawdown: journal / buy & hold | ${(maxDD(j.days.map((d) => d.equity)) * 100).toFixed(1)}% / ${(maxDD(j.days.map((d) => d.benchmark)) * 100).toFixed(1)}% |`,
    `| Days logged | ${j.days.length} |`,
    `| Backtest model vs real credit at entry | ${mc.length ? (mc.reduce((a, b) => a + b, 0) / mc.length).toFixed(2) + 'x (1.00 = exact; below 1 = backtest was conservative)' : 'n/a (from next entry on)'} |`,
  ];
}

export function report(j) {
  const last = j.days.at(-1);
  const wins = j.closed.filter((t) => t.pnl > 0).length;
  const realized = j.closed.reduce((a, t) => a + t.pnl, 0);
  const lines = [
    '# Paper-trading journal ($1,000 start, no real orders)', '',
    `Strategy: QQQ put credit spreads, short ~${RULES.targetDelta} delta, ${RULES.minDte}-${RULES.maxDte} DTE, entered at the 10:07 ET run, max loss <= ${RULES.maxRiskPerTrade * 100}% of equity per trade,`,
    `<= ${RULES.maxTotalRisk * 100}% total. Rules v2: hold to expiration, no stop; on expiration morning let it expire if QQQ is ${RULES.expiryCushion * 100}%+ above the short strike, else close. Fills use Robinhood "high fill rate" prices + fees.`, '',
    `**As of ${last.date}:** equity **$${last.equity.toFixed(2)}** (${((last.equity / RULES.startCash - 1) * 100).toFixed(2)}%) vs buy-and-hold QQQ **$${last.benchmark.toFixed(2)}** (${((last.benchmark / RULES.startCash - 1) * 100).toFixed(2)}%).`,
    `Closed trades: ${j.closed.length} (${wins} winners), realized P&L $${realized.toFixed(2)}. Open: ${j.open.length}, risk in use $${last.riskUsed.toFixed(0)}.`, '',
    '## Open positions', '', '| Spread | Opened | DTE | Credit | Max loss | Breakeven | P&L now | Delta $/pt | Theta $/day | Vega $/vol | Cushion | Status |', '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...j.open.map((p) => { const m = p.lastMark ?? {}, g = m.greeks ?? {}, c = m.cushion ?? {};
      return `| ${p.id} | ${p.openDate} | ${m.dte ?? ''} | $${(p.credit * 100).toFixed(0)} | $${p.maxLoss.toFixed(0)} | ${p.breakeven} | $${m.pnl ?? 0} | ${g.delta ?? ''} | ${g.theta ?? ''} | ${g.vega ?? ''} | ${c.pct ?? ''}% / ${c.sd ?? ''} EM | ${c.status ?? ''} |`; }), '',
    'Delta: $ gained per $1 QQQ rise. Theta: $ earned per day from time decay. Vega: $ change per 1-point rise in implied vol. Cushion: % and expected moves (EM = 1 std-dev to expiry) above the short strike.', '',
    '## Stats', '', ...stats(j), '',
    '## Closed trades', '', '| Spread | Opened | Closed | Credit | Paid to close | Reason | P&L |', '|---|---|---|---|---|---|---|',
    ...j.closed.map((t) => `| ${t.id} | ${t.openDate} | ${t.exitDate} | $${(t.credit * 100).toFixed(0)} | $${(t.exitDebit * 100).toFixed(0)} | ${t.reason} | $${t.pnl} |`), '',
    '## Daily log', '', '| Date | QQQ | VIX | IV/RV | Equity | Buy & hold | Actions | Note |', '|---|---|---|---|---|---|---|---|',
    ...[...j.days].reverse().map((d) => `| ${d.date} | ${d.spot} | ${d.vix} | ${d.ivRv ?? ''} | $${d.equity} | $${d.benchmark} | ${d.actions.join('; ')} | ${d.note} |`), '',
    'IV/RV: at-the-money implied vol / 20-day realized vol. Above ~1.2 = options rich (2011-2026 median 1.23). Logged for study; as an entry filter it did not improve backtests.', '',
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
  } else if (cmd === 'report') { // rebuild JOURNAL.md from journal.json
    fs.writeFileSync(REPORT, report(load())); console.log('JOURNAL.md rebuilt');
  } else console.log('usage: plan --spot --vix --today --expirations | run snapshot.json | report');
}
