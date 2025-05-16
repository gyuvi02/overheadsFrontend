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
  selector: 'app-get-admin-data',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './get-admin-data.component.html',
  styleUrls: ['./get-admin-data.component.css']
})
export class GetAdminDataComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;
  selectedApartment: Apartment | null = null;

  // Store meter values and images
  meterData: { [key: string]: any } = {};

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

    console.log('Selected apartment:', this.selectedApartment);

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Call the getAllLastMeterValues endpoint with the apartment ID and withImage=1
    this.httpClient.post(`${environment.apiBaseUrl}/admin/getAllLastMeterValues`,
      {
        apartmentId: this.selectedApartment.id.toString(),
        withImage: "1"
      },
      {
        headers: {
          'API-KEY': environment.apiKeyValid,
          'Authorization': `Bearer ${token}`
        }
      }).subscribe({
        next: (response: any) => {
          console.log('Last meter values fetched successfully:', response);
          this.meterData = response as { [key: string]: any };
        },
        error: (error) => {
          if (error.status === 401) {
            this.popupService.showPopup('Session expired, please, log in again');
            this.authService.logout();
          } else {
            console.error('Error fetching last meter values:', error);
            this.popupService.showPopup('An error occurred while fetching last meter values. Please try again.');
          }
        }
      });
  }

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }

  // Helper method to get meter type keys
  getMeterTypes(): string[] {
    return Object.keys(this.meterData).filter(key => !key.endsWith('_image'));
  }

  // Helper method to check if a meter type has an image
  hasImage(meterType: string): boolean {
    return this.meterData[`${meterType}_image`] !== undefined;
  }

  // Helper method to download an image
  downloadImage(meterType: string): void {
    if (!this.hasImage(meterType)) {
      return;
    }

    const imageData = this.meterData[`${meterType}_image`];
    const byteCharacters = atob(imageData);
    const byteNumbers = new Array(byteCharacters.length);

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }

    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `${meterType}_image.jpg`;
    link.click();
  }
}
