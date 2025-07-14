import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PopupService } from '../../shared/popup/popup.service';
import {environment} from '../../../environments/environment';
import { Observable, from } from 'rxjs';

@Component({
  selector: 'app-submit-data',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './submit-data.component.html',
  styleUrls: ['./submit-data.component.css']
})
export class SubmitDataComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  isLoggedIn$ = this.authService.isLoggedIn$;
  isSubmitting: boolean = false;

  constructor(private popupService: PopupService) {}

  // Will be populated based on available meter data
  meterTypes: string[] = [];
  selectedMeterType = '';
  meterValue: number | null = null;
  selectedFile: File | null = null;

  // Store actual meter values from login response
  actualMeterValues: {[key: string]: string} = {};

  // Translation mapping
  meterTypeLabels: { [key: string]: string } = {
    'Gas meter': $localize`:@@gasMeter:Gas meter`,
    'Electricity meter': $localize`:@@electricityMeter:Electricity meter`,
    'Water meter': $localize`:@@waterMeter:Water meter`,
    'Heating  meter': $localize`:@@heatingMeter:Heating meter`
  };

  ngOnInit() {
    this.authService.meterValues$.subscribe(values => {
      this.actualMeterValues = values;
      this.meterTypes = Object.keys(values);
    });
  }

  getTranslatedMeterType(type: string): string {
    return this.meterTypeLabels[type] || type;
  }

  // Get the actual meter value for the selected meter type
  get actualValue(): string | null {
    return this.selectedMeterType ? this.actualMeterValues[this.selectedMeterType] : null;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.popupService.showPopup($localize`:@@errorFileSize:File size exceeds 10MB limit`);
        input.value = '';
        this.selectedFile = null;
        return;
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/tiff', 'image/jpg', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        this.popupService.showPopup($localize`:@@errorWrongFormat:Only PNG, TIFF, JPG and JPEG files are allowed!`);
        input.value = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
    }
  }

  // Compress image to reduce file size
  private compressImage(file: File): Observable<File> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const img = new Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;
          const maxDimension = 1200; // Limit max dimension to 1200px

          if (width > height && width > maxDimension) {
            height = Math.round(height * (maxDimension / width));
            width = maxDimension;
          } else if (height > maxDimension) {
            width = Math.round(width * (maxDimension / height));
            height = maxDimension;
          }

          canvas.width = width;
          canvas.height = height;

          // Draw image on canvas with new dimensions
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with reduced quality
          canvas.toBlob(
            blob => {
              if (blob) {
                // Create new file from blob
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                });
                observer.next(compressedFile);
                observer.complete();
              } else {
                // If compression fails, return original file
                observer.next(file);
                observer.complete();
              }
            },
            'image/jpeg',
            0.7 // Quality parameter (0.7 = 70% quality)
          );
        };
      };
      reader.onerror = error => {
        observer.error(error);
      };
    });
  }

  // onSubmitImage() {
  //   if (this.selectedFile) {
  //     console.log('Uploading image:', this.selectedFile.name);
  //   } else {
  //     this.popupService.showPopup('Please select an image first');
  //   }
  // }

  onSubmitData() {
    // Don't proceed if already submitting
    if (this.isSubmitting) {
      return;
    }

    if (!this.selectedMeterType) {
      this.popupService.showPopup($localize`:@@errorSelectMeterType:Please select a meter type`);
      return;
    }

    if (this.meterValue === null) {
      this.popupService.showPopup($localize`:@@errorAddMeterValue:Please enter a meter value!`);

      return;
    }

    // Check if the meter value is an integer
    if (this.meterValue % 1 !== 0) {
      this.popupService.showPopup($localize`:@@errorAddWholeNumber:Please enter a whole number (integer) value!`);
      return;
    }

    // Check if the new meter value is less than the previous value
    if (this.actualValue && this.meterValue < parseFloat(this.actualValue)) {
      this.popupService.showPopup($localize`:@@errorSmallerMeterValue:The new meter value cannot be less than the previous value!`);
      return;
    }

    // Check if the new meter value is equal to the previous value
    if (this.actualValue && this.meterValue === parseFloat(this.actualValue)) {
      this.popupService.showPopup($localize`:@@errorEqualMeterValue:The new meter value is the same as the previous value. No new value will be stored.`);
      this.router.navigate(['/me']);
      return;
    }

    console.log('Submitting data:', {
      meterType: this.selectedMeterType,
      meterValue: this.meterValue,
      image: this.selectedFile ? this.selectedFile.name : 'No image'
    });

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup($localize`:@@errorTokenNotFound:Authentication token not found. Please log in again.`);
      return;
    }

    // Get the apartment ID from the auth service
    const apartmentId = this.authService.apartmentData?.id;
    if (!apartmentId) {
      this.popupService.showPopup($localize`:@@errorApartmentNotFound:Apartment data not found. Please log in again.`);
      return;
    }

    // Prepare the form data
    const formData = new FormData();

    // Add meterType parameter
    formData.append('meterType', this.selectedMeterType.split(' ')[0].toLowerCase());

    // Add values parameter as a map
    const values = {
      apartmentId: apartmentId,
      meterValue: this.meterValue.toString()
    };
    formData.append('values', JSON.stringify(values));

    // Set isSubmitting to true to disable the button and show loading indicator
    this.isSubmitting = true;

    // Compress and append the file if selected
    if (this.selectedFile) {
      // Show loading message
      // this.popupService.showPopup($localize`:@@processingImage:Processing image, please wait...`);

      // Compress the image before uploading
      this.compressImage(this.selectedFile).subscribe(compressedFile => {
        console.log('Original size:', this.selectedFile!.size / 1024 / 1024, 'MB');
        console.log('Compressed size:', compressedFile.size / 1024 / 1024, 'MB');

        formData.append('file', compressedFile);

        // Make the HTTP POST request after compression
        this.makeHttpRequest(formData, token);
      });
    } else {
      // Make the HTTP POST request without file
      this.makeHttpRequest(formData, token);
    }
  }

  private makeHttpRequest(formData: FormData, token: string) {
    this.httpClient.post(`${environment.apiBaseUrl}/user/submitMeterValue`, formData, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      },
      responseType: 'text'
    }).subscribe({
      next: (response) => {
        console.log('Submission successful:', response);

        // Reset isSubmitting when request completes successfully
        this.isSubmitting = false;

        // Show success message
        this.popupService.showPopup($localize`:@@successSubmit:Submission successful! Thank you!`);

        // Reset the form
        this.resetForm();

        // Navigate back to the main page (effectively refreshing it)
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/me']);
        });
      },
      error: (error) => {
        // Reset isSubmitting when request fails
        this.isSubmitting = false;

        if (error.status === 401) {
          this.popupService.showPopup($localize`:@@errorSessionExpired:Session expired, please, log in again!`);
          this.authService.logout();
        } else {
          console.error('Submission error:', error);
          this.popupService.showPopup($localize`:@@errorUnknownError:An error occurred while submitting the data. Please try again later.`);
        }
      }
    });
  }

  private resetForm() {
    this.selectedMeterType = '';
    this.meterValue = null;
    this.selectedFile = null;

    // Reset the file input element if it exists
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
