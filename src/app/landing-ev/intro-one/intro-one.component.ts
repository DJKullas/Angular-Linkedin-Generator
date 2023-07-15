import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';
import { LinkedinService } from '../../linkedin.service';
import { Firestore, collectionData, collection, setDoc, doc, docData } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as e from 'express';
import { Route, Router } from '@angular/router';
import { getDoc, updateDoc } from 'firebase/firestore';
import { getApp } from "@firebase/app";
import { getStripePayments } from "@stripe/firestore-stripe-payments";
import { createCheckoutSession } from "@stripe/firestore-stripe-payments";
import { environment } from '../../../environments/environment';
import { FormControl, Validators } from '@angular/forms';
import { FormValidators } from 'src/app/validators';
import { take } from 'rxjs';


@Component({
  selector: 'app-intro',
  templateUrl: './intro-one.component.html',
  styleUrls: ['./intro-one.component.scss']
})
export class IntroOneComponent implements OnInit {


  formValidators: FormValidators;
  email = new FormControl('', [Validators.required, Validators.email]);
  linkedInUrlErrorFormControl: any; //= new FormControl('', [Validators.required]);
  userSelectedUrlErrorFormControl: any; // new FormControl('', [Validators.required]);
  customDomainErrorFormControl: any;
  linkedInUrl: string = "";
  customDomain: string = "";
  currentUsername: string = "";
  currentUserId: string = "";
  websiteType: string = "";
  userSelectedUrl: string = "";
  app = getApp();
  payments = getStripePayments(this.app, {
    productsCollection: "products",
    customersCollection: "customers",
  });
  domainFormatError = false;
  linkedInUrlError = false;
  domainNotAvailableError = false;
  customUrlNotAvailableError = false;
  submitError: string | null = null;

  constructor(private readonly linkedInService: LinkedinService, private store: Firestore, private auth: AngularFireAuth, private router: Router) { 
    this.formValidators = new FormValidators(linkedInService, store);
  }

  customUrlErrorCheck() {
    console.log("CUSTOM CHECK")
    const url = doc(this.store, "urls/" + this.userSelectedUrl);

    console.log("URL: ");
    console.log(url);

    const urlData = docData(url);


    // TODO unsubscribe maybe so it doesnt hit this multiple times

    urlData.subscribe((res: any) => {
      if (res) {
        this.customUrlNotAvailableError = true;
        console.log("URL IS TAKEN CHOOSE ANOTHER");
        return;
      } 

      this.customUrlNotAvailableError = false;
    });
  }


  updateDesiredUrlFromLinkedInUrl() {
    
    if (this.linkedInUrl != "" && this.userSelectedUrl == "") {

      if (!this.linkedInUrl.includes("/")) {
        console.log("LinkedIn Url Incorrect Format");
        return;
      }

      var urlArray = this.linkedInUrl.split("/");

      console.log("URL ARRAy" + urlArray);


      var id = urlArray[urlArray.length - 1];

      console.log("ID: " + id);

      if (id.length == 0) {
        id = urlArray[urlArray.length - 2];
      }

      console.log("ID 2: " + id);

      this.userSelectedUrl = id;

      this.customDomain = id + ".com"

      console.log("USER SELECTED URL: ", this.userSelectedUrl);
      console.log("LinkedIN URL: " + this.linkedInUrl);
      console.log("CUSTOM DOMAIN: " + this.customDomain)
  } 
}

  testit() {
    console.log("CUSTOM DOMAIN IN MODEL CHANGE: " + this.customDomain)
  }

  createWebsite() {

    console.log("HERE IF WE ");

   

    if (this.userSelectedUrl == "") {
      console.log("Select a url");
      this.submitError = "Please input your desired Url.";
      console.log(this.submitError)
      return;
    }

    if (this.linkedInUrl == "") {
      this.submitError = "Please input your LinkedIn Url.";
      return;
    }

    if (this.linkedInUrl != "") {

      if (!this.linkedInUrl.includes("/")) {
        console.log("LinkedIn Url Incorrect Format");
        this.submitError = "Linked Url Incorrect Format";
        return;
      }

      var urlArray = this.linkedInUrl.split("/");

      console.log("URL ARRAy" + urlArray);


      var id = urlArray[urlArray.length - 1];

      console.log("ID: " + id);

      if (id.length == 0) {
        id = urlArray[urlArray.length - 2];
      }

      console.log("ID 2: " + id);

      if (id == undefined || id == null) {
        console.log("LinkedIn Url Incorrect format");
        this.submitError = "Linked Url Incorrect Format";
        return;
      }

      var counter = 2;
      const url = doc(this.store, "urls/" + this.userSelectedUrl);

      console.log("URL: ");
      console.log(url);

      const urlData = docData(url);


      // TODO unsubscribe maybe so it doesnt hit this multiple times
      this.submitError = null;

      urlData.pipe(take(1)).subscribe((res: any) => {
        if (res) {
          console.log("URL IS TAKEN CHOOSE ANOTHER");
          this.submitError = "Desired Url taken. Please choose another.";
        } else {

          this.submitError = null;
          if (this.currentUserId == "") {

                this.router.navigate(['/auth'], { queryParams: { userUrl: this.userSelectedUrl, customDomain: this.customDomain, linkedInId: id, navigateTo: "website" } });

                // CONTINUE THE WEBSITE CREATION

                return;
              }

          const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);

          console.log("No RES SO SET THE DOC")

          // TODO add more website types
          this.websiteType = "creative";

          setDoc(url, { websiteType: this.websiteType, customDomain: this.customDomain, userId: this.currentUserId, linkedInId: id }).then(() => {
            console.log("set doc");
          }).then(() => {
            setDoc(user, { customDomain: this.customDomain, url: this.userSelectedUrl }).then(async () => {
              console.log("set user url");
  
              if (this.customDomain != "") {
                console.log("INSIDE THE CUSTOM DOMAIN");
                console.log("Paymenyts: " + JSON.stringify(this.payments));
                console.log("PRICE: " + environment.PREMIUM_PRICE_ID);
                const session = await createCheckoutSession(this.payments, {
                  price: environment.PREMIUM_PRICE_ID,
                  success_url: `http://localhost:5000/w/${this.userSelectedUrl}?redirectPaid=true`,
                  cancel_url: "http://localhost:5000",
                  client_reference_id: this.customDomain,
                  metadata: { customDomain: this.customDomain }
                });

                // TODO: ADD URL PARAM TO SUCCESSFUL PAYMENT TO show dialog saying custom site takes 72 hours

                console.log("Session: " + JSON.stringify(session));

                window.location.assign(session.url);
              } else {
                this.router.navigate([`w/${this.userSelectedUrl}`]);
              }

              

              
  
              // redirect to website page
            })
          }).catch(() => {
            console.log("error setting doc");
          });
        }
      });
    
  
        // updateDoc(url, { websiteType: this.websiteType, customDomain: this.customDomain, userId: this.currentUserId, linkedInId: id }).then(() => {
        //   // Redirect to website page
        // }).catch(() => {
          
        // });
    
        
      

      

      console.log("LinkedIn Url Correct format");
    }

  }

  checkDomain() {

    // TODO: set up payment block on this
this.submitError = null;
    console.log("CUSTOM DOMAIN SHOULD BE SET HERE: " + this.customDomain);

    if (this.customDomain == "") {
      console.log("Not using Custom Domain");
      this.createWebsite();
    } else {
      this.linkedInService.checkDomain(this.customDomain).subscribe((result: any) => {
        if (result?.error?.error_code == 10006) {
          this.submitError = null;
          console.log("Domain is available");
            this.createWebsite();
        }

        if (result?.error?.error_code == 10007) {
          console.log("Incorrect domain format");
          this.submitError = "Incorrect domain format";
        }

        if (result?.domain) {
          this.submitError = "Domain is not available. Please select a different domain."
          console.log("Domaion is not available");
        }

      });
    }
  }

  checkLogin() {
    this.auth.authState.subscribe((res: any) => {
      
      if (res) {
        console.log("Here");
        this.currentUserId = res.uid;
        if (res.displayName) {
          this.currentUsername = res.displayName;
        } else {
          this.currentUsername = res.email;
        }
        console.log(res);
        return;
      } else {
        console.log("Not Here");
        
      }
      

    });
  }

  ngOnInit(): void {
    const test = doc(this.store, "test/1");
    setDoc(test, {theKey: "TheValue"});

    this.checkLogin();

    this.linkedInUrlErrorFormControl = new FormControl('', { updateOn: "blur", validators: [Validators.required, this.formValidators.linkedInUrlErrorCheck()] });
    this.userSelectedUrlErrorFormControl = new FormControl('', { updateOn: "blur", validators: [Validators.required] });
    this.customDomainErrorFormControl = new FormControl('');
  }
  
  buyEgret() {
    window.open('https://themeforest.net/item/egret-angular-4-material-design-admin-template/20161805?ref=mh_rafi');
  }
  getNGLanding() {
    window.open('');
  }
}
