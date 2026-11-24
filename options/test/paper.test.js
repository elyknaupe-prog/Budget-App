import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyJournal, run } from '../paper/trader.js';

const q = (id, strike, sellFill, buyFill, delta, expiry = '2027-01-15') => ({ [id]: { id, expiry, strike, type: 'put', sellFill, buyFill, delta } });
const open = () => {
  const j = emptyJournal(636, '2026-11-24');
  run(j, { date: '2026-11-24', spot: 636, vix: 27, quotes: { ...q('s', 600, 12.07, 12.12, -0.20), ...q('l', 595, 11.01, 11.06, -0.25) } });
  return j;
};

test('opens one $5 put spread with realistic fills, risk under limit', () => {
  const j = open();
  assert.equal(j.open.length, 1);
  assert.equal(j.open[0].credit, 1.01);
  assert.ok(j.open[0].maxLoss < 450);
});

test('does not open a second spread while one is on (one-at-a-time with $1k)', () => {
  const j = open();
  run(j, { date: '2026-11-25', spot: 640, vix: 25, quotes: { ...q('s', 600, 11.5, 11.55, -0.25), ...q('l', 595, 10.6, 10.65, -0.23), ...q('s2', 605, 12, 12.05, -0.27), ...q('l2', 600, 11.5, 11.55, -0.25) } });
  assert.equal(j.open.length, 1);
});

test('v2: holds winners (no early take-profit) and losers (no stop) until expiration', () => {
  const j = open();
  run(j, { date: '2026-12-02', spot: 660, vix: 20, quotes: { ...q('s', 600, 4.0, 4.05, -0.1), ...q('l', 595, 3.6, 3.65, -0.09) } });
  assert.equal(j.closed.length, 0);
  run(j, { date: '2026-12-03', spot: 600, vix: 35, quotes: { ...q('s', 600, 20, 20.05, -0.5), ...q('l', 595, 17, 17.05, -0.43) } });
  assert.equal(j.closed.length, 0);
});

test('v2: expiration morning with 2%+ cushion expires worthless, keeps full credit', () => {
  const j = open();
  run(j, { date: '2027-01-15', spot: 640, vix: 20, quotes: { ...q('s', 600, 0.01, 0.02, -0.01), ...q('l', 595, 0, 0.01, 0) } });
  assert.equal(j.closed[0].reason, 'expired-worthless');
  assert.ok(Math.abs(j.closed[0].pnl - (101 - 0.06)) < 0.5);
});

test('v2: expiration morning near the strike closes at market', () => {
  const j = open();
  run(j, { date: '2027-01-15', spot: 605, vix: 25, quotes: { ...q('s', 600, 0.9, 0.95, -0.3), ...q('l', 595, 0.1, 0.12, -0.05) } });
  assert.equal(j.closed[0].reason, 'expiry-day-close');
});

test('expired spread settles at intrinsic', () => {
  const j = open();
  run(j, { date: '2027-01-19', spot: 590, vix: 30, quotes: {} });
  assert.equal(j.closed[0].reason, 'expired');
  assert.equal(j.closed[0].exitDebit, 5);
});

import { positionGreeks, cushion, realizedVol } from '../paper/trader.js';
// Real Robinhood quotes for the open QQQ Dec-24 600/595 put spread, 2026-11-24 19:55Z
const realQ = {
  s: { strike: 600, delta: -0.269626, gamma: 0.004772, theta: -0.362691, vega: 0.601484, iv: 0.381395 },
  l: { strike: 595, delta: -0.248154, gamma: 0.004471, theta: -0.354911, vega: 0.576205, iv: 0.388399 },
};
const pos = { shortId: 's', longId: 'l', shortStrike: 600 };

test('position Greeks from real quotes: ~+2 delta, ~+$0.78/day theta, ~-$2.53 vega', () => {
  const g = positionGreeks(pos, realQ, 636.25, 30);
  assert.ok(Math.abs(g.delta - 2.15) < 0.01, `delta ${g.delta}`);
  assert.ok(Math.abs(g.theta - 0.78) < 0.01, `theta ${g.theta}`);
  assert.ok(Math.abs(g.vega + 2.53) < 0.01, `vega ${g.vega}`);
  assert.ok(g.gamma < 0);
});

test('cushion: 6% above strike with 38% IV and 30 days is only ~0.5 expected moves (EM ~$70) -> WATCH', () => {
  const c = cushion(pos, realQ, 636.25, 30);
  assert.ok(Math.abs(c.pct - 6.04) < 0.01);
  assert.ok(c.sd > 0.5 && c.sd < 0.6, `sd ${c.sd}`);
  assert.equal(c.status, 'WATCH');
  assert.equal(cushion(pos, realQ, 598, 10).status, 'DANGER (short strike breached)');
});

test('realized vol of a constant 1%/day zig-zag is ~15.9% annualized', () => {
  const closes = [100]; for (let i = 0; i < 20; i++) closes.push(closes.at(-1) * (i % 2 ? 1.01 : 0.99));
  assert.ok(Math.abs(realizedVol(closes) - 0.0100 * Math.sqrt(252)) < 0.002);
  assert.equal(realizedVol([1, 2, 3]), null);
});

import { weekly } from '../paper/trader.js';
test('weekly scorecard groups days by Monday-start week and measures week-over-week change', () => {
  const j = open(); // opened Tue 2026-11-24
  run(j, { date: '2026-11-25', spot: 640, vix: 25, quotes: { ...q('s', 600, 11, 11.05, -0.2), ...q('l', 595, 10.2, 10.25, -0.18) } });
  run(j, { date: '2026-11-30', spot: 645, vix: 22, quotes: { ...q('s', 600, 9, 9.05, -0.17), ...q('l', 595, 8.4, 8.45, -0.15) } });
  const w = weekly(j);
  assert.equal(w.length, 2);
  assert.equal(w[0].week, '2026-11-23');
  assert.equal(w[0].days, 2);
  assert.equal(w[1].week, '2026-11-30');
  assert.equal(w[0].opened, 1);
  assert.ok(Math.abs(w[1].change - (w[1].equity - w[0].equity)) < 0.01);
});
