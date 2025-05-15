import { Injectable, inject } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ComponentDisplayService, DisplayComponent } from './component-display.service';
import { HttpClient } from '@angular/common/http';
import { Apartment } from '../main/edit-apartment/edit-apartment.component';
import { Router } from '@angular/router';
import {environment} from '../../environments/environment';

export interface ApartmentData {
  zip: string;
  electricityMeterID: string;
  city: string;
  street: string;
  gasMeterID: string;
  waterMeterID: string;
  id: string;
}

export interface LoginResponse {
  message: string;
  apartment: ApartmentData;
  actualGas?: string;
  token: string;
  actualElectricity?: string;
  actualWater?: string;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private componentDisplayService = inject(ComponentDisplayService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private apartmentDataSubject = new BehaviorSubject<ApartmentData | null>(null);
  apartmentData$ = this.apartmentDataSubject.asObservable();

  private meterValuesSubject = new BehaviorSubject<{[key: string]: string}>({});
  meterValues$ = this.meterValuesSubject.asObservable();

  login(loginResponse: LoginResponse) {
    // Store token in sessionStorage
    sessionStorage.setItem('token', loginResponse.token);

    // Store isAdmin value in sessionStorage
    if (loginResponse.isAdmin !== undefined) {
      sessionStorage.setItem('isAdmin', loginResponse.isAdmin.toString());
    }

    // Store apartment data
    this.apartmentDataSubject.next(loginResponse.apartment);

    // Store meter values
    const meterValues: {[key: string]: string} = {};
    if (loginResponse.actualGas) {
      meterValues['Gas meter'] = loginResponse.actualGas;
    }
    if (loginResponse.actualElectricity) {
      meterValues['Electricity meter'] = loginResponse.actualElectricity;
    }
    if (loginResponse.actualWater) {
      meterValues['Water meter'] = loginResponse.actualWater;
    }
    this.meterValuesSubject.next(meterValues);

    // If user is admin, fetch all apartments and set active component to GET_ADMIN_DATA
    if (loginResponse.isAdmin) {
      this.fetchAllApartments();
      this.componentDisplayService.setActiveComponent(DisplayComponent.GET_ADMIN_DATA);
    } else {
      // Set the active component to SUBMIT_DATA after login for non-admin users
      this.componentDisplayService.setActiveComponent(DisplayComponent.SUBMIT_DATA);
    }

    this.isLoggedInSubject.next(true);

    // Navigate to /me after successful login
    this.router.navigate(['/me']);
  }

  fetchAllApartments() {
    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found. Please log in again.');
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
        const apartments = response as Apartment[];

        // Store apartments in sessionStorage
        sessionStorage.setItem('apartments', JSON.stringify(apartments));
      },
      error: (error) => {
        console.error('Error fetching apartments:', error);
      }
    });
  }

  logout() {
    // Clear token from sessionStorage
    sessionStorage.removeItem('token');

    // Clear isAdmin from sessionStorage
    sessionStorage.removeItem('isAdmin');

    // Clear apartments from sessionStorage
    sessionStorage.removeItem('apartments');

    // Clear apartment data
    this.apartmentDataSubject.next(null);

    // Clear meter values
    this.meterValuesSubject.next({});

    this.isLoggedInSubject.next(false);

    // Navigate to /login after logout
    this.router.navigate(['/login']);
  }

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  get apartmentData(): ApartmentData | null {
    return this.apartmentDataSubject.value;
  }

  get meterValues(): {[key: string]: string} {
    return this.meterValuesSubject.value;
  }

  get token(): string | null {
    return sessionStorage.getItem('token');
  }

  get isAdmin(): boolean {
    const isAdmin = sessionStorage.getItem('isAdmin');
    return isAdmin === 'true';
  }
}
