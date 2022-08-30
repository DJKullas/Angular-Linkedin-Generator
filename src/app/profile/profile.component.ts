import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { collection, collectionData, DocumentData, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {

  websites: any[] = [];

  constructor(private store: Firestore, private readonly auth: AngularFireAuth) { }

  loadUserWebsites() {
    this.auth.authState.subscribe((res: any) => {
      console.log("before if")
      console.log(res);
      if (res) {
        const websitesRef = collection(this.store, "users/" + res.uid + "/websites");
        const websites = collectionData(websitesRef).subscribe((websites: DocumentData[]) => {
          console.log("here");
          console.log(res);
  
          for (var i = 0; i < websites.length; i += 1) {
            console.log(websites[i]);

            let website = { url: websites[i]['url'], customDomain: websites[i]['customDomain'] }

            this.websites.push(website);
          }

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

  ngOnInit(): void {
    this.loadUserWebsites();
  }

}
