import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { map } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { PopupService } from '../../shared/popup/popup.service';
import { environment } from '../../../environments/environment';
import { Apartment } from '../edit-apartment/edit-apartment.component';
import { Observable, from } from 'rxjs';

@Component({
  selector: 'app-admin-submit-data',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './admin-submit-data.component.html',
  styleUrls: ['./admin-submit-data.component.css']
})
export class AdminSubmitDataComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private router = inject(Router);
  private popupService = inject(PopupService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  // Flag to control when to show the meter fields
  apartmentSubmitted = false;

  // Apartment selection
  apartments: Apartment[] = [];
  selectedApartmentId: number | null = null;

  // Will be populated based on available meter data
  meterTypes: string[] = [];
  selectedMeterType = '';
  meterValue: number | null = null;
  selectedFile: File | null = null;

  // Store actual meter values from login response
  actualMeterValues: {[key: string]: string} = {};

  ngOnInit() {
    // Load apartments from sessionStorage
    const apartmentsJson = sessionStorage.getItem('apartments');
    if (apartmentsJson) {
      this.apartments = JSON.parse(apartmentsJson);
    } else if (this.authService.isAdmin) {
      // If not in sessionStorage and user is admin, fetch them
      this.fetchAllApartments();
    }

    // Subscribe to meter values from auth service
    this.authService.meterValues$.subscribe(values => {
      this.actualMeterValues = values;
    });
  }

  // Method to handle apartment selection submission
  onSubmitApartment() {
    if (!this.selectedApartmentId) {
      this.popupService.showPopup('Please select an apartment');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Reset meter fields before fetching new meter types
    this.selectedMeterType = '';
    this.meterValue = null;
    this.selectedFile = null;

    // Fetch meter types for the selected apartment
    this.fetchMeterTypesForApartment(this.selectedApartmentId, token);
  }

  // Fetch meter types for a specific apartment
  fetchMeterTypesForApartment(apartmentId: number, token: string) {
    // Find the selected apartment in the apartments array
    const selectedApartment = this.apartments.find((apartment) => apartment.id === Number(apartmentId));

    if (!selectedApartment) {
      this.popupService.showPopup('Selected apartment not found');
      return;
    }

    // Call the getAllLastMeterValues endpoint with the apartment ID
    this.httpClient.post(`${environment.apiBaseUrl}/admin/getAllLastMeterValues`,
      {
        apartmentId: apartmentId.toString(),
        withImage: "0"  // We don't need images for this purpose
      },
      {
        headers: {
          'API-KEY': environment.apiKeyValid,
          'Authorization': `Bearer ${token}`
        }
      }).subscribe({
        next: (response: any) => {
          console.log('Last meter values fetched successfully:', response);

          // Store the meter data
          this.actualMeterValues = response as { [key: string]: string };

          // Extract meter types (keys that don't end with '_image')
          this.meterTypes = Object.keys(this.actualMeterValues).filter(key => !key.endsWith('_image'));

          // Set apartmentSubmitted to true to show the other fields
          this.apartmentSubmitted = true;

          // Reset other form fields
          this.selectedMeterType = '';
          this.meterValue = null;
          this.selectedFile = null;
        },
        error: (error) => {
          if (error.status === 401) {
            this.popupService.showPopup('Session expired, please, log in again');
            this.authService.logout();
          } else {
            console.error('Error fetching meter types:', error);
            this.popupService.showPopup('An error occurred while fetching meter types. Please try again.');
          }
        }
      });
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
        // console.log('Apartments fetched successfully:', response);
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

  // Get the actual meter value for the selected meter type
  get actualValue(): string | null {
    return this.selectedMeterType ? this.actualMeterValues[this.selectedMeterType] : null;
  }

  // Helper method to get apartment display name
  getApartmentDisplayName(apartment: Apartment): string {
    return `${apartment.city}, ${apartment.street}`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        this.popupService.showPopup('File size exceeds 10MB limit');
        input.value = '';
        this.selectedFile = null;
        return;
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/tiff', 'image/jpg', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        this.popupService.showPopup('Only PNG, TIFF, JPG, and JPEG files are allowed');
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
  //     // Add logic to upload the image
  //   } else {
  //     this.popupService.showPopup('Please select an image first');
  //   }
  // }

  onSubmitData() {
    if (!this.selectedApartmentId) {
      this.popupService.showPopup('Please select an apartment');
      return;
    }

    if (!this.selectedMeterType) {
      this.popupService.showPopup('Please select a meter type');
      return;
    }

    if (this.meterValue === null) {
      this.popupService.showPopup('Please enter a meter value');
      return;
    }

    // Check if the meter value is an integer
    if (this.meterValue % 1 !== 0) {
      this.popupService.showPopup('Please enter a whole number (integer) value');
      return;
    }

    // Check if the new meter value is less than the previous value
    if (this.actualValue && this.meterValue < parseFloat(this.actualValue)) {
      this.popupService.showPopup('Error: The new meter value cannot be less than the previous value. Please enter a value greater than ' + this.actualValue);
      return;
    }

    // Check if the new meter value is equal to the previous value
    if (this.actualValue && this.meterValue === parseFloat(this.actualValue)) {
      this.popupService.showPopup('The new meter value is the same as the previous value. No new value will be stored.');
      this.router.navigate(['/me']);
      return;
    }

    console.log('Submitting data:', {
      apartmentId: this.selectedApartmentId,
      meterType: this.selectedMeterType,
      meterValue: this.meterValue,
      image: this.selectedFile ? this.selectedFile.name : 'No image'
    });

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Prepare the form data
    const formData = new FormData();

    // Add meterType parameter
    formData.append('meterType', this.selectedMeterType.split(' ')[0].toLowerCase());

    // Add values parameter as a map
    const values = {
      // apartmentId: this.selectedApartmentId.toString(),
      apartmentId: this.selectedApartmentId,
      meterValue: this.meterValue.toString()
    };
    formData.append('values', JSON.stringify(values));

    // Compress and append the file if selected
    if (this.selectedFile) {
      // Show loading message
      // this.popupService.showPopup('Processing image, please wait...');

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
    // Use environment variable instead of hardcoded URL
    this.httpClient.post(`${environment.apiBaseUrl}/user/submitMeterValue`, formData, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      },
      responseType: 'text'
    }).subscribe({
      next: (response) => {
        console.log('Submission successful:', response);

        // Show success message with submitted values
        this.popupService.showPopup(`Submission successful! \nMeter Type: ${this.selectedMeterType}\nMeter Value: ${this.meterValue}`);

        // Reset the form
        this.resetForm();

        // Navigate back to the main page (effectively refreshing it)
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/me']);
        });
      },
      error: (error) => {
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Submission error:', error);
          this.popupService.showPopup('An error occurred while submitting the data. Please try again.');
        }
      }
    });
  }

  private resetForm() {
    this.selectedApartmentId = null;
    this.selectedMeterType = '';
    this.meterValue = null;
    this.selectedFile = null;
    this.apartmentSubmitted = false;  // Reset the apartmentSubmitted flag

    // Reset the file input element if it exists
    const fileInput = document.getElementById('imageUpload') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }
}
