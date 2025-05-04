import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum DisplayComponent {
  SUBMIT_DATA = 'submit-data',
  LATEST_VALUES = 'latest-values'
}

@Injectable({
  providedIn: 'root'
})
export class ComponentDisplayService {
  private activeComponentSubject = new BehaviorSubject<DisplayComponent>(DisplayComponent.SUBMIT_DATA);
  activeComponent$ = this.activeComponentSubject.asObservable();

  constructor() { }

  setActiveComponent(component: DisplayComponent): void {
    this.activeComponentSubject.next(component);
  }

  get activeComponent(): DisplayComponent {
    return this.activeComponentSubject.value;
  }
}
