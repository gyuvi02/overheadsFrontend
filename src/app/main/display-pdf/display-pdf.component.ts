import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-display-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, NgIf],
  templateUrl: './display-pdf.component.html',
  styleUrls: ['./display-pdf.component.css']
})
export class DisplayPdfComponent implements OnInit {
  private authService = inject(AuthService);
  private componentDisplayService = inject(ComponentDisplayService);
  private sanitizer = inject(DomSanitizer);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);

  isLoggedIn$ = this.authService.isLoggedIn$;
  pdfData: string = '';
  safePdfUrl: SafeResourceUrl | null = null;
  email: string = '';
  apartmentAddress: string = '';
  language: string = '';
  isSending: boolean = false;

  ngOnInit() {
    // Get the PDF data from sessionStorage
    const pdfData = sessionStorage.getItem('invoicePdf64');
    if (pdfData) {
      this.pdfData = pdfData;
      this.createPdfUrl();

      // Get the email, apartmentAddress, and language from sessionStorage
      const email = sessionStorage.getItem('invoiceEmail');
      const apartmentAddress = sessionStorage.getItem('invoiceApartmentAddress');
      const language = sessionStorage.getItem('invoiceLanguage');

      if (email) {
        this.email = email;
      }

      if (apartmentAddress) {
        this.apartmentAddress = apartmentAddress;
      }

      if (language) {
        this.language = language;
      }
    } else {
      // If no PDF data is found, go back to create-pdf component
      this.onCancel();
    }
  }

  createPdfUrl() {
    try {
      // Create a blob from the base64 PDF data
      const byteCharacters = atob(this.pdfData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create a URL for the blob
      const blobUrl = URL.createObjectURL(blob);

      // Sanitize the URL to prevent security issues
      this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
      console.log('PDF URL created successfully:', this.safePdfUrl);
    } catch (error) {
      console.error('Error creating PDF URL:', error);
      this.popupService.showPopup('Error creating PDF URL. Please try again.');
    }
  }

  onSend() {
    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Set isSending to true to disable the button and show loading indicator
    this.isSending = true;

    // Create the request data
    const emailData = {
      apartmentAddress: this.apartmentAddress,
      email: this.email,
      language: this.language,
      pdfBase64: this.pdfData
    };

    // Make the HTTP POST request to send the email
    this.httpClient.post(`${environment.apiBaseUrl}/admin/sendPdfEmail`, emailData, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Email sent successfully:', response);
        this.isSending = false; // Reset isSending when request completes successfully
        this.popupService.showPopup('Email sent successfully');
        this.onCancel();
      },
      error: (error) => {
        this.isSending = false; // Reset isSending when request fails
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error sending email:', error);
          this.popupService.showPopup('An error occurred while sending the email. Please try again.');
        }
      }
    });
  }

  onCancel() {
    // Clear all invoice data from sessionStorage
    sessionStorage.removeItem('invoicePdf64');
    sessionStorage.removeItem('invoiceEmail');
    sessionStorage.removeItem('invoiceApartmentAddress');
    sessionStorage.removeItem('invoiceLanguage');

    // Navigate back to the create-pdf component
    this.componentDisplayService.setActiveComponent(DisplayComponent.CREATE_PDF);
  }
}
