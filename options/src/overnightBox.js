// "Overnight box" claim from the reel:
//   Split the overnight range (18:00 -> 09:30 ET) in half at the 09:30 open.
//   Open in upper half -> overnight HIGH gets tapped during RTH ~80.8% of the time.
//   Open in lower half -> overnight LOW  gets tapped ~75.7% of the time.
//
// This module (1) measures that statistic on any set of sessions, (2) measures a
// CONTROL level placed the same distance from the open on the other side, and
// (3) backtests actually trading toward the "target" with realistic NQ costs.
//
// A session is { ovn: number[] | Bar[], rth: Bar[] } where Bar = {o,h,l,c}.
// For simulated data each bar is a single price (o=h=l=c).

export const NQ = { pointValue: 20, tick: 0.25, commissionRT: 4.5, slippageTicksPerSide: 1 };
export const MNQ = { pointValue: 2, tick: 0.25, commissionRT: 1.5, slippageTicksPerSide: 1 };

export function boxStats(session) {
  const H = Math.max(...session.ovn.map((b) => b.h));
  const L = Math.min(...session.ovn.map((b) => b.l));
  const open = session.rth[0].o;
  const mid = (H + L) / 2;
  const upper = open >= mid;
  const rthHigh = Math.max(...session.rth.map((b) => b.h));
  const rthLow = Math.min(...session.rth.map((b) => b.l));
  const outside = open > H || open < L; // gapped outside the box: level already "taken"
  const near = upper ? H : L;
  const far = upper ? L : H;
  const d = Math.abs(near - open);
  const mirror = upper ? open - d : open + d; // control: same distance, opposite side
  return {
    H, L, open, mid, upper, outside, near, far, d, mirror,
    nearTapped: upper ? rthHigh >= H : rthLow <= L,
    farTapped: upper ? rthLow <= L : rthHigh >= H,
    mirrorTapped: upper ? rthLow <= mirror : rthHigh >= mirror,
  };
}

export function hitRates(sessions) {
  const rows = sessions.map(boxStats).filter((s) => !s.outside && s.d > 0);
  const rate = (arr, k) => (arr.length ? arr.filter((s) => s[k]).length / arr.length : NaN);
  const up = rows.filter((s) => s.upper), dn = rows.filter((s) => !s.upper);
  return {
    sessions: rows.length,
    upperOpen: { n: up.length, highTapped: rate(up, 'nearTapped'), lowTapped: rate(up, 'farTapped') },
    lowerOpen: { n: dn.length, lowTapped: rate(dn, 'nearTapped'), highTapped: rate(dn, 'farTapped') },
    nearTapped: rate(rows, 'nearTapped'),
    mirrorTapped: rate(rows, 'mirrorTapped'),
    farTapped: rate(rows, 'farTapped'),
  };
}

// Trade rules (enter at the 09:30 open in the direction of the near level):
//   stop: 'far'    -> stop at the opposite overnight extreme
//         'mirror' -> stop the same distance away as the target (1:1)
//         number   -> fixed stop in points
//   timeStopBars: exit at market after N RTH bars if neither hit (e.g. 20 for 09:50 on 1-min)
// If target and stop are both inside one bar, assume the STOP filled first (conservative).
export function backtestBox(sessions, { stop = 'far', timeStopBars = null, contract = NQ } = {}) {
  const trades = [];
  for (const sess of sessions) {
    const s = boxStats(sess);
    if (s.outside || s.d <= 0) continue;
    const dir = s.upper ? 1 : -1;
    const target = s.near;
    const stopPx = stop === 'far' ? s.far : stop === 'mirror' ? s.mirror : s.open - dir * stop;
    const lastIdx = timeStopBars != null ? Math.min(timeStopBars, sess.rth.length - 1) : sess.rth.length - 1;
    let exit = null, reason = 'close';
    for (let i = 0; i <= lastIdx && exit == null; i++) {
      const b = sess.rth[i];
      const stopHit = dir === 1 ? b.l <= stopPx : b.h >= stopPx;
      const tgtHit = dir === 1 ? b.h >= target : b.l <= target;
      if (stopHit) { exit = stopPx; reason = 'stop'; }
      else if (tgtHit) { exit = target; reason = 'target'; }
    }
    if (exit == null) { exit = sess.rth[lastIdx].c; reason = timeStopBars != null ? 'time' : 'close'; }
    const grossPts = dir * (exit - s.open);
    const costPts = 2 * contract.slippageTicksPerSide * contract.tick + contract.commissionRT / contract.pointValue;
    trades.push({ reason, grossPts, netPts: grossPts - costPts, netUsd: (grossPts - costPts) * contract.pointValue });
  }
  const n = trades.length;
  const mean = (k) => trades.reduce((a, t) => a + t[k], 0) / n;
  const wins = trades.filter((t) => t.netPts > 0);
  const losses = trades.filter((t) => t.netPts <= 0);
  const sd = Math.sqrt(trades.reduce((a, t) => a + (t.netPts - mean('netPts')) ** 2, 0) / n);
  return {
    trades: n,
    targetHitRate: trades.filter((t) => t.reason === 'target').length / n,
    winRate: wins.length / n,
    avgWinPts: wins.length ? wins.reduce((a, t) => a + t.netPts, 0) / wins.length : 0,
    avgLossPts: losses.length ? losses.reduce((a, t) => a + t.netPts, 0) / losses.length : 0,
    grossPtsPerTrade: mean('grossPts'),
    netPtsPerTrade: mean('netPts'),
    netUsdPerTrade: mean('netUsd'),
    tStat: (mean('netPts') / sd) * Math.sqrt(n), // |t| < 2 => indistinguishable from luck
  };
}

// ---------- No-edge baseline: pure random walk sessions ----------
import { mulberry32 } from './backtest.js';

function gauss(rand) {
  const u = Math.max(rand(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

// Defaults approximate NQ: ~330 pt daily std-dev, ~65% of daily variance during RTH,
// 930 overnight minutes (18:00-09:30), 390 RTH minutes. Zero drift, zero memory = NO edge.
export function randomWalkSessions({ n = 2000, seed = 1, start = 24000, dailySdPts = 330, rthVarShare = 0.65, ovnMin = 930, rthMin = 390, driftPtsPerDay = 0 } = {}) {
  const mu = driftPtsPerDay / (ovnMin + rthMin);
  const rand = mulberry32(seed);
  const sdO = Math.sqrt(((1 - rthVarShare) * dailySdPts ** 2) / ovnMin);
  const sdR = Math.sqrt((rthVarShare * dailySdPts ** 2) / rthMin);
  const out = [];
  let px = start;
  for (let k = 0; k < n; k++) {
    const ovn = [], rth = [];
    for (let i = 0; i < ovnMin; i++) { px += mu + sdO * gauss(rand); ovn.push({ o: px, h: px, l: px, c: px }); }
    for (let i = 0; i < rthMin; i++) { rth.push({ o: px, h: px, l: px, c: px }); px += mu + sdR * gauss(rand); }
    out.push({ ovn, rth });
  }
  return out;
}

// ---------- Real data: CSV of 1-min (or any) bars ----------
// Columns: datetime (America/New_York local, e.g. 2026-11-20 09:30), open, high, low, close
// Export from TradingView, NinjaTrader, Databento, your broker, etc.
export function sessionsFromCsv(text) {
  const rows = text.trim().split(/\r?\n/).filter((l) => /\d/.test(l[0]));
  const bars = rows.map((l) => {
    const [dt, o, h, l2, c] = l.split(',');
    const [d, t] = dt.trim().split(/[ T]/);
    const [hh, mm] = t.split(':').map(Number);
    return { d, m: hh * 60 + mm, o: +o, h: +h, l: +l2, c: +c };
  });
  const sessions = [];
  let ovn = [], rth = [], curDay = null;
  for (const b of bars) {
    if (b.m >= 18 * 60 || b.m < 9 * 60 + 30) {
      if (rth.length) { sessions.push({ day: curDay, ovn, rth }); ovn = []; rth = []; }
      ovn.push(b);
    } else if (b.m < 16 * 60) {
      if (ovn.length) { rth.push(b); curDay = b.d; }
    }
  }
  if (rth.length && ovn.length) sessions.push({ day: curDay, ovn, rth });
  return sessions.filter((s) => s.ovn.length && s.rth.length);
}
