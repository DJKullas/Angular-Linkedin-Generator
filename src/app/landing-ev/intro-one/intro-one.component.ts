import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';
import { LinkedinService } from '../../linkedin.service';
import { Firestore, collectionData, collection, setDoc, doc, docData } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as e from 'express';
import { Route, Router } from '@angular/router';
import { getDoc, updateDoc } from 'firebase/firestore';
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
  isAnnualSelected: boolean = false;
  domainFormatError = false;
  linkedInUrlError = false;
  domainNotAvailableError = false;
  customUrlNotAvailableError = false;
  submitError: string | null = null;
  stripePriceId: string | null = null;
  navigatingToStripeBasic: boolean = false;
  navigatingToStripePro: boolean = false;

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

validateAndScroll(id: any) {
  const result = this.validateInputs();

  if (result == null) {
    return;
  }
  
  this.scroll(id);
}

  testit() {
    console.log("CUSTOM DOMAIN IN MODEL CHANGE: " + this.customDomain)
  }

  createWebsite(useCustomDomain: boolean, isAnnualSelected: boolean, makingPro: boolean = false) {
    if (!makingPro) {
      this.navigatingToStripeBasic = true;
    }
   
    console.log("HERE IF WE ");

   
    const id = this.validateInputs();
   
    console.log("ID HERE IS",id)

    if (id == null) {
      this.scroll("intro-section")
      this.navigatingToStripeBasic = false;
      this.navigatingToStripePro = false;
      return;
    }

    if (this.linkedInUrl != "") {

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
          this.navigatingToStripeBasic = false;
          this.navigatingToStripePro = false;
          this.scroll("intro-section")
        } else {

          this.submitError = null;
          if (this.currentUserId == "") {

                this.router.navigate(['/auth'], { queryParams: { userUrl: this.userSelectedUrl, customDomain: this.customDomain, linkedInId: id, navigateTo: "website", useCustomDomain, isAnnualSelected } });

                // CONTINUE THE WEBSITE CREATION

                return;
              }

          const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);

          console.log("No RES SO SET THE DOC")

          // TODO add more website types
          this.websiteType = "creative";

          const urlUpdateData: any = { id: this.userSelectedUrl, websiteType: this.websiteType, userId: this.currentUserId, linkedInId: id }

          if (useCustomDomain) {
            urlUpdateData.customDomain = this.customDomain;
          }

          setDoc(url, urlUpdateData, { merge: true }).then(() => {
            console.log("set doc");
          }).then(() => {
            const userUpdateData: any = { url: this.userSelectedUrl };
            if (useCustomDomain) {
              userUpdateData.customDomain = this.customDomain;
            }
            setDoc(user, userUpdateData, { merge: true }).then(async () => {
              console.log("set user url");
  
              // if (useCustomDomain) {
                console.log("INSIDE THE CUSTOM DOMAIN");
                // console.log("Paymenyts: " + JSON.stringify(this.payments));

                const priceId = this.linkedInService.getPriceId(useCustomDomain, isAnnualSelected);
                const domainToAdd = useCustomDomain ? this.customDomain : null;
                const session = await this.linkedInService.createStripeCheckoutSession(priceId, domainToAdd, this.userSelectedUrl, useCustomDomain);

                // TODO: ADD URL PARAM TO SUCCESSFUL PAYMENT TO show dialog saying custom site takes 72 hours

                console.log("Session: " + JSON.stringify(session));

                window.location.assign(session.url);
              // } else {
              //   // TODO: Do cheaper pament plan
              //   this.router.navigate([`w/${this.userSelectedUrl}`]);
              // }

              

              
  
              // redirect to website page
            })
          }).catch(() => {
            this.navigatingToStripeBasic = false;
            this.navigatingToStripePro = false;
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

  validateInputs() {
    if (this.userSelectedUrl == "") {
      console.log("Select a url");
      this.submitError = "Please input your desired Url.";
      console.log(this.submitError)
      this.navigatingToStripeBasic = false;
      this.navigatingToStripePro = false;
      return null;
    }

    if (this.linkedInUrl == "") {
      this.submitError = "Please input your LinkedIn Url.";
      this.navigatingToStripeBasic = false;
      this.navigatingToStripePro = false;

      return null;
    }

    if (this.linkedInUrl != "") {
      if (!this.linkedInUrl.includes("/")) {
        console.log("LinkedIn Url Incorrect Format");
        this.submitError = "Linked Url Incorrect Format";
        this.navigatingToStripeBasic = false;
        this.navigatingToStripePro = false;

        return null;
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
        this.navigatingToStripeBasic = false;
        this.navigatingToStripePro = false;

        return null;
      }

      this.submitError = null;
      return id;
    }

    this.navigatingToStripeBasic = false;
    this.navigatingToStripePro = false;

    return null;
  }


  navigateToContact() {
    this.router.navigate(["contact"]);
  }

  scroll(elementId: string) {

    const element = document.getElementById(elementId);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }

  checkDomain(isAnnualSelected: boolean) {
    this.navigatingToStripePro = true;

    // TODO: set up payment block on this
this.submitError = null;
    console.log("CUSTOM DOMAIN SHOULD BE SET HERE: " + this.customDomain);

    if (this.customDomain == "") {
      console.log("Not using Custom Domain");
      this.submitError = "Please enter a custom domain";
      this.scroll("intro-section")
      this.navigatingToStripePro = false;
    } else {
      this.submitError = null;
      this.linkedInService.checkDomain(this.customDomain).subscribe((result: any) => {
        if (result?.error?.error_code == 10006) {
          this.submitError = null;
          console.log("Domain is available");
            this.createWebsite(true, isAnnualSelected, true);
        }

        if (result?.error?.error_code == 10007) {
          console.log("Incorrect domain format");
          this.submitError = "Incorrect domain format";
          this.navigatingToStripePro = false;
        }

        if (result?.domain) {
          this.submitError = "Domain is not available. Please select a different domain."
          console.log("Domaion is not available");
          this.navigatingToStripePro = false;
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

    console.log("ON INIT AY")

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
