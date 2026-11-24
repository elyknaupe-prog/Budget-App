// Pre-trade risk checks. These encode common beginner guard-rails; adjust limits to taste.
export const DEFAULT_LIMITS = {
  maxRiskPerTradePct: 0.02,   // risk at most 2% of the account on any one trade
  maxTotalOptionsPct: 0.10,   // keep total options exposure under 10% of the account
  minDaysToExpiry: 7,         // avoid very short-dated lottery tickets
  maxBidAskSpreadPct: 0.10,   // spread wider than 10% of mid = poor liquidity
  allowUndefinedRisk: false,  // no naked short calls / unlimited-loss positions
};

export function checkTrade({ analysis, contracts = 1, accountValue, openOptionsRisk = 0, dte, bid, ask }, limits = DEFAULT_LIMITS) {
  const issues = [];
  const lossPerUnit = -analysis.maxLoss;
  const totalRisk = lossPerUnit * contracts;
  if (!Number.isFinite(lossPerUnit)) {
    if (!limits.allowUndefinedRisk) issues.push('Unlimited loss potential (undefined risk). Use a spread to cap it.');
  } else {
    if (totalRisk > accountValue * limits.maxRiskPerTradePct)
      issues.push(`Max loss $${totalRisk.toFixed(0)} exceeds ${(limits.maxRiskPerTradePct * 100).toFixed(0)}% of account ($${(accountValue * limits.maxRiskPerTradePct).toFixed(0)}).`);
    if (openOptionsRisk + totalRisk > accountValue * limits.maxTotalOptionsPct)
      issues.push(`Total options risk would be $${(openOptionsRisk + totalRisk).toFixed(0)}, above ${(limits.maxTotalOptionsPct * 100).toFixed(0)}% of account.`);
  }
  if (dte != null && dte < limits.minDaysToExpiry) issues.push(`Only ${dte} days to expiry (min ${limits.minDaysToExpiry}). Time decay and gamma risk are extreme.`);
  if (bid != null && ask != null) {
    const mid = (bid + ask) / 2;
    if (mid > 0 && (ask - bid) / mid > limits.maxBidAskSpreadPct)
      issues.push(`Bid/ask spread is ${(((ask - bid) / mid) * 100).toFixed(0)}% of mid: illiquid, fills will be poor.`);
  }
  return { ok: issues.length === 0, totalRisk, issues };
}

// Largest number of contracts allowed by the per-trade risk limit.
export function maxContracts(analysis, accountValue, limits = DEFAULT_LIMITS) {
  const lossPerUnit = -analysis.maxLoss;
  if (!Number.isFinite(lossPerUnit) || lossPerUnit <= 0) return 0;
  return Math.floor((accountValue * limits.maxRiskPerTradePct) / lossPerUnit);
}
