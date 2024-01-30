const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./config");
const bcrypt = require("bcrypt"); // Make sure to install the 'bcrypt' package
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, resp) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      resp.status(500).send("Internal Server Error");
      return;
    }
    resp.json(results);
  });
});

// app.post("/signup", (req, resp) => {
//   const sql =
//     "INSERT INTO users(`Name`,`Email`,`Password`,`TaxId`,`PhoneNumber`,`CompanyName`) VALUES (?)";
//   // const values = ["conu", "cobu@gmail", "123456", "12365", "2525252525", "xyz"];
//   const values = [
//     req.body.Name,
//     req.body.Email,
//     req.body.Password,
//     req.body.TaxId,
//     req.body.PhoneNumber,
//     req.body.CompanyName,
//   ];
//   connection.query(sql, [values], (err, result) => {
//     if (err) console.error("Error executing MySQL query:", err);
//     return resp.send(result);
//   });
// });
app.post("/signup", async (req, resp) => {
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
});

app.post("/login", async (req, resp) => {
  const { username, password } = req.body;

  try {
    // SQL query to retrieve user data based on the username
    const sql = "SELECT * FROM users WHERE username = ?";
    const values = [username];

    connection.query(sql, values, async (err, results) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        return resp.status(500).send("Error during login");
      }

      // Check if the user with the provided username exists
      if (results.length === 0) {
        return resp.status(401).send("Invalid username or password");
      }

      const user = results[0];

      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return resp.status(401).send("Invalid username or password");
      }

      // If the password matches, return user data excluding the password
      const userData = {
        userId: user.id,
        username: user.username,
        email: user.email,
        tax_id: user.tax_id,
        company_name: user.company_name,
        phone_number: user.phone_number,
      };

      return resp.json(userData);
    });
  } catch (error) {
    console.error("Error during login:", error);
    return resp.status(500).send("Error during login");
  }
});

app.put("/", (req, resp) => {
  const data = ["Tonu", "Tonu@gmail.com", 4];
  connection.query(
    "UPDATE users SET Name = ?, Email = ? WHERE id = ?",
    data,
    (err, result, fields) => {
      if (err) console.error("Error executing MySQL query:", err);
      resp.send(result);
    }
  );
});

// app.delete("/:id", (req, resp) => {
//   connection.query(
//     "DELETE FROM users WHERE id = " + req.params.id,
//     (err, result) => {
//       if (err) console.error("Error executing MySQL query:", err);
//       resp.send(result);
//     }
//   );
// });

app.listen(5000, () => {
  console.log("Server is running on port localhost:5000");
});
