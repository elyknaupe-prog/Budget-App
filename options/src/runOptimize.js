import { loadDaily, simulate, grid } from './optimize.js';
const rows = loadDaily(new URL('../data/qqq_vix_daily.csv', import.meta.url).pathname);
const train = rows.filter((r) => r.date < '2020-01-01'), test = rows.filter((r) => r.date >= '2020-01-01');
const score = (s) => s.cagr / Math.max(s.maxDD, 0.05); // return per unit of worst drawdown
const t0 = Date.now();
const res = grid().map((p) => ({ p, tr: simulate(train, p), te: simulate(test, p) }));
res.sort((a, b) => score(b.tr) - score(a.tr));
const fmt = (s) => `CAGR ${(s.cagr * 100).toFixed(1).padStart(5)}% DD ${(s.maxDD * 100).toFixed(0).padStart(3)}% win ${(s.winRate * 100).toFixed(0)}% n=${s.trades} hold ${s.avgDays.toFixed(0)}d`;
const lab = ({ dte, delta, tp, sl, exitDte }) => `dte ${dte} d${delta} tp ${tp ?? 'hold'} sl ${sl ?? 'none'} exit@${exitDte}`;
console.log(`${res.length} combos in ${((Date.now() - t0) / 1000).toFixed(1)}s\nTOP 10 picked on 2011-2019 -> how they did on unseen 2020-2026:`);
for (const r of res.slice(0, 10)) console.log(lab(r.p).padEnd(42), '| train', fmt(r.tr), '| TEST', fmt(r.te));
const cur = res.find((r) => r.p.dte === 30 && r.p.delta === 0.27 && r.p.tp === 0.5 && r.p.sl === 2 && r.p.exitDte === 7);
console.log('\nCURRENT journal rules'.padEnd(43), '| train', fmt(cur.tr), '| TEST', fmt(cur.te));
const rank = res.indexOf(cur) + 1;
console.log(`current rules rank ${rank}/${res.length} on train`);
// marginal effect of each knob (median test score across everything else)
for (const k of ['tp', 'sl', 'dte', 'delta', 'exitDte']) {
  const vals = [...new Set(res.map((r) => r.p[k]))];
  console.log(`\n${k}:`, vals.map((v) => { const xs = res.filter((r) => r.p[k] === v); const med = (f) => { const a = xs.map(f).sort((x, y) => x - y); return a[a.length >> 1]; };
    return `${v ?? 'none'} -> train ${(med((r) => r.tr.cagr) * 100).toFixed(1)}%/${(med((r) => r.tr.maxDD) * 100).toFixed(0)}dd test ${(med((r) => r.te.cagr) * 100).toFixed(1)}%/${(med((r) => r.te.maxDD) * 100).toFixed(0)}dd`; }).join(' | '));
}
