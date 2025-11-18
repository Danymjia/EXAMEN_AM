import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { ToastController } from '@ionic/angular';

@Component({
  selector: 'app-mis-planes',
  templateUrl: './mis-planes.page.html',
  styleUrls: ['./mis-planes.page.scss'],
  standalone: false,
})
export class MisPlanesPage implements OnInit {
  contrataciones: any[] = [];
  loading: boolean = false;

  constructor(
    private supabaseService: SupabaseService,
    private toastController: ToastController,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadContrataciones();
  }

  async loadContrataciones() {
    this.loading = true;
    try {
      const user = await this.supabaseService.getCurrentUser();
      if (!user) {
        await this.presentToast('Debes iniciar sesión para ver tus planes', 'warning');
        return;
      }

      const { data, error } = await this.supabaseService.client
        .from('contrataciones')
        .select(`
          *,
          planes_moviles (
            id,
            nombre_comercial,
            precio,
            datos_moviles,
            minutos_voz
          )
        `)
        .eq('usuario_id', user.id)
        .order('fecha_contratacion', { ascending: false });

      if (error) throw error;
      this.contrataciones = data || [];
    } catch (error: any) {
      console.error('Error al cargar contrataciones:', error);
      await this.presentToast('Error al cargar tus planes contratados', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async doRefresh(event: any) {
    await this.loadContrataciones();
    event.target.complete();
  }

  // TrackBy para evitar problemas con ngFor
  trackByContratacionId(index: number, contratacion: any): any {
    return contratacion.id || index;
  }

  getEstadoColor(estado: string): string {
    const estados: { [key: string]: string } = {
      'pendiente': 'warning',
      'aprobada': 'success',
      'rechazada': 'danger',
      'cancelada': 'medium'
    };
    return estados[estado] || 'medium';
  }

  // Navegar a los detalles del plan
  verDetallesPlan(contratacion: any) {
    if (contratacion?.id) {
      this.router.navigate(['/tabs/planes/detalle', contratacion.id]);
    }
  }

  // Manejar clic en el botón de chat
  async iniciarChat(event: Event, contratacion: any) {
    event.stopPropagation(); // Evitar que se active el clic de la tarjeta
    if (contratacion?.id) {
      this.router.navigate(['/tabs/chat'], {
        queryParams: { contratacionId: contratacion.id }
      });
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
