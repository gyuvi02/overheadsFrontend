import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import {environment} from '../../../environments/environment';

// Interface for Apartment
export interface Apartment {
  id: number;
  city: string;
  zip: string;
  street: string;
  gasMeterID: string;
  electricityMeterID: string;
  waterMeterID: string;
}

@Component({
  selector: 'app-edit-apartment',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './edit-apartment.component.html',
  styleUrls: ['./edit-apartment.component.css']
})
export class EditApartmentComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;
  selectedApartment: Apartment | null = null;
  originalApartment: Apartment | null = null;

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

  onSubmit() {
    if (!this.selectedApartmentId) {
      this.popupService.showPopup('Please select an apartment');
      return;
    }

    console.log('Selected apartment ID:', this.selectedApartmentId);

    // Find the selected apartment in the apartments array
    this.selectedApartment = this.apartments.find((apartment) => apartment.id === Number(this.selectedApartmentId)) || null;

    if (!this.selectedApartment) {
      this.popupService.showPopup('Selected apartment not found');
      return;
    }

    // Store a deep copy of the original apartment for comparison later
    this.originalApartment = JSON.parse(JSON.stringify(this.selectedApartment));

    console.log('Selected apartment:', this.selectedApartment);
  }

  onSaveChanges() {
    if (!this.selectedApartment || !this.originalApartment) {
      this.popupService.showPopup('No apartment selected');
      return;
    }

    console.log('Checking for changes to apartment:', this.selectedApartment);

    // Check if any data was modified by comparing with original apartment
    const isModified =
      this.selectedApartment.city !== this.originalApartment.city ||
      this.selectedApartment.zip !== this.originalApartment.zip ||
      this.selectedApartment.street !== this.originalApartment.street ||
      this.selectedApartment.gasMeterID !== this.originalApartment.gasMeterID ||
      this.selectedApartment.electricityMeterID !== this.originalApartment.electricityMeterID ||
      this.selectedApartment.waterMeterID !== this.originalApartment.waterMeterID;

    if (!isModified) {
      this.popupService.showPopup('No data was modified, nothing to save');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP POST request to save the apartment changes
    this.httpClient.post(`${environment.apiBaseUrl}/admin/editApartment`, this.selectedApartment, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Apartment updated successfully:', response);

        // Delete the apartment list from sessionStorage
        sessionStorage.removeItem('apartments');

        // Show success message
        this.popupService.showPopup('Apartment updated successfully');

        // Reset the component state and reload
        this.selectedApartmentId = null;
        this.selectedApartment = null;
        this.originalApartment = null;
        this.componentDisplayService.setActiveComponent(DisplayComponent.EDIT_APARTMENT);
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

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }
}
