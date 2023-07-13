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

  axios.get(`https://nubela.co/proxycurl/api/v2/linkedin?url=https://www.linkedin.com/in/${req.query.linkedInId}/`, config)
    .then(data => {
      res.status(200).json(data.data);
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
    res.status(200).json(subscriptions.data);
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



module.exports = router;