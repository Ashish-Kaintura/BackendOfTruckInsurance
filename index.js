const express = require("express");
const bodyParser = require("body-parser");
const connection = require("./config");
const { createUser, getUserByEmail } = require("./userController");
const cors = require("cors");
const multer = require("multer");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const jwtKey = "j&Struck";
const app = express();
// const verifyToken = (req, resp, next) => {
//   const token = req.headers.authorization;
//   if (!token) {
//     return resp.status(403).json({ error: "Token is required" });
//   }

//   jwt.verify(token, jwtKey, (err, decoded) => {
//     if (err) {
//       return resp.status(401).json({ error: "Unauthorized" });
//     }
//     req.user = decoded;
//     next();
//   });
// };

const verifyToken = (req, resp, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return resp.status(401).json({ error: "Token not provided" });
  }

  jwt.verify(token, jwtKey, (err, decoded) => {
    if (err) {
      return resp.status(403).json({ error: "Failed to authenticate token" });
    }
    req.user = decoded;
    next();
  });
};
app.use(cors());
app.use(express.json());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Add this middleware after defining your routes
app.use("/uploads", express.static("./uploads"));

// const emailStorage = multer.memoryStorage(); // Using memory storage for simplicity
// Define storage for file uploads
const emailStorage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    // Generate a unique filename by appending a timestamp to the original filename
    const uniqueFilename = Date.now() + "-" + file.originalname;
    cb(null, uniqueFilename);
  },
});
// Using memory storage for simplicity
const emailUpload = multer({ storage: emailStorage });

// Specify the storage configuration to keep the original filename
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Keep the original filename
  },
});

const upload = multer({ storage: storage });
const users = [{ username: "J&SInsurance", password: "123456" }];
// master login
app.post("/masterlogin", (req, res) => {
  const { username, password } = req.body;

  // Check if the username and password match any user in the database
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    const token = jwt.sign({ username: user.username }, jwtKey);
    console.log(`User ${username} logged in`);
    res.status(200).json({ user, isAdmin: token });
  } else {
    res.status(401).json({ message: "Invalid username or password" });
  }
});
app.get("/masterusers", verifyToken, (req, res) => {
  res.status(200).json(users); // Assuming `users` is your array of users
});
// get id
app.get("/users", verifyToken, (req, resp) => {
  connection.query("SELECT * FROM users", (err, results) => {
    if (err) {
      console.error("Error executing MySQL query:", err);
      resp.status(500).send("Internal Server Error");
      return;
    }
    resp.json(results);
  });
});

app.get("/users/:id", verifyToken, (req, res) => {
  const userId = req.params.id;
  connection.query(
    "SELECT * FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (results.length === 0) {
        // No user found with the specified ID
        res.status(404).send("User not found");
        return;
      }

      res.json(results[0]); // Assuming the ID is unique, so returning the first result
    }
  );
});
// for signup
app.post("/signup", async (req, resp) => {
  const {
    username,
    password,
    email,
    tax_id,
    company_name,
    phone_number,
    address,
  } = req.body;

  try {
    const userData = await createUser(
      username,
      email,
      password,
      tax_id,
      company_name,
      phone_number,
      address
    );

    // Generate JWT token
    const token = jwt.sign({ email: userData.email }, jwtKey);
    return resp.json({ userData, auth: token });
    // return resp.json(userData);
  } catch (error) {
    console.error("Error during signup:", error);
    return resp.status(500).send("Error during signup");
  }
});

// Login API
app.post("/login", async (req, resp) => {
  const { username, email, password } = req.body;

  try {
    // Implement a function to authenticate the user
    // const user = await getUserByUsername(username);
    const user = await getUserByEmail(email);

    if (!user || user.password !== password) {
      return resp.status(401).json({ error: "Invalid credentials" });
    }
    // Generate JWT token
    const token = jwt.sign({ email: user.email }, jwtKey);
    // Log successful login
    console.log(`User ${email} logged in`);

    // return resp.json({ message: "Login successful", user });
    return resp.json({ user, auth: token });
    // return resp.json(user);
  } catch (error) {
    console.error("Error during login:", error);
    return resp.status(500).json({ error: "Error during login" });
  }
});
// for delete
app.delete("/users/:id", (req, res) => {
  const userId = req.params.id;

  connection.query(
    "DELETE FROM users WHERE id = ?",
    [userId],
    (err, results) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        res.status(500).send("Internal Server Error");
        return;
      }

      if (results.affectedRows === 0) {
        // No user found with the specified ID
        res.status(404).send("User not found");
        return;
      }

      res.status(204).send("success"); // Successfully deleted, return 204 No Content
    }
  );
});

// Route to handle DELETE requests to delete insurance_certificate by user ID
app.delete("/users/:id/insurance_certificate", (req, res) => {
  const userId = req.params.id;
  console.log("userId:", userId); // Add this line to check the value of userId

  // Using parameterized query to prevent SQL injection
  const sql = `UPDATE users SET insurance_certificate = NULL WHERE id = ?`;

  // Execute the query with the user ID as a parameter
  connection.query(sql, [userId], (err, result) => {
    if (err) {
      console.error("Error deleting insurance certificate:", err);
      res.status(500).json({ error: "Internal server error" });
      return;
    }

    console.log(`Insurance certificate deleted for user with ID ${userId}`);
    res.status(200).json({
      message: `Insurance certificate deleted for user with ID ${userId}`,
    });
  });
});

// for update
app.put("/users/:id", upload.single("profileImg"), (req, resp) => {
  const userId = req.params.id;
  // console.log("Received PUT request for user ID:", userId);
  // console.log("File received:", req.file);
  const {
    username,
    email,
    password,
    tax_id,
    company_name,
    phone_number,
    address,
    company_number,
    state,
    insurance_type,
    policy_number,
    effective_date,
    expiration_date,
    year,
    make_model,
    vehicle_identification_number,
    aggency_company_isuing_card,
  } = req.body;

  // Get the original filename of the uploaded image
  const originalFilename = req.file ? req.file.originalname : null;

  // If new image is provided, update profileImg in the database
  // Otherwise, keep the existing image filename
  const profileImg = req.file ? originalFilename : req.body.profileImg;
  const data = [
    username,
    email,
    password,
    tax_id,
    company_name,
    phone_number,
    address,
    company_number,
    state,
    insurance_type,
    policy_number,
    effective_date,
    expiration_date,
    year,
    make_model,
    vehicle_identification_number,
    aggency_company_isuing_card,
    // originalFilename,
    profileImg,
    // Store the original filename in the database
    userId,
  ];

  console.log("Update Query Parameters:", data);
  console.log("File received:", req.file);

  connection.query(
    "UPDATE users SET username = ?, email = ?, password = ?, tax_id = ?, company_name = ?, phone_number = ?, address = ?, company_number = ?, state = ?, insurance_type = ?, policy_number = ?, effective_date = ?, expiration_date = ?, year = ?, make_model = ?, vehicle_identification_number = ?, aggency_company_isuing_card	= ?,  profileImg = ?  WHERE id = ?",
    data,
    (err, result) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        resp.status(500).send("Internal Server Error");
        return;
      }

      if (result.affectedRows === 0) {
        // No user found with the specified ID
        resp.status(404).send("User not found");

        return;
      }
      console.log("User updated successfully");
      resp.status(200).send("User updated successfully");
    }
  );
});
// upload the insurance certifiate to user data

app.put(
  "/certificate/:id",
  upload.single("insurance_certificate"),
  (req, res) => {
    const userId = req.params.id;
    const originalFilename = req.file ? req.file.originalname : null;
    const insurance_certificate = req.file
      ? originalFilename
      : req.body.insurance_certificate;

    if (!insurance_certificate) {
      // No file uploaded, do not update insurance_certificate field
      return res.status(400).send("No file uploaded");
    }

    const pdfdata = [insurance_certificate, userId];

    console.log("Update Query Parameters:", pdfdata);
    console.log("File received:", req.file);

    connection.query(
      "UPDATE users SET insurance_certificate = ? WHERE id = ?",
      pdfdata,
      (err, result) => {
        if (err) {
          console.error("Error executing MySQL query:", err);
          return res.status(500).send("Internal Server Error");
        }

        if (result.affectedRows === 0) {
          // No user found with the specified ID
          return res.status(404).send("User not found");
        }

        console.log("User updated successfully");
        res.status(200).send("User updated successfully");
      }
    );
  }
);

// upate form client side
app.put("/clintUpdate/:id", upload.single("profileImg"), (req, resp) => {
  const userId = req.params.id;
  // console.log("Received PUT request for user ID:", userId);
  // console.log("File received:", req.file);
  const { username, company_name, address } = req.body;

  // Get the original filename of the uploaded image
  const originalFilename = req.file ? req.file.originalname : null;

  // If new image is provided, update profileImg in the database
  // Otherwise, keep the existing image filename
  const profileImg = req.file ? originalFilename : req.body.profileImg;
  const data = [
    username,
    company_name,
    address,
    profileImg,
    // Store the original filename in the database
    userId,
  ];

  console.log("Update Query Parameters:", data);
  console.log("File received:", req.file);

  connection.query(
    "UPDATE users SET username = ?, company_name = ?, address = ?,  profileImg = ?  WHERE id = ?",
    data,
    (err, result) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        resp.status(500).send("Internal Server Error");
        return;
      }

      if (result.affectedRows === 0) {
        // No user found with the specified ID
        resp.status(404).send("User not found");

        return;
      }
      console.log("User updated successfully");
      resp.status(200).send("User updated successfully");
    }
  );
});
// Search API
app.get("/search", verifyToken, async (req, res) => {
  const searchTerm = req.query.q; // Get the search term from the query parameters

  try {
    if (!searchTerm) {
      return res.status(400).json({ error: "Search term is required" });
    }

    // Search for users by username or email
    const usersByUsername = await searchUsersByUsername(searchTerm);
    const usersByEmail = await searchUsersByEmail(searchTerm);

    // Combine and remove duplicates from the search results
    const searchResults = [...usersByUsername, ...usersByEmail];
    const uniqueSearchResults = removeDuplicates(searchResults);

    return res.json(uniqueSearchResults);
  } catch (error) {
    console.error("Error during search:", error);
    return res.status(500).json({ error: "Error during search" });
  }
});

function searchUsersByUsername(username) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE username LIKE ?";
    const searchTerm = `%${username}%`; // Add wildcard for partial matching
    const values = [searchTerm];

    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        return reject(err);
      }

      resolve(results);
    });
  });
}

// Function to search users by email
function searchUsersByEmail(email) {
  return new Promise((resolve, reject) => {
    const sql = "SELECT * FROM users WHERE email LIKE ?";
    const searchTerm = `%${email}%`; // Add wildcard for partial matching
    const values = [searchTerm];

    connection.query(sql, values, (err, results) => {
      if (err) {
        console.error("Error executing MySQL query:", err);
        return reject(err);
      }

      resolve(results);
    });
  });
}

// Function to remove duplicates from an array of objects based on id
function removeDuplicates(array) {
  const uniqueArray = array.reduce((acc, current) => {
    const x = acc.find((item) => item.id === current.id);
    if (!x) {
      return acc.concat([current]);
    }
    return acc;
  }, []);
  return uniqueArray;
}
// Define your GET API endpoint
app.get("/getemails", verifyToken, (req, res) => {
  // Here you would retrieve emails from your database
  // Assuming you have a connection object named 'connection'
  connection.query("SELECT * FROM emails", (err, results) => {
    if (err) {
      console.error("Error fetching emails:", err);
      res.status(500).send("Error fetching emails");
    } else {
      console.log("Emails fetched successfully");
      res.json(results); // Sending the fetched emails as a JSON response
    }
  });
});

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "ashu88793@gmail.com",
    pass: "xedo psfr igvc heti",
  },
});

// API endpoint to send email with attachment
app.post("/sendemail", emailUpload.single("attachment"), (req, res) => {
  const mailOptions = {
    from: "ashu88793@gmail.com",
    to: req.body.recipient,
    subject: req.body.subject,
    text: req.body.content,
    attachments: [
      {
        filename: req.file.originalname,
        content: req.file.buffer, // Attach the file buffer
      },
    ],
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send("Error sending email");
    } else {
      console.log("Email sent: " + info.response);

      // Store email in database for tracking
      const emailData = {
        // sender: "your_email@gmail.com",
        sender: req.body.sender,
        recipient: req.body.recipient,
        subject: req.body.subject,
        content: req.body.content,
        attachment: req.file.originalname, // Store the file name in the database
      };

      connection.query("INSERT INTO emails SET ?", emailData, (err, result) => {
        if (err) throw err;
        console.log("Email saved to database");
        res.status(200).send("Email sent and tracked successfully");
      });
    }
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

// app.post("/signup", async (req, resp) => {
//   const { username, password, email, tax_id, company_name, phone_number } =
//     req.body;

//   try {
//     // SQL query with placeholders
//     const sql =
//       "INSERT INTO users (`username`, `email`, `password`,`tax_id`,`company_name`,`phone_number`) VALUES (?, ?, ? ,? ,?, ?)";

//     // Values to be inserted into the query
//     const values = [
//       username,
//       email,
//       password,
//       tax_id,
//       company_name,
//       phone_number,
//     ];

//     connection.query(sql, values, (err, result) => {
//       if (err) {
//         console.error("Error executing MySQL query:", err);
//         return resp.status(500).send("Error during signup");
//       }

//       // Fetch the newly inserted user data
//       const userId = result.insertId;
//       const userData = {
//         userId: userId,
//         username: username,
//         email: email,
//         password:password,
//         tax_id: tax_id,
//         company_name: company_name,
//         phone_number: phone_number,
//       };

//       return resp.json(userData);
//     });
//   } catch (error) {
//     console.error("Error hashing password:", error);
//     return resp.status(500).send("Error during signup");
//   }
// });

// app.post("/login", async (req, resp) => {
//   const { username, password } = req.body;

//   try {
//     // SQL query to retrieve user data based on the username
//     const sql = "SELECT * FROM users WHERE username = ?";
//     const values = [username];

//     connection.query(sql, values, async (err, results) => {
//       if (err) {
//         console.error("Error executing MySQL query:", err);
//         return resp.status(500).send("Error during login");
//       }

//       // Check if the user with the provided username exists
//       if (results.length === 0) {
//         return resp.status(401).send("Invalid username or password");
//       }

//       const user = results[0];

//       // Compare the provided password with the hashed password in the database
//       const passwordMatch = await bcrypt.compare(password, user.password);

//       if (!passwordMatch) {
//         return resp.status(401).send("Invalid username or password");
//       }

//       // If the password matches, return user data excluding the password
//       const userData = {
//         userId: user.id,
//         username: user.username,
//         email: user.email,
//         tax_id: user.tax_id,
//         company_name: user.company_name,
//         phone_number: user.phone_number,
//       };

//       return resp.json(userData);
//     });
//   } catch (error) {
//     console.error("Error during login:", error);
//     return resp.status(500).send("Error during login");
//   }
// });

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
