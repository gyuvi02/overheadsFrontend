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

  onSubmitNewMeterValue() {
    console.log('Submit new meter value clicked');
    this.componentDisplayService.setActiveComponent(DisplayComponent.SUBMIT_DATA);
  }

  onCheckLatestMeterValues() {
    console.log('Check latest meter values clicked');
    this.componentDisplayService.setActiveComponent(DisplayComponent.LATEST_VALUES);
  }
}
