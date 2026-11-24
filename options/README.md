# Options Lab

A self-contained toolkit for **learning and paper-testing** options strategies.
It never places real orders.

```bash
cd options
npm test                                   # 20 verification tests
node src/cli.js analyze --S 100 --K 105 --T 30 --iv 0.30 --type call --account 10000
node src/cli.js backtest --runs 300        # Monte Carlo test of preset strategies
```

## Modules
| File | What it does |
|---|---|
| `src/blackScholes.js` | Option pricing, Greeks, implied volatility, probability of finishing in the money |
| `src/strategies.js` | Multi-leg payoff, max profit/loss, breakevens; builders for calls, puts, covered calls, CSPs, spreads, iron condors |
| `src/risk.js` | Pre-trade guard-rails: 2% max risk per trade, 10% total options exposure, min DTE, bid/ask liquidity, blocks unlimited-risk trades |
| `src/backtest.js` | Paper-trading engine with slippage + commissions; Monte Carlo over many simulated years |

## What the tests verify
- Pricing matches the standard textbook example (Hull: call 4.76, put 0.81)
- Put-call parity holds exactly
- Every Greek matches a numerical finite-difference check
- Implied vol recovers the input volatility
- Payoff math for each strategy (max loss, max profit, breakevens)
- Risk rules reject oversized, short-dated, illiquid or unlimited-risk trades
- The backtester shows no free money when options are fairly priced, and shows a
  high win rate does **not** mean profit once costs are included

## Key lessons from the backtests
- **Win rate is misleading.** Credit spreads / iron condors won 74–87% of trades but
  lost money in most simulated years, because the occasional big loss plus
  commissions/slippage cancels many small wins.
- **Buying options loses money on most trades** (~35% win rate). Theta (time decay)
  works against you every day.
- With fair pricing there is no built-in edge. Profits need an actual edge
  (implied vol consistently above realized vol, a real forecasting signal, etc.).
  Social-media claims should be tested here before risking money.
