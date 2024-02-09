// userController.js
const mysql = require("mysql");
const connection = require("./config");
function createUser(
  username,
  email,
  password,
  tax_id,
  company_name,
  phone_number,
  address,
  img,
  company_number
  // state,
  // policy_number,
  // insurance_type,
  // effective_date,
  // expiration_date,
  // year,
  // make_model,
  // vehicle_identification_number,
  // aggency_company_isuing_card,
  // signature
) {
  return new Promise((resolve, reject) => {
    const sql =
      // "INSERT INTO users (`username`, `email`, `password`,`tax_id`,`company_name`,`phone_number`,`address`,`img`,`company_number` ,`state`, `policy_number`,`insurance_type`, `effective_date`, `expiration_date`,` year`,` make_model`,`vehicle_identification_number`,` aggency_company_isuing_card`,`signature`) VALUES (?, ?, ? ,? ,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?, ?,?,?)";
      "INSERT INTO users (`username`, `email`, `password`,`tax_id`,`company_name`,`phone_number`,`address`,`img`,`company_number`) VALUES (?, ?, ? ,? ,?, ?,?,?, ?)";
    const values = [
      username,
      email,
      password,
      tax_id,
      company_name,
      phone_number,
      address,
      img,
      company_number,
      // state,
      // policy_number,
      // insurance_type,
      // effective_date,
      // expiration_date,
      // year,
      // make_model,
      // vehicle_identification_number,
      // aggency_company_isuing_card,
      // signature,
    ];

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        return reject(err);
      }

      const id = result.insertId;
      const userData = {
        id: id,
        username: username,
        email: email,
        password: password,
        tax_id: tax_id,
        company_name: company_name,
        phone_number: phone_number,
        address: address,
        img: img,
        company_number: company_number,
      };

      resolve(userData);
    });
  });
}

// userController.js
// ... (previous code)

// function getUserByUsername(username) {
//   return new Promise((resolve, reject) => {
//     const sql = "SELECT * FROM users WHERE username = ?";
//     const values = [username];

//     connection.query(sql, values, (err, results) => {
//       if (err) {
//         console.error("Error executing MySQL query:", err);
//         return reject(err);
//       }

//       // Assuming username is unique, there should be at most one result
//       const user = results[0];
//       resolve(user);
//     });
//   });
// }
// userController.js
// ... (previous code)

function getUserByEmail(email) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email = ?";
    const values = [email];

    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        return reject(err);
      }

      // Assuming email is unique, there should be at most one result
      const user = results[0];
      resolve(user);
    });
  });
}

module.exports = {
  createUser,
  // getUserByUsername,
  getUserByEmail,
};
