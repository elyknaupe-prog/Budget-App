# Couples Budget & Investing App

A small app for two partners to track personal income/expenses separately,
see their monthly surplus, and manage a shared savings/investing account
with goals.

## Stack
- `client/` — React + Vite + Tailwind
- `server/` — Node/Express + SQLite (better-sqlite3)

## Getting started

Install dependencies for both apps:

```bash
cd server && npm install
cd ../client && npm install
```

Run the backend (http://localhost:4000):

```bash
cd server && npm run dev
```

Run the frontend (http://localhost:5173, proxies `/api` to the backend):

```bash
cd client && npm run dev
```

On first load, create a profile for each partner from the profile picker.

## v1 scope

- Profile switcher (no real auth)
- Transaction entry + personal dashboard (income/expenses/surplus by month)
- Joint dashboard (combined surplus, joint balance tracker, contribution history)
- Goals with manual progress tracking

Not built yet (out of v1 scope): spending charts, the opportunity-finder
savings-rate logic, a settings page, CSV import, bank linking, and
notifications.
