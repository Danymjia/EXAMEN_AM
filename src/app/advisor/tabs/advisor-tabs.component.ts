import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-advisor-tabs',
  templateUrl: './advisor-tabs.component.html',
  styleUrls: ['./advisor-tabs.component.scss'],
  standalone: false,
})
export class AdvisorTabsComponent {
  activeTab: string = 'planes';
  unreadCount = 0; // For chat notifications

  constructor() {}

  setActiveTab(tab: string) {
    this.activeTab = tab;
  }
}
