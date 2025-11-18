import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  isGuestMode: boolean = false;
  isAuthenticated: boolean = false;
  planes: any[] = [];
  loading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private toastController: ToastController,
    private platform: Platform
  ) {}

  async ngOnInit() {
    // Verificar si estamos en modo invitado (solo una vez)
    this.route.queryParams.subscribe(params => {
      this.isGuestMode = params['mode'] === 'guest';
      // Si estamos en modo invitado, forzar isAuthenticated a false
      if (this.isGuestMode) {
        this.isAuthenticated = false;
      }
    });

    // Verificar si el usuario está autenticado
    await this.checkAuthStatus();
  }

  // Cargar planes cuando la vista está lista
  async ionViewWillEnter() {
    // Cargar planes cuando la vista está a punto de entrar
    await this.loadPlanes();
  }

  async checkAuthStatus() {
    try {
      const session = await this.supabaseService.getSession();
      this.isAuthenticated = !!session?.user;
      console.log('Auth status:', this.isAuthenticated ? 'Authenticated' : 'Not authenticated');
      return this.isAuthenticated;
    } catch (error) {
      console.error('Error checking auth status:', error);
      this.isAuthenticated = false;
      return false;
    }
  }

  // Navegar a la página de login
  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { redirect: '/tabs/planes' }
    });
  }

  async loadPlanes() {
    // Evitar cargar múltiples veces
    if (this.loading) return;
    
    this.loading = true;
    try {
      const { data, error } = await this.supabaseService.getPlanes(true);
      if (error) throw error;
      // Limpiar array antes de asignar nuevos datos
      this.planes = [];
      this.planes = data || [];
    } catch (error: any) {
      console.error('Error al cargar planes:', error);
      
      let errorMessage = 'Error al cargar los planes.';
      if (error?.code === 'CONNECTION_ERROR') {
        errorMessage = 'No se puede conectar a Supabase. Verifica:\n' +
          '1. Tu conexión a internet\n' +
          '2. Que las credenciales en environment.ts sean correctas\n' +
          '3. Que la URL y clave anónima correspondan al mismo proyecto';
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      await this.presentToast(errorMessage, 'danger');
    } finally {
      this.loading = false;
    }
  }

  // Este método debería estar protegido - solo usuarios autenticados pueden contratar
  // TrackBy para evitar problemas con ngFor
  trackByPlanId(index: number, plan: any): any {
    return plan.id || index;
  }

  async contratarPlan(planId: string) {
    // Verificar el estado de autenticación actual
    const isAuthenticated = await this.checkAuthStatus();
    
    if (this.isGuestMode || !isAuthenticated) {
      await this.presentToast('Debes iniciar sesión para contratar un plan', 'warning');
      this.router.navigate(['/login'], {
        queryParams: { 
          redirect: '/tabs/planes',
          planId: planId
        }
      });
      return;
    }

    try {
      const { data, error } = await this.supabaseService.crearContratacion(planId);
      if (error) throw error;

      await this.presentToast('¡Plan contratado exitosamente! Verás el estado en "Mis Planes"', 'success');
      
      // Recargar planes (opcional)
      await this.loadPlanes();
    } catch (error: any) {
      console.error('Error al contratar plan:', error);
      await this.presentToast(
        error.message || 'Error al contratar el plan. Intenta nuevamente.',
        'danger'
      );
    }
  }

  async logout() {
    try {
      // Cerrar sesión solo si el usuario está autenticado
      if (this.isAuthenticated) {
        await this.supabaseService.signOut();
      }
      
      // Redirigir siempre a la página de bienvenida
      this.router.navigate(['/welcome'], { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      this.presentToast('Error al cerrar sesión', 'danger');
      // Asegurarse de redirigir a welcome incluso si hay un error
      this.router.navigate(['/welcome'], { replaceUrl: true });
    }
  }

  private async presentToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
