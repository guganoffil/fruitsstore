import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Theme = 'v1' | 'v2' | 'v3';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private _theme = new BehaviorSubject<Theme>('v1');
  theme$ = this._theme.asObservable();

  get theme(): Theme {
    return this._theme.value;
  }

  setTheme(t: Theme) {
    this._theme.next(t);
  }
}
