import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MisPlanesPage } from './mis-planes.page';

const routes: Routes = [
  {
    path: '',
    component: MisPlanesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MisPlanesPageRoutingModule {}
