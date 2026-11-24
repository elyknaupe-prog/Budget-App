import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simulatePath, runBacktest, monteCarlo, presetStrategies } from '../src/backtest.js';

test('simulation is reproducible for the same seed', () => {
  assert.deepEqual(simulatePath({ S0: 100, days: 50, seed: 7 }), simulatePath({ S0: 100, days: 50, seed: 7 }));
});

test('GBM path has roughly the requested volatility', () => {
  const p = simulatePath({ S0: 100, days: 252 * 20, sigma: 0.3, seed: 3 });
  const rets = p.slice(1).map((x, i) => Math.log(x / p[i]));
  const m = rets.reduce((a, b) => a + b) / rets.length;
  const sd = Math.sqrt(rets.reduce((a, b) => a + (b - m) ** 2, 0) / rets.length) * Math.sqrt(252);
  assert.ok(Math.abs(sd - 0.3) < 0.02, `annualised vol ${sd}`);
});

test('flat price path: long call loses the premium, credit spread keeps it', () => {
  const path = Array(60).fill(100);
  const call = runBacktest({ path, strategy: presetStrategies.longCall, slippagePerContract: 0, commissionPerContract: 0 });
  assert.ok(call.trades.every((t) => t.pnl < 0));
  const condor = runBacktest({ path, strategy: { ...presetStrategies.ironCondor, takeProfitPct: null }, slippagePerContract: 0, commissionPerContract: 0 });
  assert.ok(condor.trades.every((t) => t.pnl > 0));
});

test('fair pricing + zero costs => no free money on average (sanity check of the engine)', () => {
  // When IV equals realised vol and drift equals r, option strategies have ~zero expected edge.
  const res = monteCarlo({ strategy: presetStrategies.ironCondor, runs: 300, mu: 0.04, sigma: 0.25, r: 0.04, slippagePerContract: 0, commissionPerContract: 0 });
  assert.ok(Math.abs(res.medianReturnPct) < 3, `median ${res.medianReturnPct}%`);
});

test('high win rate does not imply profit once costs are included', () => {
  const res = monteCarlo({ strategy: presetStrategies.ironCondor, runs: 200 });
  assert.ok(res.avgWinRate > 0.5);
  assert.ok(res.medianReturnPct < 0, `median ${res.medianReturnPct}%`);
});
