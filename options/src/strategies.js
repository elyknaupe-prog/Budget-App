// Multi-leg position modelling. A leg is:
//   { kind: 'call'|'put'|'stock', side: 'long'|'short', strike?, premium?, qty?, price? }
// Premiums are per share; one contract = 100 shares (multiplier).
export const MULTIPLIER = 100;

function legPayoffAtExpiry(leg, S) {
  const qty = leg.qty ?? 1;
  const sign = leg.side === 'long' ? 1 : -1;
  if (leg.kind === 'stock') return sign * qty * (S - leg.price); // qty in shares
  const intrinsic = leg.kind === 'call' ? Math.max(S - leg.strike, 0) : Math.max(leg.strike - S, 0);
  return sign * qty * MULTIPLIER * (intrinsic - leg.premium);
}

export function payoffAtExpiry(legs, S) {
  return legs.reduce((sum, leg) => sum + legPayoffAtExpiry(leg, S), 0);
}

// Net cash at open: positive = credit received, negative = debit paid.
export function netPremium(legs) {
  return legs.reduce((sum, l) => {
    const sign = l.side === 'long' ? -1 : 1;
    if (l.kind === 'stock') return sum + sign * (l.qty ?? 1) * l.price;
    return sum + sign * (l.qty ?? 1) * MULTIPLIER * l.premium;
  }, 0);
}

// Scan prices to find max profit / max loss / breakevens. Flags unlimited risk/reward
// by checking the slope beyond the highest strike.
export function analyze(legs, { lo, hi, steps = 4000 } = {}) {
  const strikes = legs.map((l) => l.strike ?? l.price).filter((x) => x != null);
  const maxK = Math.max(...strikes), minK = Math.min(...strikes);
  lo ??= 0;
  hi ??= maxK * 3;
  let maxProfit = -Infinity, maxLoss = Infinity;
  const breakevens = [];
  let prev = null;
  for (let i = 0; i <= steps; i++) {
    const S = lo + ((hi - lo) * i) / steps;
    const p = payoffAtExpiry(legs, S);
    maxProfit = Math.max(maxProfit, p);
    maxLoss = Math.min(maxLoss, p);
    if (prev && Math.sign(prev.p) !== Math.sign(p) && p !== 0) {
      // linear interpolation for the zero crossing
      breakevens.push(+(prev.S + (0 - prev.p) * (S - prev.S) / (p - prev.p)).toFixed(2));
    } else if (p === 0 && (!prev || prev.p !== 0)) breakevens.push(+S.toFixed(2));
    prev = { S, p };
  }
  const far = maxK * 10;
  const slope = payoffAtExpiry(legs, far + 1) - payoffAtExpiry(legs, far);
  return {
    netPremium: +netPremium(legs).toFixed(2),
    maxProfit: slope > 1e-9 ? Infinity : +maxProfit.toFixed(2),
    maxLoss: slope < -1e-9 ? -Infinity : +maxLoss.toFixed(2),
    breakevens: [...new Set(breakevens)],
    strikeRange: [minK, maxK],
  };
}

// Builders for common strategies.
export const build = {
  longCall: (K, prem) => [{ kind: 'call', side: 'long', strike: K, premium: prem }],
  longPut: (K, prem) => [{ kind: 'put', side: 'long', strike: K, premium: prem }],
  coveredCall: (stockPx, K, prem) => [
    { kind: 'stock', side: 'long', price: stockPx, qty: 100 },
    { kind: 'call', side: 'short', strike: K, premium: prem },
  ],
  cashSecuredPut: (K, prem) => [{ kind: 'put', side: 'short', strike: K, premium: prem }],
  bullCallSpread: (K1, p1, K2, p2) => [
    { kind: 'call', side: 'long', strike: K1, premium: p1 },
    { kind: 'call', side: 'short', strike: K2, premium: p2 },
  ],
  bearPutSpread: (K1, p1, K2, p2) => [
    { kind: 'put', side: 'long', strike: K2, premium: p2 },
    { kind: 'put', side: 'short', strike: K1, premium: p1 },
  ],
  ironCondor: ({ putLong, putShort, callShort, callLong }) => [
    { kind: 'put', side: 'long', strike: putLong.K, premium: putLong.p },
    { kind: 'put', side: 'short', strike: putShort.K, premium: putShort.p },
    { kind: 'call', side: 'short', strike: callShort.K, premium: callShort.p },
    { kind: 'call', side: 'long', strike: callLong.K, premium: callLong.p },
  ],
};
