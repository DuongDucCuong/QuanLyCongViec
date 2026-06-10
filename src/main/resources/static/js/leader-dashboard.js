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

let activeParentTaskId = null;

function selectParentTask(parentId, parentTitle) {
    activeParentTaskId = parentId;
    document.getElementById("activeParentTaskTitle").innerText = parentTitle;
    document.getElementById("subtaskManagementSection").style.display = "block";
    loadSubtasksList(parentId);
}

function loadSubtasksList(parentId) {
    fetchWithAuth(`/api/leader/tasks/${parentId}/subtasks`)
        .then(res => res.json())
        .then(subtasks => {
            const tbody = document.getElementById("subtasksTableBody");
            tbody.innerHTML = "";

            if (subtasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary); padding:1.5rem;">Chưa có việc con nào. Hãy bấm nút giao việc con ở trên!</td></tr>`;
                return;
            }

            subtasks.forEach(s => {
                const employeeName = s.assignedTo ? s.assignedTo.username : "Chưa nhận";
                const feedbackText = s.feedback || "<em>Chưa có</em>";

                const disableActions = s.status === "APPROVED" ? "disabled style='opacity:0.5; cursor:not-allowed;'" : "";

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${s.title}</strong></td>
                    <td>${s.description || "Không có mô tả"}</td>
                    <td>${employeeName}</td>
                    <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
                    <td>${feedbackText}</td>
                    <td class="action-buttons">
                        <button onclick='openEditSubtaskModal(${JSON.stringify(s)})' class="btn btn-sm btn-warning" ${disableActions}>Sửa</button>
                        <button onclick="deleteSubtask(${s.id})" class="btn btn-sm btn-danger" ${disableActions}>Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

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

function openCreateSubtaskModal() {
    isEditSubtaskMode = false;
    document.getElementById("subtaskTitle").value = "";
    document.getElementById("subtaskDescription").value = "";
    loadTeamMembersDropdown();
    document.getElementById("createSubtaskModal").classList.add("open");
}
function closeCreateSubtaskModal() {
    document.getElementById("createSubtaskModal").classList.remove("open");
}

let isEditSubtaskMode = false;
let editingSubtaskId = null;

function openEditSubtaskModal(subtask) {
    isEditSubtaskMode = true;
    editingSubtaskId = subtask.id;

    document.getElementById("subtaskTitle").value = subtask.title;
    document.getElementById("subtaskDescription").value = subtask.description || "";

    loadTeamMembersDropdown();

    setTimeout(() => {
        document.getElementById("subtaskEmployeeSelect").value = subtask.assignedTo ? subtask.assignedTo.username : "";
    }, 200);

    document.getElementById("createSubtaskModal").classList.add("open");
}

function submitCreateSubtask() {
    const title = document.getElementById("subtaskTitle").value.trim();
    const description = document.getElementById("subtaskDescription").value.trim();
    const assignedTo = document.getElementById("subtaskEmployeeSelect").value;

    if (!title || !assignedTo) {
        showAlert("error", "Vui lòng điền đủ tiêu đề và chọn nhân viên thực hiện!");
        return;
    }

    const payload = { title, description, assignedTo };

    let url = "/api/leader/tasks/subtask";
    let method = "POST";

    if (isEditSubtaskMode) {
        url += "/" + editingSubtaskId;
        method = "PUT";
    } else {
        payload.parentId = activeParentTaskId;
    }

    fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (res.ok) {
                showAlert("success", isEditSubtaskMode ? "Đã cập nhật việc con!" : "Giao việc con thành công!");
                closeCreateSubtaskModal();
                isEditSubtaskMode = false;
                editingSubtaskId = null;
                loadSubtasksList(activeParentTaskId);
            } else {
                const err = await res.text();
                showAlert("error", "Lỗi: " + err);
            }
        });
}

function deleteSubtask(subtaskId) {
    if (confirm("Bạn có chắc chắn muốn xóa công việc con này không?")) {
        fetchWithAuth(`/api/leader/tasks/subtask/${subtaskId}`, {
            method: "DELETE"
        })
            .then(async res => {
                if (res.ok) {
                    showAlert("success", "Đã xóa công việc con thành công!");
                    loadSubtasksList(activeParentTaskId);
                } else {
                    const err = await res.text();
                    showAlert("error", "Không thể xóa: " + err);
                }
            });
    }
}

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

function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}