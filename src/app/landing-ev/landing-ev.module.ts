import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';

import { SharedModule } from '../shared/shared.module';
// import { HomeRoutes } from "./home.routing";
import { FlexLayoutModule } from '@angular/flex-layout';
// import { NguCarouselModule } from '@ngu/carousel';
// import { HomeOneComponent } from './home-one.component';
// import { HomeTwoComponent } from './home-two.component';
// import { HomeThreeComponent } from './home-three.component';

import { HeaderComponent } from './header/header.component';
import { IntroOneComponent } from './intro-one/intro-one.component';
import { IntroTwoComponent } from './intro-two/intro-two.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { ServicesComponent } from './services/services.component';
import { CtaComponent } from './cta/cta.component';
import { PricingsComponent } from './pricings/pricings.component';
import { ContactComponent } from './contact/contact.component';
import { FooterComponent } from './footer/footer.component';
import { TestimonialsComponent } from './testimonials/testimonials.component';
import { PortfolioCarouselComponent } from './portfolio-carousel/portfolio-carousel.component';
import { TestimonialsCarouselComponent } from './testimonials-carousel/testimonials-carousel.component';
import { ServicesCarouselComponent } from './services-carousel/services-carousel.component';
import { DemoComponent } from './demo/demo.component';
// import { AllSectionsComponent } from './all-sections.component';

import { WINDOW_PROVIDERS } from '../shared/helpers/window.helper';

import { SharedMaterialModule } from '../shared/shared-material.module';
import { SharedDirectivesModule } from '../shared/directives/shared-directives.module';
import { SharedComponentsModule } from '../shared/components/shared-components.module';
import { IntroThreeComponent } from './intro-three/intro-three.component';
import { Service3Component } from './service3/service3.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    SharedModule,
    ReactiveFormsModule,
    SharedDirectivesModule,
    SharedComponentsModule,
    SharedMaterialModule,
    FlexLayoutModule,
    // NguCarouselModule,
    // RouterModule.forChild(HomeRoutes),
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatRippleModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
  declarations: [
    HeaderComponent, 
    IntroOneComponent,
    IntroTwoComponent, 
    PortfolioComponent, 
    ServicesComponent, 
    CtaComponent, 
    PricingsComponent, 
    ContactComponent, 
    FooterComponent, 
    TestimonialsComponent, 
    PortfolioCarouselComponent,  
    TestimonialsCarouselComponent, 
    ServicesCarouselComponent, 
    DemoComponent,
    IntroThreeComponent,
    Service3Component
  ],
  exports: [
    HeaderComponent,
    IntroOneComponent,
    IntroTwoComponent, 
    PortfolioComponent, 
    ServicesComponent, 
    CtaComponent, 
    PricingsComponent, 
    ContactComponent, 
    FooterComponent, 
    TestimonialsComponent, 
    PortfolioCarouselComponent,  
    TestimonialsCarouselComponent, 
    ServicesCarouselComponent, 
    DemoComponent,
    IntroThreeComponent,
    Service3Component
  ],
  providers: [WINDOW_PROVIDERS]

})
export class HomeModule { }
