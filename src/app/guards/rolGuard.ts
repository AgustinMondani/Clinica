import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { SupabaseService } from '../core/supabase.service';

@Injectable({
  providedIn: 'root',
})
export class RolGuard implements CanActivate {
  constructor(private supabase: SupabaseService, private router: Router) {}

  async canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const allowedRoles: string[] = route.data['roles'];
    const usuario = await this.supabase.getUsuarioActual();

    if (!usuario || !allowedRoles.includes(usuario.rol)) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}
