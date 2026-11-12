# Demo check playground

A tiny static "workspace settings" app used to test the Supademo demo staleness check.

- `main` is deployed to GitHub Pages on every push (`.github/workflows/pages.yml`).
- Record demos on the current `main`, then push UI changes one commit at a time and run the check after each deploy.
- No build step, no backend. State lives in `localStorage`.
