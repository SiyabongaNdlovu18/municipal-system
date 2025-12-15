// script.js (client-side) - drop into your public folder and include in pages
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const t = await res.text().catch(()=>null);
    throw new Error(t || 'Network error');
  }
  return await res.json();
}

/* ---------- Submit Issue (resident) ---------- */
async function submitIssueFromForm(formId = "issueForm") {
  const form = document.getElementById(formId);
  if (!form) return;

  const data = Object.fromEntries(new FormData(form).entries());

  // If location contains lat,lng, convert to a Google maps link for consistency
  if (data.location && /^[0-9\.\-]+\s*,\s*[0-9\.\-]+$/.test(data.location.trim())) {
    const [lat, lng] = data.location.split(',').map(s => s.trim());
    data.location = `https://www.google.com/maps?q=${lat},${lng}`;
  }

  try {
    const result = await fetchJSON('/addIssue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    document.getElementById("msg") && (document.getElementById("msg").innerText = result.message || "Submitted");
    form.reset();
  } catch (err) {
    alert("Error submitting issue: " + err.message);
  }
}

/* ---------- Get current coordinates and fill input ---------- */
function fillCurrentLocation(inputId = "location") {
  const input = document.getElementById(inputId);
  if (!input) return alert("Location input not found");
  if (!navigator.geolocation) return alert("Geolocation not supported");
  navigator.geolocation.getCurrentPosition(
    pos => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      // store raw coords so server can convert or we can turn into map link
      input.value = `${lat}, ${lng}`;
      // optionally open map in new tab
      // window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    },
    err => {
      alert("Could not get location. Allow browser location access.");
    }
  );
}

/* ---------- Load all issues into a table (admin or generic) ---------- */
async function loadIssues(tableId = "issuesTable") {
  try {
    const data = await fetchJSON('/issues');
    const table = document.getElementById(tableId);
    if (!table) return;
    table.innerHTML = `
      <tr><th>ID</th><th>Citizen</th><th>Type</th><th>Description</th><th>Location</th><th>Worker</th><th>Status</th><th>Assign</th><th>Action</th></tr>
    `;
    const workers = await fetchJSON('/workers');
    const workerOptions = workers.map(w => `<option value="${w.username}">${w.username}</option>`).join('');

    data.forEach(i => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${i.id}</td>
        <td>${i.citizen_name}</td>
        <td>${i.issue_type}</td>
        <td>${i.description}</td>
        <td>${i.location ? `<a href="${i.location}" target="_blank">View Map</a>` : '-'}</td>
        <td>${i.assigned_worker || 'Unassigned'}</td>
        <td>${i.status}</td>
        <td>
          <select onchange="assignWorker(${i.id}, this.value)">
            <option value="">Select Worker</option>
            ${workerOptions}
          </select>
        </td>
        <td>
          <button onclick="deleteIssue(${i.id})">Delete</button>
          <a href="editIssue.html?id=${i.id}">Edit</a>
        </td>
      `;
      table.appendChild(row);
    });

  } catch (err) {
    alert("Error loading issues: " + err.message);
  }
}

/* ---------- Assign worker ---------- */
async function assignWorker(issueId, workerName) {
  if (!workerName) return;
  try {
    await fetchJSON(`/assignWorker/${issueId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assigned_worker: workerName, worker: workerName })
    });
    alert("Worker Assigned!");
    if (typeof loadIssues === 'function') loadIssues();
  } catch (err) {
    alert("Error assigning worker: " + err.message);
  }
}

/* ---------- Delete issue ---------- */
async function deleteIssue(id) {
  if (!confirm("Are you sure?")) return;
  try {
    await fetchJSON(`/deleteIssue/${id}`, { method: "DELETE" });
    alert("Deleted!");
    if (typeof loadIssues === 'function') loadIssues();
  } catch (err) {
    alert("Error deleting: " + err.message);
  }
}

/* ---------- Load single issue for edit page ---------- */
async function loadIssueForEdit() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;
  try {
    const all = await fetchJSON('/issues');
    const issue = all.find(i => i.id == id);
    if (!issue) return;
    const form = document.getElementById('editForm');
    if (!form) return;
    form.citizen_name.value = issue.citizen_name || "";
    form.issue_type.value = issue.issue_type || "";
    form.description.value = issue.description || "";
    form.location.value = issue.location || "";
    form.assigned_worker.value = issue.assigned_worker || "";
    form.due_date.value = issue.due_date ? issue.due_date.split('T')[0] : "";
    form.status.value = issue.status || "Pending";
  } catch (err) {
    alert("Error loading issue: " + err.message);
  }
}

/* ---------- Update issue from edit page ---------- */
async function updateIssue(e) {
  e.preventDefault();
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return alert("Issue id missing");
  const data = Object.fromEntries(new FormData(e.target).entries());
  try {
    await fetchJSON(`/updateIssue/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    alert("Issue updated!");
    window.location.href = "viewIssues.html";
  } catch (err) {
    alert("Error updating issue: " + err.message);
  }
}

/* ---------- Worker pages: load assigned issues ---------- */
async function loadWorkerIssues(username, tableId = "table") {
  try {
    const data = await fetchJSON('/issuesByWorker/' + encodeURIComponent(username));
    const table = document.getElementById(tableId);
    if (!table) return;
    let html = `<tr><th>Issue</th><th>Status</th><th>Actions</th></tr>`;
    data.forEach(i => {
      html += `<tr>
        <td>${i.issue_type}</td>
        <td>${i.status}</td>
        <td>
          <button onclick="markStatus(${i.id}, 'In Progress')">Start</button>
          <button onclick="markStatus(${i.id}, 'Completed')">Done</button>
        </td>
      </tr>`;
    });
    table.innerHTML = html;
  } catch (err) {
    alert("Error: " + err.message);
  }
}

async function markStatus(id, status) {
  try {
    await fetchJSON(`/updateIssue/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    alert("Updated Successfully!");
    if (typeof loadWorkerIssues === 'function') {
      const uname = sessionStorage.getItem("username");
      uname && loadWorkerIssues(uname);
    }
  } catch (err) {
    alert("Error updating status: " + err.message);
  }
}
