import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { CreativeCvComponent } from './creative-cv/creative-cv.component';
import { LandingComponent } from './landing/landing.component';

const routes: Routes = [{ path: '', component: LandingComponent },
{ path: 'creative', component: CreativeCvComponent },
{ path: 'auth', component: AuthComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
