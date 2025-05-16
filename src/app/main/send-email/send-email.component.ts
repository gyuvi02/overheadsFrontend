import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import { Apartment } from '../edit-apartment/edit-apartment.component';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-send-email',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './send-email.component.html',
  styleUrls: ['./send-email.component.css']
})
export class SendEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;
  selectedApartment: Apartment | null = null;
  email: string = '';

  ngOnInit() {
    // Check if apartments are already in sessionStorage
    const apartmentsJson = sessionStorage.getItem('apartments');
    if (apartmentsJson) {
      this.apartments = JSON.parse(apartmentsJson);
    } else if (this.authService.isAdmin) {
      // If not in sessionStorage and user is admin, fetch them
      this.fetchAllApartments();
    }
  }

  fetchAllApartments() {
    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP GET request to fetch all apartments
    this.httpClient.get(`${environment.apiBaseUrl}/admin/getAllApartments`, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Apartments fetched successfully:', response);
        this.apartments = response as Apartment[];

        // Store apartments in sessionStorage
        sessionStorage.setItem('apartments', JSON.stringify(this.apartments));
      },
      error: (error) => {
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error fetching apartments:', error);
          this.popupService.showPopup('An error occurred while fetching apartments. Please try again.');
        }
      }
    });
  }

  onApartmentSelect() {
    if (!this.selectedApartmentId) {
      this.selectedApartment = null;
      return;
    }

    console.log('Selected apartment ID:', this.selectedApartmentId);

    // Find the selected apartment in the apartments array
    this.selectedApartment = this.apartments.find((apartment) => apartment.id === Number(this.selectedApartmentId)) || null;

    if (!this.selectedApartment) {
      this.popupService.showPopup('Selected apartment not found');
      return;
    }

    console.log('Selected apartment:', this.selectedApartment);
  }

  onSubmit() {
    if (!this.selectedApartment) {
      this.popupService.showPopup('Please select an apartment');
      return;
    }

    if (!this.email || !this.validateEmail(this.email)) {
      this.popupService.showPopup('Please enter a valid email address');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Prepare the request body
    const requestBody = {
      apartment: this.selectedApartment.id.toString(),
      email: this.email
    };

    // Make the HTTP POST request to send the email
    this.httpClient.post(`${environment.apiBaseUrl}/admin/sendEmail`, requestBody, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Email sent successfully:', response);

        // Show success message
        this.popupService.showPopup('Email sent successfully');

        // Reset the form
        this.resetForm();
      },
      error: (error) => {
        console.error('Request error:', error);
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          this.popupService.showPopup('An error occurred while sending the email. Please, try again');
        }
      }
    });
  }

  resetForm() {
    this.selectedApartmentId = null;
    this.selectedApartment = null;
    this.email = '';
  }

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }

  // Helper method to validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }
}
