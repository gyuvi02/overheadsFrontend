import {Component, inject} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/button/button.component';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { AuthService, LoginResponse } from '../../core/auth.service';
import {environment} from '../../../environments/environment';
import { ApiErrorHandlerService } from '../../core/api-error-handler.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  private httpClient = inject(HttpClient);
  private authService = inject(AuthService);
  private apiErrorHandler = inject(ApiErrorHandlerService);
  username: string = '';
  password: string = '';

  onLogin() {
    console.log('Login attempt with:', this.username);
    this.httpClient.post(`${environment.apiBaseUrl}/v1/login`, {
      "username": this.username,
      "password": this.password
    }, {
      headers: {'API-KEY': environment.apiKeyValid},
      responseType: 'json'
    })
    .pipe(takeUntilDestroyed())
    .subscribe(
      {
        next: (data) => {
          console.log(data);
          const loginResponse = data as LoginResponse;
          this.authService.login(loginResponse);
        },
        error: (err: HttpErrorResponse) => {
          this.apiErrorHandler.handleError(err);
        }
      }
    );
  }
}
