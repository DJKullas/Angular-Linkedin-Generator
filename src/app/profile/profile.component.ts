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

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  websites: any[] = [];
  showUpgradeDialog: boolean = false;
  currentUserId: string = "";
  currentUsername: string = "";


  constructor(private store: Firestore, private readonly auth: AngularFireAuth,
    public dialog: MatDialog, private router: Router, private readonly linkedInService: LinkedinService) { }

  loadUserWebsites() {
    this.auth.authState.subscribe((res: any) => {
      console.log("before if")
      console.log(res);
      if (res) {
        const websitesRef = collection(this.store, "users/" + res.uid + "/websites");
        collectionData(websitesRef).subscribe((websites: DocumentData[]) => {
          console.log("here");
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

              this.websites = [];

              for (var i = 0; i < websites.length; i += 1) {
                console.log(websites[i]);
    
                let customDomain;

                if (finalPaidDomains.includes(websites[i].customDomain)) {

                  customDomain = websites[i].customDomain
                } 

                let website = { url: websites[i]['url'], customDomain: customDomain }
    
                
                
                this.websites.push(website);
              }

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

  unsubscribe(customDomain: any) {
    const dialogRef = this.dialog.open(UnsubscribeDialog, {
      data: {customDomain: customDomain},
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
  
    });
  }

  openDialog(url: any): void {
    const dialogRef = this.dialog.open(DialogOverviewExampleDialog, {
      data: {url: url},
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
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule, CommonModule],
})
export class DialogOverviewExampleDialog implements OnInit {
  constructor(
    public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private readonly linkedInService: LinkedinService,
    private store: Firestore, private auth: AngularFireAuth
  ) {}

  customDomain: any;
  currentUserId: any;
  currentUsername: any;
  userSelectedUrl: any = this.data.url;
  app = getApp();
  payments = getStripePayments(this.app, {
    productsCollection: "products",
    customersCollection: "customers",
  });
  submitError: string | null = null;

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

  checkDomain() {
this.submitError = null;
    // TODO: set up payment block on this

    if(this.customDomain) {
      this.linkedInService.checkDomain(this.customDomain).subscribe(async (result: any) => {
        if (result?.error?.error_code == 10006) {
          
          const user  = doc(this.store, "users/" + this.currentUserId, "/websites/" + this.userSelectedUrl);

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
            } 

            // redirect to website page
          })


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
    } else {
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
  imports: [MatDialogModule, MatFormFieldModule, MatInputModule, FormsModule, MatButtonModule],
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
  customDomain: any = this.data.customDomain;
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
    
    const subscription = await this.getDocumentByCustomDomain(this.customDomain);

    console.log("SUBSCRIPTION : " + JSON.stringify(subscription))

    const subscriptionId = subscription.items[0].subscription;

    console.log("Subscription ID: " + subscriptionId)

    this.linkedInService.cancelSubscription(subscriptionId).subscribe(async (result: any) => {
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