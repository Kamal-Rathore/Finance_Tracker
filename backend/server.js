const express = require("express");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL Database Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "123456",  // Change to your MySQL password
  database: process.env.DB_NAME || "finance_tracker",
});

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL Database");
});

// 🟢 SIGNUP ROUTE (Register a new user)
app.post("/signup", async (req, res) => {
  const { full_name, email, mobile, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Encrypt password

    db.query(
      "INSERT INTO users (full_name, email, mobile, password) VALUES (?, ?, ?, ?)",
      [full_name, email, mobile, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: "User already exists" });

        res.json({ message: "User registered successfully!" });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔵 LOGIN ROUTE (Authenticate user)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });

    if (results.length === 0) return res.status(401).json({ message: "User not found" });

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) return res.status(401).json({ message: "Invalid credentials" });

    res.json({ message: "Login successful", user });
  });
});

// 🟠 GET ALL TRANSACTIONS
app.get("/transactions", (req, res) => {
  db.query("SELECT * FROM transactions", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
});

// 🔴 ADD A NEW TRANSACTION
app.post("/transactions", (req, res) => {
  const { description, amount, type } = req.body;
  const sql = "INSERT INTO transactions (description, amount, type) VALUES (?, ?, ?)";
  db.query(sql, [description, amount, type], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Transaction added", id: result.insertId });
  });
});

// ❌ DELETE A TRANSACTION
app.delete("/transactions/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM transactions WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).json(err);
    res.json({ message: "Transaction deleted" });
  });
});

app.post("/support", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const sql = "INSERT INTO support_requests (name, email, message) VALUES (?, ?, ?)";
  db.query(sql, [name, email, message], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error." });

    res.json({ message: "Support request submitted successfully!" });
  });
});



// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
