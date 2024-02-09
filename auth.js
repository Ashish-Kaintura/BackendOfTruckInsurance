// auth.js
const mysql = require("mysql");
const bcrypt = require("bcrypt");

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}
// for loging
async function comparePassword(password, password) {
  return await bcrypt.compare(password, password);
}

module.exports = {
  hashPassword,
  comparePassword,
};
