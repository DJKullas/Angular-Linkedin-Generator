import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, doc, docData, setDoc } from '@angular/fire/firestore';
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

        const creatingUser = doc(this.store, `users/${this.currentUserId}`);
        setDoc(creatingUser, {}, { merge: true }).then(() => {
        //   console.log("real user created");

          

        if (this.navigateTo == "profile") {
          this.router.navigate(['/profile']);
        } else if (this.navigateTo == "website") {
        //   const url = doc(this.store, "urls/" + this.userSelectedUrl);
        //   const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);
      
          this.websiteType = "creative";
      
          // setDoc(url, { id: this.userSelectedUrl, websiteType: this.websiteType, customDomain: this.customDomain, userId: this.currentUserId, linkedInId: this.linkedInId }, { merge: true }).then(() => {
          //   console.log("set doc");
          // }).then(() => {
          //   const userUpdateData: any = { url: this.userSelectedUrl };
          //       if (this.useCustomDomain) {
          //         userUpdateData.customDomain = this.customDomain;
          //       }
          //   setDoc(user, userUpdateData, { merge: true }).then(async () => {
          //     console.log("set user url");
      
          //     console.log("use cusotm domain", this.useCustomDomain)
          //     console.log("is annual selected", this.isAnnualSelected)
          const priceId = this.linkedInService.getPriceId(this.useCustomDomain, this.isAnnualSelected);
          const domainToAdd = this.useCustomDomain ? this.customDomain : null;

          const userData = doc(this.store, `users/${this.currentUserId}`);

          docData(userData).subscribe(async (userResult: any) => {
            console.log("USER RESULT", userResult);
            if (userResult) {
              console.log("USER RESULT IS LIVe")
              const session = await this.linkedInService.createStripeCheckoutSession(priceId, domainToAdd, this.userSelectedUrl, this.useCustomDomain, this.currentUserId, userResult?.customerId, this.linkedInId, this.websiteType).subscribe(async (result: any) => {
                console.log("RESULT: " + JSON.stringify(result))
               
      
               window.location.assign(result.url);
      
              });
            } else {
              console.log("NEVER SHOULD BE HERE")
            }
          });
      
      
        } else {
          this.router.navigate(['/']);
        }
            
              // redirect to website page
        //     })
          }).catch(() => {
            console.log("error setting doc");
          });
        // }
        // });

      } else {
        this.router.navigate(['/']);
        console.log("Not Here");
      }
    }); 
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
      this.isAnnualSelected = params['isAnnualSelected'] == "true";
      this.useCustomDomain = params['useCustomDomain'] == "true";
    }
  );
  }

  ngOnInit(): void {
    this.checkLogin();
    this.getQueryParams();
  }

}
