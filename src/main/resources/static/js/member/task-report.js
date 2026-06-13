document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_USER") {
        return;
    }
    loadMemberTaskHistory();
});

function loadMemberTaskHistory() {
    fetchWithAuth("/api/member/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("memberTaskHistoryTable");
            tbody.innerHTML = "";

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Bạn chưa có lịch sử công việc nào.</td></tr>`;
                return;
            }

            tasks.forEach(t => {
                const report = t.reportContent || "<em>Chưa gửi báo cáo</em>";
                const feedback = t.feedback || "<em>Chưa có nhận xét</em>";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td><strong>${t.title}</strong></td>
                    <td>${report}</td>
                    <td><span style="color: var(--primary); font-weight: 500;">${feedback}</span></td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        });
}

function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
