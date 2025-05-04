import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PopupService } from './popup.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './popup.component.html',
  styleUrls: ['./popup.component.css']
})
export class PopupComponent implements OnInit {
  showPopup = false;
  message = '';

  constructor(private popupService: PopupService) {}

  ngOnInit(): void {
    this.popupService.showPopup$.subscribe(show => {
      this.showPopup = show;
    });

    this.popupService.message$.subscribe(message => {
      this.message = message;
    });
  }

  onOkClick(): void {
    this.popupService.hidePopup();
  }
}
