import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private showPopupSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string>('');

  showPopup$ = this.showPopupSubject.asObservable();
  message$ = this.messageSubject.asObservable();

  constructor() { }

  showPopup(message: string): void {
    this.messageSubject.next(message);
    this.showPopupSubject.next(true);
  }

  hidePopup(): void {
    this.showPopupSubject.next(false);
  }
}
