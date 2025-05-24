const express = require('express');

const router = express.Router();



const StripeController = require('../controller/stripeController');



router.get('/payment_card_url', StripeController.paymentCardUrl);

router.post('/payment_card_create', StripeController.paymentCardCreate);

router.get('/payment_success_card', StripeController.successCardPayment);

router.get('/payment_success_final_card', StripeController.successCardPaymentFinal);

router.get('/payment_cancel_card', StripeController.cancelCardPayment);

router.get('/get_stripe_card', StripeController.getCardStripe);

router.post('/payment_using_card_id',StripeController.uploadMiddleware.none(), StripeController.paymentUsingCardId);

router.post('/delete_card',StripeController.uploadMiddleware.none(), StripeController.deleteCard);









router.use((req, res, next) => {

  res.json({success:false ,msg: 'Invalid Routes Stripe!' });

});



module.exports = router;