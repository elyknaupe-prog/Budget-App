# Paper-trading journal ($1,000 start, no real orders)

Strategy: QQQ put credit spreads, short ~0.2 delta, 35-52 DTE, entered at the 10:07 ET run, max loss <= 45% of equity per trade,
<= 45% total. Rules v2: hold to expiration, no stop; on expiration morning let it expire if QQQ is 2%+ above the short strike, else close. Fills use Robinhood "high fill rate" prices + fees.

**As of 2026-11-24:** equity **$999.94** (-0.01%) vs buy-and-hold QQQ **$1000.00** (0.00%).
Closed trades: 0 (0 winners), realized P&L $0.00. Open: 1, risk in use $399.

## Open positions

| Spread | Opened | DTE | Credit | Max loss | Breakeven | P&L now | Delta $/pt | Theta $/day | Vega $/vol | Cushion | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|
| QQQ 2026-12-24 600/595P | 2026-11-24 | 30 | $101 | $399 | 598.99 | $-0.06 | 2.15 | 0.78 | -2.53 | 6.04% / 0.52 EM | WATCH |

Delta: $ gained per $1 QQQ rise. Theta: $ earned per day from time decay. Vega: $ change per 1-point rise in implied vol. Cushion: % and expected moves (EM = 1 std-dev to expiry) above the short strike.

## Stats

| Metric | Value |
|---|---|
| Trades closed | 0 |
| Win rate | n/a (backtest: ~91-97%) |
| Avg win / avg loss | $0.00 / $0.00 |
| Max drawdown: journal / buy & hold | 0.0% / 0.0% |
| Days logged | 1 |
| Backtest model vs real credit at entry | 0.99x (1.00 = exact; below 1 = backtest was conservative) |

## Closed trades

| Spread | Opened | Closed | Credit | Paid to close | Reason | P&L |
|---|---|---|---|---|---|---|

## Daily log

| Date | QQQ | VIX | IV/RV | Equity | Buy & hold | Actions | Note |
|---|---|---|---|---|---|---|---|
| 2026-11-24 | 636.25 | 27.16 |  | $999.94 | $1000 | OPEN QQQ 2026-12-24 600/595P: sell 600P @12.07, buy 595P @11.059, credit $101, max loss $399, breakeven 598.99 | First entry (afternoon setup run). QQQ -2.3% on the day, VIX 27: puts are rich, which favors selling premium but the tape is weak. |

IV/RV: at-the-money implied vol / 20-day realized vol. Above ~1.2 = options rich (2011-2026 median 1.23). Logged for study; as an entry filter it did not improve backtests.
