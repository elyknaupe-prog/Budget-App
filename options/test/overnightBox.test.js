import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boxStats, hitRates, backtestBox, randomWalkSessions, sessionsFromCsv } from '../src/overnightBox.js';

const bar = (o, h = o, l = o, c = o) => ({ o, h, l, c });

test('box math: upper-half open targets the overnight high', () => {
  const s = boxStats({ ovn: [bar(100, 110, 90, 105)], rth: [bar(106, 111, 104, 108)] });
  assert.equal(s.mid, 100);
  assert.equal(s.upper, true);
  assert.equal(s.near, 110);
  assert.equal(s.d, 4);
  assert.equal(s.mirror, 102);
  assert.equal(s.nearTapped, true);
  assert.equal(s.mirrorTapped, false);
});

test('trade: stop assumed first when both levels inside one bar', () => {
  const sess = { ovn: [bar(100, 110, 90, 100)], rth: [bar(106), bar(106, 111, 89, 100)] };
  const r = backtestBox([sess], { stop: 'far', contract: { pointValue: 20, tick: 0.25, commissionRT: 0, slippageTicksPerSide: 0 } });
  assert.equal(r.trades, 1);
  assert.equal(r.grossPtsPerTrade, 90 - 106);
});

test('CSV loader splits overnight and RTH', () => {
  const csv = `datetime,open,high,low,close
2026-11-19 18:00,100,105,99,104
2026-11-20 08:00,104,110,95,108
2026-11-20 09:30,108,112,107,111
2026-11-20 15:59,111,111,100,101
2026-11-20 18:00,101,102,100,101
2026-11-21 09:30,101,101,99,100`;
  const ss = sessionsFromCsv(csv);
  assert.equal(ss.length, 2);
  assert.equal(ss[0].ovn.length, 2);
  assert.equal(ss[0].rth.length, 2);
  assert.equal(boxStats(ss[0]).H, 110);
});

// ---- The actual verification of the claim ----
const sims = randomWalkSessions({ n: 3000, seed: 42 });

test('BASELINE: a pure random walk (zero edge) already taps the nearer level ~80% of the time', () => {
  const r = hitRates(sims);
  console.log('  random-walk hit rates:', JSON.stringify(r));
  assert.ok(r.nearTapped > 0.75, `near ${r.nearTapped}`);
});

test('CONTROL: a level the same distance away on the other side is hit just as often', () => {
  const r = hitRates(sims);
  assert.ok(Math.abs(r.nearTapped - r.mirrorTapped) < 0.03, `near ${r.nearTapped} vs mirror ${r.mirrorTapped}`);
});

test('TRADING: targeting the near level has no statistically significant edge', () => {
  for (const stop of ['far', 'mirror']) {
    const r = backtestBox(sims, { stop });
    console.log(`  stop=${stop}:`, JSON.stringify(Object.fromEntries(Object.entries(r).map(([k, v]) => [k, +v.toFixed(3)]))));
    assert.ok(Math.abs(r.grossPtsPerTrade) < 6, `gross ${r.grossPtsPerTrade}`);
    assert.ok(Math.abs(r.tStat) < 3);
  }
});

test('a zero-edge random walk reproduces ALL FOUR of the reel numbers within ~4 points', () => {
  // Reel (1,597 NQ sessions 2020-2026): up->H 80.8, up->L 41.7, down->L 75.7, down->H 41.9
  const h = hitRates(randomWalkSessions({ n: 6000, seed: 7, rthVarShare: 0.7, driftPtsPerDay: 15 }));
  const pairs = [[h.upperOpen.highTapped, 0.808], [h.upperOpen.lowTapped, 0.417], [h.lowerOpen.lowTapped, 0.757], [h.lowerOpen.highTapped, 0.419]];
  for (const [sim, claim] of pairs) assert.ok(Math.abs(sim - claim) < 0.04, `sim ${sim} vs claim ${claim}`);
});
