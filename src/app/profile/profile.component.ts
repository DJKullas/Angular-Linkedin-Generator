import { Component, Inject, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, collectionData, collection, setDoc, doc, docData, DocumentData, query, where, getDocs } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LinkedinService } from '../linkedin.service';
import { createCheckoutSession, getStripePayments } from '@stripe/firestore-stripe-payments';
import { environment } from 'src/environments/environment';
import { getApp } from 'firebase/app';
import { Router } from '@angular/router';
import { subscribeOn } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ImageUploaderService } from '../image-uploader.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  websites: any[] = [];
  basicWebsites: any[] = [];
  professionalWebsites: any[] = [];
  showUpgradeDialog: boolean = false;
  currentUserId: string = "";
  currentUsername: string = "";


  constructor(private store: Firestore, private readonly auth: AngularFireAuth,
    public dialog: MatDialog, private router: Router, private readonly linkedInService: LinkedinService,
    private readonly imageUploaderService: ImageUploaderService,) { }

    refreshLinkedInInfo(url: string, linkedInId: string) {
      const thisWebsite = doc(this.store, "urls/" + url);
  
          this.linkedInService.getLinkedInInfo(linkedInId).subscribe(async (res: any) => {
  
  
            console.log("BEFORE AWAIT")
            const downloadURL = await this.imageUploaderService.uploadImageAndGetURL(res?.profile_pic_url, url);
            console.log('Download URL:', downloadURL);
           
        
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

  loadUserWebsites() {
    this.auth.authState.subscribe((res: any) => {
      console.log("before if")
      console.log(JSON.stringify(res));
      if (res) {
       //const websitesRef = collection(this.store, "users/" + res.uid + "/websites");
        const websitesRef = collection(this.store, "urls/");
        const websitesRefQuery = query(websitesRef, where('userId', '==', res.uid));
        
        
        collectionData(websitesRefQuery, { idField: "id" }).subscribe((websites: DocumentData[]) => {
          console.log("here");
          console.log("THING I NEED", JSON.stringify(websites))
          console.log(res);
  
          const customerRef = doc(this.store, "customers/" + res.uid);

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

              const basicSubs = result.filter((x: any) => {
                return x?.items?.data[0]?.plan?.id == "price_1NsTwEHPSFrU3NLYFzpAiuxu" || 
                x?.items?.data[0]?.plan?.id == "price_1NsTsxHPSFrU3NLYs4GVDF3u"; 
              });

              console.log("Basic subs", JSON.stringify(basicSubs))

              const proSubs = result.filter((x: any) => {
                return x?.items?.data[0]?.plan?.id == "price_1NsTx2HPSFrU3NLYohRnQ4f2" || 
                x?.items?.data[0]?.plan?.id == "price_1NsTwgHPSFrU3NLYBoKITUDT"; 
              });

              this.websites = [];
              this.basicWebsites = [];
              this.professionalWebsites = [];

              for (const sub of basicSubs) {

                let websiteData = websites.find((x) => x?.id == sub?.metadata?.userSelectedUrl)
                const subItemId = sub?.items?.data[0]?.id;

                console.log("Webiste data", websiteData)
                
                let basicWebsite = { url: websiteData?.id, linkedInId: websiteData?.linkedInId, subId: sub?.id, subItemId }
                this.basicWebsites.push(basicWebsite);
              }

              for (const sub of proSubs) {
                const subItemId = sub?.items?.data[0]?.id;
                let websiteData = websites.find((x) => x?.id == sub?.metadata?.userSelectedUrl)
                let proWebsite = { url: websiteData?.id, customDomain: websiteData?.customDomain, linkedInId: websiteData?.linkedInId, subId: sub?.id, subItemId }
                this.professionalWebsites.push(proWebsite);
              }
    
              // for (var i = 0; i < websites.length; i += 1) {
              //   console.log(websites[i]);
    
              //   let customDomain;

              //   if (finalPaidDomains.includes(websites[i].customDomain)) {

              //     customDomain = websites[i].customDomain
              //   } 

              //   let website = { url: websites[i]['id'], customDomain: customDomain, linkedInId: websites[i]['linkedInId'] }
  
              //   let basicWebsite = { url: websites[i]['id'], linkedInId: websites[i]['linkedInId'], subId:  }
                
              //   this.websites.push(website);
              // }

              // TODO: MOVE LOOPING LOGIC IN HERE, CHECK IF WEBSITES WITH CUSTOM DOMAIN ARE IN
              // SUB LIST METADATA WHICH MEANS THEY ARE ACTUALLY ACTIVE, THEN ADD THEM
              // IF NOT, CHANGE CUSTOM DOMAIN ON WEBSITE TO BE EMPTY
              // THEN TRY TO UPGRADE A SITE THAT HAS A CUSTOM DOMAIN IN DATABASE BUT ISNT 
              // SUBSCRIBED TO SEE IF OVERWRITING IT WORKS
              // POTENTIAL LOGIC LATER TO AUTOPOPULATE DOMAIN ON UPGRADE IF THEY ALREADY HAVE IT BUT BAILED ON PAYING
            });
          });

          console.log("THIS>WEEBSTE: " + this.websites);
  
          console.log("After loop");
        });
      }
      console.log("After if")
    });
  }

  printWebsite(website: any) {
    return "URL: " + website['url'] + "\n" + "Custom Domain: " + website['customDomain'];
  }

  showSubscribe(website: any) {
    if (website['customDomain']) {
      return false;
    } 

    return true;
  }

  unsubscribe(subId: any) {
    const dialogRef = this.dialog.open(UnsubscribeDialog, {
      data: {subId: subId},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
  
    });
  }

  openDialog(url: any, subId: string, subItemId: string): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: {url: url, subId, subItemId},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
  
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
        return;
      } else {
        console.log("Not Here");
        console.log("AUTH NAV")
        this.router.navigate(['/auth'], { queryParams: { navigateTo: "profile" } });
      }
    });
  }

  ngOnInit(): void {
    this.checkLogin();
    this.loadUserWebsites();
  }

}


@Component({
  selector: 'dialog-overview-example-dialog',
  templateUrl: 'dialog.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, CommonModule, MatProgressSpinnerModule],
})
export class DialogOverviewExampleDialog implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly linkedInService: LinkedinService,
    private store: Firestore, private auth: AngularFireAuth,
  ) {}

  customDomain: any;
  currentUserId: any;
  currentUsername: any;
  subId: any = this.data.subId;
  subItemId: any = this.data.subItemId;
  userSelectedUrl: any = this.data.url;
  app = getApp();
  payments = getStripePayments(this.app, {
    productsCollection: "products",
    customersCollection: "customers",
  });
  submitError: string | null = null;
  navigatingToStripe: boolean = false;

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

  checkDomain(subId: string, subItemId: string) {
    this.navigatingToStripe = true;
this.submitError = null;
    // TODO: set up payment block on this

    if(this.customDomain) {
      this.linkedInService.checkDomain(this.customDomain).subscribe(async (result: any) => {
        if (result?.error?.error_code == 10006) {
          
          const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);

          setDoc(user, { customDomain: this.customDomain, url: this.userSelectedUrl }, { merge: true }).then(async () => {
            console.log("set user url");

            if (this.customDomain != "") {
              const priceId = this.linkedInService.getPriceId(true, false);
              const upgradeResult = this.linkedInService.updateStripeSubscription(priceId, subId, subItemId).subscribe(async (result: any) => {
                console.log("RESULT: " + JSON.stringify(result))
              });


              // const session = await this.linkedInService.createStripeCheckoutSession(priceId, this.customDomain, this.userSelectedUrl, true)

              // window.location.assign(session.url);
            } 

            // redirect to website page
          })


        }

        if (result?.error?.error_code == 10007) {
          console.log("Incorrect domain format");
          this.submitError = "Incorrect domain format";
          this.navigatingToStripe = false;
        }

        if (result?.domain) {
           this.submitError = "Domain is not available. Please select a different domain."
          console.log("Domaion is not available");
          this.navigatingToStripe = false;
        }

      });
    } else {
      this.navigatingToStripe = false;
      this.submitError = "Domain is required.";
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.checkLogin();
  }
}



@Component({
  selector: 'unsubscribe-dialog',
  templateUrl: 'unsubscribe-dialog.html',
  styleUrls: ['./profile.component.scss'],
  standalone: true,
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, CommonModule, MatProgressSpinnerModule],
})
export class UnsubscribeDialog implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<UnsubscribeDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly linkedInService: LinkedinService,
    private store: Firestore, private auth: AngularFireAuth
  ) {}

  currentUserId: any;
  currentUsername: any;
  //customDomain: any = this.data.customDomain;
  subId: any = this.data.subId;
  app = getApp();
  payments = getStripePayments(this.app, {
    productsCollection: "products",
    customersCollection: "customers",
  });


  async getDocumentByCustomDomain(customDomain: string): Promise<any> {
    const collectionRef = collection(this.store, `customers/${this.currentUserId}/subscriptions`);
    const q = query(collectionRef, where('metadata.customDomain', '==', customDomain));
    const querySnapshot = await getDocs(q);
  
    if (querySnapshot.empty) {
      // Document not found
      return null;
    }
  
    // Assuming you expect only one matching document
    const docSnapshot = querySnapshot.docs[0];
    const documentData = docSnapshot.data();
  
    // Access the document fields as needed
    console.log('Document Data:', documentData);
  
    return documentData;
  }

  async unsubscribe() {
    

    this.linkedInService.cancelSubscription(this.subId).subscribe(async (result: any) => {
      console.log("RESULT: " + JSON.stringify(result))
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

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.checkLogin();
  }
}