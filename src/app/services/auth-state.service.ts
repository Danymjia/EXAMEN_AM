import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {
  private isGuestModeSubject = new BehaviorSubject<boolean>(false);
  isGuestMode$ = this.isGuestModeSubject.asObservable();

  setGuestMode(isGuest: boolean) {
    this.isGuestModeSubject.next(isGuest);
  }

  getGuestMode(): boolean {
    return this.isGuestModeSubject.value;
  }
}
