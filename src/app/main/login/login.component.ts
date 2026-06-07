import {Component, inject} from '@angular/core';
import { CommonModule } from '@angular/common';
import { take } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/button/button.component';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { AuthService, LoginResponse } from '../../core/auth.service';
import {environment} from '../../../environments/environment';
import { ApiErrorHandlerService } from '../../core/api-error-handler.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private apiErrorHandler = inject(ApiErrorHandlerService);
  username: string = '';
  password: string = '';
  isLoading: boolean = false;

  onLogin() {
    if (this.isLoading) {
      return;
    }
    console.log('Login attempt with:', this.username);

    // Csak a tokent távolítjuk el, ha van, de nem töröljük az egész állapotot a kérés előtt,
    // mert az AuthService.login elvégzi a szükséges frissítéseket.
    sessionStorage.removeItem('token');

    this.isLoading = true;

    this.httpClient.post(`${environment.apiBaseUrl}/v1/login`, {
      "username": this.username,
      "password": this.password
    }, {
      headers: {'API-KEY': environment.apiKeyValid},
      responseType: 'json'
    })
    .pipe(take(1))
    .subscribe(
      {
        next: (data) => {
          console.log('Login success data:', data);
          this.isLoading = false;
          const loginResponse = data as LoginResponse;
          this.authService.login(loginResponse);
        },
        error: (err: HttpErrorResponse) => {
          this.isLoading = false;
          console.error('Login error:', err);
          this.apiErrorHandler.handleError(err);
        }
      }
    );
  }
}
