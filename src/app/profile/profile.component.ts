import { Component, Inject, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Firestore, collectionData, collection, setDoc, doc, docData, DocumentData, query, where, getDocs, Timestamp } from '@angular/fire/firestore';
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
import { last, subscribeOn, take, tap } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ImageUploaderService } from '../image-uploader.service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { PendingDialog } from '../website/pending-dialog.component';


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
  websitesLoaded: boolean = false;
  currentUrl: string = environment.CURRENT_URL;


  constructor(private store: Firestore, private readonly auth: AngularFireAuth,
    public dialog: MatDialog, private router: Router, private readonly linkedInService: LinkedinService,
    private readonly imageUploaderService: ImageUploaderService,) { }

    refreshLinkedInInfo(url: string, linkedInId: string, lastRefresh: Timestamp, index: number, planType: string) {

      let currentWebsiteData: any;

      if (planType == "basic") {
        currentWebsiteData = this.basicWebsites[index];
      } else if (planType == "professional") {
        currentWebsiteData = this.professionalWebsites[index];
      }

      currentWebsiteData.refreshing = true;

      const lastRefreshDate = lastRefresh?.toDate()?.getTime();
      const nextRefreshDate = lastRefreshDate + ( 24 * 60 * 60 * 1000);

      console.log("NExt refresh data");

     // const currentDate = Date.now();
      //const oneDay = 24 * 60 * 60 * 1000;
      const nowDate = new Date();

      console.log(":NOW DATE", nowDate.getTime());

      if (!lastRefresh || nowDate.getTime() > nextRefreshDate) {
        
      const thisWebsite = doc(this.store, "urls/" + url);
  
        docData(thisWebsite).pipe(take(1)).subscribe((res: any) => {

          const currentLastRefreshedDate = res?.lastRefreshDate?.toDate()?.getTime();
          const currentNextRefreshDate = currentLastRefreshedDate + ( 24 * 60 * 60 * 1000);


          if (!currentLastRefreshedDate || nowDate.getTime() > currentNextRefreshDate) {

            this.linkedInService.getLinkedInInfo(linkedInId).subscribe(async (res: any) => {


              console.log("BEFORE AWAIT")
              const downloadURL = await this.imageUploaderService.uploadImageAndGetURL(res?.profile_pic_url, url);
              console.log('Download URL:', downloadURL);
             
          
              // .then((imageUrlRes: any) => {
              //   console.log("INSDIE IMAGE UPLOADER")
              //   console.log(JSON.stringify(imageUrlRes));
      
              res.profile_pic_url = downloadURL;

                setDoc(thisWebsite, { info: res, lastRefresh: nowDate }, { merge: true }).then(async () => {
                  console.log("Set the data")
                  const userWebsite = doc(this.store, `users/${this.currentUserId}/websites/${url}`);
                  setDoc(userWebsite, { lastRefresh: nowDate },  { merge: true }).then(() => {
                    console.log("Set nuser website data");
                    currentWebsiteData.refreshing = false;
                  this.openCooldownDialog("Successfully Updated Data", `You have successfully updated your website data to use your current LinkedIn data. Please navigate to your website to see the updated data.`);

                  });
                });
              // });
            });

          } else {
            const timeDifference = currentLastRefreshedDate + (24 * 60 * 60 * 1000) - nowDate.getTime();

            const hours = Math.floor(timeDifference / (1000 * 60 * 60));
            const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
            currentWebsiteData.refreshing = false;

            this.openCooldownDialog("Data Refresh Cooldown", `You can only refresh your LinkedIn data every 24 hours. Please wait ${hours} hours and ${minutes} minutes before trying to refresh this website. Thank you!`);
          }

        });

      } else {
        const timeDifference = lastRefreshDate + (24 * 60 * 60 * 1000) - nowDate.getTime();

        const hours = Math.floor(timeDifference / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

        currentWebsiteData.refreshing = false;
        this.openCooldownDialog("Data Refresh Cooldown", `You can only refresh your LinkedIn data every 24 hours. Please wait ${hours} hours and ${minutes} minutes before trying to refresh this website. Thank you!`);
        
      }
        
      
    }

  loadUserWebsites() {

    this.auth.authState.subscribe((res: any) => {
      if (res?.uid) {

        const userRef = doc(this.store, "users/" + res.uid);

        docData(userRef).subscribe({
          next: (user: DocumentData) => {


            const userWebsites = collection(this.store, "users/" + res.uid + "/websites");


            collectionData(userWebsites, { idField: "id" }).subscribe({
              next: (websites: DocumentData[]) => {
                
            const customerID = user?.customerId;
            this.linkedInService.getSubscriptions(user?.customerId).subscribe({
              next: async (result: any) => {
              console.log("RESULT Getting subs: " + JSON.stringify(result))

              const basicSubs = result.filter((x: any) => {
                return x?.items?.data[0]?.plan?.id == environment.BASIC_ANNUAL_PRICE || 
                x?.items?.data[0]?.plan?.id == environment.BASIC_MONTHLY_PRICE; 
              });

              console.log("Basic subs", JSON.stringify(basicSubs))

              const proSubs = result.filter((x: any) => {
                return x?.items?.data[0]?.plan?.id == environment.PREMIUM_ANNUAL_PRICE || 
                x?.items?.data[0]?.plan?.id == environment.PREMIUM_MONTHLY_PRICE; 
              });

              this.websites = [];
              this.basicWebsites = [];
              this.professionalWebsites = [];

              for (const sub of basicSubs) {

                console.log("sub data", JSON.stringify(sub));
                console.log("Websites data", JSON.stringify(websites));
                let websiteData = websites.find((x) => x?.id == sub?.metadata?.userSelectedUrl)
                const subItemId = sub?.items?.data[0]?.id;

                console.log("Webiste data", websiteData)
                
                let basicWebsite = { refreshing: false, url: websiteData?.id, linkedInId: websiteData?.linkedInId, subId: sub?.id, subItemId, lastRefresh: websiteData?.lastRefresh }
                this.basicWebsites.push(basicWebsite);
              }

              for (const sub of proSubs) {
                const subItemId = sub?.items?.data[0]?.id;
                let websiteData = websites.find((x) => x?.id == sub?.metadata?.userSelectedUrl)
                let proWebsite = { refreshing: false, url: websiteData?.id, customDomain: websiteData?.customDomain, linkedInId: websiteData?.linkedInId, subId: sub?.id, subItemId, lastRefresh: websiteData?.lastRefresh }
                this.professionalWebsites.push(proWebsite);
              }

              this.websitesLoaded = true;
 
              // TODO: MOVE LOOPING LOGIC IN HERE, CHECK IF WEBSITES WITH CUSTOM DOMAIN ARE IN
              // SUB LIST METADATA WHICH MEANS THEY ARE ACTUALLY ACTIVE, THEN ADD THEM
              // IF NOT, CHANGE CUSTOM DOMAIN ON WEBSITE TO BE EMPTY
              // THEN TRY TO UPGRADE A SITE THAT HAS A CUSTOM DOMAIN IN DATABASE BUT ISNT 
              // SUBSCRIBED TO SEE IF OVERWRITING IT WORKS
              // POTENTIAL LOGIC LATER TO AUTOPOPULATE DOMAIN ON UPGRADE IF THEY ALREADY HAVE IT BUT BAILED ON PAYING
            },
            error: (error) => this.websitesLoaded = true });

              },
              error: (error) => {
                this.websitesLoaded = true
              }
            });


          },
          error: (error) => this.websitesLoaded = true });
      }
    });


    // this.auth.authState.subscribe((res: any) => {
    //   console.log("before if")
    //   console.log(JSON.stringify(res));
    //   if (res) {
    //     console.log("in res")
    //    //const websitesRef = collection(this.store, "users/" + res.uid + "/websites");
    //     const websitesRef = collection(this.store, "urls");
    //     console.log("websites ref", websitesRef);
    //     console.log("UID", res.uid);

    //     const websitesRefQuery = query(websitesRef, where('userId', '==', res.uid));
    //     console.log("WEBSITE REF QUERRT", websitesRefQuery);
    //     console.log("next");
        
    //     collectionData(websitesRefQuery, { idField: "id" }).subscribe({
    //       next: (websites: DocumentData[]) => {
    //       console.log("here");
    //       console.log("THING I NEED", JSON.stringify(websites))
    //       console.log(res);
  

    //       docData(userRef).subscribe({
    //         next: (user: DocumentData) => {
    //         console.log("Stripe ID: " + user?.customerId);
    //         //console.log("CUST: " + JSON.stringify(customer))
    //         this.linkedInService.getSubscriptions(user?.customerId).subscribe({
    //           next: async (result: any) => {
    //           console.log("RESULT Getting subs: " + JSON.stringify(result))

    //           let paidDomains = result.filter((x: any) => {
    //             return x?.metadata?.customDomain;
    //           })

    //           console.log("PAID DOMAINS OBJECTS: " + JSON.stringify(paidDomains))

    //           let finalPaidDomains = paidDomains.map((x: any) => {
    //             return x?.metadata?.customDomain;
    //           })

    //           console.log("FINAL PAID DOMAINDS: " + JSON.stringify(finalPaidDomains))

    //           const basicSubs = result.filter((x: any) => {
    //             return x?.items?.data[0]?.plan?.id == environment.BASIC_ANNUAL_PRICE || 
    //             x?.items?.data[0]?.plan?.id == environment.BASIC_MONTHLY_PRICE; 
    //           });

    //           console.log("Basic subs", JSON.stringify(basicSubs))

    //           const proSubs = result.filter((x: any) => {
    //             return x?.items?.data[0]?.plan?.id == environment.PREMIUM_ANNUAL_PRICE || 
    //             x?.items?.data[0]?.plan?.id == environment.PREMIUM_MONTHLY_PRICE; 
    //           });

    //           this.websites = [];
    //           this.basicWebsites = [];
    //           this.professionalWebsites = [];

    //           for (const sub of basicSubs) {

    //             let websiteData = websites.find((x) => x?.id == sub?.metadata?.userSelectedUrl)
    //             const subItemId = sub?.items?.data[0]?.id;

    //             console.log("Webiste data", websiteData)
                
    //             let basicWebsite = { url: websiteData?.id, linkedInId: websiteData?.linkedInId, subId: sub?.id, subItemId }
    //             this.basicWebsites.push(basicWebsite);
    //           }

    //           for (const sub of proSubs) {
    //             const subItemId = sub?.items?.data[0]?.id;
    //             let websiteData = websites.find((x) => x?.id == sub?.metadata?.userSelectedUrl)
    //             let proWebsite = { url: websiteData?.id, customDomain: websiteData?.customDomain, linkedInId: websiteData?.linkedInId, subId: sub?.id, subItemId }
    //             this.professionalWebsites.push(proWebsite);
    //           }

    //           this.websitesLoaded = true;
    //           // for (var i = 0; i < websites.length; i += 1) {
    //           //   console.log(websites[i]);
    
    //           //   let customDomain;

    //           //   if (finalPaidDomains.includes(websites[i].customDomain)) {

    //           //     customDomain = websites[i].customDomain
    //           //   } 

    //           //   let website = { url: websites[i]['id'], customDomain: customDomain, linkedInId: websites[i]['linkedInId'] }
  
    //           //   let basicWebsite = { url: websites[i]['id'], linkedInId: websites[i]['linkedInId'], subId:  }
                
    //           //   this.websites.push(website);
    //           // }

    //           // TODO: MOVE LOOPING LOGIC IN HERE, CHECK IF WEBSITES WITH CUSTOM DOMAIN ARE IN
    //           // SUB LIST METADATA WHICH MEANS THEY ARE ACTUALLY ACTIVE, THEN ADD THEM
    //           // IF NOT, CHANGE CUSTOM DOMAIN ON WEBSITE TO BE EMPTY
    //           // THEN TRY TO UPGRADE A SITE THAT HAS A CUSTOM DOMAIN IN DATABASE BUT ISNT 
    //           // SUBSCRIBED TO SEE IF OVERWRITING IT WORKS
    //           // POTENTIAL LOGIC LATER TO AUTOPOPULATE DOMAIN ON UPGRADE IF THEY ALREADY HAVE IT BUT BAILED ON PAYING
    //         },
    //         error: (error) => this.websitesLoaded = true });
    //       }, 
    //       error: (error) => this.websitesLoaded = true });

    //       console.log("THIS>WEEBSTE: " + this.websites);
  
    //       console.log("After loop");
    //     }, 
    //     error: (err) => this.websitesLoaded = true });
    //   } else {
    //     console.log("websites laoded");
    //     this.websitesLoaded = true;
    //   }
    //   console.log("After if")
    // });
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

  openCooldownDialog(title: string, description: string): void {
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

  openDialog(url: any, subId: string): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: {url: url, subId },
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

  checkDomain(subId: string) {
    this.navigatingToStripe = true;
this.submitError = null;
    // TODO: set up payment block on this

    if(this.customDomain) {
      this.linkedInService.checkDomain(this.customDomain).subscribe(async (result: any) => {
        if (result?.error?.error_code == 10006) {
          
      
            console.log("set user url");

            const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);

          setDoc(user, { customDomain: this.customDomain }, { merge: true }).then(async () => {
            console.log("set user url");

            if (this.customDomain != "") {

              const website = doc(this.store, `urls/${this.userSelectedUrl}`);

              setDoc(website, { customDomain: this.customDomain }, { merge: true }).then(() => {


                const userData = doc(this.store, `users/${this.currentUserId}`);

                docData(userData).subscribe(async (userResult: any) => {
                  if (userResult) {
                    const priceId = this.linkedInService.getPriceId(true, false);
                    console.log("customer id", userResult?.customerId);
                    const upgradeResult = this.linkedInService.updateStripeSubscription(priceId, subId, userResult?.customerId, this.customDomain, this.currentUserId, this.userSelectedUrl).subscribe(async (result: any) => {
                      console.log("RESULT: " + JSON.stringify(result))
                      window.location.assign(result.url);
                    });
                  }
                });

              });
              // window.location.assign(session.url);
            } 

          });


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
  unsubscribed = false;
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
    const userData = doc(this.store, `users/${this.currentUserId}`);
    docData(userData).subscribe(async (userResult: any) => {
      if (userResult) {
        this.linkedInService.cancelSubscription(this.subId, userResult?.customerId).subscribe(async (result: any) => {
          console.log("RESULT: " + JSON.stringify(result))
          window.location.assign(result.url);
        });
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

  onNoClick(): void {
    this.dialogRef.close();
  }

  ngOnInit() {
    this.checkLogin();
  }
}