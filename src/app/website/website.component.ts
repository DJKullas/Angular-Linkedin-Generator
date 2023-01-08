import { Component, OnInit } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { LinkedinService } from '../linkedin.service';
import { linkedInInfo } from '../models/linkedInInfo.model';

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

  constructor(private readonly auth: AngularFireAuth, private router: Router,private store: Firestore, private readonly linkedInService: LinkedinService,
              private route: ActivatedRoute) { }

  getLinkedInId() {
    var urlBeforeParams = this.router.url.split("?")[0];
    console.log("BEFORE PARAMS: " + urlBeforeParams)
    var urlArray = urlBeforeParams.split("/");
    var lookupKey = urlArray[urlArray.length - 1];

    const url = doc(this.store, "urls/" + lookupKey);
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

  getLinkedInInfo() {
    this.linkedInService.getLinkedInInfo(this.linkedInId).subscribe((res: any) => {
      // this.linkedInInfo.name = res.full_name;
      // this.linkedInInfo.occupation = res.occupation;
      // this.linkedInInfo.profilePicUrl = res.profile_pic_url;
      this.linkedInInfo = res;
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
