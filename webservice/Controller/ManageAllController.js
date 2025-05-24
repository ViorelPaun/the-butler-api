const connection = require('../Model/connection.js');
const languageMessage = require('../Controller/languageMessage');

const { generateOTP, getUserData, hashPassword, DeviceTokenStore_1_Signal } = require('../Controller/function');
const rs = require('randomstring')
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

let createtime = moment().tz('Asia/kolkata').format('YYYY-MM-DD HH:mm:ss');
let updatetime = moment().tz('Asia/kolkata').format('YYYY-MM-DD HH:mm:ss');

const { getNotificationArrSingle, getNotification, deleteSingleNotification, deleteAllNotification, oneSignalNotificationSendCall, getNotificationCount } = require('../Controller/notification');


// get content
const getContent = async (request, response) => {
    try {
        const webPath = 'https://app.the-butler-collection.com/butler_hospitality/server/webservice/'
        const language_id = request.query.language_id || 0;
        const fetchPrivacyPolicy =
            "SELECT content_id, content_type, content, createtime FROM content_master WHERE delete_flag = 0";
        connection.query(fetchPrivacyPolicy, async (error, result) => {

            if (error) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.internalServerError,
                    error: error.message,
                });
            }

            if (result.length === 0) {
                return response.status(200).json({
                    success: false,
                    msg: languageMessage.msgDataNotFound,
                });
            }

            const content_arr = result.map((data) => ({
                content_id: data.content_id,
                content_type: data.content_type,
                content_english: data.content,
                content_url: `${webPath}get_content_by_id?content_id=${data.content_id}&content_type=${data.content_type}`,
                createtime: moment(data.createtime).format("DD-MM-YYYY hh:mm A"),
            }));

            return response.status(200).json({
                success: true,
                msg: languageMessage.msgDataFound,
                content_arr: content_arr,
            });
        });
    } catch (error) {
        return response.status(200).json({
            success: false,
            msg: languageMessage.internalServerError,
            error: error.message,
        });
    }
};



// get content by Id
const getContentById = async (request, response) => {
    const { content_id, content_type } = request.query;
    try {

        if (!content_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'content_id' })
        }
        if (!content_type) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'content_type' })
        }
        let checkContent = "SELECT content_id, content_type, content, createtime FROM content_master WHERE delete_flag = 0 AND content_type = ?";
        connection.query(checkContent, [content_type], async (err, res) => {

            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message })
            }
            if (res.length === 0) {
                return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound })
            }

            if (res.length > 0) {
                let content_en = res[0].content;
                let new12 = '<html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src * data: gap: content:"><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, minimum-scale=1, user-scalable=no, minimal-ui"><title>Data</title></head><body style="word-break: break-all;">' + content_en + '</body></html>';
                return response.status(200).send(new12)
            }
            else {
                return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound })
            }
        })
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message, key: '2' })
    }
}


//Get faqs...
const getFaq = async (request, response) => {
    const { user_id } = request.query;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
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
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }

            const fetchDetails = 'SELECT faq_id , question, answer FROM faq_master WHERE delete_flag = 0 ORDER BY createtime DESC';
            connection.query(fetchDetails, async (err1, res1) => {
                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }
                if (res1.length == 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                }

                let faq_array = [];
                if (res1.length > 0) {
                    for (let data of res1) {
                        faq_array.push({
                            faq_id: data.faq_id,
                            question: data.question,
                            answer: data.answer ? data.answer : 'NA',
                            status: false
                        });
                    }
                    return response.status(200).json({ success: true, msg: languageMessage.Faqfetched, faq_array: faq_array });
                }
            });

        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

}



//get category 
const getCategory = async (request, response) => {
    const { user_id } = request.query;

    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

            const sql = 'SELECT category_id, category_name FROM category_master WHERE delete_flag = 0 ';
            connection.query(sql, async (err1, res1) => {

                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }

                if (res1.length == 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound, category_arr: [] });
                }

                let category_arr = [];
                for (let data of res1) {
                    category_arr.push({
                        category_id: data.category_id,
                        category_name: data.category_name
                    })
                }
                return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, category_arr: category_arr });
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}



//home page   OLD
// const homePage = async (request, response) => {

//     const { user_id } = request.query;

//     try {
//         if (!user_id) {
//             return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
//         }
//         const checkUser = 'SELECT user_id, name, image, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
//         connection.query(checkUser, [user_id], async (err, res) => {

//             if (err) {
//                 return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
//             }

//             if (res.length == 0) {
//                 return response.status(200).json({ success: false, msg: languageMessage.msgUserNotFound });
//             }
//             if (res[0].active_flag == 0) {
//                 return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated, active_flag: 0 });
//             }

//             let userDetails = {
//                 name: res[0].name,
//                 image: res[0].image,
//             }
//             const sql = 'SELECT vm.video_id, vm.title, vm.description, vm.thumbnail, vm.video, vm.createtime, cm.category_id FROM video_master vm JOIN category_master cm ON vm.category_id = cm.category_id WHERE vm.delete_flag = 0 AND cm.delete_flag = 0 ORDER BY vm.createtime DESC';
//             connection.query(sql, async (err1, res1) => {

//                 if (err1) {
//                     return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
//                 }

//                 if (res1.length == 0) {
//                     return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound, video_arr: [] });
//                 }
//                 let video_arr = [];
//                 for (let data of res1) {
//                     video_arr.push({
//                         video_id: data.video_id,
//                         title: data.title,
//                         description: data.description,
//                         thumbnail: data.thumbnail,
//                         video: data.video,
//                         createtime: moment(data.createtime).format("DD MMM, hh:mm A"),
//                     });
//                 }
//                 return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, userDetails, video_arr: video_arr });
//             });

//         });
//     }
//     catch (error) {
//         return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
//     }
// }


//home page 
const homePage = async (request, response) => {
    const { user_id } = request.query;

    try {
        let userDetails = {};
        
        if (user_id && user_id !== "0") {
            const checkUser = 'SELECT user_id, name, image, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

                userDetails = {
                    name: res[0].name,
                    image: res[0].image,
                };
                fetchVideos(response, userDetails);
            });
        } else {
            // If user_id is 0 or not provided, proceed without user details
            fetchVideos(response, userDetails);
        }
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}

// Helper function to fetch videos
function fetchVideos(response, userDetails) {
    const sql = 'SELECT vm.video_id, vm.title, vm.description, vm.thumbnail, vm.video, vm.createtime, cm.category_id FROM video_master vm JOIN category_master cm ON vm.category_id = cm.category_id WHERE vm.delete_flag = 0 AND cm.delete_flag = 0 ORDER BY vm.createtime DESC';
    connection.query(sql, async (err1, res1) => {
        if (err1) {
            return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
        }

        if (res1.length == 0) {
            return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound, video_arr: [], userDetails });
        }
        
        let video_arr = [];
        for (let data of res1) {
            video_arr.push({
                video_id: data.video_id,
                title: data.title,
                description: data.description,
                thumbnail: data.thumbnail,
                video: data.video,
                createtime: moment(data.createtime).format("DD MMM, hh:mm A"),
            });
        }
        return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, userDetails, video_arr: video_arr });
    });
}



//get video details
const getVideoDetails = async (request, response) => {
    const { user_id, video_id } = request.query;
    try {

        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        if (!video_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'video_id' });
        }

        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

            const sql = 'SELECT video_id, title, description, thumbnail, video,createtime FROM video_master WHERE video_id = ? AND  delete_flag = 0 ';
            connection.query(sql, [video_id], async (err1, res1) => {

                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }
                if (res1.length == 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound, video_details: 'NA' });
                }

                let data = res1[0];
                let video_details = {
                    video_id: data.video_id,
                    title: data.title,
                    description: data.description,
                    thumbnail: data.thumbnail,
                    video: data.video,
                    createtime: moment(data.createtime).format("DD MMM, hh:mm A"),
                }
                return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, video_details: video_details });
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}



//get video by category 
const getVideoByCategory = async (request, response) => {
    const { user_id, category_id } = request.query;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }

        if (!category_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'category_id' });
        }
        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

            let sql;
            if (category_id == 0) {
                sql = 'SELECT vm.video_id, vm.title, vm.description, vm.thumbnail, vm.video, vm.createtime,  vm.category_id FROM video_master vm JOIN category_master cm ON vm.category_id = cm.category_id WHERE vm.delete_flag = 0 AND cm.delete_flag = 0';
            }

            if (category_id > 0) {
                sql = 'SELECT vm.video_id, vm.title, vm.description, vm.thumbnail, vm.video, vm.createtime, vm.category_id FROM video_master vm JOIN category_master cm ON vm.category_id = cm.category_id WHERE vm.category_id = ? AND vm.delete_flag = 0 AND cm.delete_flag = 0';
            }
            let category_arr = await getCategories();
            connection.query(sql, [category_id], async (err1, res1) => {

                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }

                if (res1.length == 0) {
                    return response.status(200).json({ success: true, msg: languageMessage.msgDataNotFound, category_arr, video_arr: 'NA' });
                }
                let video_arr = [];
                for (let data of res1) {
                    video_arr.push({
                        video_id: data.video_id,
                        title: data.title,
                        description: data.description,
                        thumbnail: data.thumbnail,
                        video: data.video,
                        category_id: data.category_id,
                        createtime: moment(data.createtime).format("DD MMM, hh:mm A"),
                    });
                }
                return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, category_arr, video_arr: video_arr });
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}

async function getCategories() {
    let sql = 'SELECT category_id, category_name FROM category_master WHERE delete_flag = 0 '
    return new Promise((resolve, reject) => {
        connection.query(sql, async (err, res) => {

            if (err) {
                reject(err);
            }
            if (res.length == 0) {
                resolve('NA');
            }
            let category_arr = [];
            for (let data of res) {
                category_arr.push({
                    category_id: data.category_id,
                    category_name: data.category_name
                })
            }
            resolve(category_arr);
        })
    })
}

//get pdf
const getPdf = async (request, response) => {
    const { user_id, category_id  } = request.query;

    if (!user_id) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
    }
    if (!category_id ) {
        return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'category_id' });
    }

    const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

         let sql ;
         let params = [];
         if(category_id == 0){
         sql = 'SELECT pdf_id, title, pdf_file, category_id,thumbnail FROM pdf_master WHERE delete_flag = 0 ORDER BY createtime DESC';
         }

         if(category_id > 0){
            sql = 'SELECT pdf_id, title, pdf_file , category_id,thumbnail FROM pdf_master WHERE category_id = ? AND delete_flag = 0 ORDER BY createtime DESC';
            params.push(category_id);
            }

        connection.query(sql, params, async (err1, res1) => {
            if (err1) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
            }

            if (res1.length == 0) {
                return response.status(200).json({ success: true, msg: languageMessage.msgDataNotFound, pdf_arr: 'NA' });
            }

            let pdf_arr = [];
            for (let data of res1) {
                pdf_arr.push({
                    pdf_id: data.pdf_id,
                    title: data.title,
                    category_id : data.category_id,
                    pdf_file: data.pdf_file,
                    thumbnail : data.thumbnail || "NA"
                })
            }
            return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, pdf_arr: pdf_arr });
        });
    })
}


//get pdf details 
const getPdfDetail = async (request, response) => {
    const { user_id, pdf_id } = request.query;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }

        if (!pdf_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'pdf_id' });
        }

        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

            const sql = 'SELECT pdf_id, title, pdf_file,thumbnail FROM pdf_master WHERE pdf_id = ? AND delete_flag = 0';
            connection.query(sql, [pdf_id], async (err1, res1) => {

                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }

                if (res1.length == 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound, pdf_details: 'NA' });
                }
                let data = res1[0];
                let pdf_details = {
                    pdf_id: data.pdf_id,
                    title: data.title,
                    pdf_file: data.pdf_file,
                    thumbnail : data.thumbnail || "NA"
                }
                return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, pdf_details: pdf_details });
            });
        });
    }

    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//get notifications 
const getNotifications = async (request, response) => {
    const { user_id } = request.body;

    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }

        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

            const sql = 'SELECT notification_message_id, action, title, message, createtime FROM user_notification_message WHERE other_user_id = ? AND delete_flag = 0 ORDER BY createtime DESC';
            connection.query(sql, [user_id], async (err1, res1) => {
                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }

                if (res1.length == 0) {
                    return response.status(200).json({ success: true, msg: languageMessage.NoNotifications, notifications_arr: [] });
                }

                let notifications_arr = [];

                for (let data of res1) {
                    notifications_arr.push({
                        notification_message_id: data.notification_message_id,
                        action: data.action,
                        title: data.title,
                        message: data.message,
                        createtime: moment(data.createtime).format("DD MMM, hh:mm A"),
                    });
                }
                return response.status(200).json({ success: true, msg: languageMessage.msgDataFound, notifications_arr: notifications_arr });
            })
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

}


//delete single notification
const deleteSinglenotification = async (request, response) => {
    const { user_id, notification_message_id } = request.body;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        if (!notification_message_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'notification_message_id' });
        }

        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

            const checkSql = 'SELECT other_user_id FROM user_notification_message WHERE notification_message_id = ? AND delete_flag = 0';
            connection.query(checkSql, [notification_message_id], async (err1, res1) => {
                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }

                if (res1.length == 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.msgDataNotFound });
                }

                const update = 'UPDATE user_notification_message SET delete_flag = 1 WHERE notification_message_id = ? AND other_user_id = ? ';
                connection.query(update, [notification_message_id, user_id], async (err2, res2) => {
                    if (err2) {
                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err2.message });
                    }

                    if (res2.affectedRows > 0) {
                        return response.status(200).json({ success: true, msg: languageMessage.DeleteNotification })
                    }
                    else {
                        return response.status(200).json({ success: false, msg: languageMessage.NotifcationNotDeleted });
                    }
                });
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }
}


//clear all notification 
const deleteAllnotification = async (request, response) => {
    const { user_id } = request.body;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }

        const checkUser = 'SELECT user_id, active_flag FROM user_master WHERE user_id = ? AND delete_flag = 0';
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

            const check = 'SELECT  notification_message_id FROM user_notification_message WHERE other_user_id = ? AND delete_flag = 0';
            connection.query(check, [user_id], async (err1, res1) => {

                if (err1) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err1.message });
                }
                if (res1.length == 0) {
                    return response.status(200).json({ success: false, msg: languageMessage.NoNotifications });
                }

                const update = 'UPDATE user_notification_message SET delete_flag = 1 WHERE other_user_id = ? ';
                connection.query(update, [user_id], async (err2, res2) => {

                    if (err2) {
                        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err2.message });
                    }
                    if (res2.affectedRows == 0) {
                        return response.status(200).json({ success: false, msg: languageMessage.NotifcationNotDeleted });
                    }
                    return response.status(200).json({ success: true, msg: languageMessage.DeleteAllNotification})
                });
            });
        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

};


//---------------------get subscription-----------
const getSubscription = async (request, response) => {
    const { user_id } = request.query;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
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
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }

           const subscriptionsql = "SELECT subscription_id ,number_off_day ,amount ,subscription_type,description FROM subscriptions_master WHERE delete_flag = 0";
           connection.query(subscriptionsql,async (err,subscription) => {
            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }
            if(subscription.length <= 0){
                return response.status(200).json({success : true,msg : languageMessage.msgDataNotFound,subscription : "NA"})
            }
            return response.status(200).json({success : true,msg : languageMessage.msgDataNotFound,subscription});
           })

        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

}

//---------------------subscription history-------------
const subscriptionHistory = async (request, response) => {
    const { user_id } = request.query;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
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
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }

          const historysql = "SELECT user_subscription_id,subscription_id,user_id,transaction_id,amount,number_off_day,start_date,end_date,subscription_type,description,createtime,updatetime FROM user_subscription_master WHERE user_id = ? AND delete_flag= 0 ORDER BY user_subscription_id desc";
          connection.query(historysql,[user_id],async(err,history) => {
            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }
            if(history.length <=0){
                return response.status(200).json({success : true,msg : languageMessage.msgDataNotFound,history : "NA"})
            }
            history.map((item) => {
                 item.startDate = moment(item.start_date).format("MMM DD YYYY");
                item.endDate = moment(item.end_date).format("MMM DD YYYY");

                const endDate = new Date(item.end_date);
                const now = new Date();

            // Determine status using native Date comparison
            item.currentStatus = endDate < now ? "Expired" : "Ongoing";
            })
            return response.status(200).json({success : true,msg : languageMessage.msgDataNotFound,history});
          })

        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

}

//---------------------check status-------------
const checkStatus = async (request, response) => {
    const { user_id } = request.query;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
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
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }

          const historysql = "SELECT user_subscription_id,subscription_id,user_id,transaction_id,amount,number_off_day,start_date,end_date,subscription_type,description,createtime,updatetime FROM user_subscription_master WHERE user_id = ? AND delete_flag= 0 ORDER BY user_subscription_id desc";
          connection.query(historysql,[user_id],async(err,history) => {
            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }
            if(history.length <=0){
                return response.status(200).json({success : false,msg : "Expired"})
            }
            history.map((item) => {
                 item.startDate = moment(item.start_date).format("MMM DD YYYY");
                item.endDate = moment(item.end_date).format("MMM DD YYYY");

                const endDate = new Date(item.end_date);
                const now = new Date();

            // Determine status using native Date comparison
            item.currentStatus = endDate < now ? false : true;
            })
            return response.status(200).json({success : history[0].currentStatus,msg :history[0].currentStatus? "Ongoing" : "Expired" });
          })

        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

}

//---------------------subscription-------------
const subscription = async (request, response) => {
    const { user_id,subscription_id ,transaction_id } = request.body;
    try {
        if (!user_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'user_id' });
        }
        if (!subscription_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'subscription_id' });
        }
        if (!transaction_id) {
            return response.status(200).json({ success: false, msg: languageMessage.msg_empty_param, key: 'transaction_id' });
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
                return response.status(200).json({ success: false, msg: languageMessage.accountdeactivated });
            }

           

         const checksql = "SELECT subscription_id ,number_off_day,amount ,subscription_type,description FROM subscriptions_master WHERE subscription_id  =? AND delete_flag = 0";
         connection.query(checksql,[subscription_id],async(err,check) => {
            if (err) {
                return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
            }
            if(check.length <= 0){
                return response.status(200).json({success : false,msg : languageMessage.msgDataNotFound,key : "subscription"})
            }

            const subscription = check[0];
    
            // Calculate dates
            const start_date = new Date(); // Today's date
            let end_date = new Date();
            end_date.setDate(start_date.getDate() + subscription.number_off_day); // Add number of days to start date
            
            // Format dates to YYYY-MM-DD format for MySQL
            const formattedStartDate = start_date.toISOString().split('T')[0];
            const formattedEndDate = end_date.toISOString().split('T')[0];
        
            const VALUES = [
                subscription_id,
                user_id, // Make sure you have this variable defined
                transaction_id, // Make sure you have this variable defined
                1, // Make sure you have this variable defined or provide a default
                subscription.amount,
                subscription.number_off_day,
                formattedStartDate,
                formattedEndDate,
                subscription.subscription_type,
                subscription.description
            ]


            const subscriptionsql = "INSERT INTO user_subscription_master (subscription_id ,user_id ,transaction_id,status,amount,number_off_day,start_date,end_date,subscription_type,description,createtime,updatetime) VALUES(?,?,?,?,?,?,?,?,?,?,now(),now())";
            connection.query(subscriptionsql,VALUES,async(err,result) => {
                if (err) {
                    return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: err.message });
                }
                return response.status(200).json({success : true,msg :languageMessage.msgSubscriptionSuccess})
            })
         })

        });
    }
    catch (error) {
        return response.status(200).json({ success: false, msg: languageMessage.internalServerError, error: error.message });
    }

}


const togglePaymentVisibility = async (request, response) => {

    const Offstatus = { status: 0, label: "Off" }

    const Onstatus = { status: 1, label: "On" }

    return response.status(200).json({ success: true, status: 0 });
}




module.exports = { getContent, getContentById, getFaq, getCategory, homePage, getVideoDetails, getVideoByCategory, getPdf, getPdfDetail, getNotifications, deleteSinglenotification, deleteAllnotification ,getSubscription,subscriptionHistory,checkStatus,subscription, togglePaymentVisibility}



