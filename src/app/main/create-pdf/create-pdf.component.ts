import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import { environment } from '../../../environments/environment';

interface Apartment {
  id: number;
  city: string;
  zip: string;
  street: string;
  gasMeterID: string;
  electricityMeterID: string;
  waterMeterID: string;
  deadline: number;
  language: string;
  rent: number;
  maintenanceFee: number | null;
}

interface ConsumptionData {
  heating: Record<string, any>;
  electricity: Record<string, any>;
  water: Record<string, any>;
  gas: Record<string, any>;
}

@Component({
  selector: 'app-create-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './create-pdf.component.html',
  styleUrls: ['./create-pdf.component.css']
})
export class CreatePdfComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;
  selectedApartment: Apartment | null = null;
  userEmail: string = '';

  // Consumption data
  previousGas: string = '0';
  previousGasDate: string = '';
  actualGas: string = '0';
  actualGasDate: string = '';

  previousElectricity: string = '0';
  previousElectricityDate: string = '';
  actualElectricity: string = '0';
  actualElectricityDate: string = '';

  previousWater: string = '0';
  previousWaterDate: string = '';
  actualWater: string = '0';
  actualWaterDate: string = '';

  previousHeating: string = '0';
  previousHeatingDate: string = '';
  actualHeating: string = '0';
  actualHeatingDate: string = '';

  // Form fields
  gasCost: string = '0';
  electricityCost: string = '0';
  waterCost: string = '0';
  heatingCost: string = '0';
  cleaning: string = '0';
  maintenanceFee: string = '0';
  otherText: string = '';
  otherSum: string = '0';
  totalSum: string = '0';
  language: string = 'e';
  periodYear: number = new Date().getFullYear();
  periodMonth: number = new Date().getMonth() + 1;
  paymentDate: string = new Date().toISOString().slice(0, 10);
  paymentMethod: 'CASH' | 'BANK_TRANSFER' = 'BANK_TRANSFER';
  gasNewMeterConsumption: string = '0';
  electricityNewMeterConsumption: string = '0';
  waterNewMeterConsumption: string = '0';
  heatingNewMeterConsumption: string = '0';

  // Loading state
  loading: boolean = false;
  showForm: boolean = false;

  // Errors
  errors: Record<string, string> = {};

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

  // Check if utility blocks should be visible and set costs to 0 if not
  checkUtilityVisibility() {
    if (!this.actualGas || this.actualGas === '0') {
      this.gasCost = '0';
    }

    if (!this.actualElectricity || this.actualElectricity === '0') {
      this.electricityCost = '0';
    }

    if (!this.actualWater || this.actualWater === '0') {
      this.waterCost = '0';
    }

    if (!this.actualHeating || this.actualHeating === '0') {
      this.heatingCost = '0';
    }

    this.calculateTotalSum();
  }

  fetchAllApartments() {
    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    this.loading = true;

    // Make the HTTP GET request to fetch all apartments
    this.httpClient.get(`${environment.apiBaseUrl}/v1/admin/getAllApartments`, {
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
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
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

    // Set maintenance fee from apartment if available
    if (this.selectedApartment.maintenanceFee) {
      this.maintenanceFee = this.selectedApartment.maintenanceFee.toString();
    }

    console.log('Selected apartment:', this.selectedApartment);

    // Fetch user email by apartment ID
    this.getUserByApartmentId();
  }

  getUserByApartmentId() {
    if (!this.selectedApartmentId) {
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    this.loading = true;

    // Make the HTTP POST request to get user email by apartment ID
    this.httpClient.post(`${environment.apiBaseUrl}/v1/admin/getUserByApartmentId`, { apartmentId: this.selectedApartmentId.toString() }, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('User email fetched successfully:', response);
        this.userEmail = response.email;

        // After getting the email, fetch the last 2 consumption values
        this.getLast2Values();
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else if (error.status === 404) {
          // Display the error message from the response for HTTP NOT FOUND
          const errorMessage = error.error?.message || 'User not found for the selected apartment.';
          console.error('Error fetching user email:', error);
          this.popupService.showPopup(errorMessage);
        } else {
          console.error('Error fetching user email:', error);
          this.popupService.showPopup('An error occurred while fetching user email. Please try again.');
        }
      }
    });
  }

  getLast2Values() {
    if (!this.selectedApartmentId) {
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP POST request to get last 2 consumption values
    this.httpClient.post(`${environment.apiBaseUrl}/v1/admin/getLast2values`, { apartmentId: this.selectedApartmentId.toString() }, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Last 2 values fetched successfully:', response);

        // Process the response
        if (response && response.results) {
          const results = response.results as ConsumptionData;

          // Process gas data
          if (results.gas) {
            const gasEntries = Object.entries(results.gas);
            const [meterType, gasUnitPrice] = gasEntries[2];
            this.gasCost = gasUnitPrice;
            const [newMeterType, gasNewMeterConsumption] = gasEntries[3];
            this.gasNewMeterConsumption = gasNewMeterConsumption;
            if (gasEntries.length > 0) {
              const [latestGasDate, latestGasValue] = gasEntries[0];
              this.actualGas = (latestGasValue as any)?.value !== undefined ? (latestGasValue as any).value : latestGasValue;
              this.actualGasDate = this.formatDate(latestGasDate);

              if (gasEntries.length > 1) {
                const [previousGasDate, previousGasValue] = gasEntries[1];
                this.previousGas = (previousGasValue as any)?.value !== undefined ? (previousGasValue as any).value : previousGasValue;
                this.previousGasDate = this.formatDate(previousGasDate);
              }
            }
          }

          // Process electricity data
          if (results.electricity) {
            const electricityEntries = Object.entries(results.electricity);
            const [meterType, electricityUnitPrice] = electricityEntries[2];
            this.electricityCost = electricityUnitPrice;
            const [newMeterType, electricityNewMeterConsumption] = electricityEntries[3];
            this.electricityNewMeterConsumption = electricityNewMeterConsumption;
            if (electricityEntries.length > 0) {
              const [latestElectricityDate, latestElectricityValue] = electricityEntries[0];
              this.actualElectricity = (latestElectricityValue as any)?.value !== undefined ? (latestElectricityValue as any).value : latestElectricityValue;
              this.actualElectricityDate = this.formatDate(latestElectricityDate);

              if (electricityEntries.length > 1) {
                const [previousElectricityDate, previousElectricityValue] = electricityEntries[1];
                this.previousElectricity = (previousElectricityValue as any)?.value !== undefined ? (previousElectricityValue as any).value : previousElectricityValue;
                this.previousElectricityDate = this.formatDate(previousElectricityDate);
              }
            }
          }

          // Process water data
          if (results.water) {
            const waterEntries = Object.entries(results.water);
            const [meterType, waterUnitPrice] = waterEntries[2];
            this.waterCost = waterUnitPrice;
            const [newMeterType, waterNewMeterConsumption] = waterEntries[3];
            this.waterNewMeterConsumption = waterNewMeterConsumption;
            if (waterEntries.length > 0) {
              const [latestWaterDate, latestWaterValue] = waterEntries[0];
              this.actualWater = (latestWaterValue as any)?.value !== undefined ? (latestWaterValue as any).value : latestWaterValue;
              this.actualWaterDate = this.formatDate(latestWaterDate);

              if (waterEntries.length > 1) {
                const [previousWaterDate, previousWaterValue] = waterEntries[1];
                this.previousWater = (previousWaterValue as any)?.value !== undefined ? (previousWaterValue as any).value : previousWaterValue;
                this.previousWaterDate = this.formatDate(previousWaterDate);
              }
            }
          }

          // Process heating data
          if (results.heating) {
            const heatingEntries = Object.entries(results.heating);
            const [meterType, heatingUnitPrice] = heatingEntries[2];
            this.heatingCost = heatingUnitPrice;
            const [newMeterType, heatingNewMeterConsumption] = heatingEntries[3];
            this.heatingNewMeterConsumption = heatingNewMeterConsumption;
            if (heatingEntries.length > 0) {
              const [latestHeatingDate, latestHeatingValue] = heatingEntries[0];
              this.actualHeating = (latestHeatingValue as any)?.value !== undefined ? (latestHeatingValue as any).value : latestHeatingValue;
              this.actualHeatingDate = this.formatDate(latestHeatingDate);

              if (heatingEntries.length > 1) {
                const [previousHeatingDate, previousHeatingValue] = heatingEntries[1];
                this.previousHeating = (previousHeatingValue as any)?.value !== undefined ? (previousHeatingValue as any).value : previousHeatingValue;
                this.previousHeatingDate = this.formatDate(previousHeatingDate);
              }
            }
          }
        }



        this.loading = false;
        this.showForm = true;
        this.checkUtilityVisibility();
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error fetching last 2 values:', error);
          this.popupService.showPopup('An error occurred while fetching consumption values. Please try again.');
        }
      }
    });
  }

  formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}.`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  }

  calculateTotalSum() {
    if (!this.selectedApartment) {
      return;
    }

    const rent = this.selectedApartment.rent || 0;
    const gasCost = parseInt(this.gasCost) || 0;
    const electricityCost = parseInt(this.electricityCost) || 0;
    const waterCost = parseInt(this.waterCost) || 0;
    const heatingCost = parseInt(this.heatingCost) || 0;
    const cleaning = parseInt(this.cleaning) || 0;
    const maintenanceFee = parseInt(this.maintenanceFee) || 0;
    const otherSum = parseInt(this.otherSum) || 0;

    this.totalSum = (rent + gasCost + electricityCost + waterCost + heatingCost + cleaning + maintenanceFee + otherSum).toString();
  }

  onCreateReceipt() {
    if (!this.selectedApartment) {
      this.popupService.showPopup('No apartment selected');
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    this.loading = true;

    const utilityAmount =
      (parseInt(this.gasCost) || 0) +
      (parseInt(this.electricityCost) || 0) +
      (parseInt(this.waterCost) || 0) +
      (parseInt(this.heatingCost) || 0);

    const receiptData = {
      apartmentId: this.selectedApartment.id,
      periodYear: this.periodYear,
      periodMonth: this.periodMonth,
      paymentDate: this.paymentDate || null,
      paymentMethod: this.paymentMethod,
      rentAmount: this.selectedApartment.rent || 0,
      utilityAmount,
      maintenanceFee: parseInt(this.maintenanceFee) || 0,
      cleaningAmount: parseInt(this.cleaning) || 0,
      otherText: this.otherText,
      otherAmount: parseInt(this.otherSum) || 0
    };

    this.httpClient.post(`${environment.apiBaseUrl}/v1/admin/createRentalReceipt`, receiptData, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Receipt created successfully:', response);
        this.loading = false;

        if (response && response.pdfBase64) {
          sessionStorage.setItem('receiptPdf64', response.pdfBase64);
          sessionStorage.setItem('receiptEmail', this.userEmail);
          sessionStorage.setItem('receiptApartmentAddress', response.propertyAddress || `${this.selectedApartment?.city}, ${this.selectedApartment?.street}`);
          sessionStorage.setItem('receiptLanguage', this.selectedApartment?.language || '');

          this.componentDisplayService.setActiveComponent(DisplayComponent.DISPLAY_PDF);
        } else {
          this.popupService.showPopup('Receipt created successfully');
          this.resetForm();
        }
      },
      error: (error) => {
        this.loading = false;
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error creating receipt:', error);
          const errorMessage = error.error?.error || error.error || 'An error occurred while creating the receipt. Please try again.';
          this.popupService.showPopup(errorMessage);
        }
      }
    });
  }

  validateForm(): boolean {
    this.resetErrors();
    let isValid = true;

    // Validate gasCost
    if (isNaN(parseInt(this.gasCost))) {
      this.errors['gasCost'] = 'Gas cost must be a number';
      isValid = false;
    }

    // Validate electricityCost
    if (isNaN(parseInt(this.electricityCost))) {
      this.errors['electricityCost'] = 'Electricity cost must be a number';
      isValid = false;
    }

    // Validate waterCost
    if (isNaN(parseInt(this.waterCost))) {
      this.errors['waterCost'] = 'Water cost must be a number';
      isValid = false;
    }

    // Validate heatingCost
    if (isNaN(parseInt(this.heatingCost))) {
      this.errors['heatingCost'] = 'Heating cost must be a number';
      isValid = false;
    }

    // Validate cleaning
    if (isNaN(parseInt(this.cleaning))) {
      this.errors['cleaning'] = 'Cleaning cost must be a number';
      isValid = false;
    }

    // Validate maintenanceFee
    if (isNaN(parseInt(this.maintenanceFee))) {
      this.errors['maintenanceFee'] = 'Maintenance fee must be a number';
      isValid = false;
    }

    // Validate otherSum
    if (isNaN(parseInt(this.otherSum))) {
      this.errors['otherSum'] = 'Other cost must be a number';
      isValid = false;
    }

    return isValid;
  }

  resetErrors() {
    this.errors = {};
  }

  resetForm() {
    this.selectedApartmentId = null;
    this.selectedApartment = null;
    this.userEmail = '';
    this.previousGas = '0';
    this.previousGasDate = '';
    this.actualGas = '0';
    this.actualGasDate = '';
    this.previousElectricity = '0';
    this.previousElectricityDate = '';
    this.actualElectricity = '0';
    this.actualElectricityDate = '';
    this.previousWater = '0';
    this.previousWaterDate = '';
    this.actualWater = '0';
    this.actualWaterDate = '';
    this.gasCost = '0';
    this.electricityCost = '0';
    this.waterCost = '0';
    this.previousHeating = '0';
    this.previousHeatingDate = '';
    this.actualHeating = '0';
    this.actualHeatingDate = '';
    this.heatingCost = '0';
    this.electricityCost = '0';
    this.waterCost = '0';
    this.cleaning = '0';
    this.maintenanceFee = '0';
    this.otherText = '';
    this.otherSum = '0';
    this.totalSum = '0';
    this.periodYear = new Date().getFullYear();
    this.periodMonth = new Date().getMonth() + 1;
    this.paymentDate = new Date().toISOString().slice(0, 10);
    this.paymentMethod = 'BANK_TRANSFER';
    this.showForm = false;
    this.resetErrors();
  }

  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }
}
