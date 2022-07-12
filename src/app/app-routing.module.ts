import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CreativeCvComponent } from './creative-cv/creative-cv.component';
import { LandingComponent } from './landing/landing.component';

const routes: Routes = [{ path: '', component: LandingComponent },
{ path: 'creative', component: CreativeCvComponent }];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
