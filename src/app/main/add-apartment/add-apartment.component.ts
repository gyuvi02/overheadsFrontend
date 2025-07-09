import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-add-apartment',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './add-apartment.component.html',
  styleUrls: ['./add-apartment.component.css']
})
export class AddApartmentComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  ngOnInit() {
    // No need to fetch apartments on init for this component
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

        // Store apartments in sessionStorage
        sessionStorage.setItem('apartments', JSON.stringify(response));
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

  // Form data
  apartment = {
    city: '',
    zip: '',
    street: '',
    gasMeterID: '',
    electricityMeterID: '',
    waterMeterID: '',
    heatingMeterID: '',
    deadline: null as number | null,
    language: '',
    rent: null as number | null,
    maintenanceFee: null as number | null,
    gasUnitPrice: 0,
    electricityUnitPrice: 0,
    waterUnitPrice: 0,
    heatingUnitPrice: 0
  };

  // Validation errors
  errors = {
    city: '',
    zip: '',
    street: '',
    gasMeterID: '',
    electricityMeterID: '',
    waterMeterID: '',
    heatingMeterID: '',
    deadline: '',
    language: '',
    rent: '',
    maintenanceFee: '',
    gasUnitPrice: '',
    electricityUnitPrice: '',
    waterUnitPrice: '',
    heatingUnitPrice: ''
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

    // Validate Heating Meter ID (required)
    if (!this.apartment.heatingMeterID) {
      this.errors.heatingMeterID = 'Heating Meter ID is required';
      isValid = false;
    }

    // Validate Deadline (required, integer between 1 and 31)
    if (this.apartment.deadline === null || this.apartment.deadline === undefined) {
      this.errors.deadline = 'Deadline is required';
      isValid = false;
    } else if (!Number.isInteger(this.apartment.deadline) || this.apartment.deadline < 1 || this.apartment.deadline > 31) {
      this.errors.deadline = 'Deadline must be an integer between 1 and 31';
      isValid = false;
    }

    // Validate language (required)
    if (!this.apartment.language) {
      this.errors.language = 'Language is required';
      isValid = false;
    } else if (this.apartment.language !== 'e' && this.apartment.language !== 'h') {
      this.errors.language = 'The language value must be "e" or "h"';
      isValid = false;
    }

    // Validate rent
    if (this.apartment.rent === null) {
      this.errors.rent = 'Rent is required';
      isValid = false;
    } else if (this.apartment.rent < 0 || this.apartment.rent > 2000000 || !Number.isInteger(this.apartment.rent)) {
      this.errors.rent = 'Rent must be a whole number between 0 and 2000000';
      isValid = false;
    }

    // Validate maintenanceFee
    if (this.apartment.maintenanceFee !== null) {
      if (!Number.isInteger(this.apartment.maintenanceFee) || this.apartment.maintenanceFee < 0 || this.apartment.maintenanceFee > 300000) {
        this.errors.maintenanceFee = 'Maintenance Fee must be a whole number between 0 and 300000';
        isValid = false;
      }
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
      waterMeterID: '',
      heatingMeterID: '',
      deadline: '',
      language: '',
      rent: '',
      maintenanceFee: '',
      gasUnitPrice: '',
      electricityUnitPrice: '',
      waterUnitPrice: '',
      heatingUnitPrice: ''
    };
  }

  resetForm(): void {
    this.apartment = {
      city: '',
      zip: '',
      street: '',
      gasMeterID: '',
      electricityMeterID: '',
      waterMeterID: '',
      heatingMeterID: '',
      deadline: null,
      language: '',
      rent: null,
      maintenanceFee: null,
      gasUnitPrice: 0,
      electricityUnitPrice: 0,
      waterUnitPrice: 0,
      heatingUnitPrice: 0
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
    // Convert unit prices from decimal to integer (multiply by 100)
    const apartmentToSend = {
      ...this.apartment,
      gasUnitPrice: Math.round(this.apartment.gasUnitPrice * 100),
      electricityUnitPrice: Math.round(this.apartment.electricityUnitPrice * 100),
      waterUnitPrice: Math.round(this.apartment.waterUnitPrice * 100),
      heatingUnitPrice: Math.round(this.apartment.heatingUnitPrice * 100)
    };

    this.httpClient.post(`${environment.apiBaseUrl}/admin/addApartment`, apartmentToSend, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Apartment added successfully:', response);

        // Delete the apartment list from sessionStorage
        sessionStorage.removeItem('apartments');

        // Show success message
        this.popupService.showPopup('Apartment added successfully');

        // Reset the form
        this.resetForm();

        // Fetch updated apartment list
        this.fetchAllApartments();
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

  // Getter and setter for gasUnitPrice display (in decimal form)
  get gasUnitPriceDisplay(): number {
    return this.apartment.gasUnitPrice / 100;
  }

  set gasUnitPriceDisplay(value: number) {
    this.apartment.gasUnitPrice = Math.round(value * 100);
  }

  // Getter and setter for electricityUnitPrice display (in decimal form)
  get electricityUnitPriceDisplay(): number {
    return this.apartment.electricityUnitPrice / 100;
  }

  set electricityUnitPriceDisplay(value: number) {
    this.apartment.electricityUnitPrice = Math.round(value * 100);
  }

  // Getter and setter for waterUnitPrice display (in decimal form)
  get waterUnitPriceDisplay(): number {
    return this.apartment.waterUnitPrice / 100;
  }

  set waterUnitPriceDisplay(value: number) {
    this.apartment.waterUnitPrice = Math.round(value * 100);
  }

  // Getter and setter for heatingUnitPrice display (in decimal form)
  get heatingUnitPriceDisplay(): number {
    return this.apartment.heatingUnitPrice / 100;
  }

  set heatingUnitPriceDisplay(value: number) {
    this.apartment.heatingUnitPrice = Math.round(value * 100);
  }

}
