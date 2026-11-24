// Paper-trading backtester. Prices options with Black-Scholes along a price path
// (historical closes you supply, or a simulated one). No real orders are ever sent.
import { price } from './blackScholes.js';
import { MULTIPLIER } from './strategies.js';

// Deterministic PRNG so simulations are reproducible.
export function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  const u = Math.max(rand(), 1e-12), v = rand();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// Geometric Brownian motion daily path (252 trading days / year).
export function simulatePath({ S0, days, mu = 0.07, sigma = 0.25, seed = 1 }) {
  const rand = mulberry32(seed), dt = 1 / 252, path = [S0];
  for (let i = 1; i <= days; i++) {
    const prev = path[i - 1];
    path.push(prev * Math.exp((mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * gaussian(rand)));
  }
  return path;
}

// A strategy rule set:
//   open(S, ctx) -> legs spec [{kind, side, strikePct}] (strike = S * strikePct, rounded)
//   dte: days to expiry at entry (trading days)
//   takeProfitPct: close when P&L >= this fraction of max credit/debit (optional)
//   stopLossPct: close when loss >= this fraction of debit / multiple of credit (optional)
export function runBacktest({ path, strategy, r = 0.04, iv = 0.25, slippagePerContract = 0.05, commissionPerContract = 0.65, startCash = 10000, contracts = 1 }) {
  const trades = [];
  let cash = startCash, day = 0;
  const equity = [startCash];
  while (day + strategy.dte < path.length) {
    const S0 = path[day];
    const legs = strategy.open(S0).map((l) => ({ ...l, strike: Math.round(S0 * l.strikePct) }));
    const value = (S, daysLeft) => legs.reduce((sum, l) => {
      const p = price({ type: l.kind, S, K: l.strike, T: daysLeft / 252, r, sigma: iv });
      return sum + (l.side === 'long' ? p : -p);
    }, 0);
    const costs = legs.length * contracts * (slippagePerContract * MULTIPLIER + commissionPerContract);
    const entry = value(S0, strategy.dte); // >0 debit paid, <0 credit received
    let exitDay = day + strategy.dte, exitVal = value(path[exitDay], 0), reason = 'expiry';
    for (let d = day + 1; d <= day + strategy.dte; d++) {
      const v = value(path[d], day + strategy.dte - d);
      const pnl = v - entry;
      const basis = Math.abs(entry);
      if (strategy.takeProfitPct != null && pnl >= basis * strategy.takeProfitPct) { exitDay = d; exitVal = v; reason = 'take-profit'; break; }
      if (strategy.stopLossPct != null && -pnl >= basis * strategy.stopLossPct) { exitDay = d; exitVal = v; reason = 'stop-loss'; break; }
    }
    const pnl = (exitVal - entry) * MULTIPLIER * contracts - costs * 2;
    cash += pnl;
    trades.push({ openDay: day, closeDay: exitDay, spotIn: +S0.toFixed(2), spotOut: +path[exitDay].toFixed(2), reason, pnl: +pnl.toFixed(2) });
    equity.push(cash);
    day = exitDay + 1;
  }
  return { trades, equity, summary: summarize(trades, startCash, equity) };
}

export function summarize(trades, startCash, equity) {
  const wins = trades.filter((t) => t.pnl > 0), losses = trades.filter((t) => t.pnl <= 0);
  const sum = (a) => a.reduce((s, t) => s + t.pnl, 0);
  let peak = -Infinity, maxDD = 0;
  for (const e of equity) { peak = Math.max(peak, e); maxDD = Math.max(maxDD, (peak - e) / peak); }
  return {
    trades: trades.length,
    winRate: trades.length ? +(wins.length / trades.length).toFixed(3) : 0,
    avgWin: wins.length ? +(sum(wins) / wins.length).toFixed(2) : 0,
    avgLoss: losses.length ? +(sum(losses) / losses.length).toFixed(2) : 0,
    totalPnl: +sum(trades).toFixed(2),
    returnPct: +((sum(trades) / startCash) * 100).toFixed(2),
    maxDrawdownPct: +(maxDD * 100).toFixed(2),
  };
}

// Run the same strategy across many simulated paths: one lucky path proves nothing.
export function monteCarlo({ strategy, runs = 200, S0 = 100, days = 252, mu = 0.07, sigma = 0.25, iv, ...rest }) {
  const results = [];
  for (let seed = 1; seed <= runs; seed++) {
    const path = simulatePath({ S0, days, mu, sigma, seed });
    results.push(runBacktest({ path, strategy, iv: iv ?? sigma, ...rest }).summary);
  }
  const rets = results.map((r) => r.returnPct).sort((a, b) => a - b);
  const pct = (p) => rets[Math.min(rets.length - 1, Math.floor(p * rets.length))];
  return {
    runs,
    medianReturnPct: pct(0.5),
    p5ReturnPct: pct(0.05),
    p95ReturnPct: pct(0.95),
    pctRunsProfitable: +((rets.filter((x) => x > 0).length / runs) * 100).toFixed(1),
    avgWinRate: +(results.reduce((s, r) => s + r.winRate, 0) / runs).toFixed(3),
    worstDrawdownPct: Math.max(...results.map((r) => r.maxDrawdownPct)),
  };
}

export const presetStrategies = {
  longCall: { name: 'Buy 30-day ATM call', dte: 21, open: () => [{ kind: 'call', side: 'long', strikePct: 1.0 }] },
  shortPutSpread: { name: 'Sell 30-day put spread (95/90), TP 50%', dte: 21, takeProfitPct: 0.5,
    open: () => [{ kind: 'put', side: 'short', strikePct: 0.95 }, { kind: 'put', side: 'long', strikePct: 0.90 }] },
  ironCondor: { name: 'Iron condor 90/95/105/110, TP 50%', dte: 21, takeProfitPct: 0.5,
    open: () => [
      { kind: 'put', side: 'long', strikePct: 0.90 }, { kind: 'put', side: 'short', strikePct: 0.95 },
      { kind: 'call', side: 'short', strikePct: 1.05 }, { kind: 'call', side: 'long', strikePct: 1.10 }] },
  bullCallSpread: { name: 'Bull call spread 100/110', dte: 21,
    open: () => [{ kind: 'call', side: 'long', strikePct: 1.0 }, { kind: 'call', side: 'short', strikePct: 1.10 }] },
};
