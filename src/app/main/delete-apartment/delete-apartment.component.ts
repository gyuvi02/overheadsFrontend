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
  selector: 'app-delete-apartment',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './delete-apartment.component.html',
  styleUrls: ['./delete-apartment.component.css']
})
export class DeleteApartmentComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;
  selectedApartment: Apartment | null = null;
  showConfirmation: boolean = false;

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

  onDeleteClick() {
    if (!this.selectedApartment) {
      this.popupService.showPopup('No apartment selected');
      return;
    }

    // Show confirmation dialog
    this.showConfirmation = true;
  }

  onConfirmDelete() {
    if (!this.selectedApartment) {
      this.popupService.showPopup('No apartment selected');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP POST request to delete the apartment
    this.httpClient.post(`${environment.apiBaseUrl}/admin/deleteApartment`, this.selectedApartment.id.toString(), {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Apartment deleted successfully:', response);

        // Delete the apartment list from sessionStorage
        sessionStorage.removeItem('apartments');

        // Show success message
        this.popupService.showPopup('Apartment deleted successfully');

        // Reset the component state
        this.selectedApartmentId = null;
        this.selectedApartment = null;
        this.showConfirmation = false;

        // Fetch updated apartment list and reload component
        this.fetchAllApartments();
        this.componentDisplayService.setActiveComponent(DisplayComponent.DELETE_APARTMENT);
      },
      error: (error) => {
        console.error('Request error:', error);
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          this.popupService.showPopup('An error occurred while deleting apartment. Please, try again');
        }
      }
    });
  }

  onCancelDelete() {
    this.showConfirmation = false;
  }

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }
}
