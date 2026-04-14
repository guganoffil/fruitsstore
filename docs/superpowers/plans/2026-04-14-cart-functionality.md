# Cart Functionality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a working cart to the FruitShop Angular app — add items from the product page, reactive badge count, quantity controls on the cart page, and localStorage persistence.

**Architecture:** A new `CartService` (mirroring the existing `ThemeService` pattern) holds all cart state as a `BehaviorSubject<CartItem[]>`, persisting to `localStorage` on every mutation. `ProductComponent` injects `CartService` to add items and show the live badge count. `CartComponent` injects `CartService` to display items with +/- quantity controls and a running total.

**Tech Stack:** Angular 13, RxJS BehaviorSubject, localStorage, Karma/Jasmine unit tests

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/app/cart.service.ts` | CartItem type, cart state, localStorage sync |
| Create | `src/app/cart.service.spec.ts` | Unit tests for CartService |
| Modify | `src/app/product/product.component.ts` | Inject CartService, add `addToCart()` method |
| Modify | `src/app/product/product.component.html` | Wire Add to Cart buttons, live badge |
| Modify | `src/app/product/product.component.spec.ts` | Update test setup for CartService |
| Modify | `src/app/cart/cart.component.ts` | Inject CartService, expose items$/totalPrice$, quantity/remove methods |
| Modify | `src/app/cart/cart.component.html` | Replace static empty-state with live item list + controls |
| Modify | `src/app/cart/cart.component.spec.ts` | Update test setup for CartService |

---

## Task 1: Create CartService with unit tests

**Files:**
- Create: `src/app/cart.service.ts`
- Create: `src/app/cart.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/app/cart.service.spec.ts`:

```ts
import { TestBed } from '@angular/core/testing';
import { CartService, CartItem } from './cart.service';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
  });

  it('should start with empty cart', (done) => {
    service.items$.subscribe(items => {
      expect(items.length).toBe(0);
      done();
    });
  });

  it('addToCart should add a new item with quantity 1', (done) => {
    service.addToCart('apple', 'Apple', 30);
    service.items$.subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0]).toEqual({ id: 'apple', name: 'Apple', price: 30, quantity: 1 });
      done();
    });
  });

  it('addToCart should increment quantity if item already exists', (done) => {
    service.addToCart('apple', 'Apple', 30);
    service.addToCart('apple', 'Apple', 30);
    service.items$.subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].quantity).toBe(2);
      done();
    });
  });

  it('updateQuantity +1 should increment quantity', (done) => {
    service.addToCart('apple', 'Apple', 30);
    service.updateQuantity('apple', 1);
    service.items$.subscribe(items => {
      expect(items[0].quantity).toBe(2);
      done();
    });
  });

  it('updateQuantity -1 to 0 should remove the item', (done) => {
    service.addToCart('apple', 'Apple', 30);
    service.updateQuantity('apple', -1);
    service.items$.subscribe(items => {
      expect(items.length).toBe(0);
      done();
    });
  });

  it('removeFromCart should remove item entirely', (done) => {
    service.addToCart('apple', 'Apple', 30);
    service.addToCart('orange', 'Orange', 60);
    service.removeFromCart('apple');
    service.items$.subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('orange');
      done();
    });
  });

  it('totalCount$ should sum all quantities', (done) => {
    service.addToCart('apple', 'Apple', 30);
    service.addToCart('apple', 'Apple', 30);
    service.addToCart('orange', 'Orange', 60);
    service.totalCount$.subscribe(count => {
      expect(count).toBe(3);
      done();
    });
  });

  it('totalPrice$ should sum price × quantity', (done) => {
    service.addToCart('apple', 'Apple', 30);
    service.addToCart('apple', 'Apple', 30);
    service.addToCart('orange', 'Orange', 60);
    service.totalPrice$.subscribe(total => {
      expect(total).toBe(120); // 30×2 + 60×1
      done();
    });
  });

  it('should persist to localStorage on mutation', () => {
    service.addToCart('apple', 'Apple', 30);
    const stored = JSON.parse(localStorage.getItem('fruitshop_cart')!);
    expect(stored.length).toBe(1);
    expect(stored[0].id).toBe('apple');
  });

  it('should rehydrate from localStorage on construction', () => {
    const saved: CartItem[] = [{ id: 'apple', name: 'Apple', price: 30, quantity: 2 }];
    localStorage.setItem('fruitshop_cart', JSON.stringify(saved));
    const freshService = new CartService();
    let items: CartItem[] = [];
    freshService.items$.subscribe(v => items = v);
    expect(items.length).toBe(1);
    expect(items[0].quantity).toBe(2);
  });

  it('should start empty if localStorage contains invalid JSON', () => {
    localStorage.setItem('fruitshop_cart', 'not-json');
    const freshService = new CartService();
    let items: CartItem[] = [];
    freshService.items$.subscribe(v => items = v);
    expect(items.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx ng test --include="src/app/cart.service.spec.ts" --watch=false
```

Expected: Multiple failures — `CartService` and `CartItem` do not exist yet.

- [ ] **Step 3: Create `src/app/cart.service.ts`**

```ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const STORAGE_KEY = 'fruitshop_cart';

@Injectable({ providedIn: 'root' })
export class CartService {
  private _items = new BehaviorSubject<CartItem[]>(this._load());

  items$: Observable<CartItem[]> = this._items.asObservable();

  totalCount$: Observable<number> = this._items.pipe(
    map(items => items.reduce((sum, i) => sum + i.quantity, 0))
  );

  totalPrice$: Observable<number> = this._items.pipe(
    map(items => items.reduce((sum, i) => sum + i.price * i.quantity, 0))
  );

  addToCart(id: string, name: string, price: number): void {
    const current = this._items.value;
    const existing = current.find(i => i.id === id);
    if (existing) {
      this._update(current.map(i => i.id === id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      this._update([...current, { id, name, price, quantity: 1 }]);
    }
  }

  updateQuantity(id: string, delta: number): void {
    const current = this._items.value;
    const updated = current
      .map(i => i.id === id ? { ...i, quantity: i.quantity + delta } : i)
      .filter(i => i.quantity > 0);
    this._update(updated);
  }

  removeFromCart(id: string): void {
    this._update(this._items.value.filter(i => i.id !== id));
  }

  private _update(items: CartItem[]): void {
    this._items.next(items);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  private _load(): CartItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include="src/app/cart.service.spec.ts" --watch=false
```

Expected: All 11 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/cart.service.ts src/app/cart.service.spec.ts
git commit -m "feat: add CartService with localStorage persistence"
```

---

## Task 2: Wire CartService into ProductComponent

**Files:**
- Modify: `src/app/product/product.component.ts`
- Modify: `src/app/product/product.component.spec.ts`

- [ ] **Step 1: Write the failing test**

Replace contents of `src/app/product/product.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { ProductComponent } from './product.component';
import { CartService } from '../cart.service';
import { ThemeService } from '../theme.service';

describe('ProductComponent', () => {
  let component: ProductComponent;
  let fixture: ComponentFixture<ProductComponent>;
  let cartService: CartService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      declarations: [ProductComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [CartService, ThemeService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('addToCart should delegate to CartService', (done) => {
    component.addToCart('apple', 'Apple', 30);
    cartService.items$.subscribe(items => {
      expect(items.length).toBe(1);
      expect(items[0].id).toBe('apple');
      done();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx ng test --include="src/app/product/product.component.spec.ts" --watch=false
```

Expected: Fails — `addToCart` does not exist on `ProductComponent` yet.

- [ ] **Step 3: Update `src/app/product/product.component.ts`**

```ts
import { Component } from '@angular/core';
import { ThemeService, Theme } from '../theme.service';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent {
  constructor(public themeService: ThemeService, public cartService: CartService) {}

  get theme(): Theme { return this.themeService.theme; }

  onThemeChange(value: string) {
    this.themeService.setTheme(value as Theme);
  }

  addToCart(id: string, name: string, price: number) {
    this.cartService.addToCart(id, name, price);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx ng test --include="src/app/product/product.component.spec.ts" --watch=false
```

Expected: Both tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/product/product.component.ts src/app/product/product.component.spec.ts
git commit -m "feat: inject CartService into ProductComponent"
```

---

## Task 3: Update product.component.html — wire buttons and badge

**Files:**
- Modify: `src/app/product/product.component.html`

This task has no separate unit test — the template changes are covered by the component test in Task 2 and visual verification. Each of the three theme blocks (`v1`, `v2`, `v3`) needs:

1. Cart badge: replace the static `3` with `{{ cartService.totalCount$ | async }}`
2. "Add to Cart" anchors: replace `<a href="cart" ...>Add to Cart</a>` with `<button (click)="addToCart('id', 'Name', price)" ...>Add to Cart</button>`

- [ ] **Step 1: Update V1 (Neon Dark) block**

In the V1 `<ng-container>`, make these three changes:

**Badge** — find:
```html
<span class="cart-badge">3</span>
```
Replace with:
```html
<span class="cart-badge">{{ cartService.totalCount$ | async }}</span>
```

**Apple button** — find:
```html
<a href="cart" class="btn-neon-outline">Add to Cart</a>
```
(inside the Apple card — first occurrence)
Replace with:
```html
<button (click)="addToCart('apple', 'Apple', 30)" class="btn-neon-outline">Add to Cart</button>
```

**Orange button** — find:
```html
<a href="cart" class="btn-neon-outline">Add to Cart</a>
```
(inside the Orange card — second occurrence)
Replace with:
```html
<button (click)="addToCart('orange', 'Orange', 60)" class="btn-neon-outline">Add to Cart</button>
```

**Pineapple button** — find:
```html
<a href="cart" class="btn-neon-outline">Add to Cart</a>
```
(inside the Pineapple card — third occurrence)
Replace with:
```html
<button (click)="addToCart('pineapple', 'Pineapple', 70)" class="btn-neon-outline">Add to Cart</button>
```

- [ ] **Step 2: Update V2 (Tropical) block**

**Badge** — find:
```html
<span class="cart-count">3</span>
```
Replace with:
```html
<span class="cart-count">{{ cartService.totalCount$ | async }}</span>
```

**Apple button** — find:
```html
<a href="cart" class="tropic-btn">Add to Cart 🛒</a>
```
Replace with:
```html
<button (click)="addToCart('apple', 'Apple', 30)" class="tropic-btn">Add to Cart 🛒</button>
```

**Orange button** — find:
```html
<a href="cart" class="tropic-btn orange-btn">Add to Cart 🛒</a>
```
Replace with:
```html
<button (click)="addToCart('orange', 'Orange', 60)" class="tropic-btn orange-btn">Add to Cart 🛒</button>
```

**Pineapple button** — find:
```html
<a href="cart" class="tropic-btn pine-btn">Add to Cart 🛒</a>
```
Replace with:
```html
<button (click)="addToCart('pineapple', 'Pineapple', 70)" class="tropic-btn pine-btn">Add to Cart 🛒</button>
```

- [ ] **Step 3: Update V3 (Premium) block**

**Badge** — find:
```html
<span class="premium-badge">3</span>
```
Replace with:
```html
<span class="premium-badge">{{ cartService.totalCount$ | async }}</span>
```

**Apple button** — find:
```html
<a href="cart" class="btn-premium-solid">Add to Cart</a>
```
(first occurrence — Apple card)
Replace with:
```html
<button (click)="addToCart('apple', 'Apple', 30)" class="btn-premium-solid">Add to Cart</button>
```

**Orange button** — find:
```html
<a href="cart" class="btn-premium-solid">Add to Cart</a>
```
(second occurrence — Orange card)
Replace with:
```html
<button (click)="addToCart('orange', 'Orange', 60)" class="btn-premium-solid">Add to Cart</button>
```

**Pineapple button** — find:
```html
<a href="cart" class="btn-premium-solid">Add to Cart</a>
```
(third occurrence — Pineapple card)
Replace with:
```html
<button (click)="addToCart('pineapple', 'Pineapple', 70)" class="btn-premium-solid">Add to Cart</button>
```

- [ ] **Step 4: Verify app compiles**

```bash
npx ng build --configuration development 2>&1 | tail -5
```

Expected: `Build at: ... - Hash: ... - Time: ...ms` with no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/product/product.component.html
git commit -m "feat: wire Add to Cart buttons and live badge in product page"
```

---

## Task 4: Wire CartService into CartComponent

**Files:**
- Modify: `src/app/cart/cart.component.ts`
- Modify: `src/app/cart/cart.component.spec.ts`

- [ ] **Step 1: Write the failing tests**

Replace contents of `src/app/cart/cart.component.spec.ts`:

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { CartComponent } from './cart.component';
import { CartService } from '../cart.service';
import { ThemeService } from '../theme.service';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cartService: CartService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      declarations: [CartComponent],
      imports: [FormsModule, RouterTestingModule],
      providers: [CartService, ThemeService]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('updateQuantity should delegate to CartService', (done) => {
    cartService.addToCart('apple', 'Apple', 30);
    component.updateQuantity('apple', 1);
    cartService.items$.subscribe(items => {
      expect(items[0].quantity).toBe(2);
      done();
    });
  });

  it('removeFromCart should delegate to CartService', (done) => {
    cartService.addToCart('apple', 'Apple', 30);
    component.removeFromCart('apple');
    cartService.items$.subscribe(items => {
      expect(items.length).toBe(0);
      done();
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx ng test --include="src/app/cart/cart.component.spec.ts" --watch=false
```

Expected: Fails — `updateQuantity` and `removeFromCart` do not exist on `CartComponent`.

- [ ] **Step 3: Update `src/app/cart/cart.component.ts`**

```ts
import { Component } from '@angular/core';
import { ThemeService, Theme } from '../theme.service';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent {
  items$ = this.cartService.items$;
  totalPrice$ = this.cartService.totalPrice$;

  constructor(public themeService: ThemeService, public cartService: CartService) {}

  get theme(): Theme { return this.themeService.theme; }

  onThemeChange(value: string) {
    this.themeService.setTheme(value as Theme);
  }

  updateQuantity(id: string, delta: number) {
    this.cartService.updateQuantity(id, delta);
  }

  removeFromCart(id: string) {
    this.cartService.removeFromCart(id);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx ng test --include="src/app/cart/cart.component.spec.ts" --watch=false
```

Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/cart/cart.component.ts src/app/cart/cart.component.spec.ts
git commit -m "feat: inject CartService into CartComponent"
```

---

## Task 5: Update cart.component.html — live item list with quantity controls

**Files:**
- Modify: `src/app/cart/cart.component.html`

Each of the three theme `<ng-container>` blocks needs:
- Replace the static empty-state div with an `*ngIf` on the live `items$` observable
- Add an `*ngFor` item list with `-`/`+` buttons and a remove button
- Wire the total price to `totalPrice$`

The existing cart HTML has a summary panel with static `₹0` values and a separate empty-state div. We will make both dynamic.

- [ ] **Step 1: Update V1 (Neon Dark) cart block**

Replace the entire contents of the V1 `<ng-container>` (lines 2–37 of `cart.component.html`) with:

```html
<ng-container *ngIf="theme === 'v1'">
  <div class="neon-navbar">
    <div class="neon-brand">
      <span class="neon-icon">⚡</span>
      <span class="neon-logo">FruitShop</span>
    </div>
    <div class="navbar-right">
      <select class="theme-switcher theme-switcher-neon" [ngModel]="theme" (ngModelChange)="onThemeChange($event)">
        <option value="v1">⚡ Neon Dark</option>
        <option value="v2">🍓 Tropical</option>
        <option value="v3">🌿 Premium</option>
      </select>
      <a routerLink="/product" class="btn-back">← BACK TO STORE</a>
    </div>
  </div>

  <div class="cart-page">
    <div class="cart-header">
      <h1 class="cart-title">YOUR <span class="neon-text">CART</span></h1>
      <div class="cart-divider"></div>
    </div>

    <ng-container *ngIf="items$ | async as items">
      <div *ngIf="items.length === 0" class="cart-empty-state">
        <div class="empty-icon">🛒</div>
        <h2 class="empty-title">CART IS EMPTY</h2>
        <p class="empty-sub">Add some fresh fruits to get started</p>
        <a routerLink="/product" class="btn-neon-outline">CONTINUE SHOPPING</a>
      </div>

      <div *ngIf="items.length > 0" class="cart-items-list">
        <div class="cart-item" *ngFor="let item of items">
          <span class="item-name">{{ item.name }}</span>
          <div class="qty-controls">
            <button class="qty-btn" (click)="updateQuantity(item.id, -1)">−</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button class="qty-btn" (click)="updateQuantity(item.id, 1)">+</button>
          </div>
          <span class="item-subtotal">₹{{ item.price * item.quantity }}</span>
          <button class="remove-btn" (click)="removeFromCart(item.id)">Remove</button>
        </div>
      </div>
    </ng-container>

    <div class="cart-summary-panel">
      <div class="summary-row"><span>Subtotal</span><span class="neon-text">₹{{ totalPrice$ | async }}</span></div>
      <div class="summary-row"><span>Delivery</span><span class="free-tag">FREE</span></div>
      <div class="summary-divider"></div>
      <div class="summary-row total-row"><span>TOTAL</span><span class="total-price">₹{{ totalPrice$ | async }}</span></div>
      <button class="btn-checkout">PROCEED TO CHECKOUT</button>
    </div>
  </div>
</ng-container>
```

- [ ] **Step 2: Update V2 (Tropical) cart block**

Replace the entire contents of the V2 `<ng-container>` (lines 40–86 of the original file) with:

```html
<ng-container *ngIf="theme === 'v2'">
  <div class="tropic-navbar">
    <div class="tropic-brand">
      <span class="brand-emoji">🍓</span>
      <span class="brand-name">FruitShop</span>
    </div>
    <div class="tropic-navbar-right">
      <select class="theme-switcher theme-switcher-tropic" [ngModel]="theme" (ngModelChange)="onThemeChange($event)">
        <option value="v1">⚡ Neon Dark</option>
        <option value="v2">🍓 Tropical</option>
        <option value="v3">🌿 Premium</option>
      </select>
      <a routerLink="/product" class="back-link">← Keep Shopping</a>
    </div>
  </div>

  <div class="tropic-cart-page">
    <div class="cart-header-tropic">
      <h1 class="cart-heading">🛒 Your Cart</h1>
      <p class="cart-sub">Fresh fruits waiting for you!</p>
    </div>

    <ng-container *ngIf="items$ | async as items">
      <div *ngIf="items.length === 0" class="empty-cart-tropic">
        <div class="empty-illustration">
          <div class="empty-bowl">🍽️</div>
          <div class="floating-fruits">🍎 🍊 🍍</div>
        </div>
        <h2 class="empty-heading">Your cart is empty!</h2>
        <p class="empty-text">Add some fresh, delicious fruits to get started 🌿</p>
        <a routerLink="/product" class="tropic-btn-pill">Browse Fruits 🍎</a>
      </div>

      <div *ngIf="items.length > 0" class="cart-items-list">
        <div class="cart-item" *ngFor="let item of items">
          <span class="item-name">{{ item.name }}</span>
          <div class="qty-controls">
            <button class="qty-btn" (click)="updateQuantity(item.id, -1)">−</button>
            <span class="qty-value">{{ item.quantity }}</span>
            <button class="qty-btn" (click)="updateQuantity(item.id, 1)">+</button>
          </div>
          <span class="item-subtotal">₹{{ item.price * item.quantity }}</span>
          <button class="remove-btn" (click)="removeFromCart(item.id)">Remove</button>
        </div>
      </div>
    </ng-container>

    <div class="tropic-summary">
      <div class="summary-card">
        <h3 class="summary-heading">Order Summary 📋</h3>
        <div class="summary-line"><span>Items</span><span>₹{{ totalPrice$ | async }}</span></div>
        <div class="summary-line"><span>Delivery</span><span class="free-label">🚚 FREE</span></div>
        <div class="summary-divider"></div>
        <div class="summary-line total-line"><span>Total</span><span class="total-amount">₹{{ totalPrice$ | async }}</span></div>
        <button class="checkout-btn-tropic">Checkout Now 🚀</button>
        <div class="trust-badges">
          <span>🔒 Secure</span>
          <span>✅ Verified</span>
          <span>🌿 Fresh</span>
        </div>
      </div>
    </div>
  </div>
</ng-container>
```

- [ ] **Step 3: Update V3 (Premium) cart block**

Replace the entire contents of the V3 `<ng-container>` (lines 89–155 of the original file) with:

```html
<ng-container *ngIf="theme === 'v3'">
  <div class="premium-navbar">
    <div class="premium-brand">
      <div class="brand-monogram">FS</div>
      <div class="brand-text">
        <span class="brand-name">FruitShop</span>
        <span class="brand-sub">Organic Boutique</span>
      </div>
    </div>
    <div class="premium-navbar-right">
      <select class="theme-switcher theme-switcher-premium" [ngModel]="theme" (ngModelChange)="onThemeChange($event)">
        <option value="v1">⚡ Neon Dark</option>
        <option value="v2">🍓 Tropical</option>
        <option value="v3">🌿 Premium</option>
      </select>
      <a routerLink="/product" class="nav-back">Return to Shop</a>
    </div>
  </div>

  <div class="premium-cart-page">
    <div class="cart-page-header">
      <h1 class="cart-title-premium">Your Cart</h1>
      <div class="cart-title-line"></div>
    </div>
    <div class="cart-body-premium">
      <ng-container *ngIf="items$ | async as items">
        <div *ngIf="items.length === 0" class="empty-state-premium">
          <div class="empty-botanical">
            <div class="leaf-art">🌿</div>
            <div class="empty-circle"><span class="empty-icon-premium">🛍</span></div>
            <div class="leaf-art right">🌿</div>
          </div>
          <h2 class="empty-title-premium">Your cart is empty</h2>
          <p class="empty-desc-premium">Discover our curated selection of premium organic fruits.</p>
          <a routerLink="/product" class="btn-continue-premium">Continue Shopping</a>
        </div>

        <div *ngIf="items.length > 0" class="cart-items-list">
          <div class="cart-item" *ngFor="let item of items">
            <span class="item-name">{{ item.name }}</span>
            <div class="qty-controls">
              <button class="qty-btn" (click)="updateQuantity(item.id, -1)">−</button>
              <span class="qty-value">{{ item.quantity }}</span>
              <button class="qty-btn" (click)="updateQuantity(item.id, 1)">+</button>
            </div>
            <span class="item-subtotal">₹{{ item.price * item.quantity }}</span>
            <button class="remove-btn" (click)="removeFromCart(item.id)">Remove</button>
          </div>
        </div>
      </ng-container>

      <div class="premium-summary-panel">
        <div class="summary-header-premium">
          <h3 class="summary-title-premium">Order Summary</h3>
          <div class="summary-title-line"></div>
        </div>
        <div class="summary-items">
          <div class="summary-row-premium"><span>Subtotal</span><span>₹{{ totalPrice$ | async }}</span></div>
          <div class="summary-row-premium"><span>Express Delivery</span><span class="comp-label">Complimentary</span></div>
          <div class="summary-row-premium"><span>Organic Certification</span><span class="comp-label">Included</span></div>
        </div>
        <div class="summary-line-premium"></div>
        <div class="summary-row-premium total-row-premium">
          <span>Total</span>
          <span class="total-premium">₹{{ totalPrice$ | async }}</span>
        </div>
        <button class="btn-checkout-premium">Proceed to Checkout</button>
        <div class="trust-line">
          <span>🔒 Secure Checkout</span>
          <span>·</span>
          <span>🌿 100% Organic</span>
          <span>·</span>
          <span>✅ Verified Farm</span>
        </div>
      </div>
    </div>
  </div>

  <footer class="premium-footer">
    <div class="footer-brand">FruitShop</div>
    <div class="footer-tagline">Organic Boutique · Est. 2026</div>
  </footer>
</ng-container>
```

- [ ] **Step 4: Verify app compiles**

```bash
npx ng build --configuration development 2>&1 | tail -5
```

Expected: No errors.

- [ ] **Step 5: Run all tests**

```bash
npx ng test --watch=false
```

Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/app/cart/cart.component.html
git commit -m "feat: live cart item list with quantity controls on cart page"
```

---

## Task 6: Final integration verification

- [ ] **Step 1: Start the dev server**

```bash
npm start
```

Open `http://localhost:4200` in a browser.

- [ ] **Step 2: Verify Add to Cart flow**

1. On the product page, click "Add to Cart" for Apple — badge should show `1`
2. Click "Add to Cart" for Apple again — badge should show `2`
3. Click "Add to Cart" for Orange — badge should show `3`

- [ ] **Step 3: Verify Cart page**

Navigate to `/cart`:
1. Three items should appear: Apple (qty 2), Orange (qty 1)
2. Click `+` on Apple — qty becomes 3, subtotal updates
3. Click `−` on Apple until qty reaches 0 — Apple row disappears
4. Click Remove on Orange — Orange row disappears, "empty" state appears

- [ ] **Step 4: Verify localStorage persistence**

1. Add items to cart
2. Refresh the page (`F5`)
3. Navigate to `/cart` — items should still be present

- [ ] **Step 5: Verify all 3 themes**

Use the theme switcher to test V1, V2, and V3. Badge and cart should work identically in all themes.

- [ ] **Step 6: Final commit if all looks good**

```bash
git add .
git commit -m "feat: complete cart functionality with localStorage persistence"
```
