const connection = require("../Model/connection");
const languageMessages = require("../Controller/languageMessage");
const axios = require('axios');

function getNotificationArrSingle(user_id, other_user_id, action, action_id, title, message, action_data, callback) {

  const notification_arr = {};
  const action_json = JSON.stringify(action_data);

  // console.log('action_json',action_json);
  InsertNotification(user_id, other_user_id, action, action_id, action_json, title, message, (insert_status) => {
    if (insert_status === 'yes') {

      getNotificationStatus(other_user_id, (notification_status) => {
        if (notification_status === 'yes') {
          getUserPlayerId(other_user_id, async (player_id) => {

            if (player_id !== 'no') {

              notification_arr.player_id = player_id;
              notification_arr.title = title;
              notification_arr.message = message;
              notification_arr.action_json = action_data;
              await oneSignalNotificationSend(title, message, action_json, notification_arr.player_id);
              callback(notification_arr);
            } else {
              callback(notification_arr);
            }
          });
        } else {
          callback(notification_arr);
        }
      });
    } else {
      callback(notification_arr);
    }
  });
}



function InsertNotification(user_id, other_user_id, action, action_id, action_json, title, message, callback) {
  const read_status = '0';
  const delete_flag = '0';
  console.log('sdf');
  const sql = "INSERT INTO user_notification_message (user_id, other_user_id, action, action_id, action_json, title,title_2,title_3,title_4, message,message_2,message_3,message_4, read_status, delete_flag, createtime, updatetime) VALUES (?,?,?,?,?, ?, ?, ?, ?, ?, ?,?, ?,?, ?, now(), now())";
  connection.query(sql, [user_id, other_user_id, action, action_id, action_json, title, title, title, title, message, message, message, message, read_status, delete_flag], (error, results) => {

    if (error) {
      console.log('Error inserting notification:', error);
      callback('no');

    } else {
      callback('yes');
    }
  });
}



function getNotificationStatus(user_id, callback) {
  const sql = "SELECT user_id FROM user_master WHERE user_id = ? AND notification_status = '1'";
  connection.query(sql, [user_id], (error, results) => {
    if (error) {
      console.error('Error getting notification status:', error);
      callback('no');
    } else {
      if (results.length > 0) {
        callback('yes');
      } else {
        callback('no');
      }
    }
  });

}








//one single notification send
async function oneSignalNotificationSend(title, message, jsonData, player_id_arr) {

  try {
    const oneSignalAppId = "685007cb-c945-49d5-9d56-eba288e0f821";
    const oneSignalAuthorization = "YzhhYzNlNzQtZWQ5Mi00NzNmLWExNDgtMmVlZWYwMGJlNmMz";

    const fields = {
      app_id: oneSignalAppId,
      contents: { en: message },
      headings: { en: title },
      include_player_ids: player_id_arr,
      data: { action_json: jsonData },
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,
      priority: 10
    };

    const config = {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Authorization': 'Basic ' + oneSignalAuthorization
      }
    };
    const response = await axios.post('https://onesignal.com/api/v1/notifications', fields, config);
    return response.data;
  } catch (error) {
    console.error('Error sending OneSignal notification:', error.message);
    return null;

  }

}



async function oneSignalNotificationSendCall(notification_arr) {
  console.log('notification_arr', notification_arr)
  if (notification_arr && notification_arr.length > 0) {
    for (const key of notification_arr) {
      const player_id_arr = [];
      if (key.player_id !== '') {
        player_id_arr.push(key.player_id);
        const title = key.title;
        const message = key.message;
        const action_json = key.action_json;
        await oneSignalNotificationSend(title, message, action_json, player_id_arr);
      }
    }
  } else {
    console.log('Notification array is empty. No notifications to send.');
  }
}


//get user player id
async function getUserPlayerId(user_id, callback) {
  try {
    if (!user_id) return 'no';
    connection.query("SELECT player_id FROM user_notification WHERE user_id = ?", [user_id], (err, result) => {
      if (err) {
        console.log("error : ", err);
      }

      if (result.length > 0) {
        let player_id = result[0].player_id;
        if (player_id === '123456') {
          player_id = 'no';
        }
        callback(player_id);
      } else {
        callback('no');
      }
    })

  } catch (error) {
    console.error('Error executing query:', error.message);
    return null;
  }
}




// get notification count start
const getNotificationCount = async (request, response) => {
  const { user_id } = request.query;
  try {
    if (!user_id) {
      return response.status(200).json({ success: false, msg: languageMessages.msg_empty_param, key: 'user_id' });
    }
    var sqlVal = "SELECT user_id,active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0";
    await connection.query(sqlVal, [user_id], async (err, info) => {

      if (err) {
        return response.status(200).json({ success: false, msg: languageMessages.internalServerError });
      }

      if (info.length <= 0) {
        return response.status(200).json({ success: false, msg: languageMessages.msgUserNotFound });
      }

      if (info[0].active_flag === 0) {
        return response.status(200).json({ success: false, msg: languageMessages.accountdeactivated, active_status: 0 });
      }

      // check notification count start
      const getCount = "SELECT count(notification_message_id) as count FROM user_notification_message WHERE delete_flag=0 and other_user_id=? and read_status = 0";
      await connection.query(getCount, [user_id], (getCountError, getCountResult) => {

        if (getCountError) {
          return response.status(200).json({ success: false, msg: languageMessages.internalServerError, getCountError });
        }
        let notificationCount = 0;
        if (getCountResult.length > 0) {
          notificationCount = getCountResult[0].count;
        }
        return response.status(200).json({ success: true, msg: languageMessages.msgDataFound, notificationCount });
      })
      // check notification count end
    });
  } catch (error) {
    return response.status(200).json({ success: false, msg: languageMessages.internalServerError, error });
  }
}
// get notification count end


//get user data
async function getUser(userId) {
  return new Promise((resolve, reject) => {
    const query1 = "SELECT  `user_id`, `login_type`, `login_type_first`, `user_type`, `email`, `password`, `username`, `f_name`, `l_name`, `name`, `dob`, `age`, `phone_code`, `mobile`, `otp`, `otp_verify`, `image`, `gender`, `address`, `latitude`, `longitude`, `zipcode`, `bio`, `bio_type`, `active_flag`, `approve_flag`, `profile_complete`, `language_id`, `facebook_id`, `google_id`, `twitter_id`, `instagram_id`, `apple_id`, `notification_status`, `delete_flag`, `delete_reason`, `createtime`, `updatetime`, `mysqltime`, `signup_step`, `avatar_id`, `currect_location_permanent`, `about` FROM user_master WHERE user_id = ? and delete_flag=0";

    connection.query(query1, [userId], async (error, results) => {
      if (error) {
        reject(error);
        return;
      }

      if (results.length > 0) {
        const user = results[0];
        try {
          const userDataArray = {
            user_id: user.user_id,
            login_type: user.login_type,
            login_type_first: user.login_type_first,
            user_type: user.user_type,
            email: user.email,
            username: user.username,
            f_name: user.f_name,
            l_name: user.l_name,
            name: user.name,
            dob: user.dob,
            age: user.age,
            phone_code: user.phone_code,
            mobile: user.mobile,
            otp: user.otp,
            otp_verify: user.otp_verify,
            image: user.image,
            gender: user.gender,
            address: user.address,
            latitude: user.latitude,
            longitude: user.longitude,
            zipcode: user.zipcode,
            active_flag: user.active_flag,
            approve_flag: user.approve_flag,
            profile_complete: user.profile_complete,
            language_id: user.language_id,
            facebook_id: user.facebook_id,
            google_id: user.google_id,
            apple_id: user.apple_id,
            notification_status: user.notification_status,
            delete_reason: user.delete_reason,
            createtime: user.createtime,
            updatetime: user.updatetime,
            bio: user.bio,
            bio_type: user.bio_type,
            signup_step: user.signup_step,
            about: user.about,
          };
          resolve(userDataArray);
        } catch (err) {
          reject(err);
        }
      } else {
        resolve(null);
      }
    });
  });
}









module.exports = {

  getNotificationArrSingle,

  oneSignalNotificationSendCall,

  getNotificationCount

}


