import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { SubmitDataComponent } from './submit-data/submit-data.component';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    UserMenuComponent,
    SubmitDataComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  private authService = inject(AuthService);
  isLoggedIn$ = this.authService.isLoggedIn$;
}
