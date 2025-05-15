import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export enum DisplayComponent {
  SUBMIT_DATA = 'submit-data',
  LATEST_VALUES = 'latest-values',
  EDIT_APARTMENT = 'edit-apartment',
  ADD_APARTMENT = 'add-apartment',
  ADD_DEFAULT = 'add-default',
  GET_ADMIN_DATA = 'get-admin-data',
  GET_ADMIN_LISTS = 'get-admin-lists',
  DELETE_APARTMENT = 'delete-apartment',
  SEND_EMAIL = 'send-email',
  EDIT_USER = 'edit-user'
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
