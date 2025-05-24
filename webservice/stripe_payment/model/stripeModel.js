require('dotenv').config();

const mysql = require('mysql');

const moment = require('moment');

const crypto = require('crypto');



const mysqlcon = mysql.createConnection({

    host: 'localhost',  // Replace with your MySQL host
  
    user: 'ywdgzsab_butler_user',       // Replace with your MySQL username
  
    password: 'ub((9K=-v^m.',       // Replace with your MySQL password
  
    database: 'ywdgzsab_butler_db',   // Replace with your MySQL database name
    
    charset: 'utf8mb4',

    timezone: 'America/New_York'

  });



  function handleDisconnect() {

    mysqlcon.connect(function(err) {

        if (err) {

            console.error('Error connecting to MySQL:', err);

            setTimeout(handleDisconnect, 2000); // retry connection after 2 seconds

        } else {

           

        }

    });



    mysqlcon.on('error', function(err) {

        console.error('MySQL error:', err);

        if (err.code === 'PROTOCOL_CONNECTION_LOST') {

            handleDisconnect(); // attempt to reconnect

        } else {

            throw err;

        }

    });

}



handleDisconnect();

module.exports = {



    async  getStripeCustomerId(user_id) {

        return new Promise((resolve, reject) => {

            

            mysqlcon.query('SELECT stripe_customer_id, customer_id from stripe_customer_master where delete_flag = 0 AND user_id = ? order by customer_id desc limit 1 ',[user_id], (error, rows) => {

                if (error) {

                    console.log('database email check error ',error)

                    reject(error);       // Reject the promise with the error

                } else {

                    if (rows.length > 0) {

                                         // Email exists, resolve with user_id

                        resolve(rows[0]); // Resolve with user_id

                    } else {

                                          // Email does not exist, resolve with 0

                        resolve('NA');       // Resolve with 0

                    }

                }

            });

        });

        

        },

    async  getUserDetails(user_id) {

        return new Promise((resolve, reject) => {

            

            mysqlcon.query('SELECT name, email from user_master where  user_id = ? order by user_id desc limit 1 ',[user_id], (error, rows) => {

                if (error) {

                    console.log('database email check error ',error)

                    reject(error);       // Reject the promise with the error

                } else {

                    if (rows.length > 0) {

                                         // Email exists, resolve with user_id

                        resolve(rows[0]); // Resolve with user_id

                    } else {

                                          // Email does not exist, resolve with 0

                        resolve('NA');       // Resolve with 0

                    }

                }

            });

        });

        

        },

    async  getStripeCard(user_id) {

        return new Promise((resolve, reject) => {

            

            mysqlcon.query('SELECT stripe_card_id,customer_id,card_id,token,exp_month,exp_year,last4  FROM stripe_card_master  WHERE user_id=? and delete_flag=0 order by user_id desc limit 1 ',[user_id], (error, rows) => {

                if (error) {

                    console.log('database email check error ',error)

                    reject(error);       // Reject the promise with the error

                } else {

                    if (rows.length > 0) {

                                         // Email exists, resolve with user_id

                        resolve(rows[0]); // Resolve with user_id

                    } else {

                                          // Email does not exist, resolve with 0

                        resolve('NA');       // Resolve with 0

                    }

                }

            });

        });

        

        },

        async  createStripeCustomerId(user_id,customer_id) {

            return new Promise((resolve, reject) => {

                const updatetime = moment().format('YYYY-MM-DD HH:mm:ss');

                const createtime = moment().format('YYYY-MM-DD HH:mm:ss');

                query = 'INSERT INTO stripe_customer_master(user_id, customer_id, createtime, updatetime) VALUES (?,?,?,?)';

    

            mysqlcon.query(query,[user_id,customer_id,updatetime,createtime], (error, rows) => {

                if (error) {

                    console.log('database update faq_id error ')

                    reject(error);       // Reject the promise with the error

                } else {

                    if (rows.affectedRows > 0) {

                                // Email exists, resolve with user_id

                        resolve(rows.insertId); // Resolve with user_id

                    } else {

                                          // Email does not exist, resolve with 0

                        resolve(0);       // Resolve with 0

                    }

                }

            });

            });

            },

        async  createStripePayment(user_id, order_id, amount, descriptor_suffix, payment_id, payment_status, paymentIntent, transfer_user_id, transfer_amount) {

            return new Promise((resolve, reject) => {

                const updatetime = moment().format('YYYY-MM-DD HH:mm:ss');

                const createtime = moment().format('YYYY-MM-DD HH:mm:ss');

                query = 'INSERT INTO stripe_payment_master (user_id, order_id, amount, descriptor_suffix, payment_id, payment_status, paymentIntent, createtime, updatetime, transfer_user_id, transfer_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';

    

            mysqlcon.query(query,[user_id, order_id, amount, descriptor_suffix, payment_id, payment_status, paymentIntent, createtime, updatetime, transfer_user_id, transfer_amount], (error, rows) => {

                if (error) {

                    console.log('database update faq_id error ')

                    reject(error);       // Reject the promise with the error

                } else {

                    if (rows.affectedRows > 0) {

                                // Email exists, resolve with user_id

                        resolve(rows.insertId); // Resolve with user_id

                    } else {

                                          // Email does not exist, resolve with 0

                        resolve(0);       // Resolve with 0

                    }

                }

            });

            });

            

            },

            async updateStripeCustomerTokenCard(user_id, customer_id, card_id, token_id, exp_month, exp_year, last4) {

                const createtime = moment().format('YYYY-MM-DD HH:mm:ss');

                const updatetime = moment().format('YYYY-MM-DD HH:mm:ss');

            

                return new Promise((resolve, reject) => {

                    mysqlcon.query('SELECT user_id FROM stripe_card_master WHERE delete_flag = 0 AND user_id = ?', [user_id], async (error, rows) => {

                        if (error) {

                            console.error('Error selecting user:', error);

                            reject(error);

                            return;

                        }

            

                        const rowCount = rows.length;

            

                        try {

                            if (rowCount <= 0) {

                                const insertRows = await mysqlcon.query('INSERT INTO stripe_card_master (user_id, customer_id, card_id, token, exp_month, exp_year, last4, createtime, updatetime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 

                                    [user_id, customer_id, card_id, token_id, exp_month, exp_year, last4, createtime, updatetime]);

            

                                if (insertRows.affectedRows > 0) {

                                    resolve(insertRows.affectedRows);

                                } else {

                                    resolve(0);

                                }

                            } else {



                                mysqlcon.query('UPDATE stripe_card_master SET card_id=?, token=?, exp_month=?, exp_year=?, last4=?, updatetime=? WHERE user_id=? ',[card_id, token_id, exp_month, exp_year, last4, updatetime, user_id], (error, rows) => {

                                    if (error) {

                                        console.log('database user check error ')

                                        reject(error);       // Reject the promise with the error

                                    } else {

                                        if (rows.affectedRows > 0) {

                                //                              // Email exists, resolve with user_id

                                //             resolve(rows.affectedRows); 

                                // const updateRows = await mysqlcon.query('UPDATE stripe_card_master SET card_id=?, token=?, exp_month=?, exp_year=?, last4=?, updatetime=? WHERE user_id=?',

                                //     [card_id, token_id, exp_month, exp_year, last4, updatetime, user_id]);

                                // // console.log(updateRows)

                                // if (updateRows.affectedRows > 0) {

                                    resolve({ status: 'true', msg: 'Card updated' });

                                } else {

                                    resolve({ status: 'false', msg: ['Card not updated', 'Card not created'] });

                                }

                            }

                            });

                        

                            }

                        } catch (error) {

                            console.error('Error updating Stripe customer token card:', error);

                            reject(error);

                        }

                    });

                });

            },

            async deleteCard(stripe_card_id){
                
                const createtime = moment().format('YYYY-MM-DD HH:mm:ss');

                const updatetime = moment().format('YYYY-MM-DD HH:mm:ss');

                

                return new Promise((resolve, reject) => {

                    mysqlcon.query('SELECT user_id FROM stripe_card_master WHERE delete_flag = 0 AND stripe_card_id = ?', [stripe_card_id], async (error, rows) => {

                        if (error) {

                            console.error('Error selecting user:', error);

                            reject(error);

                            return;

                        }

            

                        const rowCount = rows.length;

            

                        try {

                            if (rowCount > 0) {
                                const delete_flag = 1;
                                mysqlcon.query('UPDATE stripe_card_master SET delete_flag=?, updatetime=? WHERE stripe_card_id=? ',[delete_flag, updatetime, stripe_card_id], (error, rows) => {

                                    if (error) {

                                        console.log('database user check error ')

                                        reject(error);       // Reject the promise with the error

                                    } else {

                                        if (rows.affectedRows > 0) {

                              

                                    resolve({ status: 'true', msg: 'Card deleted succesfully' });

                                } else {

                                    resolve({ status: 'false', msg: ['Card deleted unsuccesfully', 'Card deleted unsuccesfully'] });

                                }

                            }

                            });

                            } 

                        } catch (error) {

                            console.error('Error updating Stripe customer token card:', error);

                            reject(error);

                        }

                    });

                });

            },



}