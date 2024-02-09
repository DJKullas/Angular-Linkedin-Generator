const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


// declare axios for making http requests
const axios = require('axios');
// const API = `https://api.spoonacular.com/recipes/findByIngredients`;
// const apiKey = process.env.RECIPE_KEY;

// const nodemailer = require('nodemailer');
// const GMAIL_USER = process.env.GMAIL_USER;
// const GMAIL_PASS = process.env.GMAIL_PASS;
// const BUSINESS_EMAIL = process.env.BUSINESS_EMAIL;

/* GET api listing. */
router.get('/', (req, res) => {
  res.send('api works');
});

router.get('/checkDomain', (req, res) => {

  console.log(req.query)

  axios.get(`https://api.ip2whois.com/v2?key=${process.env.IPWHOIS_KEY}&domain=${req.query.domain}`).then(response => {
    // const data = response.json();
    console.log(JSON.stringify(response.data));
    return res.status(200).json(response.data)
  }).catch(error => {
    console.log("dddWPdOvvsRKD: " + JSON.stringify(error.response.data))

    // Domain is invalid form
    if (error?.response?.data?.error?.error_code == 10007) {
      return res.status(200).json(error?.response?.data);
    }

    // DOmain is available
    if (error?.response?.data?.error?.error_code == 10006) {
      return res.status(200).json(error?.response?.data);
    }

    return res.status(error.status || 500).end(error.message)
  })

});



router.get('/linkedInInfo', (req, res) => {

  const config = {
    headers: { Authorization: `Bearer ${process.env.PROXYCURL_TOKEN}` }
  };

  axios.get(`https://nubela.co/proxycurl/api/v2/linkedin?use_cache=if-recent&url=https://www.linkedin.com/in/${req.query.linkedInId}/`, config)
    .then(data => {
      res.status(200).json(data.data);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send("Broken.");
    });
});

router.get('/image', (req, res) => {

  const url = req.query.url;

  axios.get(url, {
    responseType: "arraybuffer",
})
    .then(data => {

      let base64 = Buffer.from(data.data, "binary").toString("base64");
    
      res.status(200).json(base64);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send("Broken.");
    });
});

router.get('/getSubscriptions', (req, res) => {

  const customerId = req.query.customerId;

  stripe.subscriptions
  .list({ customer: customerId })
  .then(subscriptions => {
    // Handle the canceledSubscription object or any other logic


    const filteredSubs = subscriptions.data.filter(sub => sub.status === 'active' || sub.status === 'trialing');

    res.status(200).json(filteredSubs);
  })
  .catch((error) => {
    // Handle any errors that occur during cancellation
    console.error('Error getting subscriptions:', error);
    res.status(500).send('Failed to get subscriptions');
  });
 
});

router.post('/cancelSubscription', async (req, res) => {

  try {

    console.log("DO WE GET HERE")
    var util = require('util')
   // console.log("REQUEST HERE: " + util.inspect(req));
  
   console.log("Body", JSON.stringify(req.body))
    const customerId = req.body.customerId;
    const subId = req.body.subscriptionId;
  
    console.log("Customer id", customerId)
  
    console.log("3")
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CURRENT_URL}/profile`,
      flow_data: {
        type: 'subscription_cancel',
        subscription_cancel: {
          subscription: subId,
        },
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: `${process.env.CURRENT_URL}/profile`,
          }
        },
      },
    });
  
    res.status(200).json({ url: session.url });
} catch (error) {
  console.error('Error updating subscription:', error);
  res.status(500).send('Failed to update subscription');
}
});

router.post('/updateSubscription', async (req, res) => {

  try {

    console.log("DO WE GET HERE")
    var util = require('util')
   // console.log("REQUEST HERE: " + util.inspect(req));
  
   console.log("Body", JSON.stringify(req.body))
    const priceId = req.body.priceId;
    const subItemId = req.body.subItemId;
    const customerId = req.body.customerId;
    const customDomain = req.body.customDomain;
    const subId = req.body.subId;
    const userId = req.body.userId;
    const userSelectedUrl = req.body.userSelectedUrl;
  
    console.log("Customer id", customerId)
  
    console.log("3")
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.CURRENT_URL}/profile`,
      flow_data: {
        type: 'subscription_update',
        subscription_update: {
          subscription: subId,
        },
        after_completion: {
          type: "redirect",
          redirect: {
            return_url: `${process.env.CURRENT_URL}/profile`,
          }
        },
      },
    });
  
    res.status(200).json({ url: session.url });
} catch (error) {
  console.error('Error updating subscription:', error);
  res.status(500).send('Failed to update subscription');
}
 


});


router.post('/createSubscription', async (req, res) => {
  console.log("HERE");
  console.log("fdsf", process.env.CURRENT_URL);
  try {
    const priceId = req.body.priceId;
    const customDomain = req.body.customDomain;
    const userSelectedUrl = req.body.userSelectedUrl;
    const useCustomDomain = req.body.useCustomDomain;
    const userID = req.body.userID;
    const customer =  req.body.customerID;
    const linkedInId = req.body.linkedInId;
    const websiteType = req.body.websiteType;

    const metadata = { userSelectedUrl, websiteType, linkedInId, useCustomDomain, customDomain, userId: userID }
    // const metadata = useCustomDomain ? { customDomain: customDomain, userSelectedUrl: userSelectedUrl } : { userSelectedUrl: userSelectedUrl };

    // metadata["linkedInId"] = linkedInId;
    // metadata["websiteType"] = websiteType;

   console.log("Price ID", priceId);
   console.log("ANNULA", process.env.BASIC_ANNUAL_PRICE);
   console.log("MONTHYL", process.env.BASIC_MONTHLY_PRICE);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      ...(customer ? { customer } : {}),
      success_url: `${process.env.CURRENT_URL}/w/${userSelectedUrl}?redirectPaid=${useCustomDomain ? "professional" : "basic"}`,
      //success_url: `${process.env.DEV_URL}/w/session_id={CHECKOUT_SESSION_ID}&${userSelectedUrl}?redirectPaid=${useCustomDomain ? "professional" : "basic"}`,
      cancel_url: `${process.env.CURRENT_URL}`,
      client_reference_id: userID,
      metadata: metadata,
      subscription_data: {
        metadata: metadata,
        //trial_period_days: 30,
        ...((process.env.BASIC_ANNUAL_PRICE == priceId || process.env.BASIC_MONTHLY_PRICE == priceId) ? {trial_period_days: 7} : {}),
      },
    });

    // Redirect to the URL returned on the Checkout Session.
    res.status(200).json({ url: session.url });
    //res.redirect(303, session.url);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).send('Failed to create subscription');
  }
});



// router.post('/createSubscription', async (req, res) => {

//   console.log("DO WE GET HERE")
//   var util = require('util')
//   console.log("REQUEST HERE: " + util.inspect(req));

//   const priceId = req.body.priceId;
//   const customDomain = req.body.customDomain;
//   const userSelectedUrl = req.body.userSelectedUrl;
//   const useCustomDomain = req.body.useCustomDomain;
//   const email = req.body.email;
//   const customer = req.body.userID;

//   const metadata = useCustomDomain ? { customDomain, userSelectedUrl } : { userSelectedUrl };
//   const session = stripe.checkout.sessions.create({
//   mode: 'subscription',
//   line_items: [
//     {
//       price: priceId,
//       // For metered billing, do not pass quantity
//       quantity: 1,
//     },
//   ],
//   customer_email: email,
//   customer: customer,
//   // {CHECKOUT_SESSION_ID} is a string literal; do not change it!
//   // the actual Session ID is returned in the query parameter when your customer
//   // is redirected to the success page.
//   success_url: `${process.env.DEV_URL}/w/session_id={CHECKOUT_SESSION_ID}&${userSelectedUrl}?redirectPaid=${useCustomDomain ? "professional" : "basic"}`,
//   //success_url: 'https://example.com/success.html?session_id={CHECKOUT_SESSION_ID}',
//   cancel_url: `${process.env.DEV_URL}`,
//   client_reference_id: userSelectedUrl,
//   metadata: metadata,
// }).then((createSubscription) => {
//   // Handle the canceledSubscription object or any other logic
//   //console.log('Subscription updated:', updatedSubscription);
//   console.log("Creating subscription");
//   console.log("CREATE SUB URL", JSON.stringify(createSubscription));
//   res.redirect(303, createSubscription.url);
// })
// .catch((error) => {
//   // Handle any errors that occur during cancellation
//   console.error('Error updating subscription:', error);
//   res.status(500).send('Failed to update subscription');
// });

// // Redirect to the URL returned on the Checkout Session.
// // With express, you can redirect with:
// //   res.redirect(303, session.url);
// });

router.post('/contact', (req, res) => {

  var util = require('util')
  console.log("REQUEST HERE: " + util.inspect(req));

  sendMail()
  .then(() => {
    console.log("MAIL SENT");
  })
  .catch((err) => {
    console.log("ERROR SENDING MAIL", err);
  })
});

const nodemailer = require("nodemailer");



// async..await is not allowed in global scope, must use a wrapper
async function sendMail() {

  const transporter = nodemailer.createTransport({
    port: 25, // Postfix uses port 25
    host: 'localhost',
    tls: {
      rejectUnauthorized: false
    },
  });
  // send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "dkoolj5@gmail.com", // list of receivers
    subject: "Hello ✔", // Subject line
    text: "Hello world?", // plain text body
    html: "<b>Hello world?</b>", // html body
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  //
  // NOTE: You can go to https://forwardemail.net/my-account/emails to see your email delivery status and preview
  //       Or you can use the "preview-email" npm package to preview emails locally in browsers and iOS Simulator
  //       <https://github.com/forwardemail/preview-email>
  //
}



module.exports = router;