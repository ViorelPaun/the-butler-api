const crypto = require('crypto');
const connection = require('../Model/connection');
const moment = require('moment');
const languageMessage = require('../Controller/languageMessage');



//hash password
async function hashPassword(password) {
    const hash = crypto.createHash('md5');
    hash.update(password);
    return hash.digest('hex');
}


//OTP generate function
async function generateOTP(limit) {
    var digits = '0123456789';
    let OTP = '';
    for (let i = 0; i < limit; i++) {
        OTP += digits[Math.floor(Math.random() * 10)];
    }
    return OTP;
}


//Get user details
async function getUserData(userId) {
    const query =
        'SELECT `user_id`, `login_type`, `login_type_first`, `user_type`, `email`, `f_name`, `l_name`, `dob`, `age`, `mobile`, `otp`, `otp_verify`, `image`, `gender`,  `address`, `latitude`, `longitude`, `zipcode`, `bio`, `active_flag`, `approve_flag`, `profile_completed`, `facebook_id`, `google_id`, `twitter_id`, `instagram_id`, `apple_id`, `notification_status`, `delete_reason`, `createtime`, `updatetime`, `mysqltime`, `signup_step`, `name` FROM user_master WHERE user_id = ? and delete_flag=0';
    // eslint-disable-next-line no-useless-catch

    try {
        const results = await new Promise((resolve, reject) => {
            connection.query(query, [userId], (error, results) => {

                if (error) {
                    reject(error);
                } else {
                    resolve(results);
                }
            });
        });

        if (results.length > 0) {
            const userData = results[0];
            const userDataArray = {
                user_id: userData.user_id,
                login_type: userData.login_type,
                login_type_first: userData.login_type_first,
                user_type: userData.user_type,
                email: userData.email,
                name: userData.name,
                f_name: userData.f_name,
                l_name: userData.l_name,
                dob: userData.dob,
                age: userData.age,
                country: userData.country,
                city: userData.city,
                mobile: userData.mobile,
                otp: userData.otp,
                otp_verify: userData.otp_verify,
                image: userData.image,
                gender: userData.gender,
                address: userData.address,
                latitude: userData.latitude,
                longitude: userData.longitude,
                zipcode: userData.zipcode,
                active_flag: userData.active_flag,
                approve_flag: userData.approve_flag,
                profile_completed: userData.profile_completed,
                instagram_id: userData.instagram_id,
                delete_reason: userData.delete_reason,
                createtime: userData.createtime,
                updatetime: userData.updatetime,
                bio: userData.bio ,
            };
            return userDataArray;
        } else {
            return null;
        }
    } catch (error) {
        throw error;
    }
}




//Store player id and device type 
async function DeviceTokenStore_1_Signal(user_id, device_type, player_id) {
    return new Promise((resolve, reject) => {
        try {
            // Check if player_id exists
            const checkQuery = "SELECT player_id FROM user_notification WHERE user_id=?";
            connection.query(checkQuery, [user_id], (err, rows) => {
                if (err) {
                    return reject(err);
                }

                if (rows.length > 0) {
                    // Update record if player_id exists
                    const updateQuery = `UPDATE user_notification SET user_id = ?, device_type = ?,player_id=?, inserttime = now() WHERE user_id=?`;
                    connection.query(updateQuery, [user_id, device_type,player_id,user_id], (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve("Updated successfully.");
                    });
                } else {
                    // Insert a new record if player_id does not exist
                    const insertQuery = `INSERT INTO user_notification (user_id, device_type, player_id, inserttime) 
                        VALUES (?, ?, ?, now())`;
                    connection.query(insertQuery, [user_id, device_type, player_id], (err, result) => {
                        if (err) {
                            return reject(err);
                        }
                        return resolve("Inserted successfully.");
                    });
                }
            });
        } catch (error) {
            reject(error);
        }
    });
}



module.exports = { hashPassword, generateOTP, getUserData, DeviceTokenStore_1_Signal,  };

