import { Component } from '@angular/core';
import {LoginComponent} from './login/login.component';

@Component({
  selector: 'app-main',
  imports: [
    LoginComponent
  ],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent {

}
