const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./config");
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

app.post("/signup", (req, resp) => {
  const sql =
    "INSERT INTO users(`Name`,`Email`,`Password`,`TaxId`,`PhoneNumber`,`CompanyName`) VALUES (?)";
  // const values = ["conu", "cobu@gmail", "123456", "12365", "2525252525", "xyz"];
  const values = [
    req.body.Name,
    req.body.Email,
    req.body.Password,
    req.body.TaxId,
    req.body.PhoneNumber,
    req.body.CompanyName,
  ];
  connection.query(q, [values], (err, result) => {
    if (err) console.error("Error executing MySQL query:", err);
    return resp.send(result);
  });
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
