# FruitShop — 3 Design Versions

## Active Theme: VERSION 1 — NEON DARK (currently live)
Font: Orbitron | Colors: #0a0a0f bg, #00ff88 neon green, #00cfff cyan | Style: glassmorphism, futuristic

---

## How to switch themes

### VERSION 1 — NEON DARK (currently active)
Files are already in: `src/app/product/`, `src/app/cart/`, `src/app/details/`
styles.css already set up with Orbitron + CSS variables.

### VERSION 2 — TROPICAL BURST
Copy from `src/themes/v2-tropical/` to the app:
```
cp src/themes/v2-tropical/product.component.html  src/app/product/product.component.html
cp src/themes/v2-tropical/product.component.css   src/app/product/product.component.css
cp src/themes/v2-tropical/cart.component.html     src/app/cart/cart.component.html
cp src/themes/v2-tropical/cart.component.css      src/app/cart/cart.component.css
cp src/themes/v2-tropical/details.component.html  src/app/details/details.component.html
cp src/themes/v2-tropical/details.component.css   src/app/details/details.component.css
```
Update styles.css:
```css
@import "~bootstrap/dist/css/bootstrap.min.css";
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');
body { font-family: 'Nunito', sans-serif; background: #fff9f0; }
```

### VERSION 3 — PREMIUM ORGANIC
Copy from `src/themes/v3-premium/`:
```
cp src/themes/v3-premium/product.component.html  src/app/product/product.component.html
cp src/themes/v3-premium/product.component.css   src/app/product/product.component.css
cp src/themes/v3-premium/cart.component.html     src/app/cart/cart.component.html
cp src/themes/v3-premium/cart.component.css      src/app/cart/cart.component.css
cp src/themes/v3-premium/details.component.html  src/app/details/details.component.html
cp src/themes/v3-premium/details.component.css   src/app/details/details.component.css
```
Update styles.css:
```css
@import "~bootstrap/dist/css/bootstrap.min.css";
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lato:wght@300;400;700&display=swap');
body { font-family: 'Lato', sans-serif; background: #f8f5f0; }
```

---

## Theme Summary

| Version | Name | Font | Primary Color | Style |
|---------|------|------|---------------|-------|
| V1 | Neon Dark | Orbitron | #00ff88 | Glassmorphism, futuristic glow |
| V2 | Tropical Burst | Nunito | #ff6b35 | Bubbly cards, gradient, emoji-rich |
| V3 | Premium Organic | Playfair Display + Lato | #c9a84c gold | Editorial, luxury, minimal |
