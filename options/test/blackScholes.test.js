import { test } from 'node:test';
import assert from 'node:assert/strict';
import { price, greeks, impliedVol, normCdf, probITM } from '../src/blackScholes.js';

const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} expected ${b}, got ${a}`);

test('normal CDF known values', () => {
  near(normCdf(0), 0.5, 1e-7);
  near(normCdf(1.96), 0.975, 1e-4);
  near(normCdf(-1), 0.158655, 1e-5);
});

test('matches Hull textbook example (S=42,K=40,r=10%,vol=20%,T=0.5)', () => {
  const p = { S: 42, K: 40, r: 0.1, sigma: 0.2, T: 0.5 };
  near(price({ ...p, type: 'call' }), 4.76, 0.005, 'call');
  near(price({ ...p, type: 'put' }), 0.81, 0.005, 'put');
});

test('put-call parity holds: C - P = S e^{-qT} - K e^{-rT}', () => {
  for (const [S, K, T, sigma, q] of [[100, 90, 0.25, 0.3, 0], [50, 60, 1, 0.5, 0.02], [200, 200, 0.05, 0.15, 0.01]]) {
    const r = 0.05;
    const c = price({ type: 'call', S, K, T, r, sigma, q });
    const p = price({ type: 'put', S, K, T, r, sigma, q });
    near(c - p, S * Math.exp(-q * T) - K * Math.exp(-r * T), 1e-6);
  }
});

test('greeks match finite differences', () => {
  const base = { S: 100, K: 105, T: 0.3, r: 0.04, sigma: 0.28, q: 0.01 };
  for (const type of ['call', 'put']) {
    const g = greeks({ ...base, type });
    const f = (o) => price({ ...base, type, ...o });
    const h = 0.01;
    near(g.delta, (f({ S: 100 + h }) - f({ S: 100 - h })) / (2 * h), 1e-4, `${type} delta`);
    near(g.gamma, (f({ S: 100 + h }) - 2 * f({}) + f({ S: 100 - h })) / (h * h), 1e-3, `${type} gamma`);
    near(g.vega, (f({ sigma: 0.2801 }) - f({ sigma: 0.2799 })) / 0.0002 / 100, 1e-4, `${type} vega`);
    near(g.theta, (f({ T: 0.3 - 1 / 365 }) - f({})), 2e-3, `${type} theta`);
    near(g.rho, (f({ r: 0.0401 }) - f({ r: 0.0399 })) / 0.0002 / 100, 1e-4, `${type} rho`);
  }
});

test('implied vol round-trips', () => {
  for (const sigma of [0.1, 0.35, 0.9]) {
    const args = { type: 'put', S: 80, K: 85, T: 0.5, r: 0.03 };
    const mp = price({ ...args, sigma });
    near(impliedVol({ ...args, marketPrice: mp }), sigma, 1e-6);
  }
});

test('implied vol rejects arbitrage-violating prices', () => {
  assert.ok(Number.isNaN(impliedVol({ type: 'call', marketPrice: 0.0, S: 100, K: 50, T: 0.5, r: 0.03 })));
});

test('option value at expiry is intrinsic value', () => {
  assert.equal(price({ type: 'call', S: 110, K: 100, T: 0, r: 0.05, sigma: 0.2 }), 10);
  assert.equal(price({ type: 'put', S: 110, K: 100, T: 0, r: 0.05, sigma: 0.2 }), 0);
});

test('probITM of call + put sums to 1', () => {
  const p = { S: 100, K: 100, T: 0.25, r: 0.04, sigma: 0.3 };
  near(probITM({ ...p, type: 'call' }) + probITM({ ...p, type: 'put' }), 1, 1e-9);
});
