import { Component, OnInit, HostListener, HostBinding, Inject, Input } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { WINDOW_PROVIDERS, WINDOW } from '../../shared/helpers/window.helper';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  isFixed: boolean | undefined;
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
    private router: Router,
    private auth: AngularFireAuth,
  ) { }

  @Input()
    parent: string = "";
    loggedIn: boolean = false;
    displayName: string = "";

  ngOnInit() {
    this.checkLogin();
  }
  @HostListener("window:scroll", [])
  onWindowScroll() {
    const offset = this.window.pageYOffset || this.document.documentElement.scrollTop || this.document.body.scrollTop || 0;
    if(offset > 10) {
      this.isFixed = true
    } else {
      this.isFixed = false;
    }
  }

  @HostBinding("class.menu-opened") menuOpened = false;

  toggleMenu() {
    this.menuOpened = !this.menuOpened
  }

  navigateToProfile() {
    this.router.navigate([`profile`]);
  }

  buyEgret() {
    this.window.open('https://themeforest.net/item/egret-angular-4-material-design-admin-template/20161805?ref=mh_rafi');
  }

  checkLogin() {
    this.auth.authState.subscribe((res: any) => {
      
      if (res) {
        console.log("Here");
        console.log("Result of auth", JSON.stringify(res));
        this.loggedIn = true;
        this.displayName = res?.displayName || "Profile"
        console.log(res);
      } else {
        console.log("Not Here");
      }
      

    });
  }


}
