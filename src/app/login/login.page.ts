import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastController, LoadingController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  email: string = '';
  password: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private supabaseService: SupabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }

  async login() {
    // Validación básica
    if (!this.email || !this.password) {
      await this.presentToast('Por favor completa todos los campos', 'danger');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      await this.presentToast('Por favor ingresa un email válido', 'danger');
      return;
    }

    const loading = await this.loadingController.create({
      message: 'Iniciando sesión...',
    });
    
    try {
      await loading.present();
      
      const { data, error } = await this.supabaseService.signIn(this.email, this.password);
      
      if (error) throw error;

      // Verificar el rol del usuario desde la respuesta
      const userRole = data?.user?.user_metadata?.role;
      
      // Cerrar el loading antes de la navegación
      await loading.dismiss();
      
      if (userRole === 'asesor_comercial') {
        this.router.navigate(['/advisor']);
      } else {
        // Redirigir a la página principal para usuarios normales
        this.router.navigate(['/tabs/planes']);
      }
      
      await this.presentToast('Sesión iniciada correctamente');
    } catch (error: any) {
      console.error('Error en login:', error);
      const errorMessage = error.message || 'Error al iniciar sesión';
      
      // Asegurarse de que el loading se cierre en caso de error
      if (loading) {
        await loading.dismiss();
      }
      
      await this.presentToast(
        errorMessage || 'Error al iniciar sesión. Verifica tus credenciales.',
        'danger'
      );
    }
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToWelcome() {
    this.router.navigate(['/welcome']);
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
