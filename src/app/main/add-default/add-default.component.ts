import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { API_KEY_VALID } from '../../core/constants';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import { Apartment } from '../edit-apartment/edit-apartment.component';

@Component({
  selector: 'app-add-default',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './add-default.component.html',
  styleUrls: ['./add-default.component.css']
})
export class AddDefaultComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;
  selectedApartment: Apartment | null = null;

  // Meter checkboxes
  gasChecked = false;
  electricityChecked = false;
  waterChecked = false;

  // Meter status (read-only if already exists)
  gasReadOnly = false;
  electricityReadOnly = false;
  waterReadOnly = false;

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
    this.httpClient.get('http://localhost:8080/api/v1/admin/getAllApartments', {
      headers: {
        'API-KEY': API_KEY_VALID,
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

    // Call the getAllLastMeterValues endpoint with the apartment ID
    this.httpClient.post('http://localhost:8080/api/v1/admin/getAllLastMeterValues',
      {
        apartmentId: this.selectedApartment.id.toString(),
        withImage: "0"
      },
      {
        headers: {
          'API-KEY': API_KEY_VALID,
          'Authorization': `Bearer ${token}`
        }
      }).subscribe({
        next: (response: any) => {
          console.log('Last meter values fetched successfully:', response);

          // Use the returned HashMap to set the readOnly flags
          const meterValues = response as {[key: string]: number};

          // Check if meters already exist for the selected apartment ID and set read-only status
          this.gasReadOnly = meterValues['gas'] !== undefined;
          this.electricityReadOnly = meterValues['electricity'] !== undefined;
          this.waterReadOnly = meterValues['water'] !== undefined;

          // Set checkbox values based on existing meters
          this.gasChecked = this.gasReadOnly;
          this.electricityChecked = this.electricityReadOnly;
          this.waterChecked = this.waterReadOnly;
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

  onSaveDefaults() {
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

    // Check if any new meter types were selected
    const selectedMeters = [];
    if (this.gasChecked && !this.gasReadOnly) {
      selectedMeters.push('gas');
    }
    if (this.electricityChecked && !this.electricityReadOnly) {
      selectedMeters.push('electricity');
    }
    if (this.waterChecked && !this.waterReadOnly) {
      selectedMeters.push('water');
    }

    if (selectedMeters.length === 0) {
      this.popupService.showPopup('No new meter types selected');
      return;
    }

    // Submit each selected meter type
    let completedRequests = 0;
    let failedRequests = 0;

    selectedMeters.forEach(meterType => {
      // Prepare the form data
      const formData = new FormData();

      // Add meterType parameter
      formData.append('meterType', meterType);

      // Add values parameter as a map
      const values = {
        apartmentId: this.selectedApartment!.id.toString() ,
        meterValue: "0"
      };

      console.log('Values:', values);
      formData.append('values', JSON.stringify(values));

      // Make the HTTP POST request
      this.httpClient.post('http://localhost:8080/api/v1/user/submitMeterValue', formData, {
        headers: {
          'API-KEY': API_KEY_VALID,
          'Authorization': `Bearer ${token}`
        },
        responseType: 'text'
      }).subscribe({
        next: (response) => {
          console.log(`${meterType} meter default set successfully:`, response);
          completedRequests++;

          // Check if all requests are completed
          if (completedRequests + failedRequests === selectedMeters.length) {
            this.handleAllRequestsCompleted(completedRequests, failedRequests);
          }
        },
        error: (error) => {
          console.error('Request error:', error);
          failedRequests++;
          if (error.status === 401) {
            this.popupService.showPopup('Session expired, please, log in again');
            this.authService.logout();
          } else {
            this.popupService.showPopup('An error occurred while fetching meter types. Please, try again');
            // Check if all requests are completed
            if (completedRequests + failedRequests === selectedMeters.length) {
              this.handleAllRequestsCompleted(completedRequests, failedRequests);
            }
          }
        }
      });
    });
  }

  private handleAllRequestsCompleted(completedRequests: number, failedRequests: number) {
    if (failedRequests === 0) {
      this.popupService.showPopup('Default meters set successfully');
      this.resetForm();
    } else if (completedRequests === 0) {
      this.popupService.showPopup('Failed to set default meters');
    } else {
      this.popupService.showPopup(`Partially successful: ${completedRequests} meter(s) set, ${failedRequests} failed`);
      this.resetForm();
    }
  }

  private resetForm() {
    this.selectedApartmentId = null;
    this.selectedApartment = null;
    this.gasChecked = false;
    this.electricityChecked = false;
    this.waterChecked = false;
    this.gasReadOnly = false;
    this.electricityReadOnly = false;
    this.waterReadOnly = false;
  }

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }
}
