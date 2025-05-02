import {Component, DestroyRef, inject} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/button/button.component';
import { API_KEY_VALID } from '../../core/constants';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';


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
  username: string = '';
  password: string = '';

  onLogin() {
    console.log('Login attempt with:', this.username);
    console.log(API_KEY_VALID);
    const loginData = this.httpClient.post('http://localhost:8080/api/v1/login', {
      "username": this.username,
      "password": this.password
    }, {
      headers: {'API-KEY': API_KEY_VALID},
      responseType: 'text'
    }).subscribe(
      {next: (data) => console.log(data),
        error: (err: HttpErrorResponse) => {
          // Use alert() to show the error message from the response body
          if (err && err.error) {
            alert(err.error);
          } else {
            // Fallback message if the error structure is unexpected
            alert('An unknown error occurred during login.');
            console.error('Login error:', err); // Log the full error for debugging
          }
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
