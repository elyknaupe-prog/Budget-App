#!/usr/bin/env node
// Usage:
//   node src/cli.js analyze --S 100 --K 105 --T 30 --iv 0.25 --type call [--r 0.04] [--account 10000]
//   node src/cli.js backtest [--strategy ironCondor|shortPutSpread|longCall|bullCallSpread] [--runs 300] [--sigma 0.25] [--iv 0.25]
import { price, greeks, probITM } from './blackScholes.js';
import { analyze, build } from './strategies.js';
import { checkTrade, maxContracts } from './risk.js';
import { monteCarlo, presetStrategies } from './backtest.js';

const [, , cmd, ...rest] = process.argv;
const args = {};
for (let i = 0; i < rest.length; i += 2) args[rest[i].replace(/^--/, '')] = rest[i + 1];
const num = (k, d) => (args[k] != null ? Number(args[k]) : d);

if (cmd === 'analyze') {
  const p = { type: args.type ?? 'call', S: num('S', 100), K: num('K', 100), T: num('T', 30) / 365, r: num('r', 0.04), sigma: num('iv', 0.25) };
  const prem = price(p);
  const g = greeks(p);
  const legs = p.type === 'call' ? build.longCall(p.K, prem) : build.longPut(p.K, prem);
  const a = analyze(legs);
  const account = num('account', 10000);
  const risk = checkTrade({ analysis: a, accountValue: account, dte: num('T', 30) });
  console.log(`\nLong ${p.type} K=${p.K}, ${num('T', 30)} days, spot ${p.S}, IV ${(p.sigma * 100).toFixed(0)}%`);
  console.log(`Theoretical price: $${prem.toFixed(2)}/share = $${(prem * 100).toFixed(0)} per contract`);
  console.log(`Delta ${g.delta.toFixed(3)} | Gamma ${g.gamma.toFixed(4)} | Theta $${(g.theta * 100).toFixed(2)}/day/contract | Vega $${(g.vega * 100).toFixed(2)}/vol pt/contract`);
  console.log(`Chance it finishes in the money: ${(probITM(p) * 100).toFixed(1)}%`);
  console.log(`Breakeven at expiry: ${a.breakevens.join(', ')} | Max loss $${-a.maxLoss} | Max profit ${a.maxProfit}`);
  console.log(`Max contracts under 2% risk rule on $${account}: ${maxContracts(a, account)}`);
  console.log(risk.ok ? 'Risk check: PASS' : 'Risk check: FAIL\n  - ' + risk.issues.join('\n  - '));
} else if (cmd === 'backtest') {
  const names = args.strategy ? [args.strategy] : Object.keys(presetStrategies);
  for (const n of names) {
    const s = presetStrategies[n];
    if (!s) { console.error(`Unknown strategy ${n}`); process.exit(1); }
    const res = monteCarlo({ strategy: s, runs: num('runs', 300), sigma: num('sigma', 0.25), iv: num('iv', undefined), mu: num('mu', 0.07) });
    console.log(`\n${s.name}`);
    console.log(`  ${res.runs} simulated years | win rate ${(res.avgWinRate * 100).toFixed(0)}% | median return ${res.medianReturnPct}% | 5th-95th pct ${res.p5ReturnPct}% .. ${res.p95ReturnPct}%`);
    console.log(`  profitable in ${res.pctRunsProfitable}% of years | worst drawdown ${res.worstDrawdownPct}%`);
  }
} else if (cmd === 'box') {
  // node src/cli.js box [--csv path/to/nq_1min.csv] [--contract MNQ]
  const { hitRates, backtestBox, randomWalkSessions, sessionsFromCsv, NQ, MNQ } = await import('./overnightBox.js');
  const fs = await import('node:fs');
  const sessions = args.csv ? sessionsFromCsv(fs.readFileSync(args.csv, 'utf8')) : randomWalkSessions({ n: num('n', 3000), seed: num('seed', 42) });
  const contract = args.contract === 'MNQ' ? MNQ : NQ;
  const pct = (x) => (x * 100).toFixed(1) + '%';
  const h = hitRates(sessions);
  console.log(`\nOvernight-box study on ${args.csv ?? 'RANDOM WALK (no edge by construction)'}: ${h.sessions} sessions`);
  console.log(`  Upper-half open -> high tapped: ${pct(h.upperOpen.highTapped)} (n=${h.upperOpen.n})   [reel claims 80.8%]`);
  console.log(`  Lower-half open -> low tapped:  ${pct(h.lowerOpen.lowTapped)} (n=${h.lowerOpen.n})   [reel claims 75.7%]`);
  console.log(`  Control level, same distance, opposite side: ${pct(h.mirrorTapped)}  (if ~equal, the stat is just distance)`);
  for (const [label, opts] of [['stop at far side of box', { stop: 'far' }], ['1:1 stop', { stop: 'mirror' }], ['time stop 09:50 (1-min bars)', { stop: 'far', timeStopBars: 20 }]]) {
    const r = backtestBox(sessions, { ...opts, contract });
    console.log(`  Trade toward near level, ${label}: win ${pct(r.winRate)}, avg win ${r.avgWinPts.toFixed(1)} pts, avg loss ${r.avgLossPts.toFixed(1)} pts, net $${r.netUsdPerTrade.toFixed(2)}/trade, t=${r.tStat.toFixed(2)}`);
  }
} else {
  console.log('Commands: analyze, backtest, box. See comments at top of src/cli.js');
}
