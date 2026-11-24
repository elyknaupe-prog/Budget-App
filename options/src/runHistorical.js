// node src/runHistorical.js [--from 2020-01-01] [--to 2026-12-31] [--ivMult 1.2] [--skew 0.8]
import { loadDaily, runHistorical, STRATEGIES } from './historicalBacktest.js';
const a = Object.fromEntries(process.argv.slice(2).reduce((acc, v, i, arr) => (i % 2 ? acc : [...acc, [arr[i].replace(/^--/, ''), arr[i + 1]]]), []));
const rows = loadDaily(new URL('../data/qqq_vix_daily.csv', import.meta.url).pathname);
const opts = { from: a.from, to: a.to, ivMult: a.ivMult ? +a.ivMult : undefined, skew: a.skew ? +a.skew : undefined };
const out = Object.values(STRATEGIES).map((s) => ({ strategy: s.name, ...runHistorical(rows, s, opts).stats }));
console.table(out);
