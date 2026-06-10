let isEditMode = false;

// 1. TỰ ĐỘNG CHẠY KHI TẢI TRANG
// Tùy thuộc vào đường dẫn URL hiện tại của Admin, code sẽ gọi đúng hàm tải dữ liệu
document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname;

    if (path.includes("/admin/dashboard")) {
        loadDashboardStats();    // Tải số liệu tổng quan
        loadPendingReports();    // Tải danh sách báo cáo chờ duyệt
        loadAllTasks();          // Tải toàn bộ công việc đang chạy
    } else if (path.includes("/admin/team")) {
        loadTeams();                     // Tải danh sách các nhóm
        loadAvailableLeadersDropdown();  // Tải danh sách Trưởng nhóm để chuẩn bị gán
    } else if (path.includes("/admin/task")) {
        loadBossTasks();         // Tải danh sách công việc lớn kèm bộ lọc
        loadTeamsDropdown();     // Tải danh sách nhóm đưa vào Form giao việc
    }
});

// =========================================================================
// SECTION A: LOGIC CHO TRANG DASHBOARD (TỔNG QUAN HỆ THỐNG)
// =========================================================================

// Tải số liệu thống kê đổ vào các thẻ Card ở trang chủ Admin
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

// Tải danh sách báo cáo mà các nhóm nộp lên chờ duyệt
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

// Tải danh sách tất cả các công việc trong hệ thống
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

// =========================================================================
// SECTION B: LOGIC CHO TRANG QUẢN LÝ NHÓM (TEAM) - CODE BỊ THIẾU CỦA BẠN NẰM Ở ĐÂY
// =========================================================================

// Tải danh sách nhóm hiển thị lên bảng
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

// Tải danh sách nhân viên để chọn làm Trưởng nhóm
function loadAvailableLeadersDropdown() {
    fetchWithAuth("/api/admin/teams/available-leaders")
        .then(res => res.json())
        .then(users => {
            const selectCreate = document.getElementById("teamLeaderSelect");
            const selectAssign = document.getElementById("leaderSelect");

            selectCreate.innerHTML = `<option value="">-- Chọn trưởng nhóm --</option>`;
            selectAssign.innerHTML = `<option value="">-- Chọn trưởng nhóm mới --</option>`;

            users.forEach(u => {
                const optionHtml = `<option value="${u.username}">${u.username} (${u.role === "ROLE_LEADER" ? "Trưởng nhóm" : "Nhân viên"})</option>`;
                selectCreate.insertAdjacentHTML("beforeend", optionHtml);
                selectAssign.insertAdjacentHTML("beforeend", optionHtml);
            });
        });
}

// Bật/tắt Modal tạo Nhóm mới
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

// Bật/tắt Modal bổ nhiệm Trưởng nhóm mới cho Nhóm
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

// =========================================================================
// SECTION C: LOGIC CHO TRANG QUẢN LÝ CÔNG VIỆC (TASK)
// =========================================================================

// Tải danh sách nhóm đổ vào ô chọn khi giao việc
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

// Tải danh sách dự án đổ vào ô chọn khi giao việc
function loadProjectsDropdown(selectedProjectId = "") {
    fetchWithAuth("/api/admin/projects")
        .then(res => res.json())
        .then(projects => {
            const select = document.getElementById("taskProjectSelect");
            select.innerHTML = `<option value="">-- Chọn dự án (Không bắt buộc) --</option>`;
            projects.forEach(p => {
                const selected = p.id == selectedProjectId ? "selected" : "";
                select.insertAdjacentHTML("beforeend", `<option value="${p.id}" ${selected}>${p.name} (${p.status})</option>`);
            });
        });
}

// Tải danh sách công việc lớn của Sếp (hỗ trợ tìm kiếm & lọc động)
function loadBossTasks() {
    const projectFilter = document.getElementById("projectFilter");
    if (projectFilter && projectFilter.options.length <= 1) {
        fetchWithAuth("/api/admin/projects")
            .then(res => res.json())
            .then(projects => {
                projects.forEach(p => {
                    projectFilter.insertAdjacentHTML("beforeend", `<option value="${p.id}">${p.name}</option>`);
                });
            });
    }

    fetchWithAuth("/api/admin/tasks")
        .then(res => res.json())
        .then(tasks => {
            const searchQuery = document.getElementById("searchTask").value.trim().toLowerCase();
            const statusFilter = document.getElementById("statusFilter").value;
            const projectFilterVal = document.getElementById("projectFilter").value;

            let filteredTasks = tasks;
            if (searchQuery) {
                filteredTasks = filteredTasks.filter(t =>
                    t.title.toLowerCase().includes(searchQuery) ||
                    (t.description && t.description.toLowerCase().includes(searchQuery))
                );
            }
            if (statusFilter) {
                filteredTasks = filteredTasks.filter(t => t.status === statusFilter);
            }
            if (projectFilterVal) {
                filteredTasks = filteredTasks.filter(t => t.project && t.project.id == projectFilterVal);
            }

            const tbody = document.getElementById("tasksTableBody");
            tbody.innerHTML = "";

            if (filteredTasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Không tìm thấy công việc phù hợp.</td></tr>`;
                return;
            }

            filteredTasks.forEach(t => {
                const teamName = t.assignedTeam ? t.assignedTeam.name : "N/A";
                const projectName = t.project ? t.project.name : '<span style="color:var(--text-muted);">Không thuộc dự án</span>';

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td>
                        <strong style="color:var(--text-primary);">${t.title}</strong>
                        <br><small style="color:var(--text-secondary);">${t.description || "N/A"}</small>
                    </td>
                    <td>${projectName}</td>
                    <td><span class="badge badge-doing">${teamName}</span></td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                    <td class="action-buttons">
                        <button onclick='openEditTaskModal(${JSON.stringify(t)})' class="btn btn-sm btn-warning">Sửa</button>
                        <button onclick="deleteTask(${t.id}, '${t.title.replace(/'/g, "\\'")}')" class="btn btn-sm btn-danger">Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// Bật/tắt Modal tạo công việc lớn
function openCreateTaskModal() {
    isEditMode = false;
    document.getElementById("modalTitle").innerText = "Giao công việc cho Nhóm";
    document.getElementById("btnSubmitTask").innerText = "Giao việc";
    document.getElementById("taskId").value = "";
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDescription").value = "";

    loadTeamsDropdown();
    loadProjectsDropdown();

    document.getElementById("createTaskModal").classList.add("open");
}

// Bật Modal chỉnh sửa công việc lớn
function openEditTaskModal(task) {
    if (task.status === "APPROVED") {
        showAlert("error", "Không thể chỉnh sửa công việc đã hoàn thành!");
        return;
    }

    isEditMode = true;
    document.getElementById("modalTitle").innerText = "Chỉnh sửa công việc lớn";
    document.getElementById("btnSubmitTask").innerText = "Lưu thay đổi";

    document.getElementById("taskId").value = task.id;
    document.getElementById("taskTitle").value = task.title;
    document.getElementById("taskDescription").value = task.description || "";

    loadTeamsDropdown();
    loadProjectsDropdown(task.project ? task.project.id : "");

    setTimeout(() => {
        document.getElementById("taskTeamSelect").value = task.assignedTeam ? task.assignedTeam.id : "";
    }, 200);

    document.getElementById("createTaskModal").classList.add("open");
}

function closeCreateTaskModal() {
    document.getElementById("createTaskModal").classList.remove("open");
}

// Gửi Form Giao việc / Lưu thay đổi việc
function submitCreateTask() {
    const taskId = document.getElementById("taskId").value;
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const teamId = document.getElementById("taskTeamSelect").value;
    const projectId = document.getElementById("taskProjectSelect").value;

    if (!title || !teamId) {
        showAlert("error", "Vui lòng điền đủ thông tin tiêu đề và chọn nhóm nhận việc!");
        return;
    }

    const payload = {
        title,
        description,
        teamId: parseInt(teamId),
        projectId: projectId ? parseInt(projectId) : null
    };

    let url = "/api/admin/tasks";
    let method = "POST";

    if (isEditMode) {
        url += "/" + taskId;
        method = "PUT";
    }

    fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (res.ok) {
                showAlert("success", isEditMode ? "Cập nhật công việc thành công!" : "Giao việc thành công!");
                closeCreateTaskModal();
                loadBossTasks();
            } else {
                const err = await res.text();
                showAlert("error", "Lỗi: " + err);
            }
        });
}

// Xóa công việc lớn
function deleteTask(id, title) {
    if (confirm(`Bạn có chắc muốn xóa công việc lớn "${title}" không? Toàn bộ công việc con thuộc nó cũng sẽ bị xóa.`)) {
        fetchWithAuth(`/api/admin/tasks/${id}`, {
            method: "DELETE"
        })
            .then(async res => {
                if (res.ok) {
                    showAlert("success", "Đã xóa công việc lớn thành công!");
                    loadBossTasks();
                } else {
                    const err = await res.text();
                    showAlert("error", "Không thể xóa: " + err);
                }
            });
    }
}

// Sếp review báo cáo của nhóm nộp lên
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

// Hiển thị việc con (Subtasks) trong Modal của Admin
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

// =========================================================================
// SECTION D: TIỆN ÍCH DÙNG CHUNG
// =========================================================================
function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;

    // Tự động ẩn thông báo sau 3 giây
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}