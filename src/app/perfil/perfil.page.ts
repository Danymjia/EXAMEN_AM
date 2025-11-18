import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: false,
})
export class PerfilPage implements OnInit {
  nombresCompletos: string = '';
  telefono: string = '';
  email: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastController: ToastController
  ) { }

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    this.loading = true;
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        await this.presentToast('Debes iniciar sesión', 'warning');
        return;
      }

      this.email = user.email || '';
      
      // Intentar cargar el perfil
      try {
        const { data: profile, error } = await this.supabaseService.getProfile(user.id);
        if (error) {
          console.warn('Error al obtener perfil:', error);
          // Si no existe el perfil, intentar actualizar con datos vacíos para crearlo
          return;
        }
        
        if (profile) {
          this.nombresCompletos = profile.nombres_completos || '';
          this.telefono = profile.telefono || '';
          console.log('Perfil cargado:', { nombresCompletos: this.nombresCompletos, telefono: this.telefono });
        }
      } catch (profileError: any) {
        console.error('Error al obtener perfil:', profileError);
        // Continuar sin mostrar error si el perfil no existe aún
      }
    } catch (error: any) {
      console.error('Error al cargar perfil:', error);
      await this.presentToast('Error al cargar el perfil', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async ionViewWillEnter() {
    // Recargar perfil cada vez que se entra a la página
    await this.loadProfile();
  }

  async doRefresh(event: any) {
    await this.loadProfile();
    event.target.complete();
  }

  async logout() {
    try {
      const { error } = await this.supabaseService.signOut();
      if (error) throw error;

      await this.presentToast('Sesión cerrada exitosamente', 'success');
      
      // Redirigir a la página de bienvenida
      this.router.navigate(['/welcome']);
    } catch (error: any) {
      console.error('Error al cerrar sesión:', error);
      await this.presentToast('Error al cerrar sesión', 'danger');
    }
  }

  async cerrarSesion() {
    await this.logout();
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
