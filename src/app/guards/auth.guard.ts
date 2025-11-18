import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    // Si es una ruta de invitado, permitir el acceso
    if (next.data['guest'] === true) {
      return true;
    }

    const user = await this.supabase.getCurrentUser();
    
    if (!user) {
      // Not logged in, redirect to login page with the return url
      this.router.navigate(['/login'], { 
        queryParams: { 
          returnUrl: state.url 
        } 
      });
      return false;
    }
    
    return true;
  }
}
