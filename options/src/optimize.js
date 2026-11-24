// Path-dependent put-credit-spread backtest on REAL daily QQQ + VIX (2011-2026), managed the way
// the paper journal manages trades: one spread at a time, marked once a day, exits on take-profit,
// stop-loss or a days-to-expiry time exit, a new spread opened the next trading day.
// Used to search for the best exit "goal" and entry settings, with a train/test split so we
// do not just curve-fit the past.
import { price, greeks } from './blackScholes.js';
import { loadDaily, makeMarket } from './historicalBacktest.js';

const TBILL_DEFAULT = 0.02;

function strikeForDelta(m, row, target, T) {
  const S = row.c, step = S >= 100 ? 1 : 0.5;
  let best = null;
  for (let k = Math.round((S * 0.7) / step) * step; k <= S; k += step) {
    const d = Math.abs(greeks({ type: 'put', S, K: k, T, r: m.r(row), sigma: m.ivAt(row, S, k) }).delta);
    if (!best || Math.abs(d - target) < best.e) best = { k, e: Math.abs(d - target) };
  }
  // real QQQ strikes this far OTM are $5 apart at today's prices (~0.8% of spot)
  const coarse = Math.max(step, Math.round((S * 0.0079) / step) * step);
  return Math.round(best.k / coarse) * coarse;
}

export function simulate(rows, p, mkt = {}) {
  const { dte = 30, delta = 0.27, tp = 0.5, sl = 2, exitDte = 7, riskFrac = 0.4, costMult = 1 } = p;
  const m = makeMarket(mkt);
  const hs = (S) => costMult * Math.max(0.01, 0.03 * (S / 600)); // half bid/ask per leg, scaled to price level
  const putVal = (row, K, daysLeft) => (daysLeft <= 0 ? Math.max(K - row.c, 0)
    : price({ type: 'put', S: row.c, K, T: daysLeft / 365, r: m.r(row) ?? TBILL_DEFAULT, sigma: m.ivAt(row, row.c, K) }));
  let eq = 1, peak = 1, maxDD = 0, pos = null;
  const trades = [];
  const cal = (a, b) => (Date.parse(b) - Date.parse(a)) / 86400000;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (pos) {
      const left = pos.dte - cal(pos.date, row.date);
      const cost = putVal(row, pos.Ks, left) - putVal(row, pos.Kl, left) + (left > 0 ? 2 * hs(row.c) : 0);
      const pnl = pos.credit - cost;
      let reason = null;
      if (left <= 0) reason = 'expiry';
      else if (tp != null && pnl >= tp * pos.credit) reason = 'tp';
      else if (sl != null && -pnl >= sl * pos.credit) reason = 'sl';
      else if (left <= exitDte) reason = 'time';
      if (reason) {
        const r = pos.n * pnl;                       // fraction of equity
        eq *= 1 + r;
        trades.push({ open: pos.date, close: row.date, reason, ret: r, days: cal(pos.date, row.date) });
        pos = null;
        peak = Math.max(peak, eq); maxDD = Math.max(maxDD, 1 - eq / peak);
        continue; // re-enter next trading day, like the journal
      }
    }
    if (!pos && i + 5 < rows.length && (!p.filter || p.filter(rows, i))) {
      const T = dte / 365;
      const Ks = strikeForDelta(m, row, delta, T);
      const w = Math.max(row.c >= 100 ? 1 : 0.5, Math.round((row.c * 0.0079) / (row.c >= 100 ? 1 : 0.5)) * (row.c >= 100 ? 1 : 0.5));
      const Kl = Ks - w;
      const credit = putVal(row, Ks, dte) - putVal(row, Kl, dte) - 2 * hs(row.c);
      if (credit <= 0.05 * w) continue;
      const maxLoss = w - credit;
      pos = { date: row.date, Ks, Kl, credit, dte, n: riskFrac / maxLoss };
    }
  }
  const years = cal(rows[0].date, rows.at(-1).date) / 365.25;
  const wins = trades.filter((t) => t.ret > 0);
  return {
    cagr: eq ** (1 / years) - 1, maxDD, trades: trades.length, winRate: wins.length / trades.length,
    avgDays: trades.reduce((a, t) => a + t.days, 0) / trades.length,
    reasons: trades.reduce((a, t) => ((a[t.reason] = (a[t.reason] ?? 0) + 1), a), {}), eq,
  };
}

export function grid() {
  const out = [];
  for (const dte of [21, 30, 45]) for (const delta of [0.16, 0.22, 0.27, 0.32])
    for (const tp of [0.25, 0.35, 0.5, 0.65, 0.8, null]) for (const sl of [1, 1.5, 2, 3, null]) for (const exitDte of [0, 7, 14])
      if (exitDte < dte) out.push({ dte, delta, tp, sl, exitDte });
  return out;
}

export { loadDaily };
