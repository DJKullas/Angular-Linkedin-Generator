import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { CreativeCvComponent } from './creative-cv/creative-cv.component';
import { LandingComponent } from './landing/landing.component';
import { WebsiteComponent } from './website/website.component';

const routes: Routes = [{ path: '', component: LandingComponent },
{ path: 'creative', component: CreativeCvComponent },
{ path: 'auth', component: AuthComponent },
{ path: 'w/:website', component: WebsiteComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
