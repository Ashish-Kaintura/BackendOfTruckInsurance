const mysql = require("mysql");
// signup.js
const bcrypt = require("bcrypt");
const handleSignup = async (req, resp) => {
  const { username, password, email, tax_id, company_name, phone_number } =
    req.body;

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // SQL query with placeholders
    const sql =
      "INSERT INTO users (`username`, `email`, `password`,`tax_id`,`company_name`,`phone_number`) VALUES (?, ?, ? ,? ,?, ?)";

    // Values to be inserted into the query
    const values = [
      username,
      email,
      hashedPassword,
      tax_id,
      company_name,
      phone_number,
    ];

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        return resp.status(500).send("Error during signup");
      }

      // Fetch the newly inserted user data
      const userId = result.insertId;
      const userData = {
        userId: userId,
        username: username,
        email: email,
        password: hashedPassword,
        tax_id: tax_id,
        company_name: company_name,
        phone_number: phone_number,
      };

      return resp.json(userData);
    });
  } catch (error) {
    console.error("Error hashing password:", error);
    return resp.status(500).send("Error during signup");
  }
};

module.exports = handleSignup;
