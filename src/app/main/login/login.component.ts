import {Component, DestroyRef, inject} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/button/button.component';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import { AuthService, LoginResponse } from '../../core/auth.service';
import {environment} from '../../../environments/environment';


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
          // Parse the response as LoginResponse
          const loginResponse = data as LoginResponse;
          // Pass the response to the auth service
          this.authService.login(loginResponse);
        },
        error: (err: HttpErrorResponse) => {
          const errorDiv = document.createElement('div');
          errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: red;
            padding: 50px;
            z-index: 1000;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          `;

          const errorMessage = document.createElement('div');
          errorMessage.textContent = err.error || 'An unknown error occurred during login.';

          const okButton = document.createElement('button');
          okButton.textContent = 'OK';
          okButton.style.cssText = `
            padding: 8px 20px;
            border: none;
            border-radius: 4px;
            background-color: #007bff;
            color: white;
            cursor: pointer;
            font-size: 1rem; /* Ensure readable font size */

          `;
          okButton.onclick = () => errorDiv.remove();

          errorDiv.appendChild(errorMessage);
          errorDiv.appendChild(okButton);
          document.body.appendChild(errorDiv);
          console.error('Login error:', err);
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
