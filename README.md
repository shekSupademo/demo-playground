# Northbeam

A frontend-only business banking dashboard. It's a realistic, interaction-heavy UI for testing tools that watch code changes and check their effect on the user-facing app.

There's no backend. All data is generated sample data and is kept in the browser's `localStorage`. **Settings → Company → Reset demo data** restores the original data.

## Pages and flows

| Route | What you can do |
|---|---|
| `#/` Home | Total balance chart (30D/90D/6M), money in and out, burn and runway, a "Needs attention" list, account tiles, cash flow chart, recent transactions |
| `#/transactions` | Search, filter (account, category, status, direction, date range, minimum amount, missing receipt), sort, paginate, bulk-categorize, CSV export, a detail drawer (click a row) with category, an **Add note** / **Save note** editor and receipt upload |
| `#/accounts/:id` | Per-account balance chart, routing and account numbers with copy buttons, that account's transactions |
| `#/payments` | Upcoming and recent payments, recipients with search and a "Pay" button |
| `#/bills` | **Drag-and-drop** approval board (Inbox → Approved → Scheduled → Paid). Drag across columns or reorder within one. Dropping on Paid posts a pending transaction and debits Operating. Each card also has a **hover menu** with "Move to…" as a keyboard-friendly alternative. A searchable vendor **dropdown** filters the board |
| `#/cards` | Click a card to open its **Manage card** drawer (freeze or unfreeze, edit name and monthly limit), issue new virtual or physical cards in two steps (type, then details), spend-vs-limit bars |
| `#/invoices` | Status tabs, an invoice editor with line items and validation, send, view, delete, and **Record payment** from the invoice view, which asks you to confirm and then posts a revenue transaction |
| `#/insights` | Spend by category (click through to filtered transactions), top vendors, net cash flow by month |
| `#/settings` | Company profile and theme, team invites with roles (the last admin can't be removed), notification toggles and threshold, reset data, and an **Integrations** tab whose list (QuickBooks, Slack, Gusto with Connect, then Sync now) is a same-origin **iframe** loading `public/integrations/index.html`. `src/lib/integrations.ts` sets its src, title, name and load delay |

Complex controls, built for testing interactions:
- **Searchable dropdowns** (`role="combobox"`, type to filter, arrow keys and Enter): the category filter, the bulk "Set category…" control, the drawer's Category, the new card's Cardholder and Type, the Bills vendor filter, and Send money's Pay to.
- **Sliders:** the card monthly limit (synced with a number field, with clickable tick marks and a warning when the limit is below this month's spend), plus a two-handle **Amount** range filter on Transactions.
- **Drag and drop:** the Bills board, plus a receipt drop zone in the transaction drawer.
- **Hover menus:** the "⋯" on each transaction row opens on hover, and **Categorize ▸** opens a submenu flyout. Bill cards have the same kind of menu.

Also available everywhere:
- **Move money**: a send-money form (a searchable recipient dropdown, amount, account, date and memo on one screen, then a review) that can add a recipient and checks the balance and date, plus transfers between accounts.
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

## Demo variants

Open **Demo admin** in the sidebar or go to `#/admin`. Each selector applies immediately and persists in the current browser. Any combination of the four variants works.

| Feature | Variant | What changes |
|---|---|---|
| Cards | UI change | A full-width orange **Card management** banner highlights **Issue card** and expandable **Card tips**. The card list adds a **Your cards** heading and warm accents. The issue-card form stays the same. |
| Payments | Flow change | **Send money** moves into the Payments list. The workflow adds recipient verification and separates the date and memo into a Delivery step. This applies to entry points on Payments. |
| Bills | Big flow change | The status board becomes a searchable vendor list. Open a vendor, choose a bill, then select **Pay now** or **Schedule** and confirm. |
| Insights | Rebranding | **Fieldnote Analytics** adds a leaf mark, a forest-green palette, serif heading, and new chart labels. Report data, filters, and drill-down links keep their existing behavior. |

**Shareable preview** opens the feature in a new tab with all four selections encoded in the URL. For example, `?variants=payments#/payments` enables just the guided payment variant, and `?variants=#/payments` forces all baselines. Opening a preview is independent of the receiving browser’s saved selections. The URL carries variant settings only. Demo records continue to use the browser’s sample data, which you can restore from Settings. **Reset to baseline** resets the selectors.
