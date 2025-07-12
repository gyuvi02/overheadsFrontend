import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import {environment} from '../../../environments/environment';

// Interface for meter values
interface MeterValue {
  date: string;
  value: string;
}

@Component({
  selector: 'app-latest-values',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './latest-values.component.html',
  styleUrls: ['./latest-values.component.css']
})
export class LatestValuesComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  // Will be populated based on available meter data
  meterTypes: string[] = [];
  selectedMeterType = '';

  // Properties for the table
  meterValues: MeterValue[] = [];
  showTable = false;

  // Translation mapping
  meterTypeLabels: { [key: string]: string } = {
    'Gas meter': $localize`:@@gasMeter:Gas meter`,
    'Electricity meter': $localize`:@@electricityMeter:Electricity meter`,
    'Water meter': $localize`:@@waterMeter:Water meter`,
    'Heating meter': $localize`:@@heatingMeter:Water meter`
  };


  ngOnInit() {
    // Subscribe to meter values from auth service
    this.authService.meterValues$.subscribe(values => {
      // Update meter types based on available values
      this.meterTypes = Object.keys(values);
    });
  }

  getTranslatedMeterType(type: string): string {
    return this.meterTypeLabels[type] || type;
  }

  onSubmit() {
    if (!this.selectedMeterType) {
      this.popupService.showPopup('Please select a meter type');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Get the apartment ID from the auth service
    const apartmentId = this.authService.apartmentData?.id;
    if (!apartmentId) {
      this.popupService.showPopup('Apartment data not found. Please log in again.');
      return;
    }

    // Make the HTTP POST request with JSON body
    this.httpClient.post(`${environment.apiBaseUrl}/user/getLastMeterValues`,
      {
        "apartmentId": apartmentId,
        "meterType": this.selectedMeterType.split(' ')[0].toLowerCase()
      },
      {
        headers: {
          'API-KEY': environment.apiKeyValid,
          'Authorization': `Bearer ${token}`
        }
      }
    ).subscribe({
      next: (response: any) => {
        console.log('Request successful:', response);

        // Check if response contains data
        if (response && typeof response === 'object') {
          // Clear previous values
          this.meterValues = [];

          // Process the Map<String,String> object
          // Iterate through the keys (dates) in the response object
          Object.keys(response).forEach(dateStr => {
            // Format date as YYYY.MM.DD
            try {
              const date = new Date(dateStr);
              const formattedDate = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;

              // Add to meterValues array
              this.meterValues.push({
                date: formattedDate,
                value: response[dateStr]
              });
            } catch (e) {
              console.error('Error parsing date:', dateStr, e);
            }
          });

          // Sort by date (newest first)
          this.meterValues.sort((a, b) => {
            return new Date(b.date.replace(/\./g, '-')).getTime() - new Date(a.date.replace(/\./g, '-')).getTime();
          });

          // Show the table if we have values
          this.showTable = this.meterValues.length > 0;

          // Show popup if no values
          if (this.meterValues.length === 0) {
            this.popupService.showPopup("No meter value found in the database");
          }
        } else {
          // No data in response, show popup message
          this.popupService.showPopup("No meter value found in the database");
          this.showTable = false;
        }
      },
      error: (error) => {
        console.error('Request error:', error);
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          this.popupService.showPopup('An error occurred while fetching the latest meter values. Please, try again');
        }
        this.showTable = false;
      }
    });
  }
}
