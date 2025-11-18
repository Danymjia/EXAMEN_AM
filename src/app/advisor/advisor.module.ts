import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { AdvisorRoutingModule } from './advisor-routing.module';
import { AdvisorTabsComponent } from './tabs/advisor-tabs.component';

@NgModule({
  declarations: [AdvisorTabsComponent],
  imports: [
    CommonModule,
    IonicModule,
    AdvisorRoutingModule
  ]
})
export class AdvisorModule {}
