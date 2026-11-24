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

## Test of the "overnight box" reel claim (NQ futures)
Claim: split the overnight range in half at 09:30; an open in the upper half taps the
overnight high 80.8% of the time, an open in the lower half taps the low 75.7%.

```bash
node src/cli.js box                              # zero-edge random-walk baseline
node src/cli.js box --csv nq_1min.csv            # your real NQ data (datetime ET,open,high,low,close)
node src/cli.js box --csv nq_1min.csv --contract MNQ
```

Result on a market that is random by construction (3,000 sessions, NQ-like volatility):
near level tapped **80.5%**, about the same as the claim. A control level the same distance
away on the *other* side was tapped 78.6%. The statistic measures distance: the closer
level is closer, so price reaches it more often. Trading toward it gives a high win rate
with small wins and large losses (75.6% wins, +57 / -180 pts), roughly zero edge before
costs. A real edge would show up on real data as (a) near-level hit rate clearly above the
mirror control and (b) a positive net result with |t| > 2.

### Update: full numbers from the reel
The reel also shows the far level: upper-half open -> low tapped 41.7%; lower-half open -> high
tapped 41.9% (1,597 sessions, 2020-2026). A random walk with NQ-like volatility (70% of daily
variance in RTH) and NQ's upward drift gives:

| | Reel | Random walk (no edge) |
|---|---|---|
| Upper-half open -> high tapped | 80.8% | 80.8% |
| Upper-half open -> low tapped | 41.7% | 41.8% |
| Lower-half open -> low tapped | 75.7% | 79.3% |
| Lower-half open -> high tapped | 41.9% | 44.4% |

All four numbers come out within ~4 points of what pure chance produces. The one gap (lows
hit a bit *less* than chance) reflects the strong 2020-2026 bull market, and it works
against the short side of this setup.
