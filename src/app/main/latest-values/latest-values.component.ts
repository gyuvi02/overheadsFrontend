import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { API_KEY_VALID } from '../../core/constants';
import { PopupService } from '../../shared/popup/popup.service';

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

  ngOnInit() {
    // Subscribe to meter values from auth service
    this.authService.meterValues$.subscribe(values => {
      // Update meter types based on available values
      this.meterTypes = Object.keys(values);
    });
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

    // Make the HTTP GET request with JSON body
    this.httpClient.request('POST', `http://localhost:8080/api/v1/user/getLastMeterValues`, {
      headers: {
        'API-KEY': API_KEY_VALID,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        apartmentId: apartmentId,
        meterType: this.selectedMeterType.split(' ')[0].toLowerCase()
      })
    }).subscribe({
      next: (response) => {
        console.log('Request successful:', response);
        this.popupService.showPopup(`Latest meter values for ${this.selectedMeterType}:\n\n${JSON.stringify(response, null, 2)}`);
      },
      error: (error) => {
        console.error('Request error:', error);
        this.popupService.showPopup('An error occurred while fetching the latest meter values. Please try again.');
      }
    });
  }
}
