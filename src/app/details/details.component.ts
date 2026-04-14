import { Component } from '@angular/core';
import { ThemeService, Theme } from '../theme.service';

@Component({
  selector: 'app-details',
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.css']
})
export class DetailsComponent {
  constructor(public themeService: ThemeService) {}

  get theme(): Theme { return this.themeService.theme; }

  onThemeChange(value: string) {
    this.themeService.setTheme(value as Theme);
  }
}
