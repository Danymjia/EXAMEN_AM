import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MisPlanesPageRoutingModule } from './mis-planes-routing.module';

import { MisPlanesPage } from './mis-planes.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MisPlanesPageRoutingModule
  ],
  declarations: [MisPlanesPage]
})
export class MisPlanesPageModule {}
