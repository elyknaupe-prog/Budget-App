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

### Real-data check: QQQ, Jan 30 - Nov 23 2026 (Robinhood 30-min bars, 24/5 session)
`node tools/robinhoodToCsv.mjs 1 <saved get_equity_historicals JSON...> > qqq.csv`, then
`node src/cli.js box --csv qqq.csv --contract MNQ --scale 41 --barMinutes 30`
(scale 41 converts QQQ prices to NQ-equivalent points; flag 1 uses candle bodies outside
regular hours to ignore bad thin-market prints).

| | Reel (NQ) | Real QQQ, 179 sessions |
|---|---|---|
| Upper-half open -> high tapped | 80.8% | 79.4% |
| Lower-half open -> low tapped | 75.7% | 80.5% |
| Same-distance control level | - | 74.9% |
| Trade it, stop at far side | - | 70% wins, +63 / -165 pts, -$12/trade MNQ, t=-0.6 |

The hit rates replicate; the trades do not make money. Same as the random-walk result.

## Known options strategies on real QQQ history (2011 - Nov 2026)
`node src/runHistorical.js [--from 2020-01-01] [--ivMult 1.2]`

Real daily QQQ prices + real daily VIX from Robinhood (`data/qqq_vix_daily.csv`). Options are
priced with Black-Scholes at IV = VIX x 1.2 (Nasdaq vol runs ~1.2x S&P vol) with put skew,
$0.03 half-spread per leg, monthly 30-day cycles held to expiry, cash earns T-bill yield.
Spot check on 2026-11-24: real Dec-24 610 put = $14.00 (IV 36.5%) vs model $13.05, so the
model is if anything conservative for option sellers.

| Strategy | CAGR | Volatility | Sharpe | Max drawdown | Winning months |
|---|---|---|---|---|---|
| Buy & hold QQQ | 17.6% | 16.9% | 0.95 | 33% | 65% |
| Cash-secured put, 30-delta | 12.0% | 6.4% | 1.54 | 12% | 88% |
| Cash-secured put, ATM | 15.1% | 9.8% | 1.32 | 21% | 79% |
| Covered call, 30-delta | 18.1% | 13.4% | 1.19 | 29% | 75% |
| Put credit spread (5% risk/mo) | 5.5% | 5.2% | 0.73 | 12% | 84% |
| Iron condor (5% risk/mo) | 4.7% | 4.8% | 0.62 | 8% | 76% |
| Buy ATM calls (5%/mo) | 4.4% | 19.7% | 0.23 | 36% | 46% |
| Collar | 8.3% | 11.1% | 0.62 | 26% | 63% |

Sensitivity (IV = VIX x 1.0 ... 1.3): option selling's edge depends on how rich implied vol is.
Robust conclusions: nothing reliably beat buy-and-hold on raw return in this bull market;
cash-secured puts gave ~2/3 of the return with ~1/3 of the drawdown; buying calls and
spreads/condors were the weakest. Not modelled: early assignment, taxes (option income is
short-term gains), real chain pricing gaps.

## Timing optimization (2026-11-24) -> journal rules v2
`node src/runOptimize.js` searches 1,080 management rules (DTE x delta x take-profit x stop x time-exit)
for a one-spread-at-a-time put credit spread on real QQQ+VIX, picks on 2011-2019, checks on 2020-2026.

- **Overfitting is real:** the #1 rule on 2011-2019 (27.9%/yr, ~0% drawdown) did -0.5%/yr with a 58% drawdown on 2020-2026.
- **Old rules (30 DTE, 0.27 delta, +50% take-profit, 2x stop, 7-DTE exit) lost money in both periods.**
- **Holding to expiration beat every early exit** in both periods, even with zero trading costs; stop-losses hurt everywhere.
  Early exits re-pay the bid/ask (large vs a $5-wide spread's credit) and cut trades that would have expired worthless.
- **Most robust:** ~45 DTE, short put 0.16-0.22 delta, hold to expiry, no stop. At 40% risk/trade (forced by $1k + $5 strikes):
  2011-19 32.7%/yr, max DD 40%; 2020-26 16.7%/yr, max DD 40%. Buy & hold QQQ 2020-26: 18.8%/yr, max DD 33%.
- **Entry time of day does not matter:** 30-min QQQ slots over 206 days, every |t| < 2 (differences ~0.05% of price).
  The run stays at 10:07 ET, after the opening half hour when option spreads are widest.

### Entry filters and robustness (2026-11-24)
- Filters tested on v2 (picked on 2011-19, checked on 2020-26): QQQ above 20/50/200-day average, VIX >= 15/18,
  VIX <= 30, VIX not spiking, after a down day, combinations. **None beat no filter in either period.**
- **Start-date sensitivity:** the same v2 rules on 2020-26 return anywhere from +16.7%/yr to -12.8%/yr just by
  starting 0-19 trading days later (at 40% risk/trade). At 10% risk: +5.2% to -0.9%/yr.
  With ~50-60 trades, the result is decided by whether 1-3 big losses land in the window. Further rule tuning
  on this data is curve-fitting; the honest estimate of the edge is small (a few %/yr at 10% risk, about T-bill level).
