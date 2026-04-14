# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # ng serve — dev server at http://localhost:4200
npm run build      # production build
npm test           # run unit tests via Karma
```

Run a single test file:
```bash
npx ng test --include="src/app/product/product.component.spec.ts"
```

## Architecture

Angular 13 single-page fruit store app. No services or state management — all three routed components (`ProductComponent`, `DetailsComponent`, `CartComponent`) are currently stateless shells with no logic in their `.ts` files. The `AppComponent` provides the shell (toolbar/sidenav via Angular Material).

**Routes** (`app-routing.module.ts`):
- `/` and `/product` → `ProductComponent`
- `/details` → `DetailsComponent`
- `/cart` → `CartComponent`

**UI libraries**: Angular Material (toolbar, sidenav, icons, buttons) + Bootstrap 5 (layout/utilities).

## Theming

The app has three complete design themes. The active theme is swapped by replacing component HTML/CSS files and updating `styles.css`. Do not mix files across themes.

| Version | Directory | Font | Style |
|---------|-----------|------|-------|
| V1 — Neon Dark (active) | `src/app/*/` | Orbitron | Glassmorphism, `#00ff88` neon green |
| V2 — Tropical Burst | `src/themes/v2-tropical/` | Nunito | Bubbly cards, `#ff6b35` orange |
| V3 — Premium Organic | `src/themes/v3-premium/` | Playfair Display + Lato | Luxury editorial, `#c9a84c` gold |

To switch themes, copy the relevant files from `src/themes/<version>/` into `src/app/product/`, `src/app/cart/`, and `src/app/details/`, then update the `body` rule and font import in `src/styles.css`. See `src/themes/HOW-TO-SWITCH-THEMES.md` for exact commands and CSS snippets.

CSS variables for V1 are defined in `src/styles.css` under `:root`. Theme-specific variables in V2/V3 are scoped within their component CSS files.
