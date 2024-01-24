const mysql = require("mysql");

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

module.exports = values;
