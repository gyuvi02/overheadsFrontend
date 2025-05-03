import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/auth.service';
import { ButtonComponent } from '../../shared/button/button.component';

@Component({
  selector: 'app-user-menu',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.css']
})
export class UserMenuComponent {
  private authService = inject(AuthService);
  isLoggedIn$ = this.authService.isLoggedIn$;

  onSubmitNewMeterValue() {
    console.log('Submit new meter value clicked');
    // Additional logic can be added here
  }

  onCheckLatestMeterValues() {
    console.log('Check latest meter values clicked');
    // Additional logic can be added here
  }
}
