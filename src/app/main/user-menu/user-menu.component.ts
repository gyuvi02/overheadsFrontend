import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';
import { ComponentDisplayService, DisplayComponent } from '../../core/component-display.service';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent {
  private authService = inject(AuthService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  get isAdmin(): boolean {
    return this.authService.isAdmin;
  }

  onSubmitNewMeterValue() {
    console.log('Submit new meter value clicked');
    this.componentDisplayService.setActiveComponent(DisplayComponent.SUBMIT_DATA);
  }

  onCheckLatestMeterValues() {
    console.log('Check latest meter values clicked');
    this.componentDisplayService.setActiveComponent(DisplayComponent.LATEST_VALUES);
  }

  // Admin functions
  onGetAllApartments() {
    console.log('Get all apartments clicked');
    this.authService.fetchAllApartments();
    this.componentDisplayService.setActiveComponent(DisplayComponent.EDIT_APARTMENT);
  }

  onEditApartment() {
    console.log('Edit apartment clicked');
    this.authService.fetchAllApartments();
    this.componentDisplayService.setActiveComponent(DisplayComponent.EDIT_APARTMENT);
  }

  onAddApartment() {
    console.log('Add apartment clicked');
    this.componentDisplayService.setActiveComponent(DisplayComponent.ADD_APARTMENT);
  }

  onAddDefault() {
    console.log('Add default meters clicked');
    this.authService.fetchAllApartments();
    this.componentDisplayService.setActiveComponent(DisplayComponent.ADD_DEFAULT);
  }

  onGetAdminLists() {
    console.log('Get value lists clicked');
    this.authService.fetchAllApartments();
    this.componentDisplayService.setActiveComponent(DisplayComponent.GET_ADMIN_LISTS);
  }

  onGetAdminData() {
    console.log('Get Admin Data clicked');
    this.authService.fetchAllApartments();
    this.componentDisplayService.setActiveComponent(DisplayComponent.GET_ADMIN_DATA);
  }

  onDeleteApartment() {
    console.log('Delete apartment clicked');
    this.authService.fetchAllApartments();
    this.componentDisplayService.setActiveComponent(DisplayComponent.DELETE_APARTMENT);
  }

  onSendEmail() {
    console.log('Send email clicked');
    this.authService.fetchAllApartments();
    this.componentDisplayService.setActiveComponent(DisplayComponent.SEND_EMAIL);
  }

  onEditUsers() {
    console.log('Edit users clicked');
    this.componentDisplayService.setActiveComponent(DisplayComponent.EDIT_USER);
  }
}
