import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { SupabaseService } from '../core/supabase.service';

@Directive({
  selector: '[appMostrarAdmin]',
  standalone: true
})
export class MostrarAdminDirective {

   constructor( private templateRef: TemplateRef<any>, private viewContainer: ViewContainerRef, private supabaseService: SupabaseService) {}

   async ngOnInit() {
    const user = await this.supabaseService.getUsuarioActual();
    const esAdmin = user?.rol === 'admin';

    if (esAdmin) {
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      this.viewContainer.clear();
    }
  }
}
