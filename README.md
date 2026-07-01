# Couples Budget & Investing App

A small web app for two partners to track individual income/expenses, see
combined monthly surplus, and manage shared savings/investment goals.

## Stack
- `client/` — React + Vite + Tailwind
- `server/` — Node/Express + better-sqlite3 (SQLite file at `server/data/budget.sqlite`)

## Running locally

```bash
# terminal 1
cd server
npm install
npm run dev   # http://localhost:3001

# terminal 2
cd client
npm install
npm run dev   # http://localhost:5173
```

The client dev server proxies `/api` requests to the Express server.

## v1 scope

- Profile switch (no real auth) between two seeded users
- Transaction entry (income/expense, categorized, recurring flag) and a
  personal monthly dashboard (income, expenses, surplus, spending-by-category
  and 6-month trend charts)
- Joint dashboard: combined monthly surplus, manually-tracked joint account
  balance, and contribution history tagged by contributor
- Goals: create/edit goals with a target amount/date, progress bars, and a
  simple "at current pace" projection based on recent contribution history
- Settings: manage transaction categories and each partner's savings-rate
  target

Skipped for v1 (per spec): bank account linking, notifications, mobile app,
and the "opportunity finder" surplus-vs-savings-rate flagging logic — happy
to add any of these next if useful.
