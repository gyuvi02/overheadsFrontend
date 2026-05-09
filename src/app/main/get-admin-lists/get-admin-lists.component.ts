import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import { Apartment } from '../edit-apartment/edit-apartment.component';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'app-get-admin-lists',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './get-admin-lists.component.html',
  styleUrls: ['./get-admin-lists.component.css']
})
export class GetAdminListsComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;

  // Meter types
  meterTypes: string[] = ['Gas', 'Electricity', 'Water', 'Heating'];
  selectedMeterType: string = '';

  // Response data
  meterValues: {[key: string]: {date: string, value: string, image: string | null}} = {};
  tableData: {date: string, value: string, image: string | null}[] = [];
  isDataLoaded: boolean = false;
  lastLoadedMeterType: string = '';

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

    if (!this.selectedMeterType) {
      this.popupService.showPopup('Please select a meter type');
      return;
    }

    console.log('Selected apartment ID:', this.selectedApartmentId);
    console.log('Selected meter type:', this.selectedMeterType);

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Prepare the request body
    const requestBody = {
      apartmentId: this.selectedApartmentId.toString(),
      meterType: this.selectedMeterType.toLowerCase()
    };

    // Call the getLastMeterValues endpoint
    this.httpClient.post(`${environment.apiBaseUrl}/admin/getLastMeterValues`, requestBody, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Meter values fetched successfully:', response);
        this.meterValues = response;
        this.tableData = [];

        // Convert the Map<String, Map<String, Object>> to an array of objects for the table
        for (const key in this.meterValues) {
          if (this.meterValues.hasOwnProperty(key)) {
            const item = this.meterValues[key];
            this.tableData.push({
              date: item.date,
              value: item.value,
              image: item.image
            });
          }
        }

        // Store the meter type that was used for this data load
        this.lastLoadedMeterType = this.selectedMeterType;
        this.isDataLoaded = true;
      },
      error: (error) => {
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error fetching meter values:', error);
          this.popupService.showPopup('An error occurred while fetching meter values. Please try again.');
        }
      }
    });
  }

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }

  // Helper method to check if a meter type has an image
  hasImage(meterType: string): boolean {
    return this.meterValues[meterType]?.image !== undefined && this.meterValues[meterType]?.image !== null;
  }

  // Helper method to download an image
  downloadImage(imageData: string): void {
    if (!imageData) {
      console.error('No image data provided');
      this.popupService.showPopup('No image data available for download.');
      return;
    }

    try {
      // Check if imageData is a valid string
      if (typeof imageData !== 'string' || imageData.trim() === '') {
        console.error('Invalid image data');
        this.popupService.showPopup('Invalid image data. Cannot download.');
        return;
      }

      const byteCharacters = atob(imageData);
      const byteNumbers = new Array(byteCharacters.length);

      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/jpeg' });

      const link = document.createElement('a');
      const objectUrl = window.URL.createObjectURL(blob);
      link.href = objectUrl;
      link.download = `${this.lastLoadedMeterType.toLowerCase()}_image.jpg`;
      link.click();

      // Clean up by revoking the object URL to prevent memory leaks
      setTimeout(() => {
        window.URL.revokeObjectURL(objectUrl);
      }, 100);
    } catch (error) {
      console.error('Error downloading image:', error);
      this.popupService.showPopup('An error occurred while downloading the image. Please try again.');
    }
  }

}
