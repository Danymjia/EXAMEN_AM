import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdvisorGuard } from './guards/advisor.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'welcome',
    pathMatch: 'full'
  },
  {
    path: 'welcome',
    loadChildren: () => import('./welcome/welcome.module').then(m => m.WelcomePageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    runGuardsAndResolvers: 'always',
    canActivate: [AuthGuard]
  },
  {
    path: 'advisor',
    loadChildren: () => import('./advisor/advisor.module').then(m => m.AdvisorModule),
    canActivate: [AuthGuard, AdvisorGuard],
    data: { role: 'asesor_comercial' }
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then(m => m.RegisterPageModule)
  },
  // Ruta especial para invitados que permite ver solo planes
  {
    path: 'guest/planes',
    loadChildren: () => import('./home/home.module').then(m => m.HomePageModule),
    data: { guest: true }
  },
  {
    path: 'perfil',
    loadChildren: () => import('./perfil/perfil.module').then(m => m.PerfilPageModule)
  },
  {
    // Chat solo dentro de tabs de usuario (/tabs/chat) y asesor (/advisor/chat)
    path: 'chat',
    redirectTo: 'tabs/chat',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
