import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { collection, collectionData, doc, docData, DocumentData, Firestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkedinService } from '../linkedin.service';
import { linkedInInfo } from '../models/linkedInInfo.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogOverviewExampleDialog } from '../profile/profile.component';

@Component({
  selector: 'app-website',
  templateUrl: './website.component.html',
  styleUrls: ['./website.component.scss']
})
export class WebsiteComponent implements OnInit {

  linkedInId: string = "";
  websiteType: string = "";
  //linkedInInfo: linkedInInfo = new linkedInInfo();
  linkedInInfo: any = {};
  showSpinner: boolean = true;
  currentUserId: string = "";
  ownerUserId: string = "";
  isOwner: boolean = false;
  redirectPaid: boolean = false;
  lookupKey: string = "";
  showUpgradeBanner: boolean = false;

  constructor(private readonly auth: AngularFireAuth, private router: Router,private store: Firestore, private readonly linkedInService: LinkedinService,
              private route: ActivatedRoute, public dialog: MatDialog) { }

  getLinkedInId() {
    var urlBeforeParams = this.router.url.split("?")[0];
    console.log("BEFORE PARAMS: " + urlBeforeParams)
    var urlArray = urlBeforeParams.split("/");
    this.lookupKey = urlArray[urlArray.length - 1];

    const url = doc(this.store, "urls/" + this.lookupKey);
    const urlData = docData(url);

    urlData.subscribe((res: any) => {
      console.log(res);
      this.websiteType = res.websiteType;
      this.linkedInId = res.linkedInId;
      this.ownerUserId = res.userId;
      this.checkLogin();
      this.getLinkedInInfo();
      this.loadScripts();
    });
  }

  setUpgradeBanner() {
        const websitesRef = collection(this.store, "users/" + this.currentUserId + "/websites");
        const thisWebsite = doc(this.store, "users/" + this.currentUserId + "/websites/" + this.lookupKey);
        docData(thisWebsite).subscribe((website: DocumentData) => {
          console.log("here");
   
  
          const customerRef = doc(this.store, "customers/" + this.currentUserId);

          docData(customerRef).subscribe((customer: DocumentData) => {
            console.log("Stripe ID: " + customer.stripeId);
            console.log("CUST: " + JSON.stringify(customer))
            this.linkedInService.getSubscriptions(customer.stripeId).subscribe(async (result: any) => {
              console.log("RESULT Getting subs: " + JSON.stringify(result))

              let paidDomains = result.filter((x: any) => {
                return x?.metadata?.customDomain;
              })

              console.log("PAID DOMAINS OBJECTS: " + JSON.stringify(paidDomains))

              let finalPaidDomains = paidDomains.map((x: any) => {
                return x?.metadata?.customDomain;
              })

              console.log("FINAL PAID DOMAINDS: " + JSON.stringify(finalPaidDomains))


              console.log("WEBSITE R US: " + JSON.stringify(website))

              if (!finalPaidDomains.includes(website?.customDomain)) {
                this.showUpgradeBanner = true;
              }

            });
          });

      
        });
   
  }

openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: {url: this.lookupKey},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
  
    });
  }

  getMonthName(monthNumber: number) {
    const date = new Date();
    date.setMonth(monthNumber - 1);
  
    return date.toLocaleString('en-US', { month: 'long' });
  }

  getLinkedInInfo() {
    this.linkedInService.getLinkedInInfo(this.linkedInId).subscribe((res: any) => {
      // this.linkedInInfo.name = res.full_name;
      // this.linkedInInfo.occupation = res.occupation;
      // this.linkedInInfo.profilePicUrl = res.profile_pic_url;
      this.linkedInInfo = res;
      console.log("LINKEDIN INFO: " + JSON.stringify(this.linkedInInfo))
      this.showSpinner = false;
    });
  }

  loadScripts() {
    if (this.websiteType == "creative") {
      this.loadScript('../assets/js/core/jquery.3.2.1.min.js');
      this.loadScript('../assets/js/core/bootstrap.min.js');  
      this.loadScript('../assets/js/core/popper.min.js');
      this.loadScript('../assets/js/plugins/bootstrap-datepicker.js');
      this.loadScript('../assets/js/plugins/bootsrap-switch.js');
      this.loadScript('../assets/js/plugins/jquery.sharrre.js');
      this.loadScript('../assets/js/plugins/nouislider.min.js');
      this.loadScript('../assets/js/aos.js');
      this.loadScript('../assets/js/main.js');
      this.loadScript('../assets/js/now-ui-kit.js');
    }
  }

  public loadScript(url: string) {
    const body = <HTMLDivElement> document.body;
    const script = document.createElement('script');
    script.innerHTML = '';
    script.src = url;
    script.async = false;
    script.defer = true;
    body.appendChild(script);
  }

  checkLogin() {
    this.auth.authState.subscribe((res: any) => {
      
      if (res) {
        this.currentUserId = res.uid;

        this.isOwner = this.ownerUserId === this.currentUserId;
        this.setUpgradeBanner();

        // if (res.displayName) {
        //   this.currentUsername = res.displayName;
        // } else {
        //   this.currentUsername = res.email;
        // }
      } 
    });
  }

  setIfPaid(): void {
    this.route.queryParams
      .subscribe((params: any) => {
        console.log(params); // { category: "fiction" }
        this.redirectPaid = params['redirectPaid'];
      }
    );
  }

  ngOnInit(): void {
    this.setIfPaid();
    this.getLinkedInId();
  }

}
