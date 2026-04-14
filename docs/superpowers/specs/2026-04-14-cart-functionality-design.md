# Cart Functionality Design

**Date:** 2026-04-14  
**Status:** Approved

## Summary

Add real cart functionality to the FruitShop Angular app: users can add items from the product page, the cart badge updates reactively, and the cart page shows items with quantity controls and a total. Cart state persists to `localStorage` across page refreshes.

---

## 1. Data Model

```ts
interface CartItem {
  id: string;       // 'apple' | 'orange' | 'pineapple'
  name: string;     // display name
  price: number;    // unit price in ₹
  quantity: number; // must be >= 1
}
```

Products are identified by stable string ids matching the hardcoded items in `product.component.html`.

---

## 2. CartService (`src/app/cart.service.ts`)

A single injectable service (provided in root) that owns all cart state.

**State:**
- `private _items = new BehaviorSubject<CartItem[]>([])` — source of truth
- Rehydrates from `localStorage` on construction
- Persists to `localStorage` on every mutation

**Public API:**
```ts
items$: Observable<CartItem[]>
totalCount$: Observable<number>   // sum of all quantities
totalPrice$: Observable<number>   // sum of price × quantity

addToCart(id: string, name: string, price: number): void
  // if item exists → increment quantity; else → push new CartItem with qty 1

updateQuantity(id: string, delta: number): void
  // applies delta (+1 or -1); removes item if quantity reaches 0

removeFromCart(id: string): void
  // removes item entirely regardless of quantity
```

**localStorage key:** `'fruitshop_cart'`

---

## 3. Product Page (`product.component`)

**Changes to `product.component.ts`:**
- Inject `CartService` alongside existing `ThemeService`
- Add method: `addToCart(id: string, name: string, price: number)`

**Changes to `product.component.html` (all 3 theme blocks):**
- Replace `<a href="cart" ...>Add to Cart</a>` with `<button (click)="addToCart(id, name, price)" ...>Add to Cart</button>`
- Replace static cart badge `3` with `{{ cartService.totalCount$ | async }}`

Product ids, names, and prices to pass through:
| id | name | price |
|----|------|-------|
| `'apple'` | `'Apple'` | `30` |
| `'orange'` | `'Orange'` | `60` |
| `'pineapple'` | `'Pineapple'` | `70` |

---

## 4. Cart Page (`cart.component`)

**Changes to `cart.component.ts`:**
- Inject `CartService`
- Expose `items$`, `totalPrice$` to template
- Methods: `updateQuantity(id, delta)`, `removeFromCart(id)`

**Template layout (per theme block):**

```
[ Item name ]  [ − ]  [ qty ]  [ + ]  [ ₹subtotal ]  [ Remove ]
...
──────────────────────────────────────────
Total: ₹XXX
```

- Empty state: show "Your cart is empty" message when `items$` emits `[]`
- All 3 theme blocks (`v1`, `v2`, `v3`) get the same logic, styled per existing theme conventions

---

## 5. Persistence

- On every cart mutation, serialize `CartItem[]` to JSON and write to `localStorage['fruitshop_cart']`
- On `CartService` construction, read and parse `localStorage['fruitshop_cart']`; if absent or invalid JSON, start with empty array

---

## 6. Out of Scope

- Checkout / payment flow
- Backend / API integration
- Product catalog as a data service (products remain hardcoded in HTML)
- Toast/snackbar notifications on add
- Cart drawer / slide-out panel
