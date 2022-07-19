import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-creative-cv',
  templateUrl: './creative-cv.component.html',
  styleUrls: ['./creative-cv.component.scss']
})
export class CreativeCvComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    this.loadScript('../assets/js/core/bootstrap.min.js');
    this.loadScript('../assets/js/core/jquery.3.2.1.min.js');
    this.loadScript('../assets/js/core/popper.min.js');
    this.loadScript('../assets/js/plugins/bootstrap-datepicker.js');
    this.loadScript('../assets/js/plugins/bootsrap-switch.js');
    this.loadScript('../assets/js/plugins/jquery.sharrre.js');
    this.loadScript('../assets/js/plugins/nouislider.min.js');
    this.loadScript('../assets/js/aos.js');
    this.loadScript('../assets/js/main.js');
    this.loadScript('../assets/js/now-ui-kit.js');
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

}
