import { Component, OnInit } from '@angular/core';
import { doc, docData, Firestore } from '@angular/fire/firestore';
import { Router } from '@angular/router';

@Component({
  selector: 'app-website',
  templateUrl: './website.component.html',
  styleUrls: ['./website.component.scss']
})
export class WebsiteComponent implements OnInit {

  linkedInId: string = "";
  websiteType: string = "";

  constructor(private router: Router,private store: Firestore) { }

  getLinkedInId() {
    var urlArray = this.router.url.split("/");
    var lookupKey = urlArray[urlArray.length - 1];

    const url = doc(this.store, "urls/" + lookupKey);
    const urlData = docData(url);

    urlData.subscribe((res: any) => {
      console.log(res);
      this.websiteType = res.websiteType;
      this.loadScripts();
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

  ngOnInit(): void {
    this.getLinkedInId();
  }

}
