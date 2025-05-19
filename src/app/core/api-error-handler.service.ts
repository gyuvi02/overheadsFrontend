import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { PopupService } from '../shared/popup/popup.service';

@Injectable({
  providedIn: 'root'
})
export class ApiErrorHandlerService {
  private popupService = inject(PopupService);

  /**
   * Handles HTTP errors and displays appropriate error messages using the PopupService
   * @param error The HTTP error response
   */
  handleError(error: HttpErrorResponse): void {
    let errorMessage: string;

    // Check if it's a network error (API not available)
    if (error.error instanceof ProgressEvent && error.error.type === 'error') {
      errorMessage = 'Failed to connect to the server. Please check your internet connection or try again later.';
    } else if (error.status === 0) {
      errorMessage = 'The server is not responding. Please try again later.';
    } else {
      errorMessage = error.error || 'An unknown error occurred. Please try again later.';
    }

    // Use the popup service to show the error message
    this.popupService.showPopup(errorMessage);
    console.error('API error:', error);
  }
}
