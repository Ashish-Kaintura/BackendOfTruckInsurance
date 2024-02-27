const mysql = require("mysql");

const connection = mysql.createConnection({
  host: "198.12.236.79", // or replace with your MySQL server's hostname or IP address
  // port: 3306, // if your MySQL server is running on a different port, specify it here
  user: "JANDSUser",
  password: "TDhcnKK@ejFz",
  database: "JANDS",
});

// Connect to the Database
connection.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL database:", err);
    return;
  }
  console.log("Connected to MySQL database");
});

module.exports = connection;
