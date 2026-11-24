import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, build, payoffAtExpiry } from '../src/strategies.js';
import { checkTrade, maxContracts } from '../src/risk.js';

test('long call: max loss = premium, unlimited upside, breakeven = K + premium', () => {
  const a = analyze(build.longCall(100, 3));
  assert.equal(a.maxLoss, -300);
  assert.equal(a.maxProfit, Infinity);
  assert.deepEqual(a.breakevens, [103]);
});

test('cash-secured put: max profit = premium, breakeven = K - premium', () => {
  const a = analyze(build.cashSecuredPut(50, 2));
  assert.equal(a.maxProfit, 200);
  assert.equal(a.maxLoss, -4800);
  assert.deepEqual(a.breakevens, [48]);
});

test('bull call spread: risk and reward capped', () => {
  const a = analyze(build.bullCallSpread(100, 5, 110, 2)); // debit 3
  assert.equal(a.netPremium, -300);
  assert.equal(a.maxLoss, -300);
  assert.equal(a.maxProfit, 700);
  assert.deepEqual(a.breakevens, [103]);
});

test('iron condor: credit is max profit, wing width minus credit is max loss', () => {
  const legs = build.ironCondor({ putLong: { K: 90, p: 0.5 }, putShort: { K: 95, p: 1.5 }, callShort: { K: 105, p: 1.5 }, callLong: { K: 110, p: 0.5 } });
  const a = analyze(legs);
  assert.equal(a.netPremium, 200);
  assert.equal(a.maxProfit, 200);
  assert.equal(a.maxLoss, -300);
  assert.deepEqual(a.breakevens, [93, 107]);
  assert.equal(payoffAtExpiry(legs, 100), 200);
});

test('covered call payoff', () => {
  const legs = build.coveredCall(100, 105, 2);
  assert.equal(payoffAtExpiry(legs, 120), 700); // capped: 5 gain + 2 premium
  assert.equal(payoffAtExpiry(legs, 90), -800);
});

test('naked short call is flagged as unlimited risk', () => {
  const a = analyze([{ kind: 'call', side: 'short', strike: 100, premium: 2 }]);
  assert.equal(a.maxLoss, -Infinity);
  const r = checkTrade({ analysis: a, accountValue: 10000 });
  assert.equal(r.ok, false);
  assert.match(r.issues[0], /Unlimited loss/);
});

test('risk check enforces 2% rule, DTE, and spread width', () => {
  const a = analyze(build.longCall(100, 5)); // $500 risk
  const r = checkTrade({ analysis: a, accountValue: 10000, dte: 2, bid: 4, ask: 6 });
  assert.equal(r.ok, false);
  assert.equal(r.issues.length, 3);
  assert.equal(maxContracts(a, 10000), 0);
  assert.equal(maxContracts(a, 50000), 2);
  assert.equal(checkTrade({ analysis: a, accountValue: 50000, dte: 30, bid: 4.95, ask: 5.05 }).ok, true);
});
