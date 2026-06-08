// Gọi khi trang load
document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname;

    if (path.includes("/admin/dashboard")) {
        loadDashboardStats();
        loadPendingReports();
        loadAllTasks();
    } else if (path.includes("/admin/team")) {
        loadTeams();
        loadAvailableLeadersDropdown();
    } else if (path.includes("/admin/task")) {
        loadBossTasks();
        loadTeamsDropdown();
    }
});

// ==========================================
// 1. TẢI DỮ LIỆU ĐỔ VÀO VIEW
// ==========================================

// Tải số liệu thống kê Dashboard
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

// Tải danh sách báo cáo chờ duyệt
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

// Tải toàn bộ công việc đang chạy
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

// Tải danh sách nhóm (admin/team.html)
function loadTeams() {
    fetchWithAuth("/api/admin/teams")
        .then(res => res.json())
        .then(teams => {
            const tbody = document.getElementById("teamsTableBody");
            tbody.innerHTML = "";

            if (teams.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Chưa có nhóm nào. Hãy bấm nút tạo nhóm mới ở trên.</td></tr>`;
                return;
            }

            teams.forEach(t => {
                const leaderName = t.leader ? t.leader.username : "<em>Chưa có</em>";
                const membersCount = t.members ? t.members.length : 0;
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td>${t.name}</td>
                    <td>${leaderName}</td>
                    <td>${membersCount} nhân viên</td>
                    <td>
                        <button onclick="openAssignLeaderModal(${t.id}, '${t.name.replace(/'/g, "\\'")}')" class="btn btn-secondary btn-sm">👑 Bổ nhiệm Trưởng nhóm</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// Tải danh sách công việc của sếp (admin/task.html)
function loadBossTasks() {
    fetchWithAuth("/api/admin/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("tasksTableBody");
            tbody.innerHTML = "";

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Chưa giao dự án/công việc nào.</td></tr>`;
                return;
            }

            tasks.forEach(t => {
                const teamName = t.assignedTeam ? t.assignedTeam.name : "N/A";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td><strong>${t.title}</strong></td>
                    <td>${t.description || "N/A"}</td>
                    <td><span class="badge badge-doing">${teamName}</span></td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// ==========================================
// 2. DROPDOWNS & MODAL HANDLERS
// ==========================================

function loadAvailableLeadersDropdown() {
    fetchWithAuth("/api/admin/teams/available-leaders")
        .then(res => res.json())
        .then(users => {
            const selectCreate = document.getElementById("teamLeaderSelect");
            const selectAssign = document.getElementById("leaderSelect");
            
            // Xóa cũ, giữ option mặc định
            selectCreate.innerHTML = `<option value="">-- Chọn trưởng nhóm --</option>`;
            selectAssign.innerHTML = `<option value="">-- Chọn trưởng nhóm mới --</option>`;

            users.forEach(u => {
                const optionHtml = `<option value="${u.username}">${u.username} (${u.role === "ROLE_LEADER" ? "Trưởng nhóm" : "Nhân viên"})</option>`;
                selectCreate.insertAdjacentHTML("beforeend", optionHtml);
                selectAssign.insertAdjacentHTML("beforeend", optionHtml);
            });
        });
}

function loadTeamsDropdown() {
    fetchWithAuth("/api/admin/teams")
        .then(res => res.json())
        .then(teams => {
            const select = document.getElementById("taskTeamSelect");
            select.innerHTML = `<option value="">-- Chọn nhóm nhận việc --</option>`;
            teams.forEach(t => {
                if (t.leader) {
                    select.insertAdjacentHTML("beforeend", `<option value="${t.id}">${t.name} (Leader: ${t.leader.username})</option>`);
                } else {
                    select.insertAdjacentHTML("beforeend", `<option value="${t.id}">${t.name} (Chưa có Leader)</option>`);
                }
            });
        });
}

// Tạo Nhóm mới
function openCreateTeamModal() {
    loadAvailableLeadersDropdown();
    document.getElementById("createTeamModal").classList.add("open");
}
function closeCreateTeamModal() {
    document.getElementById("createTeamModal").classList.remove("open");
}
function submitCreateTeam() {
    const name = document.getElementById("teamName").value.trim();
    const leaderUsername = document.getElementById("teamLeaderSelect").value;

    if (!name) {
        showAlert("error", "Vui lòng nhập tên nhóm!");
        return;
    }

    fetchWithAuth("/api/admin/teams", {
        method: "POST",
        body: JSON.stringify({ name, leaderUsername })
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Tạo nhóm thành công!");
            closeCreateTeamModal();
            loadTeams();
        } else {
            const err = await res.text();
            showAlert("error", "Lỗi: " + err);
        }
    });
}

// Bổ nhiệm Leader
function openAssignLeaderModal(teamId, teamName) {
    document.getElementById("assignTeamId").value = teamId;
    document.getElementById("assignTeamName").value = teamName;
    loadAvailableLeadersDropdown();
    document.getElementById("assignLeaderModal").classList.add("open");
}
function closeAssignLeaderModal() {
    document.getElementById("assignLeaderModal").classList.remove("open");
}
function submitAssignLeader() {
    const teamId = document.getElementById("assignTeamId").value;
    const leaderUsername = document.getElementById("leaderSelect").value;

    if (!leaderUsername) {
        showAlert("error", "Vui lòng chọn Trưởng nhóm mới!");
        return;
    }

    fetchWithAuth(`/api/admin/teams/${teamId}/assign-leader`, {
        method: "PUT",
        body: JSON.stringify({ leaderUsername })
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Bổ nhiệm Trưởng nhóm mới thành công!");
            closeAssignLeaderModal();
            loadTeams();
        } else {
            const err = await res.text();
            showAlert("error", "Lỗi: " + err);
        }
    });
}

// Giao việc lớn
function openCreateTaskModal() {
    loadTeamsDropdown();
    document.getElementById("createTaskModal").classList.add("open");
}
function closeCreateTaskModal() {
    document.getElementById("createTaskModal").classList.remove("open");
}
function submitCreateTask() {
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const teamId = document.getElementById("taskTeamSelect").value;

    if (!title || !teamId) {
        showAlert("error", "Vui lòng điền đủ thông tin tiêu đề và chọn nhóm!");
        return;
    }

    fetchWithAuth("/api/admin/tasks", {
        method: "POST",
        body: JSON.stringify({ title, description, teamId })
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Giao việc thành công!");
            closeCreateTaskModal();
            loadBossTasks();
        } else {
            const err = await res.text();
            showAlert("error", "Lỗi: " + err);
        }
    });
}

// Duyệt Báo cáo
let activeReviewTaskId = null;
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

// Xem việc con (Subtasks)
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

// Tiện ích hiển thị Alert
function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;
    
    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
