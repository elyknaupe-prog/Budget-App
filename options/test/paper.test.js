import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyJournal, run } from '../paper/trader.js';

const q = (id, strike, sellFill, buyFill, delta, expiry = '2026-12-24') => ({ [id]: { id, expiry, strike, type: 'put', sellFill, buyFill, delta } });
const open = () => {
  const j = emptyJournal(636, '2026-11-24');
  run(j, { date: '2026-11-24', spot: 636, vix: 27, quotes: { ...q('s', 600, 12.07, 12.12, -0.27), ...q('l', 595, 11.01, 11.06, -0.25) } });
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

test('takes profit at 50% of credit', () => {
  const j = open();
  run(j, { date: '2026-12-02', spot: 660, vix: 20, quotes: { ...q('s', 600, 4.0, 4.05, -0.1), ...q('l', 595, 3.6, 3.65, -0.09) } });
  assert.equal(j.closed.length, 1);
  assert.equal(j.closed[0].reason, 'take-profit');
  assert.ok(j.closed[0].pnl > 50);
});

test('stops out when loss reaches 2x credit', () => {
  const j = open();
  run(j, { date: '2026-12-01', spot: 600, vix: 35, quotes: { ...q('s', 600, 20, 20.05, -0.5), ...q('l', 595, 17, 17.05, -0.43) } });
  assert.equal(j.closed[0].reason, 'stop-loss');
  assert.ok(j.closed[0].pnl < -190);
});

test('expired spread settles at intrinsic', () => {
  const j = open();
  run(j, { date: '2026-12-28', spot: 590, vix: 30, quotes: {} });
  assert.equal(j.closed[0].reason, 'expired');
  assert.equal(j.closed[0].exitDebit, 5);
});
