import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { environment } from '../../../environments/environment';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-register-me',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './register-me.component.html',
  styleUrls: ['./register-me.component.css']
})
export class RegisterMeComponent implements OnInit {
  private httpClient = inject(HttpClient);
  private destroyRef = inject(DestroyRef);
  private popupService = inject(PopupService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  token: string = '';
  ap: string = '';
  showPassword: boolean = false;

  // Validation errors
  errors = {
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  };

  ngOnInit() {
    // Get token and ap from URL parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.ap = params['ap'] || '';

      if (!this.token) {
        this.popupService.showPopup('Token is missing. Please use a valid registration link.');
      }
    });
  }

  // Validate the form
  validateForm(): boolean {
    let isValid = true;
    this.resetErrors();

    // Validate Email (required, valid email format)
    if (!this.email) {
      this.errors.email = 'Email is required';
      isValid = false;
    } else if (!this.validateEmail(this.email)) {
      this.errors.email = 'Please enter a valid email address';
      isValid = false;
    }

    // Validate Username (required)
    if (!this.username) {
      this.errors.username = 'Username is required';
      isValid = false;
    }

    // Validate Password (required)
    if (!this.password) {
      this.errors.password = 'Password is required';
      isValid = false;
    }

    // Validate Confirm Password (required, must match password)
    if (!this.confirmPassword) {
      this.errors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (this.password !== this.confirmPassword) {
      this.errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    return isValid;
  }

  resetErrors(): void {
    this.errors = {
      email: '',
      username: '',
      password: '',
      confirmPassword: ''
    };
  }

  resetForm(): void {
    this.email = '';
    this.username = '';
    this.password = '';
    this.confirmPassword = '';
    this.resetErrors();
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    if (!this.token) {
      this.popupService.showPopup('Token is missing. Please use a valid registration link.');
      return;
    }

    // Prepare the request body
    const requestBody = {
      email: this.email,
      username: this.username,
      password: this.password,
      token: this.token,
      apartmentId: this.ap
    };

    // Make the HTTP POST request to register the user
    const registerRequest = this.httpClient.post(`${environment.apiBaseUrl}/register`, requestBody, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Registration successful:', response);

        // Show success message
        this.popupService.showPopup('Registration successful! You can now log in.');

        // Reset the form
        this.resetForm();

        // Navigate to login page after a short delay to ensure popup is shown
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (error: HttpErrorResponse) => {
        console.error('Registration error:', error);

        // Show error message
        if (error.status === 409) {
          // Handle conflict (username already taken)
          this.popupService.showPopup('The username is already taken, please choose another one.');
        } else if (error.error && typeof error.error === 'string') {
          this.popupService.showPopup(error.error);
        } else {
          this.popupService.showPopup('An error occurred during registration. Please try again.');
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      registerRequest.unsubscribe();
      console.log('Destroying register-me component');
    });
  }

  // Helper method to validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  // Toggle password visibility
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
