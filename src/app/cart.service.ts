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
    } catch (e) {
      return [];
    }
  }
}
