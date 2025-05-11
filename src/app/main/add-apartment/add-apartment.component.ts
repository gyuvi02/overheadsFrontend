import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { API_KEY_VALID } from '../../core/constants';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';

@Component({
  selector: 'app-add-apartment',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './add-apartment.component.html',
  styleUrls: ['./add-apartment.component.css']
})
export class AddApartmentComponent {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  // Form data
  apartment = {
    city: '',
    zip: '',
    street: '',
    gasMeterID: '',
    electricityMeterID: '',
    waterMeterID: ''
  };

  // Validation errors
  errors = {
    city: '',
    zip: '',
    street: '',
    gasMeterID: '',
    electricityMeterID: '',
    waterMeterID: ''
  };

  // Validate the form
  validateForm(): boolean {
    let isValid = true;
    this.resetErrors();

    // Validate City (required, max 15 chars)
    if (!this.apartment.city) {
      this.errors.city = 'City is required';
      isValid = false;
    } else if (this.apartment.city.length > 15) {
      this.errors.city = 'City cannot exceed 15 characters';
      isValid = false;
    }

    // Validate ZIP (required, 4 numeric chars)
    if (!this.apartment.zip) {
      this.errors.zip = 'ZIP is required';
      isValid = false;
    } else if (!/^\d{4}$/.test(this.apartment.zip)) {
      this.errors.zip = 'ZIP must be exactly 4 numeric characters';
      isValid = false;
    }

    // Validate Street (required)
    if (!this.apartment.street) {
      this.errors.street = 'Street is required';
      isValid = false;
    }

    // Validate Gas Meter ID (required)
    if (!this.apartment.gasMeterID) {
      this.errors.gasMeterID = 'Gas Meter ID is required';
      isValid = false;
    }

    // Validate Electricity Meter ID (required)
    if (!this.apartment.electricityMeterID) {
      this.errors.electricityMeterID = 'Electricity Meter ID is required';
      isValid = false;
    }

    // Validate Water Meter ID (required)
    if (!this.apartment.waterMeterID) {
      this.errors.waterMeterID = 'Water Meter ID is required';
      isValid = false;
    }

    return isValid;
  }

  resetErrors(): void {
    this.errors = {
      city: '',
      zip: '',
      street: '',
      gasMeterID: '',
      electricityMeterID: '',
      waterMeterID: ''
    };
  }

  resetForm(): void {
    this.apartment = {
      city: '',
      zip: '',
      street: '',
      gasMeterID: '',
      electricityMeterID: '',
      waterMeterID: ''
    };
    this.resetErrors();
  }

  onSubmit(): void {
    if (!this.validateForm()) {
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP POST request to add the apartment
    this.httpClient.post('http://localhost:8080/api/v1/admin/addApartment', this.apartment, {
      headers: {
        'API-KEY': API_KEY_VALID,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Apartment added successfully:', response);

        // Show success message
        this.popupService.showPopup('Apartment added successfully');

        // Reset the form
        this.resetForm();
      },
      error: (error) => {
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error adding apartment:', error);
          this.popupService.showPopup('An error occurred while adding the apartment. Please try again.');
        }
      }
    });
  }
}
