document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = Object.fromEntries(new FormData(e.target).entries());
    const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
    });
    const data = await res.json();
    if(data.success){
        sessionStorage.setItem("username", data.username);
        if(data.role === "worker") window.location.href = "workerDashboard.html";
        else window.location.href = "adminDashboard.html";
    } else {
        document.getElementById("loginMsg").innerText = data.message;
    }
});
