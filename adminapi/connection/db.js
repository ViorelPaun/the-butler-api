const dotenv = require("dotenv");

dotenv.config();// Load environment variables from .env

const mysql = require("mysql");



const connection = mysql.createConnection({

  host: process.env.DATABASE_HOST, 

  user: process.env.DATABASE_USER,         

  password:  process.env.DATABASE_PASS,        

  database: process.env.DATABASE_NAME 

});



 function connectToDatabase() {

  connection.connect((err) => {

    if (err) {

      console.error('Error connecting to MySQL database:', err);

      return;

    }

    

    return console.log('Connected to MySQL database');

  });

}



module.exports = { connectToDatabase, connection };



