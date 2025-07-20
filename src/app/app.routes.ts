import { Routes } from '@angular/router';
import { LoginComponent } from './main/login/login.component';
import { MainComponent } from './main/main.component';
import { RegisterMeComponent } from './main/register-me/register-me.component';
import { NotFoundComponent } from './not-found/not-found.component';
import { authGuard } from './core/auth.guard';
import { environment } from '../environments/environment';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'me', component: MainComponent, canActivate: [authGuard] },
  { path: 'registerMe', component: RegisterMeComponent },
  { path: environment.apiBaseUrl, redirectTo: '/login', pathMatch: 'full' },
  { path: '**', component: NotFoundComponent } // Wildcard route for 404 page
];
