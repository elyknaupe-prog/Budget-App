import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadDaily, runHistorical, STRATEGIES, makeMarket } from '../src/historicalBacktest.js';

const rows = loadDaily(new URL('../data/qqq_vix_daily.csv', import.meta.url).pathname);
const row = (c, vix = 20, date = '2024-01-02') => ({ date, o: c, h: c, l: c, c, vix });

test('data file covers 2011-2026 with no gaps in VIX', () => {
  assert.ok(rows.length > 3900);
  assert.ok(rows.every((r) => r.c > 0 && r.vix > 5));
});

test('buy & hold matches the actual QQQ price change (plus dividends)', () => {
  const { rets } = runHistorical(rows, STRATEGIES.buyHold);
  const growth = rets.reduce((e, r) => e * (1 + r.ret), 1);
  const last = rows[rets.length * 21];
  const priceOnly = last.c / rows[0].c;
  assert.ok(growth > priceOnly && growth < priceOnly * 1.12, `${growth} vs ${priceOnly}`);
});

test('cash-secured put: flat market keeps the premium, crash loses (K - S) minus premium', () => {
  const m = makeMarket();
  const T = 30 / 365;
  const flat = STRATEGIES.cashSecuredPut.cycle(m, row(500), row(500), T);
  assert.ok(flat > 0.004 && flat < 0.03, `flat ${flat}`);
  const crash = STRATEGIES.cashSecuredPut.cycle(m, row(500), row(400), T);
  assert.ok(crash < -0.1, `crash ${crash}`);
});

test('defined-risk strategies never lose more than their risk budget in a month', () => {
  for (const k of ['putCreditSpread', 'ironCondor', 'longCall']) {
    const { rets } = runHistorical(rows, STRATEGIES[k]);
    assert.ok(Math.min(...rets.map((r) => r.ret)) >= -0.0501, k);
  }
});

test('30-delta strike is out of the money on the correct side', () => {
  const m = makeMarket();
  const r = row(600);
  assert.ok(m.strikeForDelta(r, 'put', 0.3, 30 / 365) < 600);
  assert.ok(m.strikeForDelta(r, 'call', 0.3, 30 / 365) > 600);
});
