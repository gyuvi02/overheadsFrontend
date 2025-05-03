import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-submit-data',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './submit-data.component.html',
  styleUrls: ['./submit-data.component.css']
})
export class SubmitDataComponent {
  private authService = inject(AuthService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  meterTypes = ['Gas meter', 'Electricity meter', 'Water meter'];
  selectedMeterType = '';
  meterValue: number | null = null;
  selectedFile: File | null = null;

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        input.value = '';
        this.selectedFile = null;
        return;
      }

      // Check file type
      const allowedTypes = ['image/png', 'image/tiff', 'image/jpg', 'image/jpeg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Only PNG, TIFF, JPG, and JPEG files are allowed');
        input.value = '';
        this.selectedFile = null;
        return;
      }

      this.selectedFile = file;
    }
  }

  onSubmitImage() {
    if (this.selectedFile) {
      console.log('Uploading image:', this.selectedFile.name);
      // Add logic to upload the image
    } else {
      alert('Please select an image first');
    }
  }

  onSubmitData() {
    if (!this.selectedMeterType) {
      alert('Please select a meter type');
      return;
    }

    if (this.meterValue === null) {
      alert('Please enter a meter value');
      return;
    }

    console.log('Submitting data:', {
      meterType: this.selectedMeterType,
      meterValue: this.meterValue,
      image: this.selectedFile ? this.selectedFile.name : 'No image'
    });

    // Add logic to submit the data
  }
}
