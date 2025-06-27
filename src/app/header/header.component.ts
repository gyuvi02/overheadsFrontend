import {Component, inject} from '@angular/core';
import {ButtonComponent} from "../shared/button/button.component";
import {NavigationEnd, Router} from '@angular/router';
import {filter} from 'rxjs/operators';
import {AsyncPipe, NgIf} from '@angular/common';
import {AuthService} from '../core/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    ButtonComponent,
    NgIf,
    AsyncPipe
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent {
  currentRoute: string = '';
  currentLang: 'en' | 'hu' = 'hu'; // Default to Hungarian
  private authService = inject(AuthService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  constructor(private router: Router) {
    this.detectLangFromUrl();

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects;
    });
  }

  isLoginRoute(): boolean {
    return this.currentRoute === '/login' || this.currentRoute === '/';
  }

  onLogout(): void {
    this.authService.logout();
  }

  onHome(): void {
    this.router.navigate(['/me']);
  }

  redirectToLanguage(lang: 'en' | 'hu'): void {
    if (this.currentRoute.startsWith('/registerMe')) {
      // For registerMe routes, preserve the path and query parameters
      const currentUrl = new URL(window.location.href);
      const pathWithoutLang = currentUrl.pathname.replace(/^\/(en|hu)/, '');
      const queryString = currentUrl.search;

      window.location.href = `https://omegahouses.org/${lang}${pathWithoutLang}${queryString}`;
    } else {
      // For other routes, redirect to the language root
      window.location.href = `https://omegahouses.org/${lang}`;
    }
  }

  private detectLangFromUrl(): void {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // Check if URL includes "/en" or "/hu"
    if (pathname.startsWith('/en')) {
      this.currentLang = 'en';
    } else {
      this.currentLang = 'hu';
    }
  }

  showLangButton(lang: 'en' | 'hu'): boolean {
    return (this.isLoginRoute() || this.currentRoute.startsWith('/registerMe')) && this.currentLang !== lang;
  }
}
