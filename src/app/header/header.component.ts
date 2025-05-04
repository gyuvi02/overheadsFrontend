import { Component, inject } from '@angular/core';
import { ButtonComponent } from "../shared/button/button.component";
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgIf, AsyncPipe } from '@angular/common';
import { AuthService } from '../core/auth.service';

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
  private authService = inject(AuthService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: any) => {
      this.currentRoute = event.urlAfterRedirects;
    });
  }

  isLoginRoute(): boolean {
    return this.currentRoute === '/main/login' || this.currentRoute === '/';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/main/login']);
  }

  onHome(): void {
    this.router.navigate(['/main']);
  }
}
