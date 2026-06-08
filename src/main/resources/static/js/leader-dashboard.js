// Khởi chạy khi tải trang
document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname;

    if (path.includes("/leader/dashboard")) {
        loadLeaderDashboardStats();
        loadLeaderBigTasks();
        loadMemberPendingReports();
    } else if (path.includes("/leader/team-manage")) {
        loadLeaderTeamInfo();
        loadAvailableMembersDropdown();
    } else if (path.includes("/leader/task-report")) {
        loadLeaderBigTasksSelector();
        loadTeamMembersDropdown();
    }
});

// ==========================================
// 1. TẢI DỮ LIỆU ĐỔ VÀO VIEW
// ==========================================

// Tải số liệu thống kê Dashboard
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
            
            // Đếm số lượng việc con của các task lớn này đang chờ duyệt (SUBMITTED)
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

// Tải danh sách công việc lớn (leader/dashboard.html)
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

// Tải danh sách báo cáo việc con của nhân viên (leader/dashboard.html)
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

// Tải danh sách thành viên nhóm (leader/team-manage.html)
function loadLeaderTeamInfo() {
    fetchWithAuth("/api/leader/teams")
        .then(res => res.json())
        .then(team => {
            if (!team) {
                document.getElementById("teamLabelName").innerText = "Chưa có nhóm";
                document.getElementById("membersTableBody").innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Bạn chưa được gán dẫn dắt nhóm nào.</td></tr>`;
                return;
            }

            document.getElementById("teamLabelName").innerText = team.name;
            const tbody = document.getElementById("membersTableBody");
            tbody.innerHTML = "";

            if (!team.members || team.members.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nhóm chưa có thành viên. Hãy bấm nút thêm thành viên ở trên.</td></tr>`;
                return;
            }

            team.members.forEach(m => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${m.id}</strong></td>
                    <td>${m.username}</td>
                    <td>${m.email || "N/A"}</td>
                    <td>${m.phoneNumber || "N/A"}</td>
                    <td><span class="badge badge-doing">Nhân viên</span></td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// Tải bảng chọn việc lớn (leader/task-report.html)
function loadLeaderBigTasksSelector() {
    fetchWithAuth("/api/leader/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("leaderBigTasksSelectorTable");
            tbody.innerHTML = "";

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Chưa có công việc lớn nào được giao.</td></tr>`;
                return;
            }

            tasks.forEach(t => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td><strong>${t.title}</strong></td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                    <td>
                        <button onclick="selectParentTask(${t.id}, '${t.title.replace(/'/g, "\\'")}')" class="btn btn-secondary btn-sm">🛠️ Quản lý & Giao việc con</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// ==========================================
// 2. PHÂN VIỆC CON & NỘP BÁO CÁO
// ==========================================

let activeParentTaskId = null;

function selectParentTask(parentId, parentTitle) {
    activeParentTaskId = parentId;
    document.getElementById("activeParentTaskTitle").innerText = parentTitle;
    document.getElementById("subtaskManagementSection").style.display = "block";
    loadSubtasksList(parentId);
}

// Tải danh sách việc con
function loadSubtasksList(parentId) {
    fetchWithAuth(`/api/leader/tasks/${parentId}/subtasks`)
        .then(res => res.json())
        .then(subtasks => {
            const tbody = document.getElementById("subtasksTableBody");
            tbody.innerHTML = "";

            if (subtasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary); padding:1.5rem;">Chưa có việc con nào. Hãy bấm nút giao việc con ở trên!</td></tr>`;
                return;
            }

            subtasks.forEach(s => {
                const employeeName = s.assignedTo ? s.assignedTo.username : "Chưa nhận";
                const feedbackText = s.feedback || "<em>Chưa có</em>";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${s.title}</strong></td>
                    <td>${s.description || "Không có mô tả"}</td>
                    <td>${employeeName}</td>
                    <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
                    <td>${feedbackText}</td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// ==========================================
// 3. DROPDOWNS & MODALS
// ==========================================

// Tải danh sách nhân viên tự do
function loadAvailableMembersDropdown() {
    fetchWithAuth("/api/leader/teams/available-members")
        .then(res => res.json())
        .then(users => {
            const select = document.getElementById("memberSelect");
            select.innerHTML = `<option value="">-- Chọn nhân viên --</option>`;
            users.forEach(u => {
                select.insertAdjacentHTML("beforeend", `<option value="${u.username}">${u.username} (${u.email || 'Chưa thiết lập Email'})</option>`);
            });
        });
}

// Tải danh sách nhân viên trong nhóm của Leader
function loadTeamMembersDropdown() {
    fetchWithAuth("/api/leader/teams")
        .then(res => res.json())
        .then(team => {
            const select = document.getElementById("subtaskEmployeeSelect");
            select.innerHTML = `<option value="">-- Chọn nhân viên thực hiện --</option>`;
            if (team && team.members) {
                team.members.forEach(m => {
                    select.insertAdjacentHTML("beforeend", `<option value="${m.username}">${m.username}</option>`);
                });
            }
        });
}

// Modal Thêm nhân viên
function openAddMemberModal() {
    loadAvailableMembersDropdown();
    document.getElementById("addMemberModal").classList.add("open");
}
function closeAddMemberModal() {
    document.getElementById("addMemberModal").classList.remove("open");
}
function submitAddMember() {
    const memberUsername = document.getElementById("memberSelect").value;
    if (!memberUsername) {
        showAlert("error", "Vui lòng chọn nhân viên muốn thêm!");
        return;
    }

    fetchWithAuth("/api/leader/teams/add-member", {
        method: "PUT",
        body: JSON.stringify({ memberUsername })
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Đã thêm nhân viên vào nhóm!");
            closeAddMemberModal();
            loadLeaderTeamInfo();
        } else {
            const err = await res.text();
            showAlert("error", "Lỗi: " + err);
        }
    });
}

// Modal Giao việc con
function openCreateSubtaskModal() {
    loadTeamMembersDropdown();
    document.getElementById("createSubtaskModal").classList.add("open");
}
function closeCreateSubtaskModal() {
    document.getElementById("createSubtaskModal").classList.remove("open");
}
function submitCreateSubtask() {
    const title = document.getElementById("subtaskTitle").value.trim();
    const description = document.getElementById("subtaskDescription").value.trim();
    const assignedTo = document.getElementById("subtaskEmployeeSelect").value;

    if (!title || !assignedTo) {
        showAlert("error", "Vui lòng điền đủ tiêu đề và chọn nhân viên thực hiện!");
        return;
    }

    fetchWithAuth("/api/leader/tasks/subtask", {
        method: "POST",
        body: JSON.stringify({ title, description, parentId: activeParentTaskId, assignedTo })
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Giao việc con thành công!");
            closeCreateSubtaskModal();
            loadSubtasksList(activeParentTaskId);
        } else {
            const err = await res.text();
            showAlert("error", "Lỗi: " + err);
        }
    });
}

// Modal Duyệt báo cáo nhân viên (Leader)
let activeSubtaskId = null;
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

// Modal Báo cáo lên Sếp
function openSubmitTeamReportModal() {
    document.getElementById("teamReportContent").value = "";
    document.getElementById("submitTeamReportModal").classList.add("open");
}
function closeSubmitTeamReportModal() {
    document.getElementById("submitTeamReportModal").classList.remove("open");
}
function submitTeamReport() {
    const reportContent = document.getElementById("teamReportContent").value.trim();
    if (!reportContent) {
        showAlert("error", "Vui lòng nhập nội dung báo cáo!");
        return;
    }

    fetchWithAuth(`/api/leader/tasks/${activeParentTaskId}/submit`, {
        method: "PUT",
        body: JSON.stringify({ reportContent })
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Đã nộp báo cáo nhóm lên Sếp!");
            closeSubmitTeamReportModal();
            loadLeaderBigTasksSelector();
            document.getElementById("subtaskManagementSection").style.display = "none";
        } else {
            const err = await res.text();
            showAlert("error", "Lỗi: " + err);
        }
    });
}

// Tiện ích hiển thị Alert
function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;
    
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
