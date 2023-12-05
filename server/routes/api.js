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

router.post('/cancelSubscription', (req, res) => {

  var util = require('util')
  console.log("REQUEST HERE: " + util.inspect(req));

  const subscriptionId = req.body.subscriptionId;

  console.log("API SUB ID: " +  subscriptionId);

  stripe.subscriptions
    .del(subscriptionId)
    .then((canceledSubscription) => {
      // Handle the canceledSubscription object or any other logic
      console.log('Subscription canceled:', canceledSubscription);
      res.status(200).send('Subscription canceled successfully');
    })
    .catch((error) => {
      // Handle any errors that occur during cancellation
      console.error('Error canceling subscription:', error);
      res.status(500).send('Failed to cancel subscription');
    });
});

router.post('/updateSubscription', (req, res) => {

  console.log("DO WE GET HERE")
  var util = require('util')
  console.log("REQUEST HERE: " + util.inspect(req));

  const priceId = req.body.priceId;
  const subItemId = req.body.subItemId;

  //console.log("API SUB ID: " +  subscriptionId);

  stripe.subscriptionItems
    .update(
      subItemId,
      {
        price: priceId,
      }
    )
    .then((updatedSubscription) => {
      // Handle the canceledSubscription object or any other logic
      console.log('Subscription updated:', updatedSubscription);
      res.status(200).send('Subscription updated successfully');
    })
    .catch((error) => {
      // Handle any errors that occur during cancellation
      console.error('Error updating subscription:', error);
      res.status(500).send('Failed to update subscription');
    });
});

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