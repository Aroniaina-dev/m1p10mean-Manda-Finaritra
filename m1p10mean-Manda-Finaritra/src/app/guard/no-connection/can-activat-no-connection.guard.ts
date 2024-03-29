import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthentificationService } from 'src/app/services/AuthentificationService/authentification.service';
import { User } from 'src/app/models/user';

@Injectable({
  providedIn: 'root'
})
export class CanActivatNoConnectionGuard implements CanActivate {
  idTemp = 0;
  constructor(private authentificationService: AuthentificationService, private router: Router) { }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    if (!this.authentificationService.loggedIn()) {
      return true
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}

