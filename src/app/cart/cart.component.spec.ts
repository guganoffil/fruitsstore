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
