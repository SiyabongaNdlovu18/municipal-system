const express = require("express");
const dotenv = require("dotenv");
const path = require("path");
const pool = require("./db");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// Home
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// =======================
// ADD ISSUE
// =======================
app.post("/addIssue", async (req, res) => {
  try {
    const {
      citizen_name,
      issue_type,
      description,
      location
    } = req.body;

    await pool.query(
      `INSERT INTO issues 
      (citizen_name, issue_type, description, location, status)
      VALUES ($1, $2, $3, $4, 'Pending')`,
      [citizen_name, issue_type, description, location]
    );

    res.redirect("/issues");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding issue");
  }
});

// =======================
// VIEW ISSUES
// =======================
app.get("/issues", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM issues ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching issues");
  }
});

// =======================
// UPDATE ISSUE STATUS
// =======================
app.post("/updateIssue", async (req, res) => {
  try {
    const { id, status } = req.body;

    await pool.query(
      "UPDATE issues SET status = $1 WHERE id = $2",
      [status, id]
    );

    res.redirect("/issues");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating issue");
  }
});

// =======================
// DELETE ISSUE
// =======================
app.post("/deleteIssue", async (req, res) => {
  try {
    const { id } = req.body;

    await pool.query(
      "DELETE FROM issues WHERE id = $1",
      [id]
    );

    res.redirect("/issues");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting issue");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
