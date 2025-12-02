const mysql = require('mysql2');

const db = mysql.createConnection({
  host:'localhost',
  user:'root',
  password:'Siyabonga56!',
  database:'municipal_db'
});

db.connect(()=>console.log("Database Connected"));
module.exports = db;
