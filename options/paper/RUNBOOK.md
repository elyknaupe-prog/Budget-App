# Morning paper-trading run (for the scheduled session)

PAPER TRADING ONLY. Never call any place_*, cancel_*, review_*_order or exercise tool.

1. `cd options/paper`. Read `journal.json` (if any) for open positions.
2. Robinhood tools (read-only):
   - `get_equity_quotes` ["QQQ"] -> spot (last_trade_price). If the quote is not from today (market holiday/weekend), stop: no run.
   - `get_index_quotes` ["VIX"] -> vix.
   - `get_option_chains` underlying_symbol QQQ -> chain id a95fe906-11f0-4699-bfc2-520dd706e98d and expiration_dates.
3. `node trader.js plan --spot <spot> --vix <vix> --today <YYYY-MM-DD> --expirations <comma list>`
4. If a spread is already open (one at a time with $1k), skip new-entry quotes. Otherwise, for each strike in `newEntry.strikes`: `get_option_instruments` (chain_id, expiration_dates=newEntry.expiry, type=put,
   strike_price "<k>.0000"); skip strikes that return nothing. Then `get_option_quotes` for those ids plus every id in `openIds`.
5. Write `snapshot.json` (see the header of trader.js) mapping each instrument id to
   { id, expiry, strike, type, bid, ask, mark, sellFill: high_fill_rate_sell_price, buyFill: high_fill_rate_buy_price,
     delta, gamma, theta, vega, iv: implied_volatility }.
   Also add `recentCloses`: the last ~25 QQQ daily closes, oldest first (get_equity_historicals, symbols ["QQQ"],
   interval "day", start_time ~40 days ago) for the IV/RV reading.
   Add a one-line `note` with your read of the market (overnight news, QQQ change, VIX).
6. `node trader.js run snapshot.json` (do not commit snapshot.json). It logs position Greeks, cushion status
   (OK / WATCH / DANGER), IV/RV, and on new entries a model-vs-real price check.
   WATCH/DANGER are information only: v2 rules have no stop. Mention them in the summary.
7. Commit `journal.json` and `JOURNAL.md` with message "Paper journal <date>" and push to the working branch.
