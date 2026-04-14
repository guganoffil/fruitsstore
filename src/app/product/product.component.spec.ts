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

  it('totalCount$ should reflect cart state', (done) => {
    component.addToCart('apple', 'Apple', 30);
    component.totalCount$.subscribe(count => {
      if (count === 0) return;
      expect(count).toBe(1);
      done();
    });
  });
});
