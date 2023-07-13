import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { createCheckoutSession, getStripePayments } from '@stripe/firestore-stripe-payments';
import { getApp } from 'firebase/app';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit {

  userSelectedUrl: string = "";
  customDomain: string = "";
  websiteType: string = "";
  currentUserId: string = "";
  currentUsername: string = "";
  linkedInId: string = "";
  navigateTo: string = "";
  app = getApp();
  payments = getStripePayments(this.app, {
    productsCollection: "products",
    customersCollection: "customers",
  });

  constructor(private router: Router,  private route: ActivatedRoute, private store: Firestore, private auth: AngularFireAuth) { }

  successCallback(event: any) {

    console.log("IN SUCCESS: " + this.navigateTo)
    console.log("IN SUCCESS 2: " + this.userSelectedUrl)
    console.log("IN SUCCESS 3: " + this.linkedInId)
    console.log("IN SUCCESS 4: " + this.navigateTo)

    if (this.navigateTo == "profile") {
      this.router.navigate(['/profile']);
    } else if (this.navigateTo == "website") {
      const url = doc(this.store, "urls/" + this.userSelectedUrl);
      const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);
  
      this.websiteType = "creative";
  
      setDoc(url, { websiteType: this.websiteType, customDomain: this.customDomain, userId: this.currentUserId, linkedInId: this.linkedInId }).then(() => {
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

  getQueryParams() {
    this.route.queryParams
    .subscribe((params: any) => {
      console.log("PARAMS IN GQP: " + JSON.stringify(params)); // { category: "fiction" }

      this.userSelectedUrl = params['userUrl'];
      this.customDomain = params['customDomain'];
      this.linkedInId = params['linkedInId'];
      this.navigateTo = params['navigateTo'];
    }
  );
  }

  ngOnInit(): void {
    this.checkLogin();
    this.getQueryParams();
  }

}
