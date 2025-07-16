import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PopupService } from '../../shared/popup/popup.service';
import { environment } from '../../../environments/environment';

// Interface for Apartment
export interface Apartment {
  id: number;
  city: string;
  zip: string;
  street: string;
  gasMeterID: string;
  electricityMeterID: string;
  waterMeterID: string;
  heatingMeterID: string;
  deadline: number; // Added deadline property
  language: string;
  rent: number | null;
  maintenanceFee: number | null;
  gasUnitPrice: number;
  electricityUnitPrice: number;
  waterUnitPrice: number;
}

@Component({
  selector: 'app-new-meter',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './new-meter.component.html',
  styleUrls: ['./new-meter.component.css']
})
export class NewMeterComponent {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private popupService = inject(PopupService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  // Flag to control when to show the meter type field
  apartmentSubmitted = false;
  meterTypeSubmitted = false;
  // selectedMeterType = ""

  // Apartment selection
  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;
  selectedApartment: Apartment | null = null;

  // Will be populated based on available meter data
  meterTypes: string[] = [];
  selectedMeterType = '';
  // Store actual meter values from login response
  actualMeterValues: {[key: string]: string} = {};

  // Private property to store the last meter value
  private _lastMeterValue: string = '';

   ngOnInit() {
    // Load apartments from sessionStorage
    const apartmentsJson = sessionStorage.getItem('apartments');
    if (apartmentsJson) {
      this.apartments = JSON.parse(apartmentsJson);
    } else if (this.authService.isAdmin) {
      // If not in sessionStorage and user is admin, fetch them
      this.fetchAllApartments();
    }
  }

    // Method to handle apartment selection submission
    onSubmitApartment() {
      if (!this.selectedApartmentId) {
        this.popupService.showPopup('Please select an apartment');
        return;
      }

      this.selectedApartment = this.apartments.find((apartment) => apartment.id === Number(this.selectedApartmentId)) || null;

      if (this.selectedApartment === null) {
        this.popupService.showPopup('Selected apartment not found');
        return;
      }
      // Get the token from sessionStorage
      const token = sessionStorage.getItem('token');
      if (!token) {
        this.popupService.showPopup('Authentication token not found. Please log in again.');
        return;
      }

      // Reset meter type before fetching new meter types
      this.selectedMeterType = '';

      // Fetch meter types for the selected apartment
      this.fetchMeterTypesForApartment(this.selectedApartmentId, token);

    }

  onSaveChanges() {


    if (!this.selectedApartment ) {
      this.popupService.showPopup('No apartment selected');
      return;
    }

    if (!this.selectedMeterType ) {
      this.popupService.showPopup('No meter type selected');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Convert unit prices from decimal to integer (multiply by 100)
    const apartmentToSend = {
      ...this.selectedApartment,
    };

    // Make the HTTP POST request to save the apartment changes
    this.httpClient.post(`${environment.apiBaseUrl}/admin/editApartment?meterType=${this.selectedMeterType.split(' ')[0].toLowerCase()}&lastMeterValue=${this._lastMeterValue}`, apartmentToSend, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Last meter value submitted: ', this.selectedApartment);
        console.log('New meter device registered successfully:', response);

        // Delete the apartment list from sessionStorage
        sessionStorage.removeItem('apartments');

        // Show success message
        this.popupService.showPopup('New meter device registered successfully!');

        // Reset the form
        this.resetForm();

        // Reset the component state and reload
        this.selectedApartmentId = null;
        this.selectedApartment = null;
        // this.originalApartment = null;
        // this.componentDisplayService.setActiveComponent(DisplayComponent.EDIT_APARTMENT);
      },
      error: (error) => {
        console.error('Request error:', error);
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          this.popupService.showPopup('An error occurred while editing apartment data. Please, try again');
        }
      }
    });
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

  // Fetch meter types for a specific apartment
  fetchMeterTypesForApartment(apartmentId: number, token: string) {
    // Find the selected apartment in the apartments array
    const selectedApartment = this.apartments.find((apartment) => apartment.id === Number(apartmentId));

    if (!selectedApartment) {
      this.popupService.showPopup('Selected apartment not found');
      return;
    }

    // Call the getAllLastMeterValues endpoint with the apartment ID
    this.httpClient.post(`${environment.apiBaseUrl}/admin/getAllLastMeterValues`,
      {
        apartmentId: apartmentId.toString(),
        withImage: "0"  // We don't need images for this
      },
      {
        headers: {
          'API-KEY': environment.apiKeyValid,
          'Authorization': `Bearer ${token}`
        }
      }).subscribe({
      next: (response: any) => {
        console.log('Last meter values fetched successfully:', response);

        // Store the meter data
        this.actualMeterValues = response as { [key: string]: string };

        // Extract meter types (keys that don't end with '_image')
        this.meterTypes = Object.keys(this.actualMeterValues).filter(key => !key.endsWith('_image'));

        // Set apartmentSubmitted to true to show the other fields
        this.apartmentSubmitted = true;

        // Reset other form fields
        this.selectedMeterType = '';

      },
      error: (error) => {
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error fetching meter types:', error);
          this.popupService.showPopup('An error occurred while fetching meter types. Please try again.');
        }
      }
    });
  }

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }

  private resetForm() {
    this.selectedApartmentId = null;
    this.selectedMeterType = '';
    this.apartmentSubmitted = false;  // Reset the apartmentSubmitted flag
  }

  onMeterTypeChange() {
    this.meterTypeSubmitted = !!this.selectedMeterType; // true if selectedMeterType is not empty
  }

  get currentMeterID(): string {
    if (!this.selectedApartment) return '';

    switch (this.selectedMeterType) {
      case 'gas':
        return this.selectedApartment.gasMeterID;
      case 'electricity':
        return this.selectedApartment.electricityMeterID;
      case 'water':
        return this.selectedApartment.waterMeterID;
      case 'heating':
        return this.selectedApartment.heatingMeterID;
      default:
        return '';
    }
  }

  set currentMeterID(value: string) {
    if (!this.selectedApartment) return;

    switch (this.selectedMeterType) {
      case 'gas':
        this.selectedApartment.gasMeterID = value;
        break;
      case 'electricity':
        this.selectedApartment.electricityMeterID = value;
        break;
      case 'water':
        this.selectedApartment.waterMeterID = value;
        break;
      case 'heating':
        this.selectedApartment.heatingMeterID = value;
        break;
    }
  }

  get lastMeterValue(): string {
    return this._lastMeterValue;
  }

  set lastMeterValue(value: string) {
    this._lastMeterValue = value;
  }

}
