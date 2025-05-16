import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { SubmitDataComponent } from './submit-data/submit-data.component';
import { LatestValuesComponent } from './latest-values/latest-values.component';
import { EditApartmentComponent } from './edit-apartment/edit-apartment.component';
import { AddApartmentComponent } from './add-apartment/add-apartment.component';
import { AddDefaultComponent } from './add-default/add-default.component';
import { GetAdminDataComponent } from './get-admin-data/get-admin-data.component';
import { GetAdminListsComponent } from './get-admin-lists/get-admin-lists.component';
import { DeleteApartmentComponent } from './delete-apartment/delete-apartment.component';
import { SendEmailComponent } from './send-email/send-email.component';
import { EditUserComponent } from './edit-user/edit-user.component';
import { AdminSubmitDataComponent } from './admin-submit-data/admin-submit-data.component';
import { AuthService } from '../core/auth.service';
import { ComponentDisplayService, DisplayComponent } from '../core/component-display.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    LoginComponent,
    UserMenuComponent,
    SubmitDataComponent,
    LatestValuesComponent,
    EditApartmentComponent,
    AddApartmentComponent,
    AddDefaultComponent,
    GetAdminDataComponent,
    GetAdminListsComponent,
    DeleteApartmentComponent,
    SendEmailComponent,
    EditUserComponent,
    AdminSubmitDataComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {
  private authService = inject(AuthService);
  private componentDisplayService = inject(ComponentDisplayService);
  isLoggedIn$ = this.authService.isLoggedIn$;
  activeComponent$ = this.componentDisplayService.activeComponent$;
  DisplayComponent = DisplayComponent;
}
