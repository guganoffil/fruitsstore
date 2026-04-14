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

  constructor(private themeService: ThemeService, private cartService: CartService) {}

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
