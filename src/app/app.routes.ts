import { Routes } from '@angular/router';
import { LoginComponent } from './main/login/login.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'localhost:8080/api/v1', redirectTo: '/login', pathMatch: 'full' }
];
