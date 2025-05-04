import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private apartmentDataSubject = new BehaviorSubject<ApartmentData | null>(null);
  apartmentData$ = this.apartmentDataSubject.asObservable();

  private meterValuesSubject = new BehaviorSubject<{[key: string]: string}>({});
  meterValues$ = this.meterValuesSubject.asObservable();

  login(loginResponse: LoginResponse) {
    // Store token in sessionStorage
    sessionStorage.setItem('token', loginResponse.token);

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

    this.isLoggedInSubject.next(true);
  }

  logout() {
    // Clear token from sessionStorage
    sessionStorage.removeItem('token');

    // Clear apartment data
    this.apartmentDataSubject.next(null);

    // Clear meter values
    this.meterValuesSubject.next({});

    this.isLoggedInSubject.next(false);
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
}
