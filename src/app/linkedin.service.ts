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

  cancelSubscription(subscriptionId: string) {
    return this.http.post("/api/cancelSubscription", { subscriptionId })
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

  async createStripeCheckoutSession(priceId: any, customDomain: any, userSelectedUrl: any, useCustomDomain: boolean) {
    const app = getApp();
    const payments = getStripePayments(app, {
      productsCollection: "products",
      customersCollection: "customers",
    });

    //const ref_id = useCustomDomain ? customDomain : userSelectedUrl;
    const metadata = useCustomDomain ? { customDomain, userSelectedUrl } : { userSelectedUrl };

    const session = await createCheckoutSession(payments, {
      price: priceId,
      success_url: `http://localhost:5000/w/${userSelectedUrl}?redirectPaid=${useCustomDomain ? "professional" : "basic"}`,
      cancel_url: "http://localhost:5000",
      client_reference_id: userSelectedUrl,
      metadata: metadata,
    });

    return session;
  }

  updateStripeSubscription(priceId: string, subId: string, subItemId: string) {
    console.log("update sub", subId, subItemId, priceId)
    return this.http.post("/api/updateSubscription", { subItemId, priceId })
  }
}
