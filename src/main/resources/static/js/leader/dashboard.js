let activeSubtaskId = null;

document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_LEADER") {
        return;
    }
    loadLeaderDashboardStats();
    loadLeaderBigTasks();
    loadMemberPendingReports();
});

function loadLeaderDashboardStats() {
    fetchWithAuth("/api/leader/teams")
        .then(res => res.json())
        .then(team => {
            if (team) {
                document.getElementById("statMembers").innerText = team.members ? team.members.length : 0;
            }
        });

    fetchWithAuth("/api/leader/tasks")
        .then(res => res.json())
        .then(tasks => {
            document.getElementById("statTeamTasks").innerText = tasks.length;

            let pendingSubtaskCount = 0;
            let promises = tasks.map(t => {
                return fetchWithAuth(`/api/leader/tasks/${t.id}/subtasks`)
                    .then(res => res.json())
                    .then(subtasks => {
                        pendingSubtaskCount += subtasks.filter(s => s.status === "SUBMITTED").length;
                    });
            });

            Promise.all(promises).then(() => {
                document.getElementById("statPendingReviews").innerText = pendingSubtaskCount;
            });
        });
}

function loadLeaderBigTasks() {
    fetchWithAuth("/api/leader/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("leaderBigTasksTable");
            tbody.innerHTML = "";

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nhóm của bạn chưa được giao việc lớn nào.</td></tr>`;
                return;
            }

            tasks.forEach(t => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td><strong>${t.title}</strong></td>
                    <td>${t.description || "N/A"}</td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                    <td><span style="font-size: 0.85rem; color: var(--text-secondary);">${t.feedback || "<em>Không có</em>"}</span></td>
                `;
                tbody.appendChild(tr);
            });
        });
}

function loadMemberPendingReports() {
    fetchWithAuth("/api/leader/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("memberPendingReportsTable");
            tbody.innerHTML = "";

            let hasPending = false;
            let promises = tasks.map(t => {
                return fetchWithAuth(`/api/leader/tasks/${t.id}/subtasks`)
                    .then(res => res.json())
                    .then(subtasks => {
                        const pending = subtasks.filter(s => s.status === "SUBMITTED");
                        pending.forEach(s => {
                            hasPending = true;
                            const tr = document.createElement("tr");
                            tr.innerHTML = `
                                <td><strong>${s.assignedTo ? s.assignedTo.username : "N/A"}</strong></td>
                                <td>${s.title}</td>
                                <td><span class="badge badge-doing">${t.title}</span></td>
                                <td><span style="font-size: 0.85rem; color: var(--text-secondary); max-width: 200px; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.reportContent}">${s.reportContent}</span></td>
                                <td>
                                    <button onclick="openReviewSubtaskModal(${s.id}, '${s.title.replace(/'/g, "\\'")}', '${s.reportContent.replace(/'/g, "\\'")}')" class="btn btn-primary btn-sm">Xem & Phê duyệt</button>
                                </td>
                            `;
                            tbody.appendChild(tr);
                        });
                    });
            });

            Promise.all(promises).then(() => {
                if (!hasPending) {
                    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Không có báo cáo nhân viên nào chờ duyệt.</td></tr>`;
                }
            });
        });
}

function openReviewSubtaskModal(subtaskId, title, report) {
    activeSubtaskId = subtaskId;
    document.getElementById("modalSubtaskTitle").value = title;
    document.getElementById("modalSubtaskReport").value = report;
    document.getElementById("modalSubtaskFeedback").value = "";
    document.getElementById("reviewSubtaskModal").classList.add("open");
}

function closeReviewSubtaskModal() {
    document.getElementById("reviewSubtaskModal").classList.remove("open");
}

function submitSubtaskReview(isApprove) {
    const feedback = document.getElementById("modalSubtaskFeedback").value.trim();
    const url = `/api/leader/tasks/${activeSubtaskId}/${isApprove ? 'approve' : 'reject'}`;

    fetchWithAuth(url, {
        method: "PUT",
        body: JSON.stringify({ feedback })
    })
        .then(async res => {
            if (res.ok) {
                showAlert("success", isApprove ? "Đã duyệt hoàn thành việc con!" : "Đã từ chối và yêu cầu sửa đổi!");
                closeReviewSubtaskModal();
                loadLeaderDashboardStats();
                loadLeaderBigTasks();
                loadMemberPendingReports();
            } else {
                const err = await res.text();
                showAlert("error", "Lỗi: " + err);
            }
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
