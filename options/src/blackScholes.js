// Black-Scholes-Merton pricing for European options (with continuous dividend yield q).
// Inputs: S spot, K strike, T years to expiry, r risk-free rate, sigma volatility, q dividend yield.

export function normCdf(x) {
  // Abramowitz & Stegun 7.1.26 via erf, accurate to ~1e-7
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x) / Math.SQRT2;
  const t = 1 / (1 + 0.3275911 * z);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 + sign * y);
}

export function normPdf(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function d1d2({ S, K, T, r, sigma, q = 0 }) {
  const vt = sigma * Math.sqrt(T);
  const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / vt;
  return { d1, d2: d1 - vt };
}

export function price({ type, S, K, T, r, sigma, q = 0 }) {
  if (T <= 0) return Math.max(type === 'call' ? S - K : K - S, 0);
  const { d1, d2 } = d1d2({ S, K, T, r, sigma, q });
  const dfq = Math.exp(-q * T), dfr = Math.exp(-r * T);
  return type === 'call'
    ? S * dfq * normCdf(d1) - K * dfr * normCdf(d2)
    : K * dfr * normCdf(-d2) - S * dfq * normCdf(-d1);
}

// Greeks: delta per $1, gamma per $1, vega per 1 vol point (0.01), theta per calendar day, rho per 1% rate.
export function greeks({ type, S, K, T, r, sigma, q = 0 }) {
  if (T <= 0) {
    const itm = type === 'call' ? S > K : S < K;
    return { delta: itm ? (type === 'call' ? 1 : -1) : 0, gamma: 0, vega: 0, theta: 0, rho: 0 };
  }
  const { d1, d2 } = d1d2({ S, K, T, r, sigma, q });
  const dfq = Math.exp(-q * T), dfr = Math.exp(-r * T), sqT = Math.sqrt(T);
  const gamma = (dfq * normPdf(d1)) / (S * sigma * sqT);
  const vega = (S * dfq * normPdf(d1) * sqT) / 100;
  const common = -(S * dfq * normPdf(d1) * sigma) / (2 * sqT);
  if (type === 'call') {
    return {
      delta: dfq * normCdf(d1),
      gamma,
      vega,
      theta: (common - r * K * dfr * normCdf(d2) + q * S * dfq * normCdf(d1)) / 365,
      rho: (K * T * dfr * normCdf(d2)) / 100,
    };
  }
  return {
    delta: -dfq * normCdf(-d1),
    gamma,
    vega,
    theta: (common + r * K * dfr * normCdf(-d2) - q * S * dfq * normCdf(-d1)) / 365,
    rho: (-K * T * dfr * normCdf(-d2)) / 100,
  };
}

// Implied volatility from a market price (bisection: slow but cannot diverge).
export function impliedVol({ type, marketPrice, S, K, T, r, q = 0 }) {
  let lo = 1e-4, hi = 5;
  const f = (s) => price({ type, S, K, T, r, sigma: s, q }) - marketPrice;
  if (f(lo) > 0 || f(hi) < 0) return NaN; // price outside no-arbitrage bounds
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) hi = mid; else lo = mid;
    if (hi - lo < 1e-8) break;
  }
  return (lo + hi) / 2;
}

// Probability the option finishes in the money under the risk-neutral measure (N(d2)).
export function probITM({ type, S, K, T, r, sigma, q = 0 }) {
  if (T <= 0) return (type === 'call' ? S > K : S < K) ? 1 : 0;
  const { d2 } = d1d2({ S, K, T, r, sigma, q });
  return type === 'call' ? normCdf(d2) : normCdf(-d2);
}
