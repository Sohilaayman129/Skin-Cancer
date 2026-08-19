import { Injectable, signal, effect } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly isDark = signal<boolean>(true);

  constructor() {
    const saved = localStorage.getItem('grounded_theme');
    if (saved) {
      this.isDark.set(saved === 'dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isDark.set(prefersDark);
    }

    effect(() => {
      const dark = this.isDark();
      if (dark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('grounded_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('grounded_theme', 'light');
      }
    });
  }

  toggleTheme() {
    this.isDark.update(v => !v);
  }
}
