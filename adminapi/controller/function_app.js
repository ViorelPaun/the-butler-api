const {connection} = require('../connection/db');

const moment = require('moment');





//--------------get user details--------------------

async function getUserDetails(user_id){

    return new Promise(async (resolve, reject) => {

      connection.query("select `user_id`, `login_type`, `login_type_first`, `user_type`, `email`,`f_name`, `l_name`, `name`, `username`, `dob`, `age`, `phone_code`, `mobile`, `otp`, `otp_verify`, `image`, `gender`, `address`, `latitude`, `longitude`, `zipcode`, `bio`, `active_flag`, `approve_flag`, `profile_completed`, `language_id`, `facebook_id`, `google_id`, `twitter_id`, `instagram_id`, `apple_id`, `signup_step`, `about`, `delete_flag`, `delete_reason`, `createtime` from user_master where user_id = ? AND delete_flag = 0",[user_id],async (error, rows) => {

        if(error){

          reject(error); // Reject the promise with the error

        }else{

          if(rows.length > 0){

            const userData = rows[0];

            let age = 0;

            

           

            //resolve(userData);

            const userDataArray = {

            user_id: userData.user_id,

            user_type: userData.user_type,

            user_type_label: "0=admin,1=user",

            login_type: userData.login_type,

            login_type_first: userData.login_type_first,

            login_type_label: "0=app, 1=google, 2=apple, 3=facebook",

            email: userData.email,

            f_name: userData.f_name,

            l_name: userData.l_name,

            full_name: userData.name,

            dob: userData.dob,

            age: age,

            phone_code: userData.phone_code,

            mobile: userData.mobile,

            otp_type: userData.otp_type,

            otp: userData.otp,

            otp_verify: userData.otp_verify,

            image: userData.image,

            gender: userData.gender,

            gender_lebal: "1=male,2=female,3=other",

            address: userData.address,

            latitude: userData.latitude,

            longitude: userData.longitude,

            zipcode: userData.zipcode,

            bio: userData.bio,

            active_flag: userData.active_flag,

            approve_flag: userData.approve_flag,

            profile_complete: userData.profile_completed,

            language_id: userData.language_id,

            facebook_id: userData.facebook_id,

            google_id: userData.google_id,

            apple_id: userData.apple_id,

            signup_step: userData.signup_step,

            notification_status: userData.notification_status,

            delete_flag: userData.delete_flag,

            delete_reason: userData.delete_reason,

            category_id : userData.category_id ,

            createtime: moment(userData.createtime).format("DD-MM-YYYY h:mm A"),

            about: userData.about,

          };

          resolve(userDataArray);

        }else{

          resolve("NA");

        }

      }

        resolve("NA");

      });

    });

  };

const getVideos = async () => {

return new Promise(async (resolve,reject) => {

  const videosql = "SELECT v.video_id ,v.category_id ,v.title,v.description,v.thumbnail,v.video,v.createtime ,c.category_name FROM video_master v JOIN category_master c ON c.category_id = v.category_id WHERE v.delete_flag = 0 AND c.delete_flag = 0";

  connection.query(videosql,async (err,video) => {

    if(err){

      reject(err);

    }

    if(video.length <= 0){

      resolve(0);

    }

    resolve(video.length);

  })

})

};



const getPdf = async () => {

  return new Promise(async (resolve,reject) => {

    const pdfsql = "SELECT p.pdf_id  ,p.title ,p.pdf_file,p.createtime,p.delete_flag ,p.category_id,c.category_name FROM pdf_master p JOIN category_master c ON c.category_id = p.category_id WHERE p.delete_flag = 0 AND c.delete_flag = 0";

    connection.query(pdfsql,async (err,pdf) => {

      if(err){

        reject(err);

      }

      if(pdf.length <= 0){

        resolve(0);

      }

      resolve(pdf.length);

    })

  })

  };



  const getContactUs = async () => {

    return new Promise(async (resolve,reject) => {

      const contactsql = "SELECT contact_id   ,user_id  ,name,createtime FROM contact_us_master WHERE delete_flag = 0";

      connection.query(contactsql,async (err,contact) => {

        if(err){

          reject(err);

        }

        if(contact.length <= 0){

          resolve(0);

        }

        resolve(contact.length);

      })

    })

  }

//------------------------common function for user analytic---------------

const getUserAnalyticalReports = async (type, current_year, current_month, get_by_type)=>  {



  console.log("current_month:", current_month);



  return new Promise((resolve, reject) => {

      let where = '';



      if (type === 'monthly') {

          if (get_by_type === 'All') {

              where = `AND YEAR(createtime) = ${current_year} AND MONTH(createtime) = ${current_month}`;

          }

      } else if (type === 'yearly') {

          if (get_by_type === 'All') {

              where = `AND YEAR(createtime) = ${current_year}`;

          }

      }



      const query = `SELECT user_id FROM user_master WHERE delete_flag = 0 AND user_type = 1 ${where} ORDER BY user_id DESC`;



      connection.query(query, (error, rows) => {

          if (error) {

              console.log('database user get all error:', error);

              return reject(error); // Reject the promise with the error

          }



          const user_arr = rows.length > 0 ? rows.length : 0;

          resolve(user_arr); // Resolve the promise with the rows

      });

  });



}

//------------------------common function for video analytic---------------

const getVideoAnalyticalReports = async (type, current_year, current_month, get_by_type)=>  {



  console.log("current_month:", current_month);



  return new Promise((resolve, reject) => {

      let where = '';



      if (type === 'monthly') {

          if (get_by_type === 'All') {

              where = `AND YEAR(v.createtime) = ${current_year} AND MONTH(v.createtime) = ${current_month}`;

          }

      } else if (type === 'yearly') {

          if (get_by_type === 'All') {

              where = `AND YEAR(v.createtime) = ${current_year}`;

          }

      }



      const query = `SELECT v.video_id FROM video_master v JOIN category_master c ON c.category_id = v.category_id WHERE v.delete_flag = 0 AND c.delete_flag = 0  ${where} ORDER BY v.video_id DESC`;



      connection.query(query, (error, rows) => {

          if (error) {

              console.log('database user get all error:', error);

              return reject(error); // Reject the promise with the error

          }



          const user_arr = rows.length > 0 ? rows.length : 0;

          resolve(user_arr); // Resolve the promise with the rows

      });

  });



}

//------------------------common function for pdf analytic---------------

const getPdfAnalyticalReports = async (type, current_year, current_month, get_by_type)=>  {



  console.log("current_month:", current_month);



  return new Promise((resolve, reject) => {

      let where = '';



      if (type === 'monthly') {

          if (get_by_type === 'All') {

              where = `AND YEAR(p.createtime) = ${current_year} AND MONTH(p.createtime) = ${current_month}`;

          }

      } else if (type === 'yearly') {

          if (get_by_type === 'All') {

              where = `AND YEAR(p.createtime) = ${current_year}`;

          }

      }



      const query = `SELECT p.pdf_id FROM pdf_master p JOIN category_master c ON c.category_id = p.category_id WHERE p.delete_flag = 0  ${where} AND c.delete_flag = 0  ORDER BY p.pdf_id DESC`;



      connection.query(query, (error, rows) => {

          if (error) {

              console.log('database user get all error:', error);

              return reject(error); // Reject the promise with the error

          }



          const user_arr = rows.length > 0 ? rows.length : 0;

          resolve(user_arr); // Resolve the promise with the rows

      });

  });



}



  module.exports = {getUserDetails,getVideos,getPdf,getContactUs,getUserAnalyticalReports,getVideoAnalyticalReports,getPdfAnalyticalReports};