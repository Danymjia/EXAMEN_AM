import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdvisorTabsComponent } from './tabs/advisor-tabs.component';
import { AdvisorDashboardComponent } from './advisor-dashboard/advisor-dashboard.component';
import { AuthGuard } from '../guards/auth.guard';
import { AdvisorGuard } from '../guards/advisor.guard';

const routes: Routes = [
  {
    path: '',
    component: AdvisorTabsComponent,
    canActivate: [AuthGuard, AdvisorGuard],
    children: [
      {
        path: '',
        redirectTo: 'planes',
        pathMatch: 'full'
      },
      {
        path: 'planes',
        component: AdvisorDashboardComponent,
        data: { title: 'Planes' }
      },
      {
        path: 'chat',
        loadChildren: () => import('../chat/chat.module').then(m => m.ChatPageModule),
        data: { title: 'Chats' }
      },
      {
        path: 'perfil',
        loadChildren: () => import('../perfil/perfil.module').then(m => m.PerfilPageModule),
        data: { title: 'Perfil' }
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class AdvisorRoutingModule { }
