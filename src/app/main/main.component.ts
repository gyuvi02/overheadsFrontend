import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { SubmitDataComponent } from './submit-data/submit-data.component';
import { LatestValuesComponent } from './latest-values/latest-values.component';
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
    LatestValuesComponent
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
