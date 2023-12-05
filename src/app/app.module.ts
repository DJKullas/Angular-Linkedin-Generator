import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LandingComponent } from './landing/landing.component';
import { CreativeCvComponent } from './creative-cv/creative-cv.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { initializeApp,provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth,getAuth } from '@angular/fire/auth';
import { provideFirestore,getFirestore } from '@angular/fire/firestore';
import { AuthComponent } from './auth/auth.component';
import {firebase, firebaseui, FirebaseUIModule} from 'firebaseui-angular';
import { AngularFireAuthModule, USE_EMULATOR as USE_AUTH_EMULATOR } from "@angular/fire/compat/auth";
import { FIREBASE_OPTIONS } from '@angular/fire/compat';
import { MatRadioModule } from '@angular/material/radio';
import { MatInputModule } from '@angular/material/input'
import { MatFormFieldModule } from '@angular/material/form-field';
import { WebsiteComponent } from './website/website.component';
import { ProfileComponent } from './profile/profile.component';
import { MatButtonModule } from '@angular/material/button'
import { MatToolbarModule } from '@angular/material/toolbar';
import { LandingEvComponent } from './landing-ev/landing-ev.component';
import { SharedModule } from './shared/shared.module';
import { HomeModule } from "./landing-ev/landing-ev.module";
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { getStorage, provideStorage } from '@angular/fire/storage';


const firebaseUiAuthConfig: firebaseui.auth.Config = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    // {
    //   scopes: [
    //     'public_profile',
    //     'email',
    //     'user_likes',
    //     'user_friends'
    //   ],
    //   customParameters: {
    //     'auth_type': 'reauthenticate'
    //   },
    //   provider: firebase.auth.FacebookAuthProvider.PROVIDER_ID
    // },
    // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    {
      requireDisplayName: false,
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID
    },
    // firebase.auth.PhoneAuthProvider.PROVIDER_ID,
    // firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
  ],
  tosUrl: '<your-tos-link>',
  privacyPolicyUrl: '<your-privacyPolicyUrl-link>',
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO
};

@NgModule({
    declarations: [
        AppComponent,
        LandingComponent,
        CreativeCvComponent,
        AuthComponent,
        WebsiteComponent,
        ProfileComponent,
        LandingEvComponent
    ],
    providers: [
        { provide: FIREBASE_OPTIONS, useValue: environment.firebase }
    ],
    bootstrap: [AppComponent],
    imports: [
        BrowserModule,
        CommonModule,
        AppRoutingModule,
        FormsModule,
        HttpClientModule,
        BrowserAnimationsModule,
        provideFirebaseApp(() => initializeApp(environment.firebase)),
        provideAuth(() => getAuth()),
        provideFirestore(() => getFirestore()),
        provideStorage(() => getStorage()),
        AngularFireAuthModule,
        FirebaseUIModule.forRoot(firebaseUiAuthConfig),
        MatRadioModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatToolbarModule,
        SharedModule,
        HomeModule,
        MatProgressSpinnerModule,
    ]
})
export class AppModule { }
