const { connection } = require("../connection/db.js");

require("dotenv").config();

const sendMail = require("../connection/nodemailer.js");

const {  mailBodyForgotPasswordData,mailBodyReplyMessage } = require("./mailBody.js");

const moment = require("moment");

const { getUserDetails, getVideos, getPdf, getContactUs,getUserAnalyticalReports,getVideoAnalyticalReports,getPdfAnalyticalReports} = require("./function_app.js");

const {  generateToken, hashPassword,getNotificationArrSingle,oneSignalNotificationSendCall } = require("./common_function_app.js");

const languageMessages = require("./languagesMessage.js");

//----------------get Profile details----------------
const getProfileDetails = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const user_details = await getUserDetails(user_id);
      return res.status(200).json({

        success: true,

        message: languageMessages.msgAdminDetailsSuccess,

        user_details: user_details,

      });
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}



//-------------login-----------------------------

const login = async (req, res) => {

  let { email, password} = req.body;

  try {

    if (!email) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "email",

      });

    }

    if (!password) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "password",

      });

    }

    const checkSql =

      "SELECT user_id, active_flag,password,otp_verify,f_name,l_name,name,mobile,email FROM user_master WHERE email = ? AND delete_flag = 0 AND user_type = 0";

    connection.query(checkSql, [email], async (err, result) => {

      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (result.length <= 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.emailNotRegistered,

        });

      }

      if (result[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }

     

      //login starts

      const user_id = result[0].user_id;

      const hashedPassword = await hashPassword(password);

      if (result.length > 0) {

        var password_old = result[0].password;

        if (password_old === hashedPassword) {

          const user_details = await getUserDetails(user_id);

          

          let token = generateToken(user_id);

          return res.status(200).json({

            success: true,

            message: languageMessages.loginSuccessfully,

            user_details: user_details,

            token: token,

          });

        } else {

          return res.status(200).json({

            success: false,

            message: languageMessages.invalidCredentials,

            hello : "hello"

          });

        }

      }

    });

  } catch (err) {

    return res.status(200).json({

      success: false,

      message: languageMessages.internalServerError,

      error: err.message,

    });

  }

};





//---------------------- Forgot Password -------------------------------------------------

const ForgotPassword = async (req, res) => {

  const { email } = req.body;

  try {

    if (!email) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "email",

      });

    }

    //check user exist

    const sql1 =

      "SELECT user_id, active_flag,user_type,name FROM user_master WHERE email = ? AND delete_flag = 0 AND user_type = 0";

    connection.query(sql1, [email], async (err, info) => {

      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.emailNotRegistered,

        });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }

      //----otp generate

      let subject = "Forgot Password";

      let text = mailBodyForgotPasswordData(info[0]);

      await sendMail(email, subject, text);

      

        //-----------------res-----------

        return res.status(200).json({

          success: true,

          message: languageMessages.resetPassword,

        });

      });

  } catch (err) {

    return res.status(200).json({

      success: false,

      message: languageMessages.internalServerError,

      error: err.message,

    });

  }

};



//----------------------- new password -------------------------------

const resetPassword = async (req, res) => {

  const { user_id } = req.query;

  const {  password } = req.body;

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    if (!password) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "password",

      });

    }

    //check user

    const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";

    connection.query(sql, [user_id], async (err, info) => {

      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }



      const hashedPassword = await hashPassword(password);



      //update user password
      const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

      const updatesql =

        "UPDATE user_master SET password = ?,updatetime=? WHERE user_id = ?";

      connection.query(

        updatesql,

        [hashedPassword,indiaTime, user_id],

        async (err, result) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          if (result.affectedRows > 0) {

            const user_details = await getUserDetails(user_id);

            return res.status(200).json({

              success: true,

              message: languageMessages.forgotNewpasswordUpdate,

              user_details: user_details,

            });

          } else {

            return res.status(200).json({

              success: false,

              message: languageMessages.forgotNewpasswordUpdateError,

            });

          }

        }

      );

    });

  } catch (err) {

    return res.status(200).json({

      success: false,

      message: languageMessages.internalServerError,

      error: err.message,

    });

  }

};



//--------------update profile-------------

const editProfile = (req, res) => {
  const  user_id  = req.user_id;
  const {  name, email } = req.body;

  let image = req.file ? req.file.filename : null;

  // Validate required fields

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    if (!name) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "name",

      });

    }

    if (!email) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "email",

      });

    }



    const searchsql =

      "SELECT user_id, active_flag,email,image FROM user_master WHERE user_id = ? and delete_flag = 0 AND user_type = 0";

    connection.query(searchsql, [user_id], async (err, details) => {

      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (details.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (details[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }

      let currentEmail = details[0].email;

      if (currentEmail == email) {

        updateProfile();

      } else {

        const emailsql =

          "SELECT user_id,email,active_flag FROM user_master WHERE email = ? AND delete_flag = 0";

        connection.query(emailsql, [email], async (err, exist) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          if (exist.length <= 0) {

            updateProfile();

          } else {

            return res.status(200).json({

              success: false,

              message: languageMessages.emailAlreadyExists,

            });

          }

        });

      }



      function updateProfile() {

        if (image == null) {

          image = details[0].image;

        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');

        const sql = `UPDATE user_master SET name = ?,  email = ?, image = ?, updatetime = ? WHERE user_id = ? AND delete_flag = 0`;

        const values = [name, email, image,indiaTime, user_id];

        connection.query(sql, values,async (err, result) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          const user_details = await getUserDetails(user_id);

          

          return res.status(200).json({

            success: true,

            message: languageMessages.msgProfileUpdateSuccess,

            user_details: user_details,

          });

        });

      }

    });

  } catch (error) {

    return res.status(200).json({

      success: false,

      message: languageMessages.internalServerError,

      error: error.message,

    });

  }

};



//----------------------------------- change password ---------------------------------------

const changePassword = async (req, res) => {
  const  user_id  = req.user_id;
  const { oldPassword, newPassword } = req.body;

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    if (!oldPassword) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "oldPassword",

      });

    }

    if (!newPassword) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "newPassword",

      });

    }

    // check user exist

    const sql =

      "SELECT user_id, active_flag,password FROM user_master WHERE user_id = ? AND delete_flag=0 AND user_type = 0";

    connection.query(sql, [user_id], async (err, info) => {

      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }

      //fetch old password

      const old_Password = await hashPassword(oldPassword);

      const new_Password = await hashPassword(newPassword);

      const password = info[0].password;

      //check if old password and new password are not same

      if (old_Password != password) {

        return res.status(200).json({

          success: false,

          message: languageMessages.currentPasswordIsIncorrect,

        });

      }

      if (new_Password === password) {

        return res.status(200).json({

          success: false,

          message: languageMessages.oldAndNewPasswordSame,

        });

      }



      const updatePassword =

        "UPDATE user_master SET password = ? WHERE user_id = ?";

      connection.query(

        updatePassword,

        [new_Password, user_id],

        (err, result) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          if (result.affectedRows > 0) {

            return res.status(200).json({

              success: true,

              message: languageMessages.changePasswordSuccessfully,

            });

          } else {

            return res.status(200).json({

              success: true,

              message: languageMessages.changePasswordSuccessfullyError,

            });

          }

        }

      );

    });

  } catch (err) {

    return res.status(200).json({

      success: false,

      message: languageMessages.changePasswordSuccessfullyError,

      error: err.message,

    });

  }

};





//---------------------dashboard-------------

const dashboard = async (req,res) => {

  const  user_id  = req.user_id;

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? and delete_flag = 0 AND user_type = 0";

      connection.query(sql,[user_id],async (err,info) => {

        if (err) {

          return res.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

          });

        }

        if (info.length <= 0) {

          return res

            .status(200)

            .json({ success: false, message: languageMessages.msgUserNotFound });

        }

        if (info[0].active_flag === 0) {

          return res.status(200).json({

            success: false,

            message: languageMessages.accountdeactivated,

            account_active_status: 0,

          });

        }

        const query = "SELECT user_id ,active_flag , delete_flag FROM user_master WHERE user_type = 1 AND delete_flag = 0";

        connection.query(query,async (err,result) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          const totalVideos = await getVideos();

          const totalPdf = await getPdf();

          const contact = await  getContactUs();

          if(result.length <= 0){

            return res.status(200).json({success : true , message : languageMessages.msgDataFound,totalUsers : 0,totalVideos,totalPdf,contact});

          }

          return res.status(200).json({success : true , message : languageMessages.msgDataFound,totalUsers : result.length,totalVideos,totalPdf,contact});

        })

      })

  } catch (error) {

    return res.status(200).json({

      success: false,

      message: languageMessages.changePasswordSuccessfullyError,

      error: err.message,

    });

  }

}





//-------------------user list-----------------

const userList = async (req,res) => {

  const  user_id  = req.user_id;

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? and delete_flag = 0 AND user_type = 0";

      connection.query(sql,[user_id],async (err,info) => {

        if (err) {

          return res.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

          });

        }

        if (info.length <= 0) {

          return res

            .status(200)

            .json({ success: false, message: languageMessages.msgUserNotFound });

        }

        if (info[0].active_flag === 0) {

          return res.status(200).json({

            success: false,

            message: languageMessages.accountdeactivated,

            account_active_status: 0,

          });

        }

        const query = "SELECT user_id ,email,name,mobile,image,active_flag ,createtime,updatetime,delete_reason,delete_flag FROM user_master WHERE user_type = 1 ORDER by user_id desc";

        connection.query(query,async (err,users) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          if(users.length <= 0){

            return res.status(200).json({success : true,message : languageMessages.msgDataFound,activeUser : "NA",deleteUser : "NA"});

          }

          let deleteUser = [] ; 

          let activeUser = [];

          users.map((data) => {

            if(data.delete_flag == 0){

              data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
              data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');

              return activeUser.push(data);

            }else if (data.delete_flag == 1){
              data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
              data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');

              return deleteUser.push(data);

            }

          });

          

          if(activeUser.length <= 0){

            activeUser = "NA";

          }

          if(deleteUser.length <= 0){

            deleteUser = "NA"

          }



          return res.status(200).json({success : true,message : languageMessages.msgDataFound,activeUser,deleteUser})

        })

      })

  } catch (error) {

    return res.status(200).json({

      success: false,

      message: languageMessages.changePasswordSuccessfullyError,

      error: err.message,

    });

  }

}





//---------------------user Details---------------

const userDetails = async (req,res) => {
  const  user_id  = req.user_id;
  const { users_id } = req.query;

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    if (!users_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "users_id",

      });

    }

    const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? and delete_flag = 0 AND user_type = 0";

      connection.query(sql,[user_id],async (err,info) => {

        if (err) {

          return res.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

          });

        }

        if (info.length <= 0) {

          return res

            .status(200)

            .json({ success: false, message: languageMessages.msgUserNotFound });

        }

        if (info[0].active_flag === 0) {

          return res.status(200).json({

            success: false,

            message: languageMessages.accountdeactivated,

            account_active_status: 0,

          });

        }

        const userinfosql = "SELECT user_id ,email,name,mobile,image,address,active_flag ,createtime FROM user_master WHERE user_id = ?";

        connection.query(userinfosql,[users_id],async (err,userInfo) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          if (userInfo.length <= 0) {

            return res

              .status(200)

              .json({ success: false, message: languageMessages.msgUserNotFound });

          }

          userInfo[0].createtime = moment(userInfo[0].createtime).format('DD-MM-YYYY HH:mm:ss');

          return res.status(200).json({success : true,message : languageMessages.msgDataFound,userDetails : userInfo[0]});

        })

      })

  } catch (error) {

    return res.status(200).json({

      success: false,

      message: languageMessages.changePasswordSuccessfullyError,

      error: err.message,

    });

  }

};





//---------------------delete user----------------

const activateDeactivate = async (req,res) => {
  const  user_id  = req.user_id;
  const { users_id} = req.body;

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    if (!users_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "users_id",

      });

    }

    const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? and delete_flag = 0 AND user_type = 0";

      connection.query(sql,[user_id],async (err,info) => {

        if (err) {

          return res.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

          });

        }

        if (info.length <= 0) {

          return res

            .status(200)

            .json({ success: false, message: languageMessages.msgUserNotFound });

        }

        if (info[0].active_flag === 0) {

          return res.status(200).json({

            success: false,

            message: languageMessages.accountdeactivated,

            account_active_status: 0,

          });

        }

        const checksql = "SELECT user_id,email,active_flag FROM user_master WHERE user_id = ?";

        connection.query(checksql,[users_id],async (err,check) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          if(check.length <= 0){

            return req.status(200).json({success : false , message : languageMessages.msgDataNotFound})

          }

          let activesql ;

          if(check[0].active_flag == 1){

            activesql = "UPDATE user_master SET active_flag = 0 WHERE user_id = ?";

          }else if(check[0].active_flag == 0){

            activesql = "UPDATE user_master SET active_flag = 1 WHERE user_id = ? ";

          }

          connection.query(activesql,[users_id],async (err,result) => {

            if (err) {

              return res.status(200).json({

                success: false,

                message: languageMessages.internalServerError,

                error: err.message,

              });

            }

            return res.status(200).json({success : true,message : check[0].active_flag == 1 ? languageMessages.msgAccountDeactive : languageMessages.msgAccountActivate})

          })

        })

        

      })

  } catch (error) {

    return res.status(200).json({

      success: false,

      message: languageMessages.changePasswordSuccessfullyError,

      error: err.message,

    });

  }

};


//--------------------Get all category---------------
const getAllCategory = async (req,res) => {
  const  user_id  = req.user_id;
try {
  if (!user_id) {

    return res.status(200).json({

      success: false,

      message: languageMessages.msg_empty_param,

      key: "user_id",

    });

  }
  const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? and delete_flag = 0 AND user_type = 0";
      connection.query(sql,[user_id],async (err,info) => {
        if (err) {

          return res.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

          });

        }

        if (info.length <= 0) {

          return res

            .status(200)

            .json({ success: false, message: languageMessages.msgUserNotFound });

        }

        if (info[0].active_flag === 0) {

          return res.status(200).json({

            success: false,

            message: languageMessages.accountdeactivated,

            account_active_status: 0,

          });

        }
        const categorysql = "SELECT category_id ,category_name,createtime,updatetime FROM category_master WHERE delete_flag = 0 ORDER BY category_id desc";
        connection.query(categorysql,async (err,category) => {
          if (err) {

            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.internalServerError,
  
              error: err.message,
  
            });
  
          }
          if(category.length <= 0){
            return res.status(200).json({success : true , message : languageMessages.msgDataFound,category : "NA"})
          }
          
          category.map((data) => {
            data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm');
        data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm');
          })

          return res.status(200).json({success : true,message : languageMessages.msgDataFound,category});
        })
      })
} catch (error) {
  return res.status(200).json({

    success: false,

    message: languageMessages.changePasswordSuccessfullyError,

    error: err.message,

  });
}
};


//--------------------------Edit Category---------------
const editCategory = async (req,res) => {
  const  user_id  = req.user_id;
  const {  category_id,category_name } = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!category_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "category_id",
  
      });
    }
    if (!category_name) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "category_name",
  
      });
    }
    const sql =
  
        "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
        connection.query(sql,[user_id],async(err,info) => {
          if (err) {

            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.internalServerError,
  
              error: err.message,
  
            });
  
          }
  
          if (info.length <= 0) {
  
            return res
  
              .status(200)
  
              .json({ success: false, message: languageMessages.msgUserNotFound });
  
          }
  
          if (info[0].active_flag === 0) {
  
            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.accountdeactivated,
  
              account_active_status: 0,
  
            });
  
          }
          const checksql = "SELECT category_id,category_name FROM category_master WHERE category_id = ? AND delete_flag = 0";
          connection.query(checksql,[category_id],async (err,check) => {
            if (err) {

              return res.status(200).json({
    
                success: false,
    
                message: languageMessages.internalServerError,
    
                error: err.message,
    
              });
    
            }
            if(check.length <= 0){
              return res.status(200).json({success : false,message : languageMessages.msgDataNotFound});
            }
            const alreadysql = "SELECT category_id ,category_name FROM category_master WHERE category_name = ? AND category_id != ? AND delete_flag=0"
            connection.query(alreadysql,[category_name,category_id],async (err,result) => {
              if (err) {

                return res.status(200).json({
      
                  success: false,
      
                  message: languageMessages.internalServerError,
      
                  error: err.message,
      
                });
      
              }
              if(result.length >0){
                return res.status(200).json({success : false,message : languageMessages.msgCategoryError})
              }
              const updatesql = "UPDATE category_master SET category_name = ? WHERE category_id = ? AND delete_flag = 0";
              connection.query(updatesql,[category_name,category_id],async(err,update) => {
                if (err) {
  
                  return res.status(200).json({
        
                    success: false,
        
                    message: languageMessages.internalServerError,
        
                    error: err.message,
        
                  });
        
                }
                return res.status(200).json({success : true , message : languageMessages.msgCategorySuccess})
              })
            })
          })
        })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//----------------------Add category---------------
const addCategory = async (req,res) => {
  const  user_id  = req.user_id;
  const {category_name} = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!category_name) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "category_name",
  
      });
    }
    const sql =
  
        "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
        connection.query(sql,[user_id],async (err, info) => {
          if (err) {

            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.internalServerError,
  
              error: err.message,
  
            });
  
          }
  
          if (info.length <= 0) {
  
            return res
  
              .status(200)
  
              .json({ success: false, message: languageMessages.msgUserNotFound });
  
          }
  
          if (info[0].active_flag === 0) {
  
            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.accountdeactivated,
  
              account_active_status: 0,
  
            });
  
          }
          const checksql = "SELECT category_id ,category_name FROM category_master WHERE category_name = ? AND delete_flag = 0";
          connection.query(checksql,[category_name],async (err,check) => {
            if (err) {

              return res.status(200).json({
    
                success: false,
    
                message: languageMessages.internalServerError,
    
                error: err.message,
    
              });
    
            }
            if(check.length >0){
              return res.status(200).json({success : false,message : languageMessages.msgCategoryError})
            }
            const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
            const query = "INSERT INTO category_master (category_name,createtime,updatetime) VALUES(?,?,?)";
            connection.query(query,[category_name,indiaTime,indiaTime],async (err,result) => {
              if (err) {

                return res.status(200).json({
      
                  success: false,
      
                  message: languageMessages.internalServerError,
      
                  error: err.message,
      
                });
      
              }
              return res.status(200).json({success : true,message : languageMessages.msgCategroyAddSuccess})
            })
          })
        })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//-----------------------Delete Category----------------
const deleteCategory = async (req,res) => {
  const  user_id  = req.user_id;
  const {category_id } = req.query;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!category_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "category_id",
  
      });
    }
    const sql =
  
        "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
        connection.query(sql,[user_id],async (err,info) => {
          if (err) {

            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.internalServerError,
  
              error: err.message,
  
            });
  
          }
  
          if (info.length <= 0) {
  
            return res
  
              .status(200)
  
              .json({ success: false, message: languageMessages.msgUserNotFound });
  
          }
  
          if (info[0].active_flag === 0) {
  
            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.accountdeactivated,
  
              account_active_status: 0,
  
            });
  
          }
          const checksql = "SELECT category_id ,category_name FROM category_master WHERE category_id = ? ";
          connection.query(checksql,[category_id],async (err,check) => {
            if (err) {

              return res.status(200).json({
    
                success: false,
    
                message: languageMessages.internalServerError,
    
                error: err.message,
    
              });
    
            }
            if(check.length <= 0){
              return res.status(200).json({success : false,message : languageMessages.msgDataNotFound});
            }
            const updatesql = "UPDATE category_master SET delete_flag = 1,updatetime = now() WHERE category_id  = ?";
            connection.query(updatesql,[category_id],async (err,update) => {
              if (err) {

                return res.status(200).json({
      
                  success: false,
      
                  message: languageMessages.internalServerError,
      
                  error: err.message,
      
                });
      
              }
              return res.status(200).json({success : true,message : languageMessages.msgCategoryDeleteSuccess});
            })
          })
        })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//------------------------get Video---------------
const getAllVideo = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    const sql =
  
        "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
        connection.query(sql,[user_id],async(err,info) => {
          if (err) {

            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.internalServerError,
  
              error: err.message,
  
            });
  
          }
  
          if (info.length <= 0) {
  
            return res
  
              .status(200)
  
              .json({ success: false, message: languageMessages.msgUserNotFound });
  
          }
  
          if (info[0].active_flag === 0) {
  
            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.accountdeactivated,
  
              account_active_status: 0,
  
            });
  
          }
          const videosql = "SELECT v.video_id ,c.category_id,c.category_name,v.title,v.description,v.thumbnail,v.video,v.createtime,v.updatetime FROM video_master v JOIN category_master c ON c.category_id = v.category_id WHERE v.delete_flag = 0 AND c.delete_flag = 0 ORDER BY v.video_id desc";
          connection.query(videosql,async(err,video) => {
            if (err) {

              return res.status(200).json({
    
                success: false,
    
                message: languageMessages.internalServerError,
    
                error: err.message,
    
              });
    
            }
            if(video.length <= 0){
              return res.status(200).json({success : true,message : languageMessages.msgDataNotFound,video : "NA"})
            }
            video.map((data) => {
              data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
        data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
            })
            return res.status(200).json({success : true,message : languageMessages.msgDataFound,video});
          })
        })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//-------------------Video Details --------------------
const videoDetails = async (req,res) => {
  const  user_id  = req.user_id;
  const { video_id} = req.query;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!video_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "video_id",
  
      }); 
  
    }
    const sql =
  
        "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
        connection.query(sql,[user_id],async (err,info) => {
          if (err) {

            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.internalServerError,
  
              error: err.message,
  
            });
  
          }
  
          if (info.length <= 0) {
  
            return res
  
              .status(200)
  
              .json({ success: false, message: languageMessages.msgUserNotFound });
  
          }
  
          if (info[0].active_flag === 0) {
  
            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.accountdeactivated,
  
              account_active_status: 0,
  
            });
  
          }
          const videosql = "SELECT v.video_id,v.category_id,c.category_name,v.title,v.description,v.thumbnail,v.video,v.createtime,v.updatetime FROM video_master v JOIN category_master c ON c.category_id = v.category_id WHERE v.video_id = ? AND v.delete_flag = 0";
          connection.query(videosql,[video_id],async (err,videoDetails) => {
            if (err) {

              return res.status(200).json({
    
                success: false,
    
                message: languageMessages.internalServerError,
    
                error: err.message,
    
              });
    
            }
            if(videoDetails.length <= 0){
              return res.status(200).json({success : false ,message : languageMessages.msgDataNotFound});
            }
            videoDetails.map((data) => {
              data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
        data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
            });
            return res.status(200).json({success : true,message : languageMessages.msgDataFound,videoDetails:videoDetails[0]})
          })
        })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//----------------------add video----------------
const addVideo = async (req,res) => {
    
  const  user_id  = req.user_id;
  const { category_id, title, description, video,  thumbnail   } = req.body;
  try {
      
//     let thumbnail;
//   if (req.files && req.files['thumbnail']) {
//     thumbnail = req.files['thumbnail'][0].filename;
//   }else{
//     return res.status(200).json({

//       success: false,

//       message: languageMessages.msg_empty_param,

//       key: "thumbnail",

//     }); 
//   }
//   let video;
//   if (req.files && req.files['video']) {
//     video = req.files['video'][0].filename;
//   }else{
//     return res.status(200).json({

//       success: false,

//       message: languageMessages.msg_empty_param,

//       key: "video",

//     }); 
//   }
   
   
  if (!user_id) {

    return res.status(200).json({

      success: false,

      message: languageMessages.msg_empty_param,

      key: "user_id",

    }); 

  }
  if (!category_id) {

    return res.status(200).json({

      success: false,

      message: languageMessages.msg_empty_param,

      key: "category_id",

    }); 

  }
  if (!title) {

    return res.status(200).json({

      success: false,

      message: languageMessages.msg_empty_param,

      key: "title",

    }); 

  }
  if (!description) {

    return res.status(200).json({

      success: false,

      message: languageMessages.msg_empty_param,

      key: "description",

    }); 

  }
  const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
      connection.query(sql,[user_id],async (err,info) => {
        if (err) {

          return res.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

          });

        }

        if (info.length <= 0) {

          return res

            .status(200)

            .json({ success: false, message: languageMessages.msgUserNotFound });

        }

        if (info[0].active_flag === 0) {

          return res.status(200).json({

            success: false,

            message: languageMessages.accountdeactivated,

            account_active_status: 0,

          });

        }
        // Check file sizes
//   if (thumbnail.size > 50 * 1024 * 1024) { // 50MB
//     return res.status(400).json({ success : false,message: languageMessages.msgFileSizeError});
//   }

//   if (video.size > 50 * 1024 * 1024) { // 50MB
//     return res.status(400).json({success : false,message: languageMessages.msgFileSizeError });
//   }
  
const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
  const addsql = "INSERT INTO video_master (category_id ,title,description	,thumbnail,video,createtime,updatetime) VALUES(?,?,?,?,?,?,?)";
  connection.query(addsql,[category_id,title,description,thumbnail,video,indiaTime,indiaTime],async (err,add) => {
    if (err) {

      return res.status(200).json({

        success: false,

        message: languageMessages.internalServerError,

        error: err.message,

      });

    }

    const usersql = "SELECT user_id FROM user_master WHERE user_type != 0 AND delete_flag = 0 AND profile_completed = 1";
    connection.query(usersql,async (err,result) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }
      if(result.length <= 0){
        return res.status(200).json({success : true,message : languageMessages.msgVideoAddedSuccess});
      }
      let subject = title;
      const notification = await Promise.all(
        result.map((item) => {
         
          const user_id_notification = 1;
          const other_user_id_notification = item.user_id;
          const action = 'new_video';
          const action_id = add.insertId;
          const title = subject;
          const title_1 = subject;
          const messages = description;
          const message_1 = description;
  
          const action_data = { user_id: user_id_notification, other_user_id: other_user_id_notification, action_id: action_id, action: action };

  
          getNotificationArrSingle(user_id_notification, other_user_id_notification, action, action_id, title,title_1, title_1, title_1,  messages,message_1,message_1,message_1, action_data, async (notification_arr_check) => {
  
              let notification_arr_check_new = [notification_arr_check];
              if (notification_arr_check_new && notification_arr_check_new.length !== 0) {
                  const notiSendStatus = await oneSignalNotificationSendCall(notification_arr_check_new);
  
              } else {
                  console.log('Notification array is empty');
              }
              
          });
        })
      )
      return res.status(200).json({success : true,message : languageMessages.msgVideoAddedSuccess});
    })

    
  })

      })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};

//-----------------delete video---------------
const deleteVideo =async (req,res) =>{
  const  user_id  = req.user_id;
  const { video_id} = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!video_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "video_id",
  
      }); 
  
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const checksql = "SELECT video_id,createtime FROM video_master WHERE video_id= ? AND delete_flag = 0";
      connection.query(checksql,[video_id],async (err,check) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(check.length <= 0){
          return res.status(200).json({success : false , message : languageMessages.msgDataNotFound})
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const updatesql = "UPDATE video_master SET delete_flag = 1,updatetime = ? WHERE video_id = ?";
        connection.query(updatesql,[indiaTime,video_id],async (err,update) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          return res.status(200).json({success : true , message : languageMessages.msgVideoDeleteSuccess});
        })
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//---------------------update video----------------
const updateVideo = async (req,res) => {
  const  user_id  = req.user_id;
  const { video_id,category_id,title,description, thumbnail, video} = req.body;
  try {
      
//     let thumbnail;
//   if (req.files && req.files['thumbnail']) {
//     thumbnail = req.files['thumbnail'][0].filename;
//   }else{
//     thumbnail = null;
//   }
//   let video;
//   if (req.files && req.files['video']) {
//     video = req.files['video'][0].filename;
//   }else{
//     video = null;
//   }

    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    if (!video_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "video_id",
      }); 
    }
    if (!category_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "category_id",
      }); 
    }
    if (!title) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "title",
      }); 
    }
    if (!description) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "description",
      }); 
    }

    

    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const checksql = "SELECT video_id,createtime,thumbnail,video FROM video_master WHERE video_id= ? AND delete_flag = 0";
      connection.query(checksql,[video_id],async (err,check) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(check.length <= 0){
          return res.status(200).json({success : false , message : languageMessages.msgDataNotFound})
        }
        if(thumbnail == null){
          thumbnail = check[0].thumbnail
        }
        if(video == null){
          video = check[0].video
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const updatesql = "UPDATE video_master SET category_id = ?,title = ?,description=?,thumbnail=?,video = ?, updatetime = ? WHERE video_id = ?";
        connection.query(updatesql,[category_id,title,description,thumbnail,video,indiaTime,video_id],async (err,update) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          return res.status(200).json({success : true , message : languageMessages.msgVideoUpdateSuccess});
        })
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//---------------------get all pdf ---------------
const getAllPdf = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const pdfsql = "SELECT p.pdf_id ,p.title,p.pdf_file,p.createtime,p.updatetime,p.category_id,c.category_name,p.thumbnail FROM pdf_master p JOIN category_master c ON c.category_id = p.category_id WHERE p.delete_flag = 0 AND c.delete_flag = 0 ORDER BY p.pdf_id desc";
      connection.query(pdfsql,async (err,pdf) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(pdf.length <=0){
          return res.status(200).json({success : true , message : languageMessages.msgDataNotFound,pdf : "NA"})
        }
        pdf.map((data) => {
          data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
          data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
        });
        return res.status(200).json({success : true , message : languageMessages.msgDataFound,pdf});
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//-------------------add pdf------------
const addPdf = async (req,res) => {
  const  user_id  = req.user_id;
  const { title,category_id } = req.body;
  
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    if (!category_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "category_id",
      }); 
    }
    if (!title) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "title",
      }); 
    }
    

    let thumbnail;
  if (req.files && req.files['thumbnail']) {
    thumbnail = req.files['thumbnail'][0].filename;
  }else{
    return res.status(200).json({

      success: false,

      message: languageMessages.msg_empty_param,

      key: "thumbnail",

    }); 
  }
  let pdf;
  if (req.files && req.files['pdf']) {
    pdf = req.files['pdf'][0].filename;
  }else{
    return res.status(200).json({

      success: false,

      message: languageMessages.msg_empty_param,

      key: "pdf",

    }); 
  }

    // File type validation - Check if the uploaded file is a PDF
    const allowedExtensions = ['.pdf'];
    const fileExtension = pdf.slice(pdf.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msgInvalidFileType,
        key: "pdf",
      });
    }
    if (pdf.size > 50 * 1024 * 1024) { // 50MB
      return res.status(400).json({ success : false,message: languageMessages.msgFileSizeError});
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
      const pdfsql = "INSERT INTO pdf_master (title,pdf_file,createtime,updatetime,category_id,thumbnail) VALUES (?,?,?,?,?,?)";
      connection.query(pdfsql,[title,pdf,indiaTime,indiaTime,category_id,thumbnail],async (err,pdf) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }

        const usersql = "SELECT user_id FROM user_master WHERE user_type != 0 AND delete_flag = 0 AND profile_completed = 1";
        connection.query(usersql,async (err,result) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          if(result.length <= 0){
            return res.status(200).json({success : true,message : languageMessages.pdfAddSuccess})
          }
          let subject = title
          const notification = await Promise.all(
            result.map((item) => {
             
              const user_id_notification = 1;
              const other_user_id_notification = item.user_id;
              const action = 'new_pdf';
              const action_id = pdf.insertId;
              const title = subject;
              const title_1 = subject;
              const messages = `Admin added a new pdf please review`;
              const message_1 = 'Admin added a new pdf please review';
      
              const action_data = { user_id: user_id_notification, other_user_id: other_user_id_notification, action_id: action_id, action: action };

      
              getNotificationArrSingle(user_id_notification, other_user_id_notification, action, action_id, title,title_1, title_1, title_1,  messages,message_1,message_1,message_1, action_data, async (notification_arr_check) => {
      
                  let notification_arr_check_new = [notification_arr_check];
                  if (notification_arr_check_new && notification_arr_check_new.length !== 0) {
                      const notiSendStatus = await oneSignalNotificationSendCall(notification_arr_check_new);
      
                  } else {
                      console.log('Notification array is empty');
                  }
                  
              });
            })
          )
          return res.status(200).json({success : true,message : languageMessages.pdfAddSuccess,result})
        })
 
      })
      

    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
 };


 //---------------------Edit Pdf---------------
 const editPdf = async (req,res) => {
  const  user_id  = req.user_id;
  const { title,pdf_id,category_id } = req.body;

  
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    if (!category_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "category_id",
      }); 
    }
    if (!pdf_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "pdf_id",
      }); 
    }
    if (!title) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "title",
      }); 
    }

    let thumbnail;
    if (req.files && req.files['thumbnail']) {
      thumbnail = req.files['thumbnail'][0].filename;
    }else{
      thumbnail = null;
    }
    let pdf;
    if (req.files && req.files['pdf']) {
      pdf = req.files['pdf'][0].filename;
    }else{
      pdf = null;
    }
    

    // File type validation - Check if the uploaded file is a PDF
    if(pdf != null){
      const allowedExtensions = ['.pdf'];
    const fileExtension = pdf.slice(pdf.lastIndexOf('.'));

    if (!allowedExtensions.includes(fileExtension.toLowerCase())) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msgInvalidFileType,
        key: "pdf",
      });
    }
    if (pdf.size > 50 * 1024 * 1024) { // 50MB
      return res.status(400).json({ success : false,message: languageMessages.msgFileSizeError});
    }
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const checksql = "SELECT pdf_id ,title	,pdf_file,thumbnail FROM pdf_master WHERE pdf_id = ? AND delete_flag = 0";
      connection.query(checksql,[pdf_id],async (err,check) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(check.length <= 0){
          return res.status(200).json({success : false,message : languageMessages.msgDataNotFound});
        }
        if(pdf == null){
          pdf = check[0].pdf_file
        }
        if(thumbnail == null){
          thumbnail = check[0].thumbnail
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const updatesql = "UPDATE pdf_master SET title = ? , pdf_file = ? ,updatetime =?,category_id = ?,thumbnail = ? WHERE pdf_id = ?";
        connection.query(updatesql,[title,pdf, indiaTime,category_id,thumbnail,pdf_id],async(err,update) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          return res.status(200).json({success : true,message : languageMessages.msgPdfEditSuccess,pdf})
        })
      })
      

    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
 };

 //-----------------------delete pdf -----------------
 const deletePdf =async (req,res) =>{
  const  user_id  = req.user_id;
  const { pdf_id} = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!pdf_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "pdf_id",
  
      }); 
  
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const checksql = "SELECT pdf_id,createtime FROM pdf_master WHERE pdf_id= ? AND delete_flag = 0";
      connection.query(checksql,[pdf_id],async (err,check) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(check.length <= 0){
          return res.status(200).json({success : false , message : languageMessages.msgDataNotFound})
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const updatesql = "UPDATE pdf_master SET delete_flag = 1,updatetime = ? WHERE pdf_id = ?";
        connection.query(updatesql,[indiaTime,pdf_id],async (err,update) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          return res.status(200).json({success : true , message : languageMessages.msgPdfDeleteSuccess});
        })
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};

//-------------------get faq-------------
const getFaq = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const faqsql = "SELECT faq_id ,question,answer,createtime,updatetime FROM faq_master WHERE delete_flag = 0 ORDER by faq_id desc";
      connection.query(faqsql,async (err,faq) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(faq.length <= 0){
          return res.status(200).json({success : true , message : languageMessages.msgDataNotFound,faq : "NA"});
        }
        faq.map((data) => {
          data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
          data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
        })
        return res.status(200).json({success : true , message : languageMessages.msgDataFound,faq})
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//-------------------get faq Details-------------
const getFaqDetails = async (req,res) => {
  const  user_id  = req.user_id;
  const {faq_id} = req.query;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!faq_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "faq_id",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const faqsql = "SELECT faq_id ,question,answer,createtime,updatetime FROM faq_master WHERE faq_id = ? AND  delete_flag = 0 ORDER by faq_id desc";
      connection.query(faqsql,[faq_id],async (err,faq) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(faq.length <= 0){
          return res.status(200).json({success : true , message : languageMessages.msgDataNotFound,faq : "NA"});
        }
        faq.map((data) => {
          data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
          data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
        })
        return res.status(200).json({success : true , message : languageMessages.msgDataFound,faq : faq[0]})
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//-------------------add Faq-------------
const addFaq = async (req,res) => {
  const  user_id  = req.user_id;
  const {question,answer} = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!question) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "question",
  
      }); 
  
    }
    if (!answer) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "answer",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
      const faqsql = "INSERT INTO faq_master (question,answer,createtime,updatetime) VALUES(?,?,?,?)";
      connection.query(faqsql,[question,answer,indiaTime,indiaTime],async (err,faq) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        return res.status(200).json({success : true , message : languageMessages.msgFaqAddSuccess})
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//-------------------edit Faq-------------
const editFaq = async (req,res) => {
  const  user_id  = req.user_id;
  const { faq_id,question,answer} = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!faq_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "faq_id",
  
      }); 
  
    }
    if (!question) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "question",
  
      }); 
  
    }
    if (!answer) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "answer",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const checksql = "SELECT faq_id ,question,answer FROM faq_master WHERE faq_id = ? AND delete_flag = 0";
      connection.query(checksql,[faq_id],async (err,check) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(check.length <= 0){
          return res.status(200).json({success : false,message : languageMessages.msgDataNotFound})
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const updatesql = "UPDATE faq_master SET question = ? , answer = ? ,updatetime = ? WHERE faq_id = ?";
        connection.query(updatesql,[question,answer,indiaTime,faq_id],async (err,update) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          return res.status(200).json({success : true,message : languageMessages.msgFaqUpdateSuccesss})
        })
      })


    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//-------------------delete Faq-------------
const deleteFaq = async (req,res) => {
  const  user_id  = req.user_id;
  const { faq_id} = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!faq_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "faq_id",
  
      }); 
  
    }
    
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const checksql = "SELECT faq_id ,question,answer FROM faq_master WHERE faq_id = ? AND delete_flag = 0";
      connection.query(checksql,[faq_id],async (err,check) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(check.length <= 0){
          return res.status(200).json({success : false,message : languageMessages.msgDataNotFound})
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const updatesql = "UPDATE faq_master SET delete_flag = 1 ,updatetime = ? WHERE faq_id = ?";
        connection.query(updatesql,[indiaTime,faq_id],async (err,update) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          return res.status(200).json({success : true,message : languageMessages.msgFaqDeleteSuccess})
        })
      })


    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};

//--------------------get contact us-----
const getContact = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
     const contactsql = "SELECT contact_id ,user_id ,name,email,message,status ,subject,reply,replied_date_time,createtime,updatetime FROM contact_us_master WHERE delete_flag = 0 ORDER BY contact_id desc";
     connection.query(contactsql,async (err,contact) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }
      if(contact.length <= 0){
        return res.status(200).json({success : true,message : languageMessages.msgDataNotFound,ContactUs : "NA"});
      }
      contact.map((data) => {
        data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
        data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
        data.replied_date_time =  moment(data.replied_date_time).format('DD-MM-YYYY HH:mm:ss');
      })
      return res.status(200).json({success : true , message : languageMessages.msgDataFound,ContactUs : contact})
     })


    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//------------------------reply ContactUs ---------------
const replyContactUs = async (req,res) => {
  const  user_id  = req.user_id;
  const { subject,message,contact_id } = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!subject) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "subject",
  
      }); 
  
    }
    if (!message) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "message",
  
      }); 
  
    }
    if (!contact_id ) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "contact_id ",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
     const contactsql = "SELECT contact_id ,user_id ,name,email,message,status ,subject,reply,replied_date_time,createtime,updatetime FROM contact_us_master WHERE delete_flag = 0 AND contact_id  =  ? ORDER BY contact_id desc";
     connection.query(contactsql,[contact_id],async (err,contact) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }
      if(contact.length <= 0){
        return res.status(200).json({success : true,message : languageMessages.msgDataNotFound,});
      }
      const email = contact[0].email;
      const name = contact[0].name;
      let text = mailBodyReplyMessage(name,message);
      const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
      
      const replysql = "UPDATE contact_us_master SET status = 1,subject = ? ,reply = ?,replied_date_time = ? WHERE contact_id = ?"
      connection.query(replysql,[subject,message,indiaTime,contact_id],async (err,reply) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        await sendMail(email, subject, text);
        return res.status(200).json({success :true,message : languageMessages.msgEmailSendSuccess})
      })
     })

    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//---------------------get content------------
const getContent = async (req,res) => {
  const  user_id  = req.user_id;
  const { content_type} = req.query;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!content_type) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "content_type",
  
      }); 
  
    }
    
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
     const contentsql = "SELECT content_id ,content_type ,content,createtime,updatetime FROM content_master WHERE content_type = ? AND delete_flag = 0";
     connection.query(contentsql,[content_type],async (err,content) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }
      if(content.length <= 0){
        return res.status(200).json({success : false , message : languageMessages.msgDataNotFound,content : "NA"});
      }
      content.map((data) => {
        data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
        data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
      })
      return res.status(200).json({success : true,message : languageMessages.msgDataFound,content});
     })

    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//-------------------update content-------------
const updateContent =async (req,res) =>{
  const  user_id  = req.user_id;
  const {content_type ,content} = req.body;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    if (!content_type) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "content_type",
  
      }); 
  
    }
    if (!content) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "content",
  
      }); 
  
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const checksql = "SELECT content_id ,content_type ,content,createtime FROM content_master WHERE content_type = ? ";
      connection.query(checksql,[content_type],async (err,check) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(check.length <= 0){
          return res.status(200),json({success : false,message: languageMessages.msgDataNotFound});
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
        const updatesql = "UPDATE content_master SET content = ? , updatetime = ? WHERE content_type = ?";
        connection.query(updatesql,[content,indiaTime,content_type],async (err,update) => {
          if (err) {

            return res.status(200).json({
    
              success: false,
    
              message: languageMessages.internalServerError,
    
              error: err.message,
    
            });
    
          }
          return res.status(200).json({success: true,message : languageMessages.msgContentUpdateSuccess});
        })
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};


//-------------------user by dates-----------------

const userByDates = async (req,res) => {

  const  user_id  = req.user_id;
  const {fromDate,toDate} = req.query;

  try {

    if (!user_id) {

      return res.status(200).json({

        success: false,

        message: languageMessages.msg_empty_param,

        key: "user_id",

      });

    }

    const sql =

      "SELECT user_id, active_flag FROM user_master WHERE user_id = ? and delete_flag = 0 AND user_type = 0";

      connection.query(sql,[user_id],async (err,info) => {

        if (err) {

          return res.status(200).json({

            success: false,

            message: languageMessages.internalServerError,

            error: err.message,

          });

        }

        if (info.length <= 0) {

          return res

            .status(200)

            .json({ success: false, message: languageMessages.msgUserNotFound });

        }

        if (info[0].active_flag === 0) {

          return res.status(200).json({

            success: false,

            message: languageMessages.accountdeactivated,

            account_active_status: 0,

          });

        }

        let query = "SELECT user_id, email, name, mobile, image, active_flag, createtime, updatetime, delete_reason, delete_flag FROM user_master WHERE user_type = 1";

        let params = [];
        if (fromDate && toDate) {
          query += ' AND createtime BETWEEN ? AND ?';
          params.push(fromDate, toDate);
      }

      query += ' ORDER BY user_id DESC';

        connection.query(query,params,async (err,users) => {

          if (err) {

            return res.status(200).json({

              success: false,

              message: languageMessages.internalServerError,

              error: err.message,

            });

          }

          if(users.length <= 0){

            return res.status(200).json({success : true,message : languageMessages.msgDataFound,activeUser : "NA",deleteUser : "NA"});

          }

          let deleteUser = [] ; 

          let activeUser = [];

          users.map((data) => {

            if(data.delete_flag == 0){

              data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
              data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');

              return activeUser.push(data);

            }else if (data.delete_flag == 1){
              data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
              data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');

              return deleteUser.push(data);

            }

          });

          

          if(activeUser.length <= 0){

            activeUser = "NA";

          }

          if(deleteUser.length <= 0){

            deleteUser = "NA"

          }



          return res.status(200).json({success : true,message : languageMessages.msgDataFound,activeUser,deleteUser})

        })

      })

  } catch (error) {

    return res.status(200).json({

      success: false,

      message: languageMessages.changePasswordSuccessfullyError,

      error: err.message,

    });

  }

}


//------------------------ Video by date---------------
const videoByDates = async (req,res) => {
  const  user_id  = req.user_id;
  const {fromDate,toDate} = req.query;
  try {
    if (!user_id) {

      return res.status(200).json({
  
        success: false,
  
        message: languageMessages.msg_empty_param,
  
        key: "user_id",
  
      }); 
  
    }
    const sql =
  
        "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
        connection.query(sql,[user_id],async(err,info) => {
          if (err) {

            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.internalServerError,
  
              error: err.message,
  
            });
  
          }
  
          if (info.length <= 0) {
  
            return res
  
              .status(200)
  
              .json({ success: false, message: languageMessages.msgUserNotFound });
  
          }
  
          if (info[0].active_flag === 0) {
  
            return res.status(200).json({
  
              success: false,
  
              message: languageMessages.accountdeactivated,
  
              account_active_status: 0,
  
            });
  
          }
          let videosql = "SELECT v.video_id ,c.category_id,c.category_name,v.title,v.description,v.thumbnail,v.video,v.createtime,v.updatetime FROM video_master v JOIN category_master c ON c.category_id = v.category_id WHERE v.delete_flag = 0 AND c.delete_flag = 0 ";

          let params = [];
        if (fromDate && toDate) {
          videosql += ' AND v.createtime BETWEEN ? AND ?';
          params.push(fromDate, toDate);
      }

          videosql += " ORDER BY v.video_id desc"
          connection.query(videosql,params,async(err,video) => {
            if (err) {

              return res.status(200).json({
    
                success: false,
    
                message: languageMessages.internalServerError,
    
                error: err.message,
    
              });
    
            }
            if(video.length <= 0){
              return res.status(200).json({success : true,message : languageMessages.msgDataNotFound,video : "NA"})
            }
            video.map((data) => {
              data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
        data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
            })
            return res.status(200).json({success : true,message : languageMessages.msgDataFound,video});
          })
        })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};

//--------------------- pdf by date---------------
const pdfByDates = async (req,res) => {
  const  user_id  = req.user_id;
  const {fromDate,toDate} = req.query;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      let pdfsql = "SELECT p.pdf_id ,p.title,p.pdf_file,p.createtime,p.updatetime, p.category_id, c.category_name FROM pdf_master p JOIN category_master c ON c.category_id = p.category_id WHERE p.delete_flag = 0 AND c.delete_flag= 0 ";
      let params = [];
      if (fromDate && toDate) {
        pdfsql += ' AND p.updatetime BETWEEN ? AND ?';
        params.push(fromDate, toDate);
    }

    pdfsql += ' ORDER BY p.pdf_id desc';
      connection.query(pdfsql,params,async (err,pdf) => {
        if (err) {

          return res.status(200).json({
  
            success: false,
  
            message: languageMessages.internalServerError,
  
            error: err.message,
  
          });
  
        }
        if(pdf.length <=0){
          return res.status(200).json({success : true , message : languageMessages.msgDataNotFound,pdf : "NA"})
        }
        pdf.map((data) => {
          data.createtime = moment(data.createtime).format('DD-MM-YYYY HH:mm:ss');
          data.updatetime = moment(data.updatetime).format('DD-MM-YYYY HH:mm:ss');
        });
        return res.status(200).json({success : true , message : languageMessages.msgDataFound,pdf});
      })
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
};




//---------------------user analytic report---------------
const userAnalyticReport = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      
      const month_report_arr = [];
          const year_report_arr = [];
          const month_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const current_year = new Date().getFullYear();
  
          for (let i = 0; i < month_arr.length; i++) {
              const month_text = month_arr[i];
              const current_month = i + 1;
              const month_user_arr = await getUserAnalyticalReports('monthly', current_year, current_month, 'All');
              month_report_arr.push({ month: month_text, month_user_arr: month_user_arr });
          }
  
          for (let i = 2020; i <= current_year; i++) {
              const year_user_arr = await getUserAnalyticalReports('yearly', i, '', 'All');
              year_report_arr.push({ year: i, year_user_arr: year_user_arr });
          }
  
          const record = { success: true, msg: languageMessages.msgDataFound, data: { month_report_arr, year_report_arr } };
          return res.json(record);
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//---------------------user analytic report---------------
const videoAnalyticReport = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      
      const month_report_arr = [];
          const year_report_arr = [];
          const month_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const current_year = new Date().getFullYear();
  
          for (let i = 0; i < month_arr.length; i++) {
              const month_text = month_arr[i];
              const current_month = i + 1;
              const month_video_arr = await getVideoAnalyticalReports('monthly', current_year, current_month, 'All');
              month_report_arr.push({ month: month_text, month_video_arr: month_video_arr });
          }
  
          for (let i = 2020; i <= current_year; i++) {
              const year_video_arr = await getVideoAnalyticalReports('yearly', i, '', 'All');
              year_report_arr.push({ year: i, year_video_arr: year_video_arr });
          }
  
          const record = { success: true, msg: languageMessages.msgDataFound, data: { month_report_arr, year_report_arr } };
          return res.json(record);
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//---------------------user analytic report---------------
const pdfAnalyticReport = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      
      const month_report_arr = [];
          const year_report_arr = [];
          const month_arr = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const current_year = new Date().getFullYear();
  
          for (let i = 0; i < month_arr.length; i++) {
              const month_text = month_arr[i];
              const current_month = i + 1;
              const month_pdf_arr = await getPdfAnalyticalReports('monthly', current_year, current_month, 'All');
              month_report_arr.push({ month: month_text, month_pdf_arr: month_pdf_arr });
          }
  
          for (let i = 2020; i <= current_year; i++) {
              const year_pdf_arr = await getPdfAnalyticalReports('yearly', i, '', 'All');
              year_report_arr.push({ year: i, year_pdf_arr: year_pdf_arr });
          }
  
          const record = { success: true, msg: languageMessages.msgDataFound, data: { month_report_arr, year_report_arr } };
          return res.json(record);
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//---------------------get subscription------------
const getAllSubscription = async (req,res) => {
  const  user_id  = req.user_id;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {

        return res.status(200).json({

          success: false,

          message: languageMessages.internalServerError,

          error: err.message,

        });

      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      
      const subsql = "SELECT subscription_id,number_off_day ,amount ,subscription_type,description,createtime,updatetime FROM subscriptions_master WHERE delete_flag = 0 ORDER by subscription_id DESC";
      connection.query(subsql,async (err,subscription) => {
        if (err) {
          return res.status(200).json({
            success: false,
            message: languageMessages.internalServerError,
            error: err.message,
          });
        }
        if(subscription.length <= 0){
          return res.status(200).json({success : true,message : languageMessages.msgDataNotFound,subscription : "NA"})
        }
        subscription.map((item) => {
          item.createtime = moment(item.createtime).format("DD-MM-YYYY HH:mm:ss");
          item.updatetime = moment(item.updatetime).format("DD-MM-YYYY HH:mm:ss");
        })

        return res.status(200).json({success : true,message : languageMessages.msgDataFound,subscription})

      })
      
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//--------------------add subscription-------------
const addSubscription = async (req,res) => {
  const  user_id  = req.user_id;
  const {number_off_day ,amount ,subscription_type,description} = req.body;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    if (!number_off_day) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "number_off_day",
      }); 
    }
    if (!amount) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "amount",
      }); 
    }
    if (!subscription_type) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "subscription_type",
      }); 
    }
    if (!description) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "description",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {
        return res.status(200).json({
          success: false,
          message: languageMessages.internalServerError,
          error: err.message,
        });
      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }
      const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
    const addsql = "INSERT INTO subscriptions_master (number_off_day ,amount ,subscription_type,description,createtime,updatetime) VALUES (?,?,?,?,?,?)";
    connection.query(addsql,[number_off_day,amount,subscription_type,description,indiaTime,indiaTime],async(err,add) => {
      if (err) {
        return res.status(200).json({
          success: false,
          message: languageMessages.internalServerError,
          error: err.message,
        });
      }
      return res.status(200).json({success : true , message: languageMessages.msgSubscriptionAddedSuccess})
    })
      
    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//--------------------add subscription-------------
const editSubscription = async (req,res) => {
  const  user_id  = req.user_id;
  const {number_off_day ,amount ,subscription_type,description,subscription_id} = req.body;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    if (!subscription_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "subscription_id",
      }); 
    }
    if (!number_off_day) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "number_off_day",
      }); 
    }
    if (!amount) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "amount",
      }); 
    }
    if (!subscription_type) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "subscription_type",
      }); 
    }
    if (!description) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "description",
      }); 
    }
    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {
        return res.status(200).json({
          success: false,
          message: languageMessages.internalServerError,
          error: err.message,
        });
      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }

      const checksql = "SELECT subscription_id ,number_off_day  FROM subscriptions_master WHERE subscription_id = ? AND delete_flag = 0";
      connection.query(checksql,[subscription_id],async (err,check) => {
        if (err) {
          return res.status(200).json({
            success: false,
            message: languageMessages.internalServerError,
            error: err.message,
          });
        }
        if(check.length <= 0){
          return res.status(200).json({success : true,message : languageMessages.msgDataNotFound,key : "subscription"})
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
   
        const updatesql = "UPDATE subscriptions_master SET number_off_day = ? ,amount =?,subscription_type=?,description=?,updatetime=? WHERE subscription_id = ? AND delete_flag = 0";
        connection.query(updatesql,[number_off_day,amount,subscription_type,description,indiaTime,subscription_id],async (err,update) => {
          if (err) {
            return res.status(200).json({
              success: false,
              message: languageMessages.internalServerError,
              error: err.message,
            });
          }
          return res.status(200).json({success : true,message:languageMessages.msgSubscriptionUpdateSuccess})
        })
      })

    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}

//--------------------add subscription-------------
const deleteSubscription = async (req,res) => {
  const  user_id  = req.user_id;
  const {subscription_id} = req.body;
  try {
    if (!user_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "user_id",
      }); 
    }
    if (!subscription_id) {
      return res.status(200).json({
        success: false,
        message: languageMessages.msg_empty_param,
        key: "subscription_id",
      }); 
    }

    const sql =

    "SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0 AND user_type = 0";
    connection.query(sql,[user_id],async (err,info) => {
      if (err) {
        return res.status(200).json({
          success: false,
          message: languageMessages.internalServerError,
          error: err.message,
        });
      }

      if (info.length <= 0) {

        return res

          .status(200)

          .json({ success: false, message: languageMessages.msgUserNotFound });

      }

      if (info[0].active_flag === 0) {

        return res.status(200).json({

          success: false,

          message: languageMessages.accountdeactivated,

          account_active_status: 0,

        });

      }

      const checksql = "SELECT subscription_id ,number_off_day  FROM subscriptions_master WHERE subscription_id = ? AND delete_flag = 0";
      connection.query(checksql,[subscription_id],async (err,check) => {
        if (err) {
          return res.status(200).json({
            success: false,
            message: languageMessages.internalServerError,
            error: err.message,
          });
        }
        if(check.length <= 0){
          return res.status(200).json({success : true,message : languageMessages.msgDataNotFound,key : "subscription"})
        }
        const indiaTime = moment().tz('Asia/Kolkata').format('YYYY-MM-DD HH:mm:ss');
   
        const updatesql = "UPDATE subscriptions_master SET delete_flag = 1,updatetime=? WHERE subscription_id = ? AND delete_flag = 0";
        connection.query(updatesql,[indiaTime,subscription_id],async (err,update) => {
          if (err) {
            return res.status(200).json({
              success: false,
              message: languageMessages.internalServerError,
              error: err.message,
            });
          }
          return res.status(200).json({success : true,message:languageMessages.msgSubscriptionDeleteSuccess})
        })
      })

    })
  } catch (error) {
    return res.status(200).json({

      success: false,
  
      message: languageMessages.changePasswordSuccessfullyError,
  
      error: err.message,
  
    });
  }
}




module.exports = {login,ForgotPassword,resetPassword,getProfileDetails,editProfile,changePassword,dashboard,userList,userDetails,activateDeactivate,getAllCategory ,editCategory,addCategory,deleteCategory,getAllVideo,videoDetails,addVideo,deleteVideo,updateVideo,getAllPdf,addPdf,editPdf,deletePdf,updateContent,getFaq,getFaqDetails,addFaq,editFaq,deleteFaq,getContact,replyContactUs,getContent,userByDates,videoByDates,pdfByDates,userAnalyticReport,videoAnalyticReport,pdfAnalyticReport,getAllSubscription,addSubscription,editSubscription,deleteSubscription};

  

