import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';
import { BehaviorSubject } from 'rxjs';

export interface Plan {
  id?: string;
  nombre_comercial: string;
  descripcion: string;
  precio: number;
  datos_moviles: string;
  minutos_voz: string;
  segmento?: string;
  publico_objetivo?: string;
  sms?: string;
  velocidad_4g?: string;
  velocidad_5g?: string;
  redes_sociales?: string;
  whatsapp?: string;
  llamadas_internacionales?: string;
  roaming?: string;
  activo: boolean;
  imagen_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdvisorService {
  private plansSubject = new BehaviorSubject<Plan[]>([]);
  plans$ = this.plansSubject.asObservable();

  constructor(private supabase: SupabaseService) {}

  async loadPlans() {
    const { data, error } = await this.supabase.client
      .from('planes_moviles')
      .select('*')
      .order('precio', { ascending: true });
    
    if (error) throw error;
    const plans = data || [];
    this.plansSubject.next(plans);
    return plans;
  }

  async createPlan(plan: Omit<Plan, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await this.supabase.client
      .from('planes_moviles')
      .insert([{ ...plan, activo: true }])
      .select();
      
    if (error) throw error;
    await this.loadPlans();
    return data?.[0];
  }

  async updatePlan(id: string, updates: Partial<Plan>) {
    const { data, error } = await this.supabase.client
      .from('planes_moviles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();
      
    if (error) throw error;
    await this.loadPlans();
    return data?.[0];
  }

  async deletePlan(id: string) {
    const { error } = await this.supabase.client
      .from('planes_moviles')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    await this.loadPlans();
  }

  async uploadPlanImage(file: File, planId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${planId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await this.supabase.client.storage
      .from('planes-imagenes')
      .upload(fileName, file);
      
    if (error) throw error;
    
    // Obtener URL pública
    const { data: publicData } = this.supabase.client.storage
      .from('planes-imagenes')
      .getPublicUrl(fileName);

    return publicData.publicUrl;
  }
}
