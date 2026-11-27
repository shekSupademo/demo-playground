# Demo playground

Ten small, independent apps for testing tools that re-record product demos after the UI changes. Each app covers one category of change, so you can test the categories in parallel. Every app has a **baseline** and a **variant**, and the admin page switches each app between them.

## Apps

| Path | App | Categories | Items |
|---|---|---|---|
| `/plano/` | Plano, project tracker | 1. Content and copy, 2. Visual style, 3. Sections added or removed | 1–21 |
| `/pipeline/` | Pipeline, sales CRM | 4. Element position and visibility | 22–28 |
| `/shopline/` | Shopline, store admin | 5. Component type swaps | 29–34 |
| `/filebox/` | Filebox, file manager | 6. Interaction model | 35–39 |
| `/tripway/` | Tripway, hotel booking | 7. Flow and steps | 40–46 |
| `/peoplehub/` | Peoplehub, HR onboarding | 8. Forms and validation | 47–49 |
| `/metricly/` | Metricly, analytics | 9. Navigation and information architecture | 50–53 |
| `/mailbird/` | Mailbird, email campaigns | 10. Interruptions and gates | 54–56 |
| `/notely/` | Notely, notes | 11. Full redesign | 57–58 |
| `/corvid/` | Corvid, issue tracker | 12. Deep workflows | 59–63 |

`src/registry.ts` lists every change, with what the baseline and the variant show, and the flow to record in each app. The admin page shows the same table.

## Admin page

The site root is the admin page. For each app it has:

- A **Baseline / Variant** switch. The choice is stored in Supabase and applies to every visitor on their next page load. **All to baseline** and **All to variant** switch every app at once.
- **Open**, which follows the shared switch.
- **Pinned baseline** and **Pinned variant** (`?variant=baseline` or `?variant=variant`), which ignore the shared switch. Use these for parallel runs that must hold a version without affecting anyone else.

Each app starts from the same sample data on every load and keeps no data in the browser, so runs are repeatable. If Supabase can't be reached, every app shows its baseline.

`public/form-lab/` and `public/integrations/` are standalone static pages and are served as they are.

## Develop

```bash
pnpm install
pnpm dev      # http://localhost:5173, admin at /, apps at /<app>/
pnpm test
pnpm build    # type-check and build to dist/
```

To use the shared switches locally, put `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Without them, apps show their baseline unless pinned, and the admin page can't save.

### Add an app

1. Add its id to `appIds` and its entry to `apps` in `src/registry.ts`.
2. Add `src/apps/<id>/App.tsx` with `export default function App({ variant })`, and register it in `src/apps/loaders.ts`.
3. Add `<id>/index.html` (copy another app's and change the id).
4. Add the id to the check constraint and the seed rows in Supabase.

## Deploy

`.github/workflows/pages.yml` tests and builds every push to `main` and publishes it to GitHub Pages. Pull requests run the same checks without deploying.

### Supabase setup

1. In the Supabase **SQL editor**, run `supabase/demo_apps.sql`. It creates one row per app that anyone can read and switch between `baseline` and `variant`, and nothing else.
2. In **Project Settings → API keys**, copy the project URL and the publishable key. Both are safe to expose, because row-level security limits what the key can change.
3. In this repository, open **Settings → Secrets and variables → Actions → Variables** and add `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY`.

A free Supabase project pauses after a week with no activity. Restore it from the Supabase dashboard. Until then, the apps show their baselines.
