
// The Cloud Functions for Firebase SDK to create Cloud Functions and triggers.
const {logger} = require("firebase-functions");
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentCreated} = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const { setGlobalOptions } = require("firebase-functions/v2/options");
const { defineString } = require('firebase-functions/params');
const stripe = require('stripe')(defineString('STRIPE_SECRET_KEY').value());

// Set the maximum instances to 10 for all functions
setGlobalOptions({ maxInstances: 10 });

initializeApp();

const getEmailData = (subType, url) => {
  switch (subType) {
    case "basic":
      return {
        "subject": "Your LinkedFolio Website has been Created",
        "mainText": "Your website has successfully been created. You can access it ",
        "linkText": "here",
        "linkUrl": url,
        "stepOne": "Your LinkedFolio website is successfully created.",
        "stepTwo": "You can share your website with others to improve your network.",
        "stepThree": "You can use your website to increase your chances on job applications.",
      }
    case "pro":
      return {
        "subject": "Your LinkedFolio Website is being Created",
        "mainText": "Your website with a custom domain is currently being created. It can take up to 72 hours for new websites to be launched. When it is finished, you can access it ",
        "linkText": "here",
        "linkUrl": url,
        "stepOne": "Enjoy your LinkedFolio website without a custom domain.",
        "stepTwo": "Wait up to 72 hours for your new website to be launched.",
        "stepThree": "Enjoy all of the features for our premium users.",
      }
    case "delete":
      return {
        "subject": "Your LinkedFolio Website has been Deleted",
        "mainText": "We are very sorry to see you go. You can always recreate your website ",
        "linkText": "here",
        "linkUrl": url,
        "stepOne": "You no longer have access to your LinkedFolio website.",
        "stepTwo": "We thank you for your time using LinkedFolio.",
        "stepThree": "Feel free to reach out with any feedback.",
      }
  }
}

const sendEmail = (toEmail, subType, url) => {
  logger.log("SAending email");
  const sgMail = require('@sendgrid/mail')
  const sendGridApiKey = defineString('SENDGRID_API_KEY').value();
  sgMail.setApiKey(sendGridApiKey)
  const msg = {
    to: toEmail, // Change to your recipient
    from: 'support@linkedfolio.com', // Change to your verified sender
    subject: subType == "delete" ? "Successfully ended LinkedFolio subscription" : 'Thanks for Your LinkedFolio Subscription',
    // text: 'and easy to do anywhere, even with Node.js',
    // html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    templateId: 'd-d9d5b64e4624421caab7017193f73072',
    dynamic_template_data: getEmailData(subType, url),
  }
  sgMail
    .send(msg)
    .then(() => {
      logger.log('Email sent')
    })
    .catch((error) => {
      logger.log("EMail send error", error)
    })
}

// Take the text parameter passed to this HTTP endpoint and insert it into
// Firestore under the path /messages/:documentId/original
exports.handleCheckout = onRequest(async (req, res) => {
    try {
        logger.log("start")
        // TODO SEND EMAIl
        const signingSecret = defineString('STRIPE_SIGNING_SECRET_HANDLE_CHECKOUT').value();
        logger.log("saigfingin secret", signingSecret)
        const payload = req?.rawBody;
        logger.log("[ayloa", payload)
        const sig = req.headers['stripe-signature'];
        logger.log("Sig", sig);

        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, sig, signingSecret);
          } catch (err) {
            logger.log("ERROR", err)
            return response.status(400).send(`Webhook Error: ${err.message}`);
          }

          logger.log("MADE IT PAST THIS ERROR")

          logger.log("EVENT IF WE HAVE", event)
        if (event?.type == "checkout.session.completed") {

            logger.log("Rigth event")
            // use custom domain if exits else use userselectedurl
            // not even sure i like that would be better to use userselected for all
            const metadata = event?.data?.object?.metadata;
            logger.log("WE got metada", metadata)
            const { userSelectedUrl, websiteType, linkedInId, useCustomDomain, customDomain } = metadata;
            logger.log("Past metadata")
            const userId = event?.data?.object?.client_reference_id;
            const customerID = event?.data?.object?.customer;

            logger.log("User id", userId)

            const useCustomDomainBool = useCustomDomain == "true";
            const planType = useCustomDomainBool ? "professional" : "basic";
            const subId = event?.data?.object?.subscription;

            const urlDoc = await getFirestore().doc(`urls/${userSelectedUrl}`);
            const urlData = { active: true, id: userSelectedUrl, websiteType: websiteType, userId: userId, linkedInId: linkedInId, planType, subId }

            logger.log("Past urldoc and data")
            
            if (useCustomDomainBool) {
                urlData["customDomain"] = customDomain;
              }

              logger.log("PAst custom check")
              await urlDoc.set(urlData);
            // const writeResult = await getFirestore()
            // .setDoc(urlDoc, urlData);
            //.doc(`urls/${event?.data?.object?.metadata?.userSelectedUrl}`).update({ active: true });

            logger.log("client_reference_id", event?.data?.object?.client_reference_id);
            logger.log("customer", event?.data?.object?.customer)
            

            await getFirestore().doc(`users/${userId}`).update({ customerId: event?.data?.object?.customer });
            
            const userWebsite = getFirestore().doc(`users/${userId}/websites/${userSelectedUrl}`);

            const userUpdateData = { url: userSelectedUrl, active: true, planType, subId, linkedInId };
            if (useCustomDomainBool) {
              userUpdateData["customDomain"] = customDomain;
            }
            await userWebsite.set(userUpdateData, { merge: true });

            const customer = await stripe.customers.retrieve(customerID);
            sendEmail(customer?.email, useCustomDomainBool ? "pro" : "basic", useCustomDomainBool ? `http://${customDomain}` : `${defineString('CURRENT_URL').value()}/w/${userSelectedUrl}`);

            res.json({failed: false, message: "It worked"});

        } else {
            res.json({failed: true, message: `Wrong event type: ${event?.type}`});
        }

    } catch(e) {
        res.json({failed: true, message: e});
        return;
    }
});


exports.handleSubscriptionDeleted = onRequest(async (req, res) => {
    try {
        logger.log("start")
        // TODO SEND EMAIl
        const signingSecret = defineString('STRIPE_SIGNING_SECRET_SUBSCRIPTION_DELETED').value();
        logger.log("saigfingin secret", signingSecret)
        const payload = req?.rawBody;
        logger.log("[ayloa", payload)
        const sig = req.headers['stripe-signature'];
        logger.log("Sig", sig);

        let event;
        try {
            event = stripe.webhooks.constructEvent(payload, sig, signingSecret);
          } catch (err) {
            logger.log("ERROR", err)
            return response.status(400).send(`Webhook Error: ${err.message}`);
          }

          logger.log("MADE IT PAST THIS ERROR")

          logger.log("EVENT IF WE HAVE", event)
        if (event?.type == "customer.subscription.deleted") {

            logger.log("In the right place", event)
            
            const metadata = event?.data?.object?.metadata;
            const customerID = event?.data?.object?.customer;
            logger.log("WE got metada", metadata)
            const { userSelectedUrl, userId } = metadata;

            await getFirestore().doc(`users/${userId}/websites/${userSelectedUrl}`).update({ active: false, planType: null, subId: null });
            await getFirestore().doc(`urls/${userSelectedUrl}`).update({ active: false, planType: null, subId: null });

            const customer = await stripe.customers.retrieve(customerID);
            sendEmail(customer?.email, "delete", defineString('CURRENT_URL').value());
            res.json({failed: false, message: "It worked"});
        } else {
            res.json({failed: true, message: `Wrong event type: ${event?.type}`});
            return;
        }

    } catch(e) {
        res.json({failed: true, message: e});
        return;
    }
});



exports.handleSubscriptionChanged = onRequest(async (req, res) => {
  try {
      logger.log("start")
      // TODO SEND EMAIl
      const signingSecret = defineString('STRIPE_SIGNING_SECRET_SUBSCRIPTION_CHANGED').value();
      logger.log("saigfingin secret", signingSecret)
      const payload = req?.rawBody;
      logger.log("[ayloa", payload)
      const sig = req.headers['stripe-signature'];
      logger.log("Sig", sig);

      let event;
      try {
          event = stripe.webhooks.constructEvent(payload, sig, signingSecret);
        } catch (err) {
          logger.log("ERROR", err)
          return response.status(400).send(`Webhook Error: ${err.message}`);
        }

        logger.log("MADE IT PAST THIS ERROR")

        logger.log("EVENT IF WE HAVE", event)
      if (event?.type == "customer.subscription.updated") {
           const switchingPlans = event?.data?.object?.status == "active" && event?.data?.previous_attributes?.plan;

           if (!switchingPlans) {
            res.json({failed: false, message: "Not a change we need to make"});
            return;
           }

            logger.log("Upgrade", event)
          
            const metadata = event?.data?.object?.metadata;
            const priceId = event?.data?.object?.plan?.id;
            const customerID = event?.data?.object?.customer;
  
         
            const { userId, userSelectedUrl } = metadata;
  
            const user = await getFirestore().doc("users/" + userId + "/websites/" + userSelectedUrl);
            let subType = ""
            let url = "";
  
            if (priceId == defineString('PREMIUM_ANNUAL_PRICE').value() || priceId == defineString('PREMIUM_MONTHLY_PRICE').value()) {
              await user.update({ planType: "professional" });
              await getFirestore().doc(`urls/${userSelectedUrl}`).update({ planType: "professional" });
              subType = "pro";
  
            } else if (priceId == defineString('BASIC_ANNUAL_PRICE').value() || priceId == defineString('BASIC_MONTHLY_PRICE').value()) {
              await user.update({ customDomain: null, planType: "basic" })
              await getFirestore().doc(`urls/${userSelectedUrl}`).update({ planType: "professional", customDomain: null });
  
              subType = "basic";
              url = `${defineString('CURRENT_URL').value()}/w/${userSelectedUrl}`;
            }
  
            const customer = await stripe.customers.retrieve(customerID);
            sendEmail(customer?.email, subType, url);
  
            res.json({failed: false, message: "It worked"});
          
      } else {
          res.json({failed: true, message: `Wrong event type: ${event?.type}`});
          return;
      }

  } catch(e) {
      res.json({failed: true, message: e});
      return;
  }
});

