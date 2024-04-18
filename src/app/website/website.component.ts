import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { collection, collectionData, doc, docData, DocumentData, Firestore, getDoc, setDoc } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkedinService } from '../linkedin.service';
import { linkedInInfo } from '../models/linkedInInfo.model';
import { MatDialog } from '@angular/material/dialog';
import { DialogOverviewExampleDialog } from '../profile/profile.component';
import { PendingDialog } from './pending-dialog.component';
import { ImageUploaderService } from '../image-uploader.service';
import { getDownloadURL } from '@angular/fire/storage';
import { environment } from 'src/environments/environment';

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
  redirectPaid: string = "false";
  lookupKey: string = "";
  showUpgradeBanner: boolean = false;
  currentUserEmail: string = "";
  subId: string = "";
  currentUrl: string = environment.CURRENT_URL;

  constructor(private readonly auth: AngularFireAuth, private router: Router,private store: Firestore, private readonly linkedInService: LinkedinService,
              private route: ActivatedRoute, public dialog: MatDialog, private readonly imageUploaderService: ImageUploaderService) { }

  getLinkedInId() {
    var urlBeforeParams = this.router.url.split("?")[0];
    console.log("BEFORE PARAMS: " + urlBeforeParams)
    var urlArray = urlBeforeParams.split("/");
    this.lookupKey = urlArray[urlArray.length - 1];

    const url = doc(this.store, "urls/" + this.lookupKey);
    const urlData = docData(url);

    urlData.subscribe((res: any) => {
      console.log("subbed data", JSON.stringify(res));
      if (res && res?.active) {
      //if (res) {
        this.websiteType = res.websiteType;
      this.linkedInId = res.linkedInId;
      this.ownerUserId = res.userId;
      this.subId = res.subId;
      this.checkLogin();
      this.getLinkedInInfo();
      this.loadScripts();
      } else {
        this.router.navigate(["/"])
      }
    });
  }

  setUpgradeBanner() {
        const websitesRef = collection(this.store, "users/" + this.currentUserId + "/websites");
        const thisWebsite = doc(this.store, "users/" + this.currentUserId + "/websites/" + this.lookupKey);
        docData(thisWebsite).subscribe((website: DocumentData) => {
          console.log("here");
  
          this.showUpgradeBanner = website?.planType == "basic";
  
          // const customerRef = doc(this.store, "customers/" + this.currentUserId);

          // docData(customerRef).subscribe((customer: DocumentData) => {
          //   console.log("Stripe ID: " + customer.stripeId);
          //   console.log("CUST: " + JSON.stringify(customer))
          //   this.linkedInService.getSubscriptions(customer.stripeId).subscribe(async (result: any) => {
          //     console.log("RESULT Getting subs: " + JSON.stringify(result))

          //     let paidDomains = result.filter((x: any) => {
          //       return x?.metadata?.customDomain;
          //     })

          //     console.log("PAID DOMAINS OBJECTS: " + JSON.stringify(paidDomains))

          //     let finalPaidDomains = paidDomains.map((x: any) => {
          //       return x?.metadata?.customDomain;
          //     })

          //     console.log("FINAL PAID DOMAINDS: " + JSON.stringify(finalPaidDomains))


          //     console.log("WEBSITE R US: " + JSON.stringify(website))

          //     if (!finalPaidDomains.includes(website?.customDomain)) {
          //       console.log("DO WE SHOW UPGRADE BANNER")
          //       this.showUpgradeBanner = true;
          //     }

          //   });
          // });

      
        });
   
  }

openDialog(): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: {url: this.lookupKey, subId: this.subId},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
  
    });
  }

  openPaidDialog(title: string, description: string): void {
    const dialogRef = this.dialog.open(PendingDialog, {
      maxWidth: "800px",
      width: "80vw",
      data: {
        title,
        description,
      },
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
    console.log("GET LINEKDIN INFO")
    console.log("CURENT UID", this.lookupKey)
    const thisWebsite = doc(this.store, "urls/" + this.lookupKey);
    docData(thisWebsite).subscribe(
      (website: DocumentData) => {
        console.log("INSIDE OUR SUB", JSON.stringify(website))
        if (website?.info) {
        console.log("WE GOT INFO", JSON.stringify(website))
        this.linkedInInfo = website?.info;
        this.showSpinner = false;
      } else {
        this.linkedInService.getLinkedInInfo(this.linkedInId).subscribe(async (res: any) => {
          // this.linkedInInfo.name = res.full_name;
          // this.linkedInInfo.occupation = res.occupation;
          // this.linkedInInfo.profilePicUrl = res.profile_pic_url;
          this.linkedInInfo = res;
          console.log("LINKEDIN INFO: " + JSON.stringify(this.linkedInInfo))
          this.showSpinner = false;
          // SAVE LINKEDINDATA
          // TODO: SAVE IMAGES

          console.log("BEFORE AWAIT")
          const downloadURL = await this.imageUploaderService.uploadImageAndGetURL(res?.profile_pic_url, this.lookupKey);
          console.log('Download URL:', downloadURL);
         
          
    
console.log("AFTER AWAIT")
  

          // .then((imageUrlRes: any) => {
          //   console.log("INSDIE IMAGE UPLOADER")
          //   console.log(JSON.stringify(imageUrlRes));

          res.profile_pic_url = downloadURL;

            setDoc(thisWebsite, { info: res }, { merge: true }).then(async () => {
              console.log("Set the data")
            });
          // });
        });
      }
    });
  }

  sendContactEmail() {
    this.linkedInService.sendContactEmail().subscribe(async (result: any) => {
      console.log(result);
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
        this.currentUserEmail = res.email;

        this.isOwner = this.ownerUserId === this.currentUserId;
        console.log("AM I OWNER", this.isOwner)
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
        if (this.redirectPaid == "professional") {
          this.openPaidDialog("Your Custom Domain Coming Soon", "Thank you for purchasing a website with a custom domain. The first load for your website can sometimes take a minute as we gather your LinkedIn data. DNS updates can take up to 72 hours to register, so please wait until then for your website to be active. You will be emailed a link when your website is completed. Be sure to check your spam folder. Your website will look like the one below on your own domain!");
        } else if (this.redirectPaid == "basic") {
          this.openPaidDialog("Your Personal Website", `Thank you for creating a personal website. The first load for your website can sometimes take a minute as we gather your LinkedIn data. It can be accessed at ${this.currentUrl}/w/${this.lookupKey}. You will receive an email when it is ready. Be sure to check your spam folder.`)
        }
      }
    );
  }

  ngOnInit(): void {
    console.log("WE ARWE TRYING TO SHOW THE WEBSITE")
    this.getLinkedInId();
    this.setIfPaid(); 
  }

}
