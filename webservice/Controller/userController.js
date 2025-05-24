const connection = require('../Model/connection.js');
const languageMessage = require('../Controller/languageMessage');
const { generateOTP, getUserData, hashPassword, DeviceTokenStore_1_Signal, getUserDetails } = require('../Controller/function');

const { oneSignalNotificationSendCall, getNotificationArrSingle } = require('./notification.js')

const { mailer } = require('./MailerApi');

const rs = require('randomstring')


const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const { request, response } = require('express');
const { route } = require('../Router/userRouter.js');
const e = require('express');



let createtime = moment().tz('Asia/kolkata').format('YYYY-MM-DD HH:mm:ss');
let updatetime = moment().tz('Asia/kolkata').format('YYYY-MM-DD HH:mm:ss');

let key = "123456";





//Sign up 
const signUp = async (request, response) => {
    const { name, email, mobile, user_type, password, player_id, device_type } = request.body;
    try {
        if (!email) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' })
        }
        if (!mobile) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'mobile' })
        }
        if (!user_type) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_type' })
        }

        if (!device_type) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'device_type' })
        }

        if (!player_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'player_id' })
        }

        if (!password) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'password' })
        }
        var otp = await generateOTP(6);
        // var otp = 123456;
        
        // if user exits
        const sqlCheckUser = 'SELECT user_id, name, email, otp_verify FROM user_master WHERE email= ? AND delete_flag = 0';
        connection.query(sqlCheckUser, [email], async (err, info) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            const useremail = info[0] ? info[0].email : email;
            const fromName = info[0] ? info[0].name : name;
            const message = 'Your OTP is';
            const subject = 'Sign up';
            const title = 'Sign up'
            const app_logo = "https://app.the-butler-collection.com/butler_hospitality/server/webservice/logo/logo.png";
            const app_name = 'Butler Hospitality App'

            if (info.length > 0) {
                if (info[0].otp_verify == 0) {

                    await mailer(useremail, fromName, app_name, message, subject, title, app_logo, otp).then(async (data) => {
                        if (data.status == 'yes') {
                            var sql = "UPDATE user_master SET otp=?, updatetime=? WHERE email=? AND delete_flag=0";
                            connection.query(sql, [data.otp, updatetime, email], async (error, queryResult) => {

                                if (error) {
                                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message, key: '1' });
                                }

                                if (queryResult.affectedRow == 0) {
                                    return response.status(200).json({ success: false, msg: languageMessage.ErrorUpdatingdetails });
                                }
                                else {
                                    const userDataArray = await getUserData(info[0].user_id);
                                    DeviceTokenStore_1_Signal(info[0].user_id, device_type, player_id, (result) => {

                                    });
                                    let payload = { subject: userDataArray.email };
                                    const token = jwt.sign(payload, key);
                                    return response.status(200).json({ success: true, msg: languageMessage.otpsend, token, userDataArray });
                                }
                            });
                        }
                    }).catch(err => {
                        return response.status(200).json({ success: false, error: err.message, key: '2' });
                    });
                }
                else {
                    return response.status(200).json({ success: false, msg: languageMessage.emailAlreadyExist });
                }
            }

            else {
                const hashedPassword =  await hashPassword(password);
                //New User register
                const sqlInsert = 'INSERT INTO user_master (name, email, mobile, password, user_type, otp, createtime, updatetime,  signup_step) VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                connection.query(sqlInsert, [name, email, mobile, hashedPassword, user_type, otp, createtime, updatetime, 1 ], async (err, result) => {

                    if (err) {
                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message, key: '3' });

                    }
                    const userDataArray = await getUserData(result.insertId);
                    await mailer(useremail, fromName, app_name, message, subject, title, app_logo, otp).then(async (data) => {

                        if (data.status == 'yes') {
                            DeviceTokenStore_1_Signal(userDataArray.user_id, device_type, player_id, (result) => {

                            });
                            const user_id_notification = 1;
                            const other_user_id_notification = result.insertId;
                            const action = 'SignUp';
                            const action_id = result.insertId;
                            const title = 'Butler Hospitality';
                            const title_1 = 'Butler Hospitality';
                            const messages = `You are in! Welcome to Butler Hospitality App`;
                            const message_1 = 'You are in! Welcome to Butler Hospitality App';

                            const action_data = { user_id: user_id_notification, other_user_id: other_user_id_notification, action_id: action_id, action: action };

                            getNotificationArrSingle(user_id_notification, other_user_id_notification, action, action_id, title, messages, action_data, async (notification_arr_check) => {

                                let notification_arr_check_new = [notification_arr_check];
                                if (notification_arr_check_new && notification_arr_check_new.length !== 0) {
                                    const notiSendStatus = await oneSignalNotificationSendCall(notification_arr_check_new);

                                } else {
                                    console.log('Notification array is empty');
                                }
                            });

                            let payload = { subject: userDataArray.email };
                            const token = jwt.sign(payload, key);
                            return response.status(200).json({ success: true, msg: languageMessage.otpsend, token: token, userDataArray: userDataArray });

                        }
                        else {
                            return response.status(200).json({ success: false, msg: languageMessage.otpResendUnSuccess, data });
                        }
                    }).catch(error => {
                        return response.status(200).json({ success: false, msg: languageMessage.mailError, error: error.message, key: '4' });
                    });

                });
            }
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message, key: '5' });
    }
};



//OTP verify
const otpVerify = async (request, response) => {
    const { user_id, otp } = request.body;

    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        if (!otp) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'otp' });
        }

        const sqlCheckUser = 'SELECT  user_id , active_flag FROM user_master WHERE user_id =? AND delete_flag =0';
        connection.query(sqlCheckUser, [user_id], async (err, result) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (result.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }

            if (result[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }

            const checksql = 'SELECT otp FROM user_master WHERE user_id =? AND otp = ?';
            connection.query(checksql, [user_id, otp], (error, data) => {

                if (error) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError });
                }
                //   let profile_complete = 1;
                if (data.length > 0) {
                    const updateSql = 'UPDATE user_master SET otp_verify = 1 , profile_completed = 1 , updatetime = ? WHERE user_id = ?';
                    connection.query(updateSql, [updatetime, user_id], async (error, result) => {
                        if (error) {
                         return response.status(200).json({ success: false, msg: languageMessage.internalServerError });
                        }

                        if (result.affectedRows > 0) {
                            const userDataArray = await getUserData(user_id);
                            if (userDataArray.length == 0) {
                                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
                            }
                            return response.status(200).json({ success: true, msg: languageMessage.otpverifysuccess, userDataArray });
                        }
                    });
                }
                else {
                    return response.status(200).json({ success: false, msg: languageMessage.wrongotpsend })
                }
            });
        });
    } catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//Otp Resend
const otpResend = async (request, response) => {
    const { user_id } = request.body;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' })
        }
        
        var otp = await generateOTP(6);
        
        // var otp = await 123456;
        
        const sqlCheckUser = 'SELECT user_id, name, email FROM user_master WHERE user_id = ?  AND delete_flag = 0';
        const value = [user_id];
        connection.query(sqlCheckUser, value, async (err, result) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (result.length === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }
            const user_email = result[0].email;
            const fromName = result[0].name;
            const app_name = 'Butler Hospitality App'
            const message = "Your OTP is ";
            const title = "Resend OTP";
            const subject = "Resend OTP";
            const app_logo = "https://app.the-butler-collection.com/butler_hospitality/server/webservice/logo/logo.png";

            await mailer(user_email, fromName, app_name, message, title, subject, app_logo, otp).then(data => {
                if (data.status === 'yes') {
                    var sqlUpdate = 'UPDATE user_master set otp = ? , updatetime = ? WHERE user_id = ? AND delete_flag = 0';
                    connection.query(sqlUpdate, [data.otp, updatetime, user_id], async (err, queryResult) => {
                        if (err) {
                            return response.status(200).json({ success: false, msg: languageMessage.internalServerError });
                        }
                        if (queryResult.affectedRows > 0) {
                            const userDataArray = await getUserData(result[0].user_id);
                            if (userDataArray.length == 0) {
                                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
                            }
                            return response.status(200).json({ success: true, msg: languageMessage.otpResendSuccess, userDataArray })
                        }
                    });
                }
                else {
                    return response.status(200).json({ success: false, msg: languageMessage.otpResendUnSuccess });
                }

            }).catch(err => {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}



//Forgot Password And Send otp
const forgotPassword = async (request, response) => {
    const { email } = request.body;
    
    var otp = await generateOTP(6);

    // var otp = 123456;

    try {
        if (!email) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' })
        }
        const sqlCheck = 'SELECT user_id, active_flag, name, email, mobile FROM  user_master WHERE email =? AND  delete_flag = 0';
        connection.query(sqlCheck, [email], async (err, result) => {

            if (err) {
             return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }
            if (result.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }
            if (result[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });
            }

            const useremail = result[0] ? result[0].email : email;
            const fromName = result[0] ? result[0].name : name  || "User";
            const message = 'Your OTP is';
            const subject = 'Forgot Password';
            const title = 'Forgot Password'
            const app_logo = "https://app.the-butler-collection.com/butler_hospitality/server/webservice/logo/logo.png";
            const app_name = 'Butler Hospitality App'





            if (result.length > 0) {
                await mailer(useremail, fromName, app_name, message, title, subject, app_logo, otp).then(data => {

                    if (data.status === 'yes') {
                        var user_id = result[0].user_id;
                        var mobile = result[0].mobile;
                        var otp = data.otp;
                        let otp_verified = 1;
                        var email = result[0].email;
                        let user_type = 1;

                        var sqlInsert = 'INSERT INTO forgot_password_master (user_id, otp, email,  mobile,  user_type,createtime, updatetime) VALUES (?, ?, ?,?,?,?, ?)';
                        connection.query(sqlInsert, [user_id, otp, email, mobile, user_type, createtime, updatetime], async (error, data) => {

                            if (error) {
                                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message }); 
                            }
                            if (data.affectedRows > 0) {
                                const userDataArray = await getUserData(user_id);
                                if (userDataArray.length == 0) {
                                    return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound })
                                }
                                return response.status(200).json({ success: true, msg: languageMessage.otpsend, userDataArray: userDataArray });
                            }
                        });
                    }

                    else {
                        return response.status(200).json({ success: false, msg: languageMessage.otpResendUnSuccess });
                    }
                }).catch(err => {
                    return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound, error: err.message });
                });
            }
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//Forgot Password Resend Otp
const forgotPasswordResendOtp = async (request, response) => {
    const { email } = request.body;
    try {
        if (!email) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' });
        }

        var otp = await generateOTP(6);


        //   var otp = 123456;

        const sqlCheck = 'SELECT user_id, email, name, active_flag FROM user_master WHERE email =? AND delete_flag  = 0';
        connection.query(sqlCheck, [email], async (error, result) => {
            if (error) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, err: error.message });
            }
            if (result.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }

            if (result[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });
            }

            const user_email = result[0].email;
            const fromName = result[0].name || "User";;
            const message = "Your OTP is";
            const title = "Forgot Password"
            const subject = "Forgot Password";
            const app_logo = "https://app.the-butler-collection.com/butler_hospitality/server/webservice/logo/logo.png";
            const app_name = "Butler Hospitality App"
            await mailer(user_email, fromName, app_name, message, title, subject, app_logo, otp).then(data => {
                if (data.status === 'yes') {
                    var sqlUpdate = 'UPDATE  forgot_password_master set otp = ? ,updatetime = ? WHERE email =? AND delete_flag =0';
                    connection.query(sqlUpdate, [data.otp, updatetime, email], async (error, result) => {

                        if (error) {
                            return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
                        }
                        else {
                            let fetchUserId = "SELECT user_id from user_master WHERE email = ?";
                            connection.query(fetchUserId, [email], async (err1, res1) => {
                                if (err1) {
                                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError })
                                }

                                const userDataArray = await getUserData(res1[0].user_id);
                                if (userDataArray.length === 0) {
                                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                                }

                                return response.status(200).json({ success: true, msg: languageMessage.otpsend, userDataArray: userDataArray });
                            });
                        }
                    });
                }
                else {
                    return response.status(200).json({ success: false, msg: languageMessage.otpResendUnSuccess });
                }
            }).catch(err => {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            });
        });
    } catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//Forgot Password otp verify
const forgotPasswordOtpVerify = async (request, response) => {
    const { user_id, otp } = request.body;

    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }

        if (!otp) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'otp' });
        }

        const sqlCheck = 'SELECT user_id , active_flag FROM  user_master WHERE user_id =? AND delete_flag = 0';
        connection.query(sqlCheck, [user_id], async (err, result) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (result.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }

            if (result[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }

            var checkOtp = 'SELECT otp FROM forgot_password_master WHERE user_id = ? AND otp =?';
            connection.query(checkOtp, [user_id, otp], async (err, data) => {
                if (err) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
                }

                if (data.length > 0) {
                    let otp_verified = 1;
                    const updateSql = 'UPDATE  forgot_password_master SET otp_verified = ?, updatetime = ? WHERE user_id =?';
                    connection.query(updateSql, [otp_verified, updatetime, user_id], async (error, info) => {
                        if (error) {
                            return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
                        }
                        else {
                            const userDataArray = await getUserData(user_id);
                            if (userDataArray.length === 0) {
                                return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                            }
                            return response.status(200).json({ success: true, msg: languageMessage.otpverifysuccess, userDataArray });
                        }
                    });
                }
                else {
                    return response.status(200).json({ success: false, msg: languageMessage.wrongotpsend });
                }
            });
        });
    } catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//reset Password
const resetPassword = async (request, response) => {
    const { user_id, new_password } = request.body;

    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        if (!new_password) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'new_password' });
        }

        const sqlCheck = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(sqlCheck, [user_id], async (err, result) => {

            if (err) { 
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (result.length === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }

            if (result[0].active_flag === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }
            const hashedPassword = await hashPassword(new_password);
            const changePasswordQuery = "UPDATE user_master SET password = ? WHERE user_id = ?";
            connection.query(changePasswordQuery, [hashedPassword, user_id], (error, res) => {

                if (error) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
                }

                if (res.affectedRows === 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                }
                return response.status(200).json({ success: true, msg: languageMessage.NewPasswordCreatedSuccessfully });
            });
        });
    } catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
};


//login
const login = async (request, response) => {
    const { email, password, device_type, player_id } = request.body;

    try {
        if (!email) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' });
        }
        if (!password) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'password' });
        }

        if (!device_type) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'device_type' });
        }

        if (!player_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'player_id' });
        }

        const sqlCheck = 'SELECT user_id , email , password, active_flag FROM user_master WHERE email = ? AND user_type = 1 AND otp_verify = 1 AND delete_flag =0';
        connection.query(sqlCheck, [email], async (err, result) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (result.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.userNotRegisterHere });
            }

            if (result[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });
            }
            if (result.length > 0) {
                const hashedPassword = await hashPassword(password);
                var user_id = result[0].user_id;
                const query1 = 'SELECT user_id , password FROM user_master WHERE  email =? AND delete_flag = 0';
                connection.query(query1, [email], async (err, data) => {

                    if (err) {
                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
                    }
                    if (data.length === 0) {
                        return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                    }
                    if (data.length > 0) {
                        if (hashedPassword != data[0].password) {
                            return response.status(200).json({ success: false, msg: languageMessage.InvalidPassword });
                        }
                    }

                    user_id = data[0].user_id;
                    DeviceTokenStore_1_Signal(user_id, device_type, player_id, (result) => {
                    });
                    const userDataArray = await getUserData(user_id);
                    let payload = { subject: userDataArray.email };
                    const token = jwt.sign(payload, key);

                    if (userDataArray.length === 0) {
                        return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                    }
                   return response.status(200).json({ success: true, msg: languageMessage.loginSuccessful, token: token, userDataArray });
                });
            }
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//Edit User profile
const editProfile = async (request, response) => {
    const { user_id, name, email, mobile, address } = request.body;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }

        if (!name) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'name' });
        }

        if (!email) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' });
        }

        if (!mobile) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'mobile' });
        }

        if (!address) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'address' });
        }

        const checkUser = 'SELECT user_id, active_flag , name, mobile, address, image FROM  user_master WHERE  user_id = ? AND delete_flag =0 AND user_type = 1';
        connection.query(checkUser, [user_id], async (error, result) => {

            if (error) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
            }

            if (result.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }

            if (result[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });
            }

            let checkMobile = "SELECT email FROM user_master WHERE email = ? AND user_id !=? AND delete_flag = 0";
            connection.query(checkMobile, [email, user_id], async (err, res) => {
                if (err) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
                }

                if (res.length > 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.EmailExist });
                }

                var image = '';
                if (!request.file) {
                    image = result[0].image;
                } else {
                    image = request.file.filename;
                }

                // if (!image) {
                //     return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'image' });
                // }
                const updateDetails = 'UPDATE user_master SET name = ?, email = ?, mobile =?, address = ?,  image = ?, updatetime = ? WHERE  user_id = ? AND delete_flag = 0';
                connection.query(updateDetails, [name ? name : res[0].name, email ? email : res[0].email, mobile ? mobile : res[0].mobile,   address, image , updatetime, user_id], async (error1, result1) => {

                    if (error1) {
                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error1.message });
                    }

                    if (result1.affectedRows == 0) {
                        return response.status(200).json({ success: false, msg: languageMessage.ErrorUpdatingdetails });
                    }

                    if (result1.affectedRows > 0) {
                        const userDataArray = await getUserData(user_id)
                        return response.status(200).json({ success: true, msg: languageMessage.profileUpdateSuccessfully, userDataArray: userDataArray });
                    }
                });
            });

        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//Change Password
const changePassword = async (request, response) => {
    const { user_id, current_password, new_password } = request.body;
    try {

        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }

        if (!current_password) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'current_password' });
        }

        if (!new_password) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'new_password' });
        }

        var sqlCheck = 'SELECT user_id , active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
        connection.query(sqlCheck, [user_id], async (err, result) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (result.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }


            if (result[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });
            }

            var sqlForget = 'SELECT password FROM user_master WHERE user_id = ?';
            connection.query(sqlForget, [user_id], async (err, data) => {

                if (err) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
                }

                if (data.length === 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });

                }
                var user_password = data[0].password;
                const current_password_set = await hashPassword(current_password);
                if (user_password == current_password_set) {
                    const new_pass = await hashPassword(new_password);

                    if (current_password_set == new_pass) {
                        return response.status(200).json({ success: false, msg: languageMessage.CurrentNewPasswordNotSame })
                    }
                    var updateSql = 'UPDATE user_master SET password=? WHERE user_id = ? AND delete_flag = 0';
                    connection.query(updateSql, [new_pass, user_id], async (err, queryResult) => {

                        if (err) {
                            return response.status(200).json({ success: false, msg: languageMessage.internalServerError });
                        }

                        if (queryResult.affectedRows > 0) {
                            const userDataArray = await getUserData(user_id)

                            if (userDataArray.length == 0) {
                                return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                            }
                            return response.status(200).json({ success: true, msg: languageMessage.forgotNewpasswordUpdate, userDataArray });
                        }
                    });
                }
                else {
                    return response.status(200).json({ success: false, msg: languageMessage.CurrentPasswordNotCorrect });
                }
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

}

//Delete Account
const deleteAccount = async (request, response) => {
    const { user_id, reason } = request.body;

    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' })
        }

        if (!reason) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'reason' })
        }

        let checkUser = "SELECT user_id , active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";
        connection.query(checkUser, [user_id], async (err, res) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message })
            }

            if (res.length === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound })
            }

            if (res[0].active_flag === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 })
            }

            let DeleteUserAccount = "UPDATE user_master SET delete_reason = ? , delete_flag = 1, updatetime = ? WHERE user_id = ?";
            connection.query(DeleteUserAccount, [reason, updatetime, user_id], async (error, result) => {

                if (error) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message })
                }

                if (result.affectedRows === 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.FailedDeletingAccount })
                }
                return response.status(200).json({ success: true, msg: languageMessage.AccoundDeleted })
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message, key: '2' })
    }
}


//Add contact us
const addContactUs = async (request, response) => {
    const { user_id, name, email, message } = request.body;

    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        if (!name) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'name' });
        }
        if (!email) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'email' });
        }
        if (!message) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'message' });
        }

        const checkUser = 'SELECT user_id, active_flag FROM  user_master WHERE  user_id = ? AND delete_flag =0';
        connection.query(checkUser, [user_id], async (err, res) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }

            if (res.length == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
            }

            if (res[0].active_flag == 0) {
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });
            }

            const insertSql = 'INSERT INTO contact_us_master (user_id, name, email, message, createtime, updatetime) VALUES(?, ?, ?, ?, ?, ?)'
            connection.query(insertSql, [user_id, name, email, message, createtime, updatetime], async (err1, res1) => {

                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }

                if (res1.affectedRows === 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.ContactNotSend });
                }

                if (res1.affectedRows > 0) {
                    return response.status(200).json({ success: true, msg: languageMessage.ContactUsSend });
                }
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


module.exports = { signUp, otpVerify, otpResend, forgotPassword, forgotPasswordResendOtp, forgotPasswordOtpVerify, resetPassword, login, editProfile, changePassword, deleteAccount,addContactUs }



