import { Component } from '@angular/core';
import { ThemeService, Theme } from '../theme.service';
import { CartService } from '../cart.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.component.html',
  styleUrls: ['./product.component.css']
})
export class ProductComponent {
  totalCount$ = this.cartService.totalCount$;

  constructor(private themeService: ThemeService, private cartService: CartService) {}

  get theme(): Theme { return this.themeService.theme; }

  onThemeChange(value: string) {
    this.themeService.setTheme(value as Theme);
  }

  addToCart(id: string, name: string, price: number) {
    this.cartService.addToCart(id, name, price);
  }
}
