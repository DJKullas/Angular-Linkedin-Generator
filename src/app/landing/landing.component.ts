import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';
import { LinkedinService } from '../linkedin.service';
import { Firestore, collectionData, collection, setDoc, doc, docData } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as e from 'express';
import { Route, Router } from '@angular/router';
import { getDoc, updateDoc } from 'firebase/firestore';
import { getApp } from "@firebase/app";
import { getStripePayments } from "@stripe/firestore-stripe-payments";
import { createCheckoutSession } from "@stripe/firestore-stripe-payments";
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

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

  constructor(private readonly linkedInService: LinkedinService, private store: Firestore, private auth: AngularFireAuth, private router: Router) { }

  createWebsite() {

    console.log("HERE IF WE ");

    if (this.currentUserId == "") {
      this.router.navigate(['/auth']);

      // CONTINUE THE WEBSITE CREATION

      return;
    }

    if (this.userSelectedUrl == "") {
      console.log("Select a url");
      return;
    }

    if (this.linkedInUrl != "") {

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

      if (id == undefined || id == null) {
        console.log("LinkedIn Url Incorrect format");
        return;
      }

      var counter = 2;
      const url = doc(this.store, "urls/" + this.userSelectedUrl);
      const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);

      console.log("URL: ");
      console.log(url);

      const urlData = docData(url);


      // TODO unsubscribe maybe so it doesnt hit this multiple times

      urlData.subscribe((res: any) => {
        if (res) {
          console.log("URL IS TAKEN CHOOSE ANOTHER");
        } else {
          console.log("No RES SO SET THE DOC")



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
                  success_url: `http://localhost:3000/w/${this.userSelectedUrl}`,
                  cancel_url: "http://localhost:3000",
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

    if (this.customDomain == "") {
      console.log("Not using Custom Domain");
      this.createWebsite();
    } else {
      this.linkedInService.checkDomain(this.customDomain).subscribe((result: any) => {
        if (result?.error?.error_code == 10006) {
          console.log("Domain is available");
            this.createWebsite();
        }

        if (result?.error?.error_code == 10007) {
          console.log("Incorrect domain format");
        }

        if (result?.domain) {
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
      } else {
        console.log("Not Here");
      }
      

    });
  }

  ngOnInit(): void {
    const test = doc(this.store, "test/1");
    setDoc(test, {theKey: "TheValue"});

    this.checkLogin();
  }

}
