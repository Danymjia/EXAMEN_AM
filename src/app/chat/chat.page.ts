// src/app/chat/chat.page.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.page.html',
  styleUrls: ['./chat.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ChatPage implements OnInit, OnDestroy {
  conversations: any[] = [];
  selectedConversation: any = null;
  mensajes: any[] = [];
  nuevoMensaje: string = '';
  loading: boolean = true;
  userId: string | null = null;
  private subscription: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private toastController: ToastController
  ) { }

  // In chat.page.ts, update the ngOnInit method
  async ngOnInit() {
  const user = await this.supabaseService.getCurrentUser();
  this.userId = user?.id || null;
  // ... rest of the code
    
    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    await this.loadConversations();
    this.setupRealtime();
    
    // Check for conversation ID in route
    this.route.queryParams.subscribe(async params => {
      const contratacionId = params['contratacionId'];
      if (contratacionId) {
        await this.selectConversation(contratacionId);
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  // Volver a la lista de conversaciones
  goBack() {
    this.selectedConversation = null;
  }

// In chat.page.ts, update the loadConversations method
async loadConversations() {
  this.loading = true;
  try {
    // Get current user's session to check if they're an advisor
    const { data: { user }, error: userError } = await this.supabaseService.client.auth.getUser();
    
    if (userError) throw userError;
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }

    const isAdvisor = user.user_metadata?.['tipo_usuario'] === 'asesor';

    // Get contrataciones where user is either client or advisor
    let query = this.supabaseService.client
      .from('contrataciones')
      .select(`
        id,
        estado,
        fecha_contratacion,
        usuario_id,
        aprobado_por,
        plan:plan_id(
          nombre_comercial,
          precio
        )
      `);

    if (isAdvisor) {
      query = query.eq('aprobado_por', user.id);
    } else {
      query = query.eq('usuario_id', user.id);
    }

    const { data: contrataciones, error } = await query
      .order('fecha_contratacion', { ascending: false });

    if (error) throw error;

    // Get all messages for these contracts
    const contratacionIds = contrataciones?.map(c => c.id) || [];
    let allMessages: any[] = [];

    if (contratacionIds.length > 0) {
      const { data: messages, error: messagesError } = await this.supabaseService.client
        .from('mensajes_chat')
        .select('*')
        .in('contratacion_id', contratacionIds);

      if (messagesError) throw messagesError;
      allMessages = messages || [];
    }

    // Get user profiles for all involved users
    const userIds = [
      ...new Set([
        ...contrataciones.map((c: any) => c.usuario_id),
        ...contrataciones.map((c: any) => c.aprobado_por).filter(Boolean),
        ...allMessages.map((m: any) => m.usuario_id)
      ])
    ];

    let profiles: Record<string, any> = {};
    
    // For each user ID, get their profile using auth.admin.getUserById
    // This requires the service role key, so we'll use a safer approach
    // by creating a serverless function or using RPC if you need this feature
    // For now, we'll just use the user ID and email
    profiles[user.id] = {
      name: user.user_metadata?.['nombres'] || user.email?.split('@')[0] || 'Usuario',
      email: user.email
    };

    // Process conversations
    this.conversations = (contrataciones || []).map((chat: any) => {
      const messages = allMessages.filter((m: any) => m.contratacion_id === chat.id);
      const lastMessage = messages.length > 0 
        ? messages.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0]
        : null;

      const isClient = chat.usuario_id === user.id;
      const otherUserId = isClient ? chat.aprobado_por : chat.usuario_id;
      const otherUser = otherUserId ? profiles[otherUserId] : null;

      const unreadCount = messages.filter((m: any) => 
        !m.leido && m.usuario_id !== user.id
      ).length;

      return {
        id: chat.id,
        planName: chat.plan?.nombre_comercial || 'Plan sin nombre',
        lastMessage: lastMessage ? {
          text: lastMessage.mensaje,
          date: lastMessage.created_at,
          isMe: lastMessage.usuario_id === user.id
        } : null,
        unreadCount,
        otherUser: {
          id: otherUserId,
          name: otherUser?.name || (isClient ? 'Asesor' : 'Cliente'),
          email: otherUser?.email
        },
        status: chat.estado,
        updatedAt: lastMessage?.created_at || chat.fecha_contratacion
      };
    });

    // Sort by last message date
    this.conversations.sort((a: any, b: any) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

  } catch (error) {
    console.error('Error loading conversations:', error);
    this.showError('Error al cargar las conversaciones');
  } finally {
    this.loading = false;
  }
}

async selectConversation(contratacionId: string) {
  this.selectedConversation = this.conversations.find((c: any) => c.id === contratacionId);
  if (!this.selectedConversation) return;

  try {
    const { data: messages, error } = await this.supabaseService.client
      .from('mensajes_chat')
      .select('*')
      .eq('contratacion_id', contratacionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    this.mensajes = messages || [];
    this.scrollToBottom();

    // Mark messages as read
    const unreadMessages = this.mensajes.filter((m: any) => !m.leido && m.usuario_id !== this.userId);
    if (unreadMessages.length > 0) {
      await this.markAsRead(unreadMessages.map((m: any) => m.id));
    }

  } catch (error) {
    console.error('Error loading messages:', error);
    this.showError('Error al cargar los mensajes');
  }
}

async enviarMensaje() {
  if (!this.nuevoMensaje.trim() || !this.selectedConversation || !this.userId) return;

  const messageText = this.nuevoMensaje.trim();
  this.nuevoMensaje = '';

  try {
    const { data, error } = await this.supabaseService.client
      .from('mensajes_chat')
      .insert([{
        contratacion_id: this.selectedConversation.id,
        usuario_id: this.userId,
        mensaje: messageText,
        leido: false
      }])
      .select();

    if (error) throw error;

    if (data && data.length > 0) {
      this.mensajes = [...this.mensajes, data[0]];
      this.scrollToBottom();
      // Update the last message in the conversation
      await this.loadConversations();
    }
  } catch (error) {
    console.error('Error sending message:', error);
    this.nuevoMensaje = messageText; // Restore the message if sending fails
    this.showError('Error al enviar el mensaje');
  }
}

  private setupRealtime() {
    this.subscription = this.supabaseService.client
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes_chat',
          filter: `usuario_id=neq.${this.userId}`
        },
        (payload: any) => {
          const newMessage = payload.new;
          // If this message is for the current conversation
          if (this.selectedConversation?.id === newMessage.contratacion_id) {
            this.mensajes.push(newMessage);
            this.scrollToBottom();
            // Mark as read
            this.markAsRead([newMessage.id]);
          }
          // Update conversation list
          this.loadConversations();
        }
      )
      .subscribe();
  }

  private async markAsRead(messageIds: string[]) {
    try {
      await this.supabaseService.client
        .from('mensajes_chat')
        .update({ leido: true })
        .in('id', messageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  private scrollToBottom() {
    setTimeout(() => {
      const content = document.querySelector('.messages-container');
      if (content) {
        content.scrollTop = content.scrollHeight;
      }
    }, 100);
  }

  private async showError(message: string) {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  formatConversationDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Hoy';
    } else if (diffDays === 1) {
      return 'Ayer';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('es-ES', { weekday: 'long' });
    } else {
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    }
  }
}