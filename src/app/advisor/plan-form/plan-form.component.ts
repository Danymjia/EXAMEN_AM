import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonicModule, ModalController } from '@ionic/angular';

import { AdvisorService, Plan } from '../../services/advisor.service';

@Component({
  selector: 'app-plan-form',
  templateUrl: './plan-form.component.html',
  styleUrls: ['./plan-form.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule
  ]
})
export class PlanFormComponent implements OnInit {
  @Input() plan?: Plan;
  planForm: FormGroup;
  isSubmitting = false;
  imageFile?: File;
  previewImage: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private modalCtrl: ModalController,
    private advisorService: AdvisorService
  ) {
    this.planForm = this.fb.group({
      nombre_comercial: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.maxLength(500)]],
      precio: [0, [Validators.required, Validators.min(0)]],
      datos_moviles: ['', [Validators.required]],
      minutos_voz: ['', [Validators.required]],
      segmento: [''],
      publico_objetivo: [''],
      sms: [''],
      velocidad_4g: [''],
      velocidad_5g: [''],
      redes_sociales: [''],
      whatsapp: [''],
      llamadas_internacionales: [''],
      roaming: [''],
      imagen_url: ['']
    });
  }

  ngOnInit() {
    if (this.plan) {
      this.planForm.patchValue(this.plan);
      if (this.plan.imagen_url) {
        this.previewImage = this.plan.imagen_url;
      }
    }
  }

  async onSubmit() {
    if (this.planForm.invalid) return;
    
    this.isSubmitting = true;
    const formValue = this.planForm.value;
    
    try {
      let imageUrl = this.plan?.imagen_url;
      
      // Upload new image if selected
      if (this.imageFile) {
        imageUrl = await this.advisorService.uploadPlanImage(this.imageFile, this.plan?.id || 'new');
      }
      
      const planData = {
        ...formValue,
        imagen_url: imageUrl
      };
      
      if (this.plan) {
        await this.advisorService.updatePlan(this.plan.id!, planData);
      } else {
        await this.advisorService.createPlan(planData);
      }
      
      this.modalCtrl.dismiss({ success: true });
    } catch (error) {
      console.error('Error saving plan:', error);
      // Show error to user
    } finally {
      this.isSubmitting = false;
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imageFile = input.files[0];
      
      // Create preview
      const reader = new FileReader();
      reader.onload = () => {
        this.previewImage = reader.result;
      };
      reader.readAsDataURL(this.imageFile);
    }
  }

  cancel() {
    this.modalCtrl.dismiss();
  }
}
