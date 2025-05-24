const express = require('express');

const router = express.Router();

const upload = require('../Controller/multer');

const{verifyToken } = require('../Controller/TokenVerify');


const { signUp, otpVerify, otpResend, forgotPassword, forgotPasswordResendOtp, forgotPasswordOtpVerify, resetPassword, login, editProfile,  changePassword, deleteAccount, addContactUs  } = require('../Controller/userController');


const {  getFaq,  getContent,  getContentById, getCategory, homePage, getVideoDetails, getVideoByCategory, getPdf, getPdfDetail, getNotifications, deleteSinglenotification, deleteAllnotification ,getSubscription,subscriptionHistory,checkStatus,subscription, togglePaymentVisibility } = require('../Controller/ManageAllController');



// user controller 
router.post('/sign_up', upload.none(), signUp);
router.post('/otp_verify', upload.none(), otpVerify);
router.post('/otp_resend', upload.none(), otpResend);
router.post('/forgot_password', upload.none(), forgotPassword);
router.post('/forgot_password_resend_otp', upload.none(), forgotPasswordResendOtp);
router.post('/forgot_password_otp_verify', upload.none(), forgotPasswordOtpVerify);
router.post('/reset_password', upload.none(), resetPassword);
router.post('/login', upload.none(), login);
router.post('/edit_profile', upload.single('image'), editProfile);
router.post('/change_password', upload.none(), changePassword);
router.post('/delete_account', upload.none(), deleteAccount);
router.post('/add_contact_us', verifyToken,  upload.none(), addContactUs);


// In Manage controller
router.get('/get_content', getContent);
router.get('/get_content_by_id', getContentById);
router.get('/get_faq', verifyToken, upload.none(), getFaq);
router.get('/get_category', verifyToken,  getCategory);
router.get('/home_page',  homePage);
router.get('/get_video_details', verifyToken, getVideoDetails);
router.get('/get_video_by_category', verifyToken, getVideoByCategory);
router.get('/get_pdf', verifyToken, getPdf);
router.get('/get_pdf_detail', verifyToken, getPdfDetail);
router.post('/get_notification', verifyToken, upload.none(), getNotifications);
router.post('/delete_single_notification', verifyToken, upload.none(), deleteSinglenotification);
router.post('/delete_all_notification', verifyToken, upload.none(), deleteAllnotification);

router.get("/get_subscription",verifyToken,getSubscription);
router.get("/subscription_history",verifyToken,subscriptionHistory);
router.get("/check_status",verifyToken,checkStatus);
router.post("/subscription",upload.none(),verifyToken,subscription);

router.get('/toggle_payment_visibility', upload.none(), togglePaymentVisibility);

module.exports = router;







