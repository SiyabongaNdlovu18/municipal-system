const PDFDocument = require('pdfkit');
const fs = require('fs');
const db = require('./db');

function generateReport(res){
    const doc = new PDFDocument();
    const filename = "monthly_report.pdf";
    doc.pipe(fs.createWriteStream(filename));

    doc.fontSize(20).text("Monthly Municipal Issues Report", {align: "center"});
    doc.moveDown();

    db.query("SELECT * FROM issues", (err, rows)=>{
        if(err) throw err;
        rows.forEach(issue=>{
            doc.fontSize(12).text(
                `ID: ${issue.id} | Citizen: ${issue.citizen_name} | Type: ${issue.issue_type} | Status: ${issue.status} | Location: ${issue.location} | Worker: ${issue.assigned_worker} | Due: ${issue.due_date}`
            );
        });
        doc.end();
        res.download(filename);
    });
}

module.exports = generateReport;
