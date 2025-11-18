import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { map, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdvisorGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) {
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
      }

      const { data: profile, error } = await this.supabase.client
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .single();

      if (error || !profile) {
        console.error('Error fetching user profile:', error);
        this.router.navigate(['/']);
        return false;
      }

      // Allow access if user is admin or advisor
      if (profile.rol === 'asesor_comercial' || profile.rol === 'admin') {
        return true;
      }

      // Redirect to home if user doesn't have permission
      this.router.navigate(['/']);
      return false;
    } catch (error) {
      console.error('Error in AdvisorGuard:', error);
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
}
