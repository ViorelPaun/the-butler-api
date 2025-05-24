require('dotenv').config();
const path = require('path');
const StripeModel = require('../model/stripeModel');
const multer = require('multer');
const { error } = require('console');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const currency = process.env.CURRENCY;
const statement_descriptor_suffix = process.env.STATEMENT_DESCRIPTOR_SUFFIX;
const description = process.env.DESCRIPTION;

const storage = multer.diskStorage({

  destination: function (req, file, cb) {

    cb(null, 'server/webservice/images/'); // Save uploaded files to the 'server/uploads/' directory

  },

  filename: function (req, file, cb) {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));

  }

});



const uploadMiddleware = multer({ storage: storage });


const paymentCardUrl = async (req, res) => {
  if ((req === '' || !('query' in req) || !('user_id' in req.query) || (req.query.user_id === ''))) {

    const record = { 'success': false, 'msg': ['Please used post method', '', ''], 'key': 4 }

    return res.json(record);

  }
  var amount;
  if (req.query.amount) {
    amount = req.query.amount;
  } else {
    amount = '0';
  }
  var transfer_amount;
  if (req.query.transfer_amount) {
    transfer_amount = req.query.transfer_amount;
  } else {
    transfer_amount = '0';
  }
  var transfer_user_id;
  if (req.query.transfer_user_id) {
    transfer_user_id = req.query.transfer_user_id;
  } else {
    transfer_user_id = '0';
  }
  var order_id;
  if (req.query.order_id) {
    order_id = req.query.order_id;
  } else {
    order_id = Date.now();
  }
  const viewPath = path.join(__dirname, '..', 'view', 'payment_method_view.ejs');

  try {
    return res.render(viewPath, {
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
      stripeSecretKey: process.env.STRIPE_SECRET_KEY,
      returnUrl: process.env.RETURN_URL,
      cancelUrl: process.env.CANCEL_URL,
      user_id: req.query.user_id,
      amount: amount,
      transfer_amount: transfer_amount,
      transfer_user_id: transfer_user_id,
      currency: currency,
      charge_type: '',
      order_id: order_id,
      flag: 1, // 1 for card add ,2 for card add with payment , 3 for payment transfer to other user
    });
  } catch (error) {
    const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 2, 'error': error }

    return res.json(record);
  }
};
const cancelCardPayment = async (req, res) => {



  try {
    const viewPath = path.join(__dirname, '..', 'view', 'payment_cancel_card.ejs');
    return res.render(viewPath, {

      errorMsg: 'Payment success error',

    });
  } catch (error) {
    const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 2, 'error': error }

    return res.json(record);
  }
};
const successCardPaymentFinal = async (req, res) => {



  try {
    const viewPath = path.join(__dirname, '..', 'view', 'payment_success_final_card.ejs');
    return res.render(viewPath, {

      // cancelUrl: process.env.CANCEL_URL,

    });
  } catch (error) {
    const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 2, 'error': error }

    return res.json(record);
  }
};
const successCardPayment = async (req, res) => {
  // console.log(req.query.user_id);
  let viewPath;
  if ((req === '' || !('query' in req))) {

    viewPath = path.join(__dirname, '..', 'view', 'payment_cancel_card.ejs');
    return res.render(viewPath, {

      errorMsg: 'Payment success error',

    });

  }
  if (!('user_id' in req.query) || (req.query.user_id === '')) {

    viewPath = path.join(__dirname, '..', 'view', 'payment_cancel_card.ejs');
    return res.render(viewPath, {

      errorMsg: 'Please send user_id error',

    });

  }

  if (!('order_id' in req.query) || (req.query.order_id === '')) {
    viewPath = path.join(__dirname, '..', 'view', 'payment_cancel_card.ejs');
    return res.render(viewPath, {

      errorMsg: 'Please send order_id error',

    });
  }
  if (!('payment_id' in req.query) || (req.query.payment_id === '')) {
    viewPath = path.join(__dirname, '..', 'view', 'payment_cancel_card.ejs');
    return res.render(viewPath, {

      errorMsg: 'Payment success error',

    });

  }
  if (!('paymentIntent' in req.query) || (req.query.paymentIntent === '')) {

    viewPath = path.join(__dirname, '..', 'view', 'payment_cancel_card.ejs');
    return res.render(viewPath, {

      errorMsg: 'Payment success error',

    });

  }
  if (!('payment_method' in req.query) || (req.query.payment_method === '')) {

    viewPath = path.join(__dirname, '..', 'view', 'payment_method.ejs');
    return res.render(viewPath, {

      errorMsg: 'Payment success error',

    });

  }
  if (!('amount' in req.query) || (req.query.amount === '')) {

    viewPath = path.join(__dirname, '..', 'view', 'payment_cancel_card.ejs');
    return res.render(viewPath, {

      errorMsg: 'Payment success error',


    });

  }

  var amount;
  if (req.query.amount) {
    amount = req.query.amount;
  } else {
    amount = '0';
  }



  var returnUrl = process.env.RETURN_URL_FINAL;
  var cancelUrl = process.env.CANCEL_URL;
  var user_id = req.query.user_id;
  var transfer_amount = req.query.transfer_amount;
  var transfer_user_id = req.query.transfer_user_id;
  var descriptor_suffix = description;
  var paymentIntent = req.query.paymentIntent;
  var paymentMethodId = req.query.payment_method;
  var payment_id = req.query.payment_id;
  var amount = amount;
  var charge_type = req.query.charge_type;
  var order_id = req.query.order_id;
  var flag = req.query.flag;
  const json_obj = JSON.parse(paymentIntent);
  // console.log(json_obj)
  const json_obj_new = json_obj.setupIntent;
  const status = json_obj_new.status;
  var payment_status = 1;




  try {
    if (status !== 'succeeded') {
      viewPath = path.join(__dirname, '..', 'view', 'payment_success_card.ejs');
      return res.render(viewPath, {

        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
        user_id: user_id,
        transfer_user_id: transfer_amount,
        transfer_user_id: transfer_user_id,
        descriptor_suffix: descriptor_suffix,
        paymentIntent: paymentIntent,
        payment_id: payment_id,
        amount: amount,
        charge_type: charge_type,
        order_id: order_id,
        flag: flag,
        error_status: 1,
        errorMsg: 'Payment card not add succeeded error',

      });

    }
    const createStripePayment = await StripeModel.createStripePayment(user_id, order_id, amount, descriptor_suffix, payment_id, payment_status, paymentIntent, transfer_user_id, transfer_amount);
    if (createStripePayment === '0') {
      viewPath = path.join(__dirname, '..', 'view', 'payment_success_card.ejs');
      return res.render(viewPath, {

        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
        user_id: user_id,
        transfer_user_id: transfer_amount,
        transfer_user_id: transfer_user_id,
        descriptor_suffix: descriptor_suffix,
        paymentIntent: paymentIntent,
        payment_id: payment_id,
        amount: amount,
        charge_type: charge_type,
        order_id: order_id,
        flag: flag,
        error_status: 1,
        errorMsg: 'Payment card create error',
      });
    }
    const customerRecord = await StripeModel.getStripeCustomerId(user_id);
    let customer_id;
    let stripe_customer_id;
    if (customerRecord === 'NA') {
      viewPath = path.join(__dirname, '..', 'view', 'payment_success_card.ejs');
      return res.render(viewPath, {
        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
        user_id: user_id,
        payment_id: payment_id,
        amount: amount,
        charge_type: charge_type,
        order_id: order_id,
        flag: flag,
        error_status: 1,
        errorMsg: 'Customer id not get error in database',

      });

    }
    customer_id = customerRecord.customer_id;
    stripe_customer_id = customerRecord.stripe_customer_id;



    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

    const token_id = paymentMethod.id;
    const card_id = paymentMethod.id;
    const exp_month = paymentMethod.card.exp_month;
    const exp_year = paymentMethod.card.exp_year;
    const last4 = paymentMethod.card.last4;
    try {
      const result = await StripeModel.updateStripeCustomerTokenCard(user_id, customer_id, card_id, token_id, exp_month, exp_year, last4);
      console.log('result', result);
      if (result === '0') {

        viewPath = path.join(__dirname, '..', 'view', 'payment_success_card.ejs');
        return res.render(viewPath, {

          returnUrl: returnUrl,
          cancelUrl: cancelUrl,
          user_id: user_id,
          transfer_user_id: transfer_amount,
          transfer_user_id: transfer_user_id,
          descriptor_suffix: descriptor_suffix,
          paymentIntent: paymentIntent,
          payment_id: payment_id,
          amount: amount,
          charge_type: charge_type,
          order_id: order_id,
          flag: flag,
          error_status: 1,
          errorMsg: 'Payment card not add error in database',

        });
      }

      viewPath = path.join(__dirname, '..', 'view', 'payment_success_card.ejs');
      return res.render(viewPath, {

        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
        user_id: user_id,
        transfer_user_id: transfer_amount,
        transfer_user_id: transfer_user_id,
        descriptor_suffix: descriptor_suffix,
        paymentIntent: paymentIntent,
        payment_id: payment_id,
        amount: amount,
        charge_type: charge_type,
        order_id: order_id,
        flag: flag,
        error_status: 0,
        errorMsg: '',
      });
    } catch (error) {
      // Handle errors
      //console.log('odfghjlk;lkjlhkgjfhgd',error)
      viewPath = path.join(__dirname, '..', 'view', 'payment_success_card.ejs');
      return res.render(viewPath, {

        returnUrl: returnUrl,
        cancelUrl: cancelUrl,
        user_id: user_id,
        transfer_user_id: transfer_amount,
        transfer_user_id: transfer_user_id,
        descriptor_suffix: descriptor_suffix,
        paymentIntent: paymentIntent,
        payment_id: payment_id,
        amount: amount,
        charge_type: charge_type,
        order_id: order_id,
        flag: flag,
        error_status: 1,
        errorMsg: 'error in catech ' + error,

      });
    }
  } catch (error) {

    viewPath = path.join(__dirname, '..', 'view', 'payment_success_card.ejs');
    return res.render(viewPath, {

      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
      user_id: user_id,
      transfer_user_id: transfer_amount,
      transfer_user_id: transfer_user_id,
      descriptor_suffix: descriptor_suffix,
      paymentIntent: paymentIntent,
      payment_id: payment_id,
      amount: amount,
      charge_type: charge_type,
      order_id: order_id,
      flag: flag,
      error_status: 1,
      errorMsg: 'error in catech ' + error,

    });
  }
};





const paymentCardCreate = async (req, res) => {

  if ((req === '' || !('body' in req) || !('user_id' in req.body))) {

    const record = { 'success': false, 'msg': ['Please used post method', '', ''], 'key': 4 }

    return res.json(record);

  }

  const data = req.body;

  if ((data === '') || !('user_id' in data) || (data.user_id === '')) {

    const record = { 'success': false, 'msg': ['Please send user_id', '', ''], 'key': 1 }

    return res.json(record);



  } else {
    // console.log(req.body)

    try {
      const { user_id, order_id, amount } = req.body;

      // Check if the customer exists in your database
      const customerRecord = await StripeModel.getStripeCustomerId(user_id);
      // console.log('customerRecord',customerRecord)
      try {
        let customer_id;
        let stripe_customer_id;
        if (customerRecord !== 'NA') {
          //console.log('customerRecord.stripe_customer_id',customerRecord.stripe_customer_id)
          customer_id = customerRecord.customer_id;
          stripe_customer_id = customerRecord.stripe_customer_id;
        } else {
          // Create a new customer in Stripe
          let customer_name;
          let customer_email;
          const user_details = await StripeModel.getUserDetails(user_id);
          if (user_details !== 'NA') {
            customer_name = user_details.name;
            customer_email = user_details.email;
          } else {
            customer_name = '';
            customer_email = '';
          }

          const customer = await stripe.customers.create({ name: customer_name, email: customer_email });
          customer_id = customer.id;

          // Save the new customer ID in your database
          const creationResponse = await StripeModel.createStripeCustomerId(user_id, customer_id);
          // console.log('creationResponse',creationResponse)
          if (creationResponse === '0') {

            const record = { 'success': false, 'msg': ['Customer not created', '', ''], 'key': 'error' }

            return res.json(record);
          }
        }

        // Convert amount to cents
        const amountInCents = amount * 100;

        // Create a SetupIntent
        const paymentIntent = await stripe.setupIntents.create({
          customer: customer_id,
        });
        // for payment create
        //     const paymentIntents = stripe.paymentIntents.create({
        //       amount: amountInCents,//amount must be multiple of 100
        //       currency: currency,
        //       customer: customer_id,
        //       setup_future_usage : 'off_session',
        //       description : description, //max 22 charcaters
        //       statement_descriptor_suffix : statement_descriptor_suffix //max 22 charcaters

        //     });
        // console.log(paymentIntents)
        const record = { 'success': true, 'msg': ['Data Found', '', ''], clientSecret: paymentIntent.client_secret, customer_id: customer_id }

        return res.json(record);
      } catch (error) {

        // console.log("database error key 2",error);

        const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 7, 'error': error }

        return res.json(record);

      }

    } catch (error) {

      // console.log("database error key 2",error);

      const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 2, 'error': error }

      return res.json(record);

    }

  }


};

const paymentUsingCardId = async (req, res) => {

  if ((req === '' || !('body' in req))) {

    const record = { 'success': false, 'msg': ['Please used post method', '', ''], 'key': 4 }

    return res.json(record);

  }

  const data = req.body;
  // console.log(req)
  if ((data === '') || !('user_id' in data) || (data.user_id === '')) {

    const record = { 'success': false, 'msg': ['Please send user_id', '', ''], 'key': 1 }

    return res.json(record);



  }

  if ((data === '') || !('card_token_id' in data) || (data.card_token_id === '')) {

    const record = { 'success': false, 'msg': ['Please send card_token_id', '', ''], 'key': 1 }

    return res.json(record);



  }
  if ((data === '') || !('customer_id' in data) || (data.customer_id === '')) {

    const record = { 'success': false, 'msg': ['Please send customer_id', '', ''], 'key': 1 }

    return res.json(record);



  }
  if ((data === '') || !('amount' in data) || (data.amount === '')) {

    const record = { 'success': false, 'msg': ['Please send amount', '', ''], 'key': 1 }

    return res.json(record);



  }
  if ((data === '') || !('descriptor_suffix' in data) || (data.descriptor_suffix === '')) {

    const record = { 'success': false, 'msg': ['Please send descriptor_suffix', '', ''], 'key': 1 }

    return res.json(record);



  }
  else {
    // console.log(req.body)

    try {
      let amount = data.amount;
      const { customer_id, descriptor_suffix, card_token_id, user_id } = data;
      if (amount < 1) {

        const record = { 'success': false, 'msg': ['Amount must be more than 1', '', ''], 'key': 1 }

        return res.json(record);
      }

      const pay_amount = amount * 100;
      let statement_descriptor_suffix1 = descriptor_suffix;
      let paymentIntentOptions = {
        amount: pay_amount,
        currency: currency,
        description: description,
        statement_descriptor_suffix: statement_descriptor_suffix1,
        customer: customer_id,
        payment_method: card_token_id,
        off_session: true,
        confirm: true
      };

      if (!statement_descriptor_suffix) {
        delete paymentIntentOptions.statement_descriptor_suffix;
      }
      try {
        const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

        if (paymentIntent.status === 'succeeded') {

          const record = {
            'success': true, 'msg': ['Payment success', 'Payment success', 'Payment success'], transactions_id: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            paymentIntent: paymentIntent
          }

          return res.json(record);
        } else {
          const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 7, 'error': ['payment faild'], status: paymentIntent.status }
          return res.json(record);
        }


      } catch (error) {

        // console.log("database error key 2",error);

        const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 7, 'error': error }

        return res.json(record);

      }

    } catch (error) {

      // console.log("database error key 2",error);

      const record = { 'success': false, 'msg': ['Internal server Error', '', ''], 'key': 2, 'error': error }

      return res.json(record);

    }

  }


};
const getCardStripe = async (req, res) => {

  if ((req === '' || !('query' in req))) {

    const record = { 'success': false, 'msg': ['Please used get method', '', ''], 'key': 4 }

    return res.json(record);

  }

  const data = req.query;

  //  console.log(req);

  if ((data === '') || !('user_id' in data) || (data.user_id === '')) {

    const record = { 'success': false, 'msg': ['Please send user_id', '', ''], 'key': 1 }

    return res.json(record);



  } else {

    try {

      const user_id = data.user_id;
      const card_arr = await StripeModel.getStripeCard(user_id);

      const record = { 'success': true, 'msg': ['Data Found', '', ''], 'data': { card_arr: card_arr } }

      return res.json(record);

    } catch (error) {

      const record = { 'success': false, 'msg': ['Internal Server Error', '', ''], 'key': 2, 'error': error }

      return res.json(record);

    }

  }





};

//====================================== Get method end ===========================  

// delete stripe_card_master start

const deleteCard = async (req, res) => {

  const { user_id, stripe_card_id } = req.body;

  try {
    if (!user_id) {
      const record = { 'success': false, 'msg': ['Please send data', '', ''], 'key': 1, key: 'user_id' }
      return res.json(record);
    }
    if (!stripe_card_id) {
      const record = { 'success': false, 'msg': ['Please send data', '', ''], 'key': 1, key: 'stripe_card_id' }
      return res.json(record);
    }

    const card_arr = await StripeModel.getStripeCard(user_id);

    if (card_arr) {
      const deleteCard = await StripeModel.deleteCard(stripe_card_id);
    }

    const record = { 'success': true, 'msg': ['Card deleted successfully', '', ''], }
    return res.json(record);



  } catch (error) {
    const record = { 'success': false, 'msg': ['Internal Server Error', '', ''], 'key': 2, 'error': error }
    return res.json(record);
  }
}

// delete stripe_card_master end

module.exports = { paymentCardUrl, paymentCardCreate, successCardPayment, successCardPaymentFinal, cancelCardPayment, paymentUsingCardId, getCardStripe, uploadMiddleware, deleteCard };