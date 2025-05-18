import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { HttpClient } from '@angular/common/http';
import { PopupService } from '../../shared/popup/popup.service';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';
import { environment } from '../../../environments/environment';

// Interface for User
export interface User {
  id: number;
  username: string;
  email: string;
  apartmentId: number;
}

@Component({
  selector: 'app-edit-user',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './edit-user.component.html',
  styleUrls: ['./edit-user.component.css']
})
export class EditUserComponent implements OnInit {
  private authService = inject(AuthService);
  private httpClient = inject(HttpClient);
  private popupService = inject(PopupService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  users: User[] = [];
  selectedUserId: number | null = null;
  selectedUser: User | null = null;
  originalUser: User | null = null;
  showConfirmation: boolean = false;

  ngOnInit() {
    console.log('EditUserComponent ngOnInit called'); // <<<--- ADD THIS LOG
    // Check if users are already in sessionStorage
    // const usersJson = sessionStorage.getItem('users');
    // if (usersJson) {
    //   this.users = JSON.parse(usersJson);
    // } else if (this.authService.isAdmin) {
    //   // If not in sessionStorage and user is admin, fetch them
    //   this.fetchAllUsers();
    // }
    this.fetchAllUsers();

  }

  // No need for updateUsersList method anymore as we're directly using the users array

  fetchAllUsers() {
    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP GET request to fetch all users
    this.httpClient.get(`${environment.apiBaseUrl}/admin/getAllUsers`, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`,
      }
    }).subscribe({
      next: (response: any) => {
        console.log('Users fetched successfully:', response);
        this.users = response as User[];
        console.log('Users:', this.users);

        // Store users in sessionStorage
        sessionStorage.setItem('users', JSON.stringify(this.users));
      },
      error: (error) => {
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          console.error('Error fetching users (full error object):', error);
          this.popupService.showPopup('An error occurred while fetching users. Please try again.');
        }
      }
    });
  }

  onSubmit() {
    if (!this.selectedUserId) {
      this.popupService.showPopup('Please select a user');
      return;
    }

    console.log('Selected user ID:', Number(this.selectedUserId));

    // Find the selected user in the users array
    console.log('All user IDs:', this.users.map(user => user.id));

    const selectedUser = this.users.find(user => user.id === Number(this.selectedUserId));
    console.log('Selected user:', selectedUser?.username);
    if (!selectedUser) {
      this.popupService.showPopup('Selected user not found');
      return;
    }

    this.selectedUser = selectedUser;

    // Store a deep copy of the original user for comparison later
    this.originalUser = JSON.parse(JSON.stringify(this.selectedUser));

    console.log('Selected user:', this.selectedUser);
  }

  onSaveChanges() {
    if (!this.selectedUser || !this.originalUser) {
      this.popupService.showPopup('No user selected');
      return;
    }

    console.log('Checking for changes to user:', this.selectedUser);

    // Check if any data was modified by comparing with original user
    const isModified =
      this.selectedUser.username !== this.originalUser.username ||
      this.selectedUser.email !== this.originalUser.email ||
      this.selectedUser.apartmentId !== this.originalUser.apartmentId;

    if (!isModified) {
      this.popupService.showPopup('No data was modified, nothing to save');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP POST request to save the user changes
    this.httpClient.post(`${environment.apiBaseUrl}/admin/editUser`, this.selectedUser, {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      }
    }).subscribe({
      next: (response: any) => {
        console.log('User updated successfully:', response);

        // Delete the users list from sessionStorage
        sessionStorage.removeItem('users');

        // Show success message
        this.popupService.showPopup('User updated successfully');

        // Reset the component state and reload
        this.resetAndReload();
      },
      error: (error) => {
        console.error('Request error:', error);
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else {
          this.popupService.showPopup('An error occurred while editing user data. Please, try again');
        }
      }
    });
  }

  onDeleteUser() {
    if (!this.selectedUser) {
      this.popupService.showPopup('No user selected');
      return;
    }

    // Show confirmation dialog
    this.showConfirmation = true;
  }

  onConfirmDelete() {
    if (!this.selectedUser) {
      this.popupService.showPopup('No user selected');
      return;
    }

    // Get the token from sessionStorage
    const token = sessionStorage.getItem('token');
    if (!token) {
      this.popupService.showPopup('Authentication token not found. Please log in again.');
      return;
    }

    // Make the HTTP POST request to delete the user
    this.httpClient.post(`${environment.apiBaseUrl}/admin/deleteUser`, this.selectedUser.id.toString(), {
      headers: {
        'API-KEY': environment.apiKeyValid,
        'Authorization': `Bearer ${token}`
      },
      responseType: 'text'
    }).subscribe({
      next: (response: any) => {
        console.log('User deleted successfully:', response);

        // Delete the users list from sessionStorage
        sessionStorage.removeItem('users');

        // Show success message
        this.popupService.showPopup('User deleted successfully');

        // Reset the component state and reload
        this.resetAndReload();
      },
      error: (error) => {
        console.error('Request error:', error);
        if (error.status === 401) {
          this.popupService.showPopup('Session expired, please, log in again');
          this.authService.logout();
        } else if (error.status === 403 && error.error === "Admin users cannot be deleted") {
          this.popupService.showPopup('Admin users cannot be deleted');
          this.showConfirmation = false;
        } else {
          this.popupService.showPopup('An error occurred while deleting user. Please, try again');
          this.showConfirmation = false;
        }
      }
    });
  }

  onCancelDelete() {
    this.showConfirmation = false;
  }

  resetAndReload() {
    // Reset the component state
    this.selectedUserId = null;
    this.selectedUser = null;
    this.originalUser = null;
    this.showConfirmation = false;

    // Fetch users again
    this.fetchAllUsers();

    // Reset the active component to refresh the view
    this.componentDisplayService.setActiveComponent(DisplayComponent.EDIT_USER);
  }

  // Helper method to get user display name
  getUserDisplayName(user: User): string {
    return `${user.username} (${user.email})`;
  }
}
