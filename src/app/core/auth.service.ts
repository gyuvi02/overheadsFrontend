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
  heatingMeterID: string;
  id: string;
  language?: string;
}

export interface LoginResponse {
  message: string;
  apartment: ApartmentData;
  actualGas?: string;
  token: string;
  actualElectricity?: string;
  actualWater?: string;
  actualHeating?: string;
  isAdmin?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private componentDisplayService = inject(ComponentDisplayService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private isLoggedInSubject = new BehaviorSubject<boolean>(!!sessionStorage.getItem('token'));
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor() {
    // Ha van token az indításkor, próbáljuk meg beállítani az állapotot
    const token = sessionStorage.getItem('token');
    if (token) {
      // Bejelentkezett állapot visszaállítása
      this.isLoggedInSubject.next(true);

      // Apartman adatok visszaállítása
      const storedApartment = sessionStorage.getItem('apartmentData');
      if (storedApartment) {
        try {
          this.apartmentDataSubject.next(JSON.parse(storedApartment));
        } catch (e) {
          console.error('Error parsing stored apartment data', e);
        }
      }

      // Mérőállások visszaállítása
      const storedMeterValues = sessionStorage.getItem('meterValues');
      if (storedMeterValues) {
        try {
          this.meterValuesSubject.next(JSON.parse(storedMeterValues));
        } catch (e) {
          console.error('Error parsing stored meter values', e);
        }
      }
    }
  }

  private apartmentDataSubject = new BehaviorSubject<ApartmentData | null>(null);
  apartmentData$ = this.apartmentDataSubject.asObservable();

  private meterValuesSubject = new BehaviorSubject<{[key: string]: string}>({});
  meterValues$ = this.meterValuesSubject.asObservable();

  login(loginResponse: LoginResponse) {
    console.log('DEBUG: AuthService.login called');
    // Store token in sessionStorage
    sessionStorage.setItem('token', loginResponse.token);

    // Store isAdmin value in sessionStorage
    if (loginResponse.isAdmin !== undefined) {
      sessionStorage.setItem('isAdmin', loginResponse.isAdmin.toString());
    }

    // Store apartment data
    this.apartmentDataSubject.next(loginResponse.apartment);
    sessionStorage.setItem('apartmentData', JSON.stringify(loginResponse.apartment));

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
    if (loginResponse.actualHeating) {
      meterValues['Heating meter'] = loginResponse.actualHeating;
    }
    this.meterValuesSubject.next(meterValues);
    sessionStorage.setItem('meterValues', JSON.stringify(meterValues));

    // Update login status immediately before any redirection or navigation
    this.isLoggedInSubject.next(true);

    // If user is admin, fetch all apartments and set active component to GET_ADMIN_DATA
    if (loginResponse.isAdmin) {
      this.fetchAllApartments();
      this.componentDisplayService.setActiveComponent(DisplayComponent.GET_ADMIN_DATA);
    } else {
      // Reset component display state for regular users as well, ensuring we start at SUBMIT_DATA
      this.componentDisplayService.reset();
      // Set the active component to SUBMIT_DATA after login for non-admin users
      this.componentDisplayService.setActiveComponent(DisplayComponent.SUBMIT_DATA);
    }

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
    this.httpClient.get(`${environment.apiBaseUrl}/v1/admin/getAllApartments`, {
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
    console.log('DEBUG: AuthService.logout called');
    this.logoutNoRedirect();

    // Force redirect to login via window.location to ensure fresh start
    // instead of router navigation which might preserve some in-memory state
    const pathname = window.location.pathname;
    let loginUrl = '/hu/login';
    if (pathname.includes('/en/')) {
      loginUrl = '/en/login';
    }
    window.location.href = loginUrl;
  }

  logoutNoRedirect() {
    // Clear all data from sessionStorage
    sessionStorage.clear();

    // Reset internal state subjects
    this.apartmentDataSubject.next(null);
    this.meterValuesSubject.next({});
    this.isLoggedInSubject.next(false);

    // Reset component display state
    this.componentDisplayService.reset();
  }

  checkLanguageConsistency() {
    const apartment = this.apartmentDataSubject.value;
    if (!apartment || this.isAdmin) return;

    const pathname = window.location.pathname;
    const urlSegments = pathname.split('/');
    const isEnPage = urlSegments.includes('en');
    const isHuPage = urlSegments.includes('hu');

    const currentLang = isEnPage ? 'en' : 'hu';
    const userLang = (apartment.language === 'angol' || apartment.language === 'e' || apartment.language === 'en') ? 'en' : 'hu';

    if (userLang !== currentLang) {
      console.log(`DEBUG: Language inconsistency detected. Current: ${currentLang}, User: ${userLang}. Redirecting...`);

      let newUrl: string;
      if (pathname.includes(`/${currentLang}/`)) {
        newUrl = pathname.replace(`/${currentLang}/`, `/${userLang}/`);
      } else if (pathname.includes('/hu/')) {
        newUrl = pathname.replace('/hu/', `/${userLang}/`);
      } else if (pathname.includes('/en/')) {
        newUrl = pathname.replace('/en/', `/${userLang}/`);
      } else {
        newUrl = `/${userLang}/me`;
      }

      newUrl = '/' + newUrl.replace(/\/+/g, '/');
      window.location.href = newUrl;
    }
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

  updateMeterValue(type: string, value: string) {
    const currentValues = this.meterValuesSubject.value;
    const updatedValues = { ...currentValues, [type]: value };
    this.meterValuesSubject.next(updatedValues);
  }

  get token(): string | null {
    return sessionStorage.getItem('token');
  }

  get isAdmin(): boolean {
    const isAdmin = sessionStorage.getItem('isAdmin');
    return isAdmin === 'true';
  }
}
