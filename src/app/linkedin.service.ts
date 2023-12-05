import { Injectable } from '@angular/core';
import {HttpClientModule} from '@angular/common/http'
import {HttpClient} from '@angular/common/http';
import { getStripePayments } from "@stripe/firestore-stripe-payments";
import { createCheckoutSession } from "@stripe/firestore-stripe-payments";
import { getApp } from "@firebase/app";

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
        return "price_1NsTx2HPSFrU3NLYohRnQ4f2"
      } else {
        return "price_1NsTwgHPSFrU3NLYBoKITUDT";
      }
    } else {
      if (isAnnualSelected) {
        return "price_1NsTwEHPSFrU3NLYFzpAiuxu"
      } else {
        return "price_1NsTsxHPSFrU3NLYs4GVDF3u"
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
