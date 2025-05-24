var mysql = require("mysql");
var connection = mysql.createConnection({
  host: "",
  user: "ywdgzsab_butler_user",
  password: "ub((9K=-v^m.",
  database: "ywdgzsab_butler_db",
});

connection.connect((err) => {
  if (err) {
    console.log("error in connection database...!!");
  }

  else {
    console.log("database Connected successfully..!!");
  }
});

module.exports = connection;

