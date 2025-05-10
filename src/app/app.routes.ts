import { Routes } from '@angular/router';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'me', component: MainComponent, canActivate: [authGuard] },
  { path: 'localhost:8080/api/v1', redirectTo: '/login', pathMatch: 'full' }
];
