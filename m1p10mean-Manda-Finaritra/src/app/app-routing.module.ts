import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path:  "", pathMatch:  "full",redirectTo:  "login"},
  {
    path: 'login',
    loadChildren: () => import('./modules/authentification/authentification.module').then(m => m.AuthentificationModule)
  },
  {
    path: 'atelier',
    loadChildren: () => import('./modules/atelier/atelier.module').then(m => m.AtelierModule)
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }