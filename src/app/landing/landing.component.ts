import { Component, OnInit } from '@angular/core';
import { LinkedinService } from '../linkedin.service';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit {

  linkedInUrl: string = "";
  customDomain: string = "";

  constructor(private readonly linkedInService: LinkedinService) { }

  createWebsite() {

    this.linkedInService.checkDomain(this.customDomain).subscribe(result => {
      console.log("here")
      console.log(result);
    });

    
  }

  ngOnInit(): void {
  }

}
