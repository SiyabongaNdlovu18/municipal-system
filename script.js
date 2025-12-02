// =======================
// Helper Function: Fetch JSON
// =======================
async function fetchJSON(url, options = {}) {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error("Network error");
    return await res.json();
}

// =======================
// 1️⃣ Submit New Issue
// =======================
async function submitIssue() {
    const data = {
        citizen_name: document.getElementById("name").value,
        location: document.getElementById("location").value,
        issue_type: document.getElementById("issue_type").value,
        description: document.getElementById("description").value,
        status: "Pending"
    };

    try {
        const result = await fetchJSON("/issues", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        document.getElementById("msg").innerText = "Issue submitted successfully!";
        document.getElementById("issueForm").reset();
    } catch (err) {
        alert("Error submitting issue: " + err.message);
    }
}

// =======================
// 2️⃣ Load All Issues
// =======================
async function loadIssues(tableId = "issuesTable") {
    try {
        const data = await fetchJSON("/issues");
        const table = document.getElementById(tableId);
        if (!table) return;

        table.innerHTML = `
            <tr>
                <th>ID</th>
                <th>Citizen</th>
                <th>Type</th>
                <th>Description</th>
                <th>Location</th>
                <th>Status</th>
                <th>Worker</th>
                <th>Actions</th>
            </tr>
        `;

        data.forEach(issue => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${issue.id}</td>
                <td>${issue.citizen_name}</td>
                <td>${issue.issue_type}</td>
                <td>${issue.description}</td>
                <td><a href="${issue.location}" target="_blank">View Map</a></td>
                <td>${issue.status}</td>
                <td>${issue.assigned_worker || "-"}</td>
                <td>
                    <a href="editIssue.html?id=${issue.id}">Edit</a>
                    <button onclick="deleteIssue(${issue.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    } catch (err) {
        alert("Error loading issues: " + err.message);
    }
}

// =======================
// 3️⃣ Delete Issue
// =======================
async function deleteIssue(id) {
    if (!confirm("Are you sure you want to delete this issue?")) return;
    try {
        await fetchJSON(`/deleteIssue/${id}`, { method: "DELETE" });
        alert("Issue deleted successfully");
        loadIssues(); // refresh table
    } catch (err) {
        alert("Error deleting issue: " + err.message);
    }
}

// =======================
// 4️⃣ Edit Issue (Load & Update)
// =======================
async function loadIssueForEdit() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (!id) return;

    try {
        const data = await fetchJSON("/issues");
        const issue = data.find(i => i.id == id);
        if (!issue) return;

        const form = document.getElementById("editForm");
        form.citizen_name.value = issue.citizen_name;
        form.issue_type.value = issue.issue_type;
        form.description.value = issue.description;
        form.location.value = issue.location;
        form.assigned_worker.value = issue.assigned_worker || "";
        form.due_date.value = issue.due_date ? issue.due_date.split("T")[0] : "";
        form.status.value = issue.status;
    } catch (err) {
        alert("Error loading issue: " + err.message);
    }
}

async function updateIssue(e) {
    e.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (!id) return;

    const data = Object.fromEntries(new FormData(e.target).entries());

    try {
        await fetchJSON(`/updateIssue/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        alert("Issue updated successfully!");
        window.location.href = "viewIssues.html";
    } catch (err) {
        alert("Error updating issue: " + err.message);
    }
}

// =======================
// 5️⃣ Get Current Location
// =======================
function fillCurrentLocation(inputId = "location") {
    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }
    navigator.geolocation.getCurrentPosition(
        pos => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            document.getElementById(inputId).value = `https://www.google.com/maps?q=${lat},${lng}`;
        },
        () => alert("Could not get location. Allow access.")
    );
}

// =======================
// 6️⃣ Assign Worker
// =======================
async function assignWorker(issueId, workerName) {
    try {
        await fetchJSON(`/assignWorker/${issueId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ assigned_worker: workerName })
        });
        alert("Worker assigned successfully!");
        loadIssues();
    } catch (err) {
        alert("Error assigning worker: " + err.message);
    }
}

// =======================
// 7️⃣ Mark Issue Status
// =======================
async function markIssueStatus(issueId, status) {
    try {
        await fetchJSON(`/updateIssue/${issueId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status })
        });
        alert("Status updated!");
        loadIssues();
    } catch (err) {
        alert("Error updating status: " + err.message);
    }
}
