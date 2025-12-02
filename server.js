const express = require('express');
const app = express();
const db = require('./db');
app.use(express.json());
app.use(express.static('.'));

app.listen(3000,()=>console.log("Server Running on http://localhost:3000"));

// LOGIN
app.post('/login',(req,res)=>{
  db.query(
    "SELECT * FROM workers WHERE username=? AND password=? AND role=?",
    [req.body.username, req.body.password, req.body.role],
    (err,result)=>{
      if(err) return res.json({success:false, message:err.message});
      if(result.length>0) res.json({success:true, ...result[0], message:"Login Successful"});
      else res.json({success:false, message:"Invalid Credentials"});
    });
});

// ADD ISSUE
app.post('/addIssue',(req,res)=>{
  db.query("INSERT INTO issues SET ?", req.body, (err)=>{
    if(err) return res.json({message:err.message});
    res.json({message:"Issue Submitted!"});
  });
});

// VIEW ISSUES BY CITIZEN
app.get('/issuesByCitizen/:n',(req,res)=>{
  db.query("SELECT * FROM issues WHERE citizen_name=?", [req.params.n], (err,result)=>{
    if(err) return res.json([]);
    res.json(result);
  });
});

// VIEW ALL ISSUES
app.get('/issues',(req,res)=>{
  db.query("SELECT * FROM issues", (err,result)=>{
    if(err) return res.json([]);
    res.json(result);
  });
});

// WORKERS LIST
app.get('/workers',(req,res)=>{
  db.query("SELECT username FROM workers WHERE role='worker'", (err,result)=>{
    if(err) return res.json([]);
    res.json(result);
  });
});

// ASSIGN WORKER
app.put('/assign/:id',(req,res)=>{
  db.query("UPDATE issues SET assigned_worker=? WHERE id=?", [req.body.worker, req.params.id], (err)=>{
    if(err) return res.json({message:err.message});
    res.json({message:"Assigned"});
  });
});

// UPDATE ISSUE STATUS
app.put('/updateIssue/:id',(req,res)=>{
  db.query("UPDATE issues SET status=? WHERE id=?", [req.body.status, req.params.id], (err)=>{
    if(err) return res.json({message:err.message});
    res.json({message:"Updated"});
  });
});

// DELETE ISSUE
app.delete('/deleteIssue/:id',(req,res)=>{
  db.query("DELETE FROM issues WHERE id=?", [req.params.id], (err)=>{
    if(err) return res.json({message:err.message});
    res.json({message:"Deleted"});
  });
});
