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
    window.location.href = `https://omegahouses.org/${lang}`;
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
    return this.isLoginRoute() && this.currentLang !== lang;
  }
}
