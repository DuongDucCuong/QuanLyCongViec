let activeReviewTaskId = null;

document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_ADMIN") {
        return;
    }
    loadDashboardStats();
    loadPendingReports();
    loadAllTasks();
});

function loadDashboardStats() {
    fetchWithAuth("/api/admin/teams")
        .then(res => res.json())
        .then(teams => {
            document.getElementById("statTeams").innerText = teams.length;
        });

    fetchWithAuth("/api/admin/tasks")
        .then(res => res.json())
        .then(tasks => {
            document.getElementById("statTasks").innerText = tasks.length;
            const pending = tasks.filter(t => t.status === "SUBMITTED").length;
            document.getElementById("statPendingApproval").innerText = pending;
        });
}

function loadPendingReports() {
    fetchWithAuth("/api/admin/tasks")
        .then(res => res.json())
        .then(tasks => {
            const pendingTasks = tasks.filter(t => t.status === "SUBMITTED");
            const tbody = document.getElementById("pendingTasksTable");
            tbody.innerHTML = "";

            if (pendingTasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Không có báo cáo nào cần duyệt.</td></tr>`;
                return;
            }

            pendingTasks.forEach(t => {
                const teamName = t.assignedTeam ? t.assignedTeam.name : "N/A";
                const leaderName = t.assignedTo ? t.assignedTo.username : "N/A";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td>${t.title}</td>
                    <td><span class="badge badge-doing">${teamName}</span></td>
                    <td>${leaderName}</td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary); max-width: 200px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${t.reportContent}">${t.reportContent}</span></td>
                    <td>
                        <button onclick="openReviewModal(${t.id}, '${t.title.replace(/'/g, "\\'")}', '${t.reportContent.replace(/'/g, "\\'")}')" class="btn btn-primary btn-sm">Xem & Phê duyệt</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

function loadAllTasks() {
    fetchWithAuth("/api/admin/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("allTasksTable");
            tbody.innerHTML = "";

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Chưa có công việc nào được giao.</td></tr>`;
                return;
            }

            tasks.forEach(t => {
                const teamName = t.assignedTeam ? t.assignedTeam.name : "N/A";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td>${t.title}</td>
                    <td>${teamName}</td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                    <td>
                        <button onclick="openSubtasksModal(${t.id})" class="btn btn-secondary btn-sm">🔍 Xem việc con</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

function openReviewModal(taskId, title, report) {
    activeReviewTaskId = taskId;
    document.getElementById("modalTaskTitle").value = title;
    document.getElementById("modalReportContent").value = report;
    document.getElementById("modalFeedback").value = "";
    document.getElementById("reviewModal").classList.add("open");
}

function closeReviewModal() {
    document.getElementById("reviewModal").classList.remove("open");
}

function submitReview(isApprove) {
    const feedback = document.getElementById("modalFeedback").value.trim();
    const url = `/api/admin/tasks/${activeReviewTaskId}/${isApprove ? 'approve' : 'reject'}`;

    fetchWithAuth(url, {
        method: "PUT",
        body: JSON.stringify({ feedback })
    })
        .then(async res => {
            if (res.ok) {
                showAlert("success", isApprove ? "Đã duyệt hoàn thành công việc!" : "Đã từ chối báo cáo công việc!");
                closeReviewModal();
                loadDashboardStats();
                loadPendingReports();
                loadAllTasks();
            } else {
                const err = await res.text();
                showAlert("error", "Lỗi: " + err);
            }
        });
}

function openSubtasksModal(parentId) {
    fetchWithAuth(`/api/admin/tasks/${parentId}/subtasks`)
        .then(res => res.json())
        .then(subtasks => {
            const tbody = document.getElementById("subtasksTableBody");
            tbody.innerHTML = "";

            if (subtasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 1.5rem;">Trưởng nhóm chưa phân rã việc con cho nhân viên.</td></tr>`;
            } else {
                subtasks.forEach(s => {
                    const employeeName = s.assignedTo ? s.assignedTo.username : "Chưa nhận";
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>${employeeName}</strong></td>
                        <td>${s.title}</td>
                        <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
                        <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${s.reportContent || "<em>Không có</em>"}</span></td>
                    `;
                    tbody.appendChild(tr);
                });
            }
            document.getElementById("subtasksModal").classList.add("open");
        });
}

function closeSubtasksModal() {
    document.getElementById("subtasksModal").classList.remove("open");
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
