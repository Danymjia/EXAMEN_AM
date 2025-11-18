import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { PlanFormComponent } from '../plan-form/plan-form.component';

import { AdvisorService, Plan } from '../../services/advisor.service';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { SupabaseService } from './../../services/supabase';

@Component({
  selector: 'app-advisor-dashboard',
  templateUrl: './advisor-dashboard.component.html',
  styleUrls: ['./advisor-dashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ]
})
export class AdvisorDashboardComponent implements OnInit {
  plans: Plan[] = [];
  filteredPlans: Plan[] = [];
  solicitudes: any[] = [];
  loading = true;
  selectedSegment = 'planes';
  unreadCount = 0;
  user: any;
  searchTerm = '';

  constructor(
    private advisorService: AdvisorService,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private supabase: SupabaseService,
    private toastCtrl: ToastController
  ) {}

  async ngOnInit() {
    await this.loadUserProfile();
    await this.loadPlans();
    this.filteredPlans = [...this.plans];
    
    // Load solicitudes if that's the default tab
    if (this.selectedSegment === 'solicitudes') {
      await this.loadSolicitudes();
    }
  }

  // Get page title based on active segment
  getPageTitle(): string {
    switch (this.selectedSegment) {
      case 'planes':
        return 'Planes Móviles';
      case 'solicitudes':
        return 'Solicitudes';
      default:
        return 'Panel de Asesor';
    }
  }

  // Handle segment changes
  segmentChanged(ev: any) {
    this.selectedSegment = ev.detail.value;
    if (this.selectedSegment === 'solicitudes') {
      this.loadSolicitudes();
    } else if (this.selectedSegment === 'planes') {
      this.loadPlans();
    }
  }

  // Refresh content
  refreshContent() {
    if (this.selectedSegment === 'planes') {
      this.loadPlans();
    } else if (this.selectedSegment === 'solicitudes') {
      this.loadSolicitudes();
    }
    // Add refresh logic for other segments if needed
  }

  // Filter plans based on search term
  filterPlans(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    if (!searchTerm) {
      this.filteredPlans = [...this.plans];
      return;
    }
    this.filteredPlans = this.plans.filter(plan => 
      plan.nombre_comercial.toLowerCase().includes(searchTerm) ||
      (plan.descripcion && plan.descripcion.toLowerCase().includes(searchTerm))
    );
  }

  // Handle logout
  async logout() {
    try {
      await this.supabase.client.auth.signOut();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during logout:', error);
      const alert = await this.alertCtrl.create({
        header: 'Error',
        message: 'No se pudo cerrar la sesión. Por favor, intente nuevamente.',
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  // Load user profile
  async loadUserProfile() {
    try {
      // Get the authenticated user
      const { data: { user: authUser }, error: authError } = await this.supabase.client.auth.getUser();
      
      if (authError) throw authError;
      if (!authUser) throw new Error('No se encontró el usuario autenticado');

      // Get the advisor's profile data from perfiles table
      const { data: perfil, error: perfilError } = await this.supabase.client
        .from('perfiles')
        .select('nombres_completos, telefono, created_at')
        .eq('id', authUser.id)
        .single();

      if (perfilError) {
        console.error('Error al cargar el perfil del asesor:', perfilError);
        // Continue with partial data if profile fetch fails
      }
      
      // Update the user object with the profile data
      this.user = {
        id: authUser.id,
        email: authUser.email || 'Sin correo',
        nombre: perfil?.nombres_completos || 'Asesor Comercial',
        telefono: perfil?.telefono || 'No especificado',
        created_at: perfil?.created_at || new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error al cargar el perfil del asesor:', error);
      this.user = { 
        id: 'error',
        email: 'Error al cargar',
        nombre: 'Asesor Comercial',
        telefono: 'No disponible',
        created_at: new Date().toISOString()
      };
    }
  }

  // Handle password change
  async changePassword() {
    try {
      // Add your password change logic here
      console.log('Changing password...');
      // Example: this.authService.changePassword();
    } catch (error) {
      console.error('Error changing password:', error);
    }
  }

  async loadPlans() {
    this.loading = true;
    try {
      const { data: planes, error } = await this.supabase.client
        .from('planes_moviles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      this.plans = planes || [];
      this.filteredPlans = [...this.plans];
    } catch (error) {
      console.error('Error loading plans:', error);
      this.showError('Error al cargar los planes');
    } finally {
      this.loading = false;
    }
  }

  async loadSolicitudes() {
    this.loading = true;
    try {
      // First, get the contrataciones with plan details
      const { data: contrataciones, error } = await this.supabase.client
        .from('contrataciones')
        .select(`
          *,
          planes_moviles(*)
        `)
        .order('fecha_contratacion', { ascending: false });

      if (error) throw error;
      
      if (contrataciones && contrataciones.length > 0) {
        // Get all user IDs from contrataciones
        const userIds = [...new Set(contrataciones.map(c => c.usuario_id))];
        
        // Get user profiles
        const { data: perfiles, error: perfilesError } = await this.supabase.client
          .from('perfiles')
          .select('*')
          .in('id', userIds);
          
        if (perfilesError) throw perfilesError;
        
        // Create a map of user_id to profile
        const perfilesMap = new Map(perfiles?.map(p => [p.id, p]));
        
        // Combine the data
        this.solicitudes = contrataciones.map(contratacion => ({
          ...contratacion,
          plan: contratacion.planes_moviles,
          usuario: perfilesMap.get(contratacion.usuario_id) || { nombres_completos: 'Cliente' },
          fecha_solicitud: contratacion.fecha_contratacion,
          estado: contratacion.estado || 'pendiente'
        }));
      } else {
        this.solicitudes = [];
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      this.showError('Error al cargar las solicitudes');
    } finally {
      this.loading = false;
    }
  }

  async actualizarEstadoSolicitud(solicitud: any, nuevoEstado: string) {
    try {
      const { data, error } = await this.supabase.client
        .from('contrataciones')
        .update({
          estado: nuevoEstado.toLowerCase(),
          fecha_aprobacion: new Date().toISOString(),
          aprobado_por: this.user.id
        })
        .eq('id', solicitud.id)
        .select();

      if (error) throw error;
      
      // Refresh the requests list
      await this.loadSolicitudes();
      
      // Show success message
      this.showError(`Solicitud ${nuevoEstado.toLowerCase()} correctamente`);
    } catch (error) {
      console.error('Error updating request status:', error);
      this.showError('Error al actualizar el estado de la solicitud');
    }
  }

  getEstadoColor(estado: string): string {
    const estadoLower = estado?.toLowerCase();
    switch (estadoLower) {
      case 'aprobada':
        return 'success';
      case 'rechazada':
      case 'cancelada':
        return 'danger';
      case 'pendiente':
        return 'warning';
      default:
        return 'medium';
    }
  }

  async iniciarChat(contratacionId: string) {
    try {
      // Get the current user
      const user = await this.supabase.getCurrentUser();
      if (!user) {
        this.showError('Debes iniciar sesión para usar el chat');
        return;
      }

      // Navigate to the advisor chat tab with the contratacionId
      this.router.navigate(['/advisor/chat'], { 
        queryParams: { 
          contratacionId: contratacionId
        } 
      });
    } catch (error) {
      console.error('Error al iniciar el chat:', error);
      this.showError('Error al iniciar el chat');
    }
  }

  async openPlanForm(plan?: Plan) {
    const modal = await this.modalCtrl.create({
      component: PlanFormComponent,
      componentProps: { plan: plan ? { ...plan } : null },
      backdropDismiss: false,
      cssClass: 'auto-height',
      mode: 'ios'
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    
    if (data) {
      this.loadPlans();
    }
  }

  async deletePlan(plan: Plan) {
    const alert = await this.alertCtrl.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de eliminar el plan ${plan.nombre_comercial}?`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          handler: async () => {
            const loading = await this.loadingCtrl.create({
              message: 'Eliminando plan...',
            });
            await loading.present();

            try {
              await this.advisorService.deletePlan(plan.id!);
              this.loadPlans();
            } catch (error) {
              console.error('Error deleting plan:', error);
              this.showError('Error al eliminar el plan');
            } finally {
              await loading.dismiss();
            }
          },
        },
      ],
    });

    await alert.present();
  }

  togglePlanStatus(plan: Plan) {
    this.advisorService.updatePlan(plan.id!, { activo: !plan.activo })
      .catch(error => {
        console.error('Error updating plan status:', error);
        this.showError('Error al actualizar el estado del plan');
        // Revert the change on error
        plan.activo = !plan.activo;
      });
  }

  private async showError(message: string) {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
