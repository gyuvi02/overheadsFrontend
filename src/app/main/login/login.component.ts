import {Component, DestroyRef, inject} from '@angular/core';
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
  private destroyRef = inject(DestroyRef);
  private authService = inject(AuthService);
  private apiErrorHandler = inject(ApiErrorHandlerService);
  username: string = '';
  password: string = '';

  onLogin() {
    console.log('Login attempt with:', this.username);
    const loginData = this.httpClient.post(`${environment.apiBaseUrl}/login`, {
      "username": this.username,
      "password": this.password
    }, {
      headers: {'API-KEY': environment.apiKeyValid},
      responseType: 'json'
    }).subscribe(
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
    )

    this.destroyRef.onDestroy(() => {
      loginData.unsubscribe();
      console.log('Destroying login component');
    });
    console.log('Login component destroyed');

  }
}
