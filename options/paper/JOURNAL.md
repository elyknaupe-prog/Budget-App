# Paper-trading journal ($1,000 start, no real orders)

Strategy: QQQ put credit spreads, short ~0.2 delta, 35-52 DTE, entered at the 10:07 ET run, max loss <= 45% of equity per trade,
<= 45% total. Rules v2: hold to expiration, no stop; on expiration morning let it expire if QQQ is 2%+ above the short strike, else close. Fills use Robinhood "high fill rate" prices + fees.

**As of 2026-11-27:** equity **$996.94** (-0.31%) vs buy-and-hold QQQ **$1003.66** (0.37%).
Closed trades: 0 (0 winners), realized P&L $0.00. Open: 1, risk in use $399.

## Open positions

| Spread | Opened | DTE | Credit | Max loss | Breakeven | P&L now | Delta $/pt | Theta $/day | Vega $/vol | Cushion | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QQQ 2026-12-24 600/595P | 2026-11-24 | 27 | $101 | $399 | 598.99 | $-3.06 | 2.11 | 0.99 | -2.59 | 6.43% / 0.57 EM | WATCH |

Delta: $ gained per $1 QQQ rise. Theta: $ earned per day from time decay. Vega: $ change per 1-point rise in implied vol. Cushion: % and expected moves (EM = 1 std-dev to expiry) above the short strike.

## Week by week

| Week of | Days | Equity (end) | Change | Change % | Buy & hold % | Opened | Closed | Realized P&L |
|---|---|---|---|---|---|---|---|---|
| 2026-11-23 | 3 | $996.94 | $-3.06 | -0.31% | 0.37% | 1 | 0 | $0 |

## Stats

| Metric | Value |
|---|---|
| Trades closed | 0 |
| Win rate | n/a (backtest: ~91-97%) |
| Avg win / avg loss | $0.00 / $0.00 |
| Max drawdown: journal / buy & hold | 6.1% / 3.3% |
| Days logged | 3 |
| Backtest model vs real credit at entry | 0.99x (1.00 = exact; below 1 = backtest was conservative) |

## Closed trades

| Spread | Opened | Closed | Credit | Paid to close | Reason | P&L |
|---|---|---|---|---|---|---|

## Daily log

| Date | QQQ | VIX | IV/RV | Equity | Buy & hold | Actions | Note |
|---|---|---|---|---|---|---|---|
| 2026-11-27 | 638.58 | 27.14 | 0.81 | $996.94 | $1003.66 | WATCH: QQQ 2026-12-24 600/595P QQQ 6.43% above short strike (0.57 expected moves); no stop by rule, holding; NO NEW TRADE: one spread at a time: a position is already open | Post-Thanksgiving half day (1pm close). QQQ recovered Wed from 615 to close 633.93 and is 638.58 now; VIX 32 -> 27. Spread back near entry value. |
| 2026-11-25 | 615.33 | 32.22 | 0.81 | $938.94 | $967.12 | DANGER: QQQ 2026-12-24 600/595P QQQ 2.55% above short strike (0.22 expected moves); no stop by rule, holding; NO NEW TRADE: one spread at a time: a position is already open | QQQ -3.6% at the open (to 615.33 from 638.10), VIX 32: chip/AI selloff resumes the day before Thanksgiving. Spread is underwater but above both strikes; holding by rule (no stop). |
| 2026-11-24 | 636.25 | 27.16 |  | $999.94 | $1000 | OPEN QQQ 2026-12-24 600/595P: sell 600P @12.07, buy 595P @11.059, credit $101, max loss $399, breakeven 598.99 | First entry (afternoon setup run). QQQ -2.3% on the day, VIX 27: puts are rich, which favors selling premium but the tape is weak. |

IV/RV: at-the-money implied vol / 20-day realized vol. Above ~1.2 = options rich (2011-2026 median 1.23). Logged for study; as an entry filter it did not improve backtests.
