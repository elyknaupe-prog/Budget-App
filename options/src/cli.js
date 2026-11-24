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
} else {
  console.log('Commands: analyze, backtest. See comments at top of src/cli.js');
}
