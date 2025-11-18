import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    // Validar que las credenciales estén configuradas
    if (!environment.supabase.url || !environment.supabase.anonKey) {
      console.error('ERROR: Las credenciales de Supabase no están configuradas en environment.ts');
      throw new Error('Configura las credenciales de Supabase en environment.ts');
    }

    // Validar formato de URL
    if (!environment.supabase.url.startsWith('https://') || !environment.supabase.url.includes('.supabase.co')) {
      console.error('ERROR: La URL de Supabase parece estar mal configurada:', environment.supabase.url);
    }

    console.log('🔌 Conectando a Supabase:', environment.supabase.url);

    const w = window as any;
    if (!w.__sbClient) {
      w.__sbClient = createClient(
        environment.supabase.url,
        environment.supabase.anonKey,
        {
          auth: {
            storageKey: 'sb-examen-ma-auth-token',
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
          },
        }
      );
    }

    this.supabase = w.__sbClient as SupabaseClient;
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  // Métodos de Autenticación
  async signUp(
    email: string,
    password: string,
    nombresCompletos?: string,
    telefono?: string
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: nombresCompletos || '',
          phone: telefono || ''
        }
      }
    });
    
    if (error) throw error;
    
    // El trigger crea el perfil automáticamente, solo actualizamos con datos adicionales si se proporcionan
    if (data.user && (nombresCompletos || telefono)) {
      // Esperar un momento para que el trigger termine de crear el perfil
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Intentar actualizar el perfil con los datos adicionales (hasta 3 intentos)
      let intentos = 0;
      const maxIntentos = 3;
      let actualizado = false;

      while (intentos < maxIntentos && !actualizado) {
        try {
          // Usar los nombres de campos correctos para la tabla perfiles
          const { error: updateError } = await this.supabase
            .from('perfiles')
            .update({
              nombres_completos: nombresCompletos || null,
              telefono: telefono || null,
              rol: 'asesor_comercial', // Asegurarnos de que el rol sea asesor_comercial
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id);

          if (updateError) throw updateError;
          
          actualizado = true;
          console.log('Perfil actualizado correctamente con nombres y teléfono');
        } catch (updateError: any) {
          intentos++;
          console.warn(`Intento ${intentos} de actualizar perfil falló:`, updateError);
          
          if (intentos < maxIntentos) {
            // Esperar un poco más antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, 500));
          } else {
            // Si no se pudo actualizar después de varios intentos, intentar crear
            try {
              const { error: createError } = await this.supabase
                .from('perfiles')
                .insert([
                  {
                    id: data.user.id,
                    email: email,
                    rol: 'asesor_comercial',
                    nombres_completos: nombresCompletos || null,
                    telefono: telefono || null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                  }
                ]);
                
              if (createError) throw createError;
              
              console.log('Perfil creado manualmente con nombres y teléfono');
            } catch (createError) {
              console.error('Error al crear perfil:', createError);
              // No lanzar error, el perfil se creará automáticamente por el trigger
            }
          }
        }
      }
    }
    
    return { data, error };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (data?.user) {
      // Obtener el perfil del usuario
      const { data: profile } = await this.supabase
        .from('perfiles')
        .select('rol')
        .eq('id', data.user.id)
        .single();
      
      // Agregar el rol al objeto de retorno
      return { 
        data: { 
          ...data, 
          user: { 
            ...data.user, 
            user_metadata: { 
              ...data.user.user_metadata, 
              role: profile?.rol 
            } 
          } 
        }, 
        error 
      };
    }
    
    return { data, error };
  }

  async signOut() {
    return await this.supabase.auth.signOut();
  }

  async getCurrentUser() {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user;
  }

  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession();
    return session;
  }

  // Métodos de Perfil
  async createProfile(
    userId: string, 
    role: string = 'usuario_registrado',
    nombresCompletos?: string,
    telefono?: string
  ) {
    // Verificar si el perfil ya existe (creado por el trigger)
    const { data: existingProfile } = await this.supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // Si ya existe, actualizarlo con los datos adicionales
      return await this.updateProfile(userId, {
        nombres_completos: nombresCompletos || undefined,
        telefono: telefono || undefined
      });
    }

    // Si no existe, crearlo
    const { data, error } = await this.supabase
      .from('perfiles')
      .insert([
        {
          id: userId,
          rol: role,
          nombres_completos: nombresCompletos || undefined,
          telefono: telefono || undefined,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error };
  }

  async updateProfile(userId: string, updates: { nombres_completos?: string; telefono?: string }) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error };
  }

  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('perfiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return { data, error };
  }

  // Métodos de Contrataciones
  async crearContratacion(planId: string) {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuario no autenticado');

    const { data, error } = await this.supabase
      .from('contrataciones')
      .insert([
        {
          usuario_id: user.id,
          plan_id: planId,
          estado: 'pendiente'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error };
  }

  // Métodos de Planes
  async getPlanes(activos: boolean = true) {
    try {
      let query = this.supabase
        .from('planes_moviles')
        .select('*')
        .order('precio', { ascending: true });

      if (activos) {
        query = query.eq('activo', true);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error de Supabase al obtener planes:', error);
        throw error;
      }
      return { data, error };
    } catch (error: any) {
      // Si es un error de red/conexión, proporcionar mensaje más claro
      if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        const connectionError: any = new Error('No se puede conectar a Supabase. Verifica tu conexión a internet y las credenciales en environment.ts');
        connectionError.code = 'CONNECTION_ERROR';
        throw connectionError;
      }
      throw error;
    }
  }

  async getPlan(id: string) {
    const { data, error } = await this.supabase
      .from('planes_moviles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return { data, error };
  }

  // Métodos de Storage
  async uploadPlanImage(file: File, planId: string) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${planId}_${Date.now()}.${fileExt}`;

    const { data, error } = await this.supabase.storage
      .from('planes-imagenes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: publicData } = this.supabase.storage
      .from('planes-imagenes')
      .getPublicUrl(fileName);

    return { data, error, publicUrl: publicData.publicUrl };
  }

  async deletePlanImage(fileName: string) {
    const { data, error } = await this.supabase.storage
      .from('planes-imagenes')
      .remove([fileName]);

    if (error) throw error;
    return { data, error };
  }

  // Observador de cambios en autenticación
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return this.supabase.auth.onAuthStateChange(callback);
  }
}
