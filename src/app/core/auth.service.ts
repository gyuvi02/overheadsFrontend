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

    // If user is admin, fetch all apartments and set active component to GET_ADMIN_DATA
    if (loginResponse.isAdmin) {
      this.fetchAllApartments();
      this.componentDisplayService.setActiveComponent(DisplayComponent.GET_ADMIN_DATA);
    } else {
      // Reset component display state for regular users as well, ensuring we start at SUBMIT_DATA
      this.componentDisplayService.reset();

      // Automatic language redirection for users
      const pathname = window.location.pathname;
      // We check if the URL contains 'en' or 'hu' as a path segment
      const urlSegments = pathname.split('/');
      const isEnPage = urlSegments.includes('en');
      const isHuPage = urlSegments.includes('hu');

      const currentLang = isEnPage ? 'en' : 'hu';
      const userLang = (loginResponse.apartment.language === 'angol' || loginResponse.apartment.language === 'e' || loginResponse.apartment.language === 'en') ? 'en' : 'hu';

      console.log(`DEBUG: Pathname: ${pathname}, Current: ${currentLang}, User: ${userLang}`);

      if (userLang !== currentLang) {
        // Fontos: mielőtt átirányítunk, beállítjuk az állapotot, hogy az újratöltéskor már bejelentkezve legyen
        this.isLoggedInSubject.next(true);

        // Kiszámítjuk a cél URL-t robusztusabban
        let newUrl: string;

        // Ha az URL-ben benne van a nyelvprefix
        if (pathname.includes(`/${currentLang}/`)) {
          newUrl = pathname.replace(`/${currentLang}/`, `/${userLang}/`);
        } else if (pathname.endsWith(`/${currentLang}`)) {
          newUrl = pathname.substring(0, pathname.lastIndexOf(`/${currentLang}`)) + `/${userLang}/me`;
        } else if (pathname.includes('/hu/')) {
          // Ha véletlenül hu van az URL-ben de nem az a currentLang (biztonsági játék)
          newUrl = pathname.replace('/hu/', `/${userLang}/`);
        } else if (pathname.includes('/en/')) {
          newUrl = pathname.replace('/en/', `/${userLang}/`);
        } else {
          // Ha nincs prefix, vagy nem felismerhető formátum, próbáljunk meg egy biztos célpontot
          newUrl = `/${userLang}/me`;
        }

        // Biztosítjuk, hogy ne legyen kettős perjel az elején, ha nem kell, de legyen egy, ha hiányzik
        if (!newUrl.startsWith('/')) {
          newUrl = '/' + newUrl;
        }

        // Dupla perjel eltávolítása az elejéről, ha véletlenül maradt (pl //en/me)
        newUrl = newUrl.replace(/\/+/g, '/');

        console.log(`DEBUG: Redirecting from ${pathname} to ${newUrl}`);
        window.location.href = newUrl;
        return; // Stop execution as we are redirecting
      }

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
    // Clear all data from sessionStorage
    sessionStorage.clear();

    // Reset component display state
    this.componentDisplayService.reset();

    // Clear apartment data
    this.apartmentDataSubject.next(null);

    // Clear meter values
    this.meterValuesSubject.next({});

    this.isLoggedInSubject.next(false);

    // Navigate to /login after logout
    this.router.navigate(['/login']).then(() => {
      // Force reload to ensure a clean state and clear any lingering memory-based state
      window.location.reload();
    });
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
