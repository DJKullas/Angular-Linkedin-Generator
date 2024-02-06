import { Injectable } from '@angular/core';
import {HttpClientModule} from '@angular/common/http'
import {HttpClient} from '@angular/common/http';
import { getStripePayments } from "@stripe/firestore-stripe-payments";
import { createCheckoutSession } from "@stripe/firestore-stripe-payments";
import { getApp } from "@firebase/app";
import { environment } from 'src/environments/environment';

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

  cancelSubscription(subscriptionId: string, customerId: string) {
    return this.http.post("/api/cancelSubscription", { subscriptionId, customerId })
  }

  getSubscriptions(customerId: string) {
    return this.http.get("/api/getSubscriptions", { params: { customerId } })
  }

  sendContactEmail() {
    return this.http.post("/api/contact", { test: "test" })
  }

  getPriceId(useCustomDomain: boolean, isAnnualSelected: boolean) {
    if(useCustomDomain) {
      if (isAnnualSelected) {
        return environment.PREMIUM_ANNUAL_PRICE;
      } else {
        return environment.PREMIUM_MONTHLY_PRICE;
      }
    } else {
      if (isAnnualSelected) {
        return environment.BASIC_ANNUAL_PRICE;
      } else {
        return environment.BASIC_MONTHLY_PRICE;
      }
    }
  }

  createStripeCheckoutSession(priceId: any, customDomain: any, userSelectedUrl: any, useCustomDomain: boolean, userID: string | null, customerID: string | null, linkedInId: string, websiteType: string) {
    return this.http.post("/api/createSubscription", { customDomain, priceId, userSelectedUrl, useCustomDomain, userID, customerID, linkedInId, websiteType });
  }

  updateStripeSubscription(priceId: string, subId: string, customerId: string, customDomain: string, userId: string, userSelectedUrl: string) {
    console.log("update sub", subId, priceId)
    return this.http.post("/api/updateSubscription", { priceId, customerId, subId, customDomain, userId, userSelectedUrl })
  }
}
