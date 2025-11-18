import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  isGuestMode = false;

  constructor(
    private route: ActivatedRoute,
    private authState: AuthStateService
  ) {}

  ngOnInit() {
    // Check if we're in guest mode from the route
    this.route.queryParams.subscribe(params => {
      this.isGuestMode = params['mode'] === 'guest';
      this.authState.setGuestMode(this.isGuestMode);
    });
  }
}
