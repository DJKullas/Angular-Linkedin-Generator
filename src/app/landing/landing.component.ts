import { Component, OnInit } from '@angular/core';
import { LinkedinService } from '../linkedin.service';
import { Firestore, collectionData, collection, setDoc, doc } from '@angular/fire/firestore';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  linkedInUrl: string = "";
  customDomain: string = "";

  constructor(private readonly linkedInService: LinkedinService, private store: Firestore) { }

  createWebsite() {

    console.log("HERE IF WE ");

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

      console.log("LinkedIn Url Correct format");
    }

  }

  checkDomain() {
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

  ngOnInit(): void {
    const test = doc(this.store, "test/1");
    setDoc(test, {theKey: "TheValue"})
  }

}
