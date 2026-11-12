# Northbeam

A frontend-only business banking dashboard. It's a realistic, interaction-heavy UI for testing tools that watch code changes and check their effect on the user-facing app.

There's no backend. All data is generated sample data and is kept in the browser's `localStorage`. **Settings → Company → Reset demo data** restores the original data.

## Pages and flows

| Route | What you can do |
|---|---|
| `#/` Home | Total balance chart (30D/90D/6M), money in and out, burn and runway, a "Needs attention" list, account tiles, cash flow chart, recent transactions |
| `#/transactions` | Search, filter (account, category, status, direction, date range, minimum amount, missing receipt), sort, paginate, bulk-categorize, CSV export, a detail drawer with category, note and receipt upload |
| `#/accounts/:id` | Per-account balance chart, routing and account numbers with copy buttons, that account's transactions |
| `#/payments` | Upcoming and recent payments, recipients with search and a "Pay" button |
| `#/bills` | **Drag-and-drop** approval board (Inbox → Approved → Scheduled → Paid). Drag across columns or reorder within one. Dropping on Paid posts a pending transaction and debits Operating. Each card also has a **hover menu** with "Move to…" as a keyboard-friendly alternative. A searchable vendor **dropdown** filters the board |
| `#/cards` | Freeze and unfreeze, edit name and monthly limit, issue new virtual or physical cards, spend-vs-limit bars |
| `#/invoices` | Status tabs, an invoice editor with line items and validation, send, mark paid (which posts a revenue transaction), view, delete |
| `#/insights` | Spend by category (click through to filtered transactions), top vendors, net cash flow by month |
| `#/settings` | Company profile and theme, team invites with roles (the last admin can't be removed), notification toggles and threshold, reset data |

Complex controls, built for testing interactions:
- **Searchable dropdowns** (`role="combobox"`, type to filter, arrow keys and Enter): the category filter, the bulk "Set category…" control, the drawer's Category, the new card's Cardholder and Type, and the Bills vendor filter.
- **Sliders:** the card monthly limit (synced with a number field, with clickable tick marks and a warning when the limit is below this month's spend), plus a two-handle **Amount** range filter on Transactions.
- **Drag and drop:** the Bills board, plus a receipt drop zone in the transaction drawer.
- **Hover menus:** the "⋯" on each transaction row opens on hover, and **Categorize ▸** opens a submenu flyout. Bill cards have the same kind of menu.

Also available everywhere:
- **Move money**: a three-step send-money wizard (recipient, amount, review) that can add a recipient and checks the balance and date, plus transfers between accounts.
- **⌘K / Ctrl+K**: a command palette that searches pages, actions and transactions.
- **Dark mode**.
- **Mobile navigation**.

Key elements carry `data-testid` attributes for automated checks.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # type-check and build to dist/
```

## Deploy

`.github/workflows/pages.yml` builds every push to `main` and publishes it to GitHub Pages, which is free. Pull requests run the same build as a check. One-time setup: **Settings → Pages → Source: GitHub Actions**.

Stack: React 19, React Router 7 (hash routing for Pages), Tailwind CSS 4, Recharts, Vite 6, TypeScript.
