import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from 'src/environments/environment';
import { LinkedinService } from '../linkedin.service';

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
  useCustomDomain: boolean = false;
  isAnnualSelected: boolean = false;

  constructor(private router: Router,  private route: ActivatedRoute, private store: Firestore, private auth: AngularFireAuth,
    private readonly linkedInService: LinkedinService) { }

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
  
      setDoc(url, { id: this.userSelectedUrl, websiteType: this.websiteType, customDomain: this.customDomain, userId: this.currentUserId, linkedInId: this.linkedInId }, { merge: true }).then(() => {
        console.log("set doc");
      }).then(() => {
        const userUpdateData: any = { url: this.userSelectedUrl };
            if (this.useCustomDomain) {
              userUpdateData.customDomain = this.customDomain;
            }
        setDoc(user, userUpdateData, { merge: true }).then(async () => {
          console.log("set user url");
  
          const priceId = this.linkedInService.getPriceId(this.useCustomDomain, this.isAnnualSelected);

          const session = await this.linkedInService.createStripeCheckoutSession(priceId, this.customDomain, this.userSelectedUrl, this.useCustomDomain)  
  
            // TODO: ADD URL PARAM TO SUCCESSFUL PAYMENT TO show dialog saying custom site takes 72 hours
  
            console.log("Session: " + JSON.stringify(session));
  
            window.location.assign(session.url);
  
        
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
      this.isAnnualSelected = params['isAnnualSelected'];
      this.useCustomDomain = params['useCustomDomain'];
    }
  );
  }

  ngOnInit(): void {
    this.checkLogin();
    this.getQueryParams();
  }

}
