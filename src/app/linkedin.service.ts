import { Injectable } from '@angular/core';
import {HttpClientModule} from '@angular/common/http'
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LinkedinService {

  constructor(private http: HttpClient) { }

  checkDomain(domain: string) {
    return this.http.get('/api/checkDomain', {params: {domain: domain}});
  }

  getLinkedInInfo(linkedInId: string) {
    return this.http.get('/api/linkedInInfo', {params: {linkedInId: linkedInId}});
  }
}
