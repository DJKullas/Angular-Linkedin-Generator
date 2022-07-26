import { Component, ComponentFactoryResolver, OnInit } from '@angular/core';
import { LinkedinService } from '../linkedin.service';
import { Firestore, collectionData, collection, setDoc, doc, docData } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import * as e from 'express';
import { Route, Router } from '@angular/router';
import { getDoc, updateDoc } from 'firebase/firestore';

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

  constructor(private readonly linkedInService: LinkedinService, private store: Firestore, private auth: AngularFireAuth, private router: Router) { }

  createWebsite() {

    console.log("HERE IF WE ");

    if (this.currentUserId == "") {
      this.router.navigate(['/auth']);

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
            // redirect to website page
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
