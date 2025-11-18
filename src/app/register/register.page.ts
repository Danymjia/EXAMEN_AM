import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController, LoadingController, AlertController } from '@ionic/angular';
import { SupabaseService } from '../services/supabase';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage implements OnInit {
  nombresCompletos: string = '';
  telefono: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';
  loading: boolean = false;

  constructor(
    private router: Router,
    private supabaseService: SupabaseService,
    private toastController: ToastController,
    private loadingController: LoadingController,
    private alertController: AlertController
  ) { }

  ngOnInit() {
  }

  async register() {
    // Validación básica
    if (!this.nombresCompletos || !this.telefono || !this.email || !this.password) {
      await this.presentToast('Por favor completa todos los campos', 'danger');
      return;
    }

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      await this.presentToast('Por favor ingresa un email válido', 'danger');
      return;
    }

    // Validación de contraseña
    if (this.password.length < 6) {
      await this.presentToast('La contraseña debe tener al menos 6 caracteres', 'danger');
      return;
    }

    // Validación de confirmación de contraseña
    if (this.password !== this.confirmPassword) {
      await this.presentToast('Las contraseñas no coinciden', 'danger');
      return;
    }

    // Validación de teléfono (básica)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(this.telefono.replace(/\s/g, ''))) {
      await this.presentToast('Por favor ingresa un teléfono válido (10 dígitos)', 'danger');
      return;
    }

    this.loading = true;
    const loading = await this.loadingController.create({
      message: 'Creando tu cuenta...',
    });
    await loading.present();

    try {
      const { data, error } = await this.supabaseService.signUp(
        this.email,
        this.password,
        this.nombresCompletos,
        this.telefono
      );
      
      if (error) throw error;

      await loading.dismiss();
      
      // Mostrar mensaje de confirmación de email
      const alert = await this.alertController.create({
        header: '¡Cuenta creada exitosamente!',
        message: 'Por favor revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.',
        buttons: [
          {
            text: 'Entendido',
            handler: () => {
              this.router.navigate(['/login']);
            }
          }
        ]
      });
      await alert.present();
    } catch (error: any) {
      await loading.dismiss();
      console.error('Error al registrar:', error);
      await this.presentToast(
        error.message || 'Error al crear la cuenta. Intenta nuevamente.',
        'danger'
      );
    } finally {
      this.loading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/login']);
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
