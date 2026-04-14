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
