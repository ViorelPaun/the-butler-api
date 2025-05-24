//DeviceToken_playerId

//Generate OTP

//Date Time Formate

//Single File Upload

//Multiple file Upload

//Onesignal Notification

//Notification Count

//jwt token create

//jwt token check function

const {connection} = require("../connection/db");

const axios = require("axios");

//const moment = require('moment-timezone');

const dotenv = require("dotenv");

const moment = require("moment");

const path = require("path");

const multer = require("multer");

const crypto = require("crypto");

const jwt = require("jsonwebtoken");

dotenv.config();



//---------------hashPassword---------------------

async function hashPassword(pass) {

    return crypto.createHash("sha256").update(pass).digest("hex");

  };



  // JWT Token Generator Function

const generateToken = (user) => {

    const payload = {user};

  

    // Generate the token

    const token = jwt.sign(payload, process.env.SECRET_KEY);

    return token;

  };



  async function DeviceTokenStore_1_Signal(user_id, device_type, player_id) {

    return new Promise((resolve, reject) => {

      try {

        // Check if player_id exists

        const checkQuery =

          "SELECT player_id FROM user_notification WHERE user_id=?";

        connection.query(checkQuery, [user_id], (err, rows) => {

          if (err) {

            return reject(err);

          }

          if (rows.length > 0) {

            // Update record if player_id exists

            const updateQuery = `UPDATE user_notification SET user_id = ?, device_type = ?,player_id=?, inserttime = now() WHERE user_id=?`;

            connection.query(

              updateQuery,

              [user_id, device_type, player_id, user_id],

              (err, result) => {

                if (err) {

                  return reject(err);

                }

                return resolve("Updated successfully.");

              }

            );

          } else {

            // Insert a new record if player_id does not exist

            const insertQuery = `INSERT INTO user_notification (user_id, device_type, player_id, inserttime) 

                          VALUES (?, ?, ?, now())`;

            connection.query(

              insertQuery,

              [user_id, device_type, player_id],

              (err, result) => {

                if (err) {

                  return reject(err);

                }

                return resolve("Inserted successfully.");

              }

            );

          }

        });

      } catch (error) {

        reject(error);

      }

    });

  }





//-------------notification count-------------------

async function getNotificationCount(user_id) {

  return new Promise((resolve, reject) => {

    try {

      // Check if player_id exists

      const checkQuery =

        "SELECT COUNT(notification_message_id) as notification_count FROM user_notification_message WHERE other_user_id=? and delete_flag=0 and read_status=0";

      connection.query(checkQuery, [user_id], (err, rows) => {

        if (err) {

          return reject(err);

        }

        if (rows.length > 0) {

          return resolve(rows[0].notification_count);

        } else {

          return resolve(0);

        }

      });

    } catch (error) {

      reject(error);

    }

  });

}



//send notification code

async function getNotificationArrSingle(

  user_id,

  other_user_id,

  action,

  action_id,

  title,

  title_2,

  title_3,

  title_4,

  message,

  message_2,

  message_3,

  message_4,

  action_data,

  callback

) {

  const notification_arr = {};

  const action_json = JSON.stringify(action_data);

  InsertNotification(

    user_id,

    other_user_id,

    action,

    action_id,

    action_json,

    title,

    title_2,

    title_3,

    title_4,

    message,

    message_2,

    message_3,

    message_4,

    (insert_status) => {

      if (insert_status === "yes") {

        getNotificationStatus(other_user_id, (notification_status) => {

          getUserPlayerId(other_user_id, async (player_id) => {

            if (player_id !== "no") {

              notification_arr.player_id = player_id;

              notification_arr.title = title;

              notification_arr.message = message;

              notification_arr.action_json = action_data;

              await oneSignalNotificationSend(

                title,

                message,

                action_json,

                notification_arr.player_id

              );

              callback(notification_arr);

            } else {

              callback(notification_arr);

            }

          });

        });

      } else {

        callback(notification_arr);

      }

    }

  );

}

function InsertNotification(

  user_id,

  other_user_id,

  action,

  action_id,

  action_json,

  title,

  title_2,

  title_3,

  title_4,

  message,

  message_2,

  message_3,

  message_4,

  callback

) {

  const read_status = "0";

  const delete_flag = "0";

  let createtime = moment().format("YYYY-MM-DD HH:mm:ss");



  const sql =

    "INSERT INTO user_notification_message (user_id, other_user_id, action, action_id, action_json, title,title_2,title_3,title_4, message,message_2,message_3,message_4, read_status, delete_flag, createtime, updatetime) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)";

  connection.query(

    sql,

    [

      user_id,

      other_user_id,

      action,

      action_id,

      action_json,

      title,

      title_2,

      title_3,

      title_4,

      message,

      message_2,

      message_3,

      message_4,

      read_status,

      delete_flag,

      createtime,

      createtime,

    ],

    (error, results) => {

      if (error) {

        callback("no");

      } else {

        callback("yes");

      }

    }

  );

}



function getNotificationStatus(user_id, callback) {

  const sql =

    "SELECT user_id FROM user_master WHERE user_id = ? AND notification_status = '1'";

  connection.query(sql, [user_id], (error, results) => {

    if (error) {

      console.error("Error getting notification status:", error);

      callback("no");

    } else {

      if (results.length > 0) {

        callback("yes");

      } else {

        callback("no");

      }

    }

  });

}

async function oneSignalNotificationSend(

  title,

  message,

  jsonData,

  player_id_arr

) {

  try {

    var oneSignalAppId = "c3a25067-c262-4916-8db6-56f2598bba14";

    var oneSignalAuthorization =

      "os_v2_app_yorfaz6cmjerndnwk3zftc52crzlq6ahr6yu2g5wiumvu47icqtjghyky6idkqi5aziuqlo3z43p6nvdmuu6u3pqxrisl5omi7u3dyi";

    const fields = {

      app_id: oneSignalAppId,

      contents: { en: message },

      headings: { en: title },

      include_player_ids: player_id_arr,

      data: { action_json: jsonData },

      ios_badgeType: "Increase",

      ios_badgeCount: 1,

      priority: 10,

    };

    const config = {

      headers: {

        "Content-Type": "application/json; charset=utf-8",

        Authorization: "Basic " + oneSignalAuthorization,

      },

    };

    const response = await axios.post(

      "https://onesignal.com/api/v1/notifications",

      fields,

      config

    );

    return response.data;

  } catch (error) {

    console.error("Error sending OneSignal notification:", error.message);

    return null;

  }

}



async function oneSignalNotificationSendCall(notification_arr) {

  if (notification_arr && notification_arr.length > 0) {

    for (const key of notification_arr) {

      const player_id_arr = [];

      if (key.player_id !== "") {

        player_id_arr.push(key.player_id);

        const title = key.title;

        const message = key.message;

        const action_json = key.action_json;

        return await oneSignalNotificationSend(

          title,

          message,

          action_json,

          player_id_arr

        );

      }

    }

  } else {

    console.log("Notification array is empty. No notifications to send.");

  }

}

async function getUserPlayerId(user_id, callback) {

  try {

    if (!user_id) return "no";

    connection.query(

      "SELECT player_id FROM user_notification WHERE user_id = ? order by user_notification_id desc",

      [user_id],

      (err, result) => {

        if (err) {

          console.log("error : ", err);

        }

        if (result.length > 0) {

          let player_id = result[0].player_id;

          if (player_id === "123456") {

            player_id = "no";

          }

          callback(player_id);

        } else {

          callback("no");

        }

      }

    );

  } catch (error) {

    console.error("Error executing query:", error.message);

    return null;

  }

}



//------------------get admin details-----------------

async function getAdminDetail() {

  const adminQuery = `SELECT user_id AS admin_id, email AS admin_email, name AS admin_name, image FROM 

            user_master WHERE delete_flag = 0 AND user_type = 0`;

  return new Promise((resolve, reject) => {

    connection.query(adminQuery, (err, result) => {

      if (err) {

        return reject({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (result.length === 0) {

        return resolve("NA");

      }

      const adminDetails = result[0];

      resolve({

        admin_id: adminDetails.admin_id,

        admin_email: adminDetails.admin_email,

        admin_name: adminDetails.admin_name,

        image: adminDetails.image,

      });

    });

  });

}



async function otpGenerator() {

  return Math.floor(1000 + Math.random() * 9000).toString();

}



  module.exports = {hashPassword,DeviceTokenStore_1_Signal,generateToken,getNotificationCount,

    getNotificationArrSingle,

    oneSignalNotificationSendCall,otpGenerator,getAdminDetail}