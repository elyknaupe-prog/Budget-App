// Backtest well-known monthly options strategies on REAL QQQ daily prices (2011-2026).
//
// Real option-chain history is not available here, so options are priced with Black-Scholes
// using a real, time-varying implied volatility: VIX (S&P 500 30-day implied vol) x ivMult,
// since Nasdaq-100 implied vol (VXN) has historically run roughly 1.2x VIX. A linear skew
// makes out-of-the-money puts dearer and calls cheaper, like real markets.
// Because IV comes from the actual fear gauge each month, the backtest captures the real
// "volatility risk premium": implied vol has usually been above the volatility that followed.
//
// All strategies are sized so they can never lose more than the account (no margin).
import fs from 'node:fs';
import { price, greeks } from './blackScholes.js';

// Approximate average 3-month T-bill yield by year (cash collateral earns this).
const TBILL = { 2011: 0.0005, 2012: 0.0009, 2013: 0.0006, 2014: 0.0003, 2015: 0.0005, 2016: 0.0032, 2017: 0.0093, 2018: 0.0194,
  2019: 0.0206, 2020: 0.0037, 2021: 0.0005, 2022: 0.0202, 2023: 0.0507, 2024: 0.0497, 2025: 0.042, 2026: 0.038 };
const DIV_YIELD = 0.006; // QQQ dividend yield, credited to strategies that hold shares

export function loadDaily(path) {
  return fs.readFileSync(path, 'utf8').trim().split('\n').slice(1).map((l) => {
    const [date, o, h, lo, c, vix] = l.split(',');
    return { date, o: +o, h: +h, l: +lo, c: +c, vix: +vix };
  });
}

export function makeMarket({ ivMult = 1.2, skew = 0.8, halfSpread = 0.03 } = {}) {
  const atmIv = (row) => (row.vix / 100) * ivMult;
  const ivAt = (row, S, K) => Math.max(atmIv(row) * 0.5, atmIv(row) + skew * Math.log(S / K) * 1); // OTM puts up, OTM calls down
  const r = (row) => TBILL[+row.date.slice(0, 4)] ?? 0.03;
  const step = (S) => (S >= 100 ? 1 : 0.5);
  const round = (x, S) => Math.round(x / step(S)) * step(S);
  // Strike whose |delta| is closest to target.
  function strikeForDelta(row, type, target, T) {
    const S = row.c;
    let best = null;
    for (let k = round(S * 0.6, S); k <= S * 1.4; k += step(S)) {
      const d = Math.abs(greeks({ type, S, K: k, T, r: r(row), sigma: ivAt(row, S, k) }).delta);
      if (!best || Math.abs(d - target) < best.err) best = { K: k, err: Math.abs(d - target) };
    }
    return best.K;
  }
  const opt = (row, type, K, T) => price({ type, S: row.c, K, T, r: r(row), sigma: ivAt(row, row.c, K) });
  return { atmIv, ivAt, r, strikeForDelta, opt, halfSpread };
}

const intrinsic = (type, S, K) => Math.max(type === 'call' ? S - K : K - S, 0);

// Each strategy returns the fractional account return for one cycle from row a (entry) to row b (expiry).
export const STRATEGIES = {
  buyHold: { name: 'Buy & hold QQQ (benchmark)', cycle: (m, a, b, T) => b.c / a.c - 1 + DIV_YIELD * T },

  cashSecuredPut: { name: 'Cash-secured put, 30-delta', cycle(m, a, b, T) {
    const K = m.strikeForDelta(a, 'put', 0.3, T);
    const prem = m.opt(a, 'put', K, T) - m.halfSpread;
    return (prem - intrinsic('put', b.c, K)) / K + m.r(a) * T;
  } },

  atmPutWrite: { name: 'Cash-secured put, at-the-money (like CBOE PUT index)', cycle(m, a, b, T) {
    const K = Math.round(a.c);
    const prem = m.opt(a, 'put', K, T) - m.halfSpread;
    return (prem - intrinsic('put', b.c, K)) / K + m.r(a) * T;
  } },

  coveredCall: { name: 'Covered call, 30-delta', cycle(m, a, b, T) {
    const K = m.strikeForDelta(a, 'call', 0.3, T);
    const prem = m.opt(a, 'call', K, T) - m.halfSpread;
    return (b.c - a.c + prem - intrinsic('call', b.c, K)) / a.c + DIV_YIELD * T;
  } },

  putCreditSpread: { name: 'Put credit spread 30d/15d, risk 5%/month', riskPct: 0.05, cycle(m, a, b, T) {
    const Ks = m.strikeForDelta(a, 'put', 0.3, T), Kl = Math.min(m.strikeForDelta(a, 'put', 0.15, T), Ks - 1);
    const credit = m.opt(a, 'put', Ks, T) - m.opt(a, 'put', Kl, T) - 2 * m.halfSpread;
    const maxLoss = Ks - Kl - credit;
    const pnl = credit - (intrinsic('put', b.c, Ks) - intrinsic('put', b.c, Kl));
    return this.riskPct * (pnl / maxLoss) + m.r(a) * T;
  } },

  ironCondor: { name: 'Iron condor 20d short / 10d long, risk 5%/month', riskPct: 0.05, cycle(m, a, b, T) {
    const Ps = m.strikeForDelta(a, 'put', 0.2, T), Pl = Math.min(m.strikeForDelta(a, 'put', 0.1, T), Ps - 1);
    const Cs = m.strikeForDelta(a, 'call', 0.2, T), Cl = Math.max(m.strikeForDelta(a, 'call', 0.1, T), Cs + 1);
    const credit = m.opt(a, 'put', Ps, T) - m.opt(a, 'put', Pl, T) + m.opt(a, 'call', Cs, T) - m.opt(a, 'call', Cl, T) - 4 * m.halfSpread;
    const maxLoss = Math.max(Ps - Pl, Cl - Cs) - credit;
    const pay = intrinsic('put', b.c, Ps) - intrinsic('put', b.c, Pl) + intrinsic('call', b.c, Cs) - intrinsic('call', b.c, Cl);
    return this.riskPct * ((credit - pay) / maxLoss) + m.r(a) * T;
  } },

  longCall: { name: 'Buy ATM call, spend 5%/month', riskPct: 0.05, cycle(m, a, b, T) {
    const K = Math.round(a.c);
    const cost = m.opt(a, 'call', K, T) + m.halfSpread;
    return this.riskPct * (intrinsic('call', b.c, K) / cost - 1) + m.r(a) * T;
  } },

  collar: { name: 'Collar: QQQ + buy 25d put + sell 25d call', cycle(m, a, b, T) {
    const Kp = m.strikeForDelta(a, 'put', 0.25, T), Kc = m.strikeForDelta(a, 'call', 0.25, T);
    const net = m.opt(a, 'call', Kc, T) - m.opt(a, 'put', Kp, T) - 2 * m.halfSpread;
    return (b.c - a.c + net + intrinsic('put', b.c, Kp) - intrinsic('call', b.c, Kc)) / a.c + DIV_YIELD * T;
  } },
};

export function runHistorical(rows, strategy, { holdDays = 21, from, to, ...mkt } = {}) {
  const m = makeMarket(mkt);
  const data = rows.filter((x) => (!from || x.date >= from) && (!to || x.date <= to));
  const T = 30 / 365;
  const rets = [];
  for (let i = 0; i + holdDays < data.length; i += holdDays) rets.push({ date: data[i].date, ret: strategy.cycle(m, data[i], data[i + holdDays], T) });
  return { rets, stats: stats(rets.map((x) => x.ret), data, holdDays) };
}

export function stats(rets, data, holdDays) {
  const perYear = 252 / holdDays;
  let eq = 1, peak = 1, maxDD = 0;
  for (const r of rets) { eq *= 1 + r; peak = Math.max(peak, eq); maxDD = Math.max(maxDD, 1 - eq / peak); }
  const years = rets.length / perYear;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - mean) ** 2, 0) / (rets.length - 1));
  const rf = 0.017 / perYear; // ~average T-bill over the period
  return {
    years: +years.toFixed(1),
    cagrPct: +((eq ** (1 / years) - 1) * 100).toFixed(2),
    volPct: +(sd * Math.sqrt(perYear) * 100).toFixed(1),
    sharpe: +(((mean - rf) / sd) * Math.sqrt(perYear)).toFixed(2),
    maxDrawdownPct: +(maxDD * 100).toFixed(1),
    worstMonthPct: +(Math.min(...rets) * 100).toFixed(1),
    winMonthsPct: +((rets.filter((r) => r > 0).length / rets.length) * 100).toFixed(0),
    growthOf10k: Math.round(10000 * eq),
  };
}
