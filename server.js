// server.js (replace your existing file)
require('dotenv').config();

const express = require('express');
const app = express();
const db = require('./db');

app.use(express.json());
app.use(express.static('.'));

// Simple logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.url);
  next();
});



app.post("/issues", (req, res) => {
  const { fullname, location, issueType, description } = req.body;

  const sql = `
    INSERT INTO issues (fullname, location, issue_type, description, status)
    VALUES (?, ?, ?, ?, 'Pending')
  `;

  db.query(sql, [fullname, location, issueType, description], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Issue submitted successfully" });
  });
});

// LOGIN
app.post('/login', (req, res) => {
  const { username, password, role } = req.body;
  db.query(
    "SELECT * FROM workers WHERE username=? AND password=? AND role=?",
    [username, password, role],
    (err, result) => {
      if (err) return res.json({ success: false, message: err.message });
      if (result.length > 0) return res.json({ success: true, ...result[0], message: "Login Successful" });
      res.json({ success: false, message: "Invalid Credentials" });
    }
  );
});

/* -----------------------
   Issues (CRUD & helpers)
   ----------------------- */

// Create new issue (both /addIssue and /issues POST accepted)
app.post(['/addIssue', '/issues'], (req, res) => {
  // Ensure default fields if missing
  const payload = {
    citizen_name: req.body.citizen_name || req.body.name || "",
    issue_type: req.body.issue_type || "",
    description: req.body.description || "",
    location: req.body.location || "",
    status: req.body.status || "Pending",
    assigned_worker: req.body.assigned_worker || null,
    due_date: req.body.due_date || null,
    feedback_admin: req.body.feedback_admin || null
  };
  db.query("INSERT INTO issues SET ?", payload, (err, result) => {
    if (err) return res.json({ message: err.message });
    res.json({ message: "Issue Submitted!", id: result.insertId });
  });
});

// Get all issues
app.get('/issues', (req, res) => {
  db.query("SELECT * FROM issues ORDER BY id DESC", (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

// Get issues by citizen name
app.get('/issuesByCitizen/:n', (req, res) => {
  db.query(
    "SELECT * FROM issues WHERE LOWER(citizen_name) = LOWER(?)",
    [req.params.n],
    (err, result) => {
      if (err) return res.json([]);
      res.json(result);
    }
  );
});

// Get issues assigned to a worker (used in workers dashboard)
app.get('/issuesByWorker/:username', (req, res) => {
  db.query("SELECT * FROM issues WHERE assigned_worker=?", [req.params.username], (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});


// Update an issue (accepts many fields)
app.put(['/updateIssue/:id', '/issues/:id'], (req, res) => {
  // Build dynamic SET clause from body
  const allowed = ['citizen_name','issue_type','description','location','assigned_worker','status','due_date','feedback_admin'];
  const updates = [];
  const values = [];
  for (const k of allowed) {
    if (req.body[k] !== undefined) {
      updates.push(`${k} = ?`);
      values.push(req.body[k]);
    }
  }
  if (updates.length === 0) return res.json({ message: "No updatable fields provided" });
  values.push(req.params.id);
  const sql = `UPDATE issues SET ${updates.join(', ')} WHERE id = ?`;
  db.query(sql, values, (err) => {
    if (err) return res.json({ message: err.message });
    res.json({ message: "Issue Updated" });
  });
});

// Assign worker (alias endpoint client might call)
app.put(['/assign/:id','/assignWorker/:id'], (req, res) => {
  const worker = req.body.worker || req.body.assigned_worker || req.body.workerName || null;
  db.query("UPDATE issues SET assigned_worker=? WHERE id=?", [worker, req.params.id], (err) => {
    if (err) return res.json({ message: err.message });
    res.json({ message: "Assigned" });
  });
});
// VIEW ISSUES BY WORKER
app.get('/issuesByWorker/:name', (req, res) => {
  db.query(
    "SELECT * FROM issues WHERE assigned_worker = ?",
    [req.params.name],
    (err, result) => {
      if(err) return res.json([]);
      res.json(result);
    }
  );
});

// Delete issue
app.delete(['/deleteIssue/:id','/issues/:id'], (req, res) => {
  db.query("DELETE FROM issues WHERE id=?", [req.params.id], (err) => {
    if (err) return res.json({ message: err.message });
    res.json({ message: "Deleted" });
  });
});

/* -----------------------
   Workers (admin management)
   ----------------------- */

// Create worker
app.post('/workers', (req, res) => {
  const payload = {
    username: req.body.username,
    password: req.body.password,
    role: req.body.role || 'worker'
  };
  db.query("INSERT INTO workers SET ?", payload, (err, result) => {
    if (err) return res.json({ message: err.message });
    res.json({ message: "Worker created", id: result.insertId });
  });
});

// Update worker
app.put('/workers/:username', (req, res) => {
  const updates = [];
  const values = [];
  if (req.body.password) { updates.push("password=?"); values.push(req.body.password); }
  if (req.body.role) { updates.push("role=?"); values.push(req.body.role); }
  if (updates.length === 0) return res.json({ message: "No updates provided" });
  values.push(req.params.username);
  db.query(`UPDATE workers SET ${updates.join(', ')} WHERE username=?`, values, (err) => {
    if (err) return res.json({ message: err.message });
    res.json({ message: "Worker updated" });
  });
});

// Delete worker
app.delete('/workers/:username', (req, res) => {
  db.query("DELETE FROM workers WHERE username=?", [req.params.username], (err) => {
    if (err) return res.json({ message: err.message });
    res.json({ message: "Worker deleted" });
  });
});

// List workers (username only) - used by admin dropdown
app.get('/workers', (req, res) => {
  db.query("SELECT username FROM workers WHERE role='worker'", (err, result) => {
    if (err) return res.json([]);
    res.json(result);
  });
});

/* -----------------------
   Start server
   ----------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server Running on http://localhost:${PORT}`));
