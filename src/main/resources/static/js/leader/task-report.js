let activeParentTaskId = null;
let isEditSubtaskMode = false;
let editingSubtaskId = null;

document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_LEADER") {
        return;
    }
    loadLeaderBigTasksSelector();
    loadTeamMembersDropdown();
});

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

function selectParentTask(parentId, parentTitle) {
    activeParentTaskId = parentId;
    document.getElementById("activeParentTaskTitle").innerText = parentTitle;
    document.getElementById("subtaskManagementSection").style.display = "block";
    loadSubtasksList(parentId);
}

function getPriorityBadgeHtml(priority) {
    if (priority === "HIGH") {
        return '<span class="badge badge-rejected" style="background-color: var(--danger-light); color: var(--danger);">HIGH</span>';
    } else if (priority === "LOW") {
        return '<span class="badge badge-pending" style="background-color: #f1f5f9; color: #64748b;">LOW</span>';
    } else {
        return '<span class="badge badge-doing" style="background-color: var(--warning-light); color: var(--warning);">MEDIUM</span>';
    }
}

function loadSubtasksList(parentId) {
    fetchWithAuth(`/api/leader/tasks/${parentId}/subtasks`)
        .then(res => res.json())
        .then(subtasks => {
            const tbody = document.getElementById("subtasksTableBody");
            tbody.innerHTML = "";

            if (subtasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-secondary); padding:1.5rem;">Chưa có việc con nào. Hãy bấm nút giao việc con ở trên!</td></tr>`;
                return;
            }

            const today = new Date().toISOString().split("T")[0];

            subtasks.forEach(s => {
                const employeeName = s.assignedTo ? s.assignedTo.username : "Chưa nhận";
                const feedbackText = s.feedback || "<em>Chưa có</em>";

                const disableActions = s.status === "APPROVED" ? "disabled style='opacity:0.5; cursor:not-allowed;'" : "";
                const priorityBadge = getPriorityBadgeHtml(s.priority);

                let dueDateText = '<span style="color:var(--text-muted);">Không đặt</span>';
                if (s.dueDate) {
                    const formattedDate = formatDate(s.dueDate);
                    if (s.dueDate < today && s.status !== "APPROVED") {
                        dueDateText = `<span style="color:var(--danger); font-weight:600;" title="Trễ hạn!">⚠️ ${formattedDate}</span>`;
                    } else {
                        dueDateText = `<span>${formattedDate}</span>`;
                    }
                }

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>${s.title}</strong></td>
                    <td>${s.description || "Không có mô tả"}</td>
                    <td>${employeeName}</td>
                    <td>${priorityBadge}</td>
                    <td>${dueDateText}</td>
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

function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
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

function openCreateSubtaskModal() {
    isEditSubtaskMode = false;
    document.getElementById("subtaskModalTitle").innerText = "Giao việc con cho Nhân viên";
    document.getElementById("subtaskTitle").value = "";
    document.getElementById("subtaskDescription").value = "";
    document.getElementById("subtaskDueDate").value = "";
    document.getElementById("subtaskPriority").value = "MEDIUM";
    loadTeamMembersDropdown();
    document.getElementById("createSubtaskModal").classList.add("open");
}

function closeCreateSubtaskModal() {
    document.getElementById("createSubtaskModal").classList.remove("open");
}

function openEditSubtaskModal(subtask) {
    isEditSubtaskMode = true;
    editingSubtaskId = subtask.id;

    document.getElementById("subtaskModalTitle").innerText = "Chỉnh sửa việc con";
    document.getElementById("subtaskTitle").value = subtask.title;
    document.getElementById("subtaskDescription").value = subtask.description || "";
    document.getElementById("subtaskDueDate").value = subtask.dueDate || "";
    document.getElementById("subtaskPriority").value = subtask.priority || "MEDIUM";

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
    const dueDate = document.getElementById("subtaskDueDate").value;
    const priority = document.getElementById("subtaskPriority").value;

    if (!title || !assignedTo) {
        showAlert("error", "Vui lòng điền đủ tiêu đề và chọn nhân viên thực hiện!");
        return;
    }

    const payload = {
        title,
        description,
        assignedTo,
        dueDate: dueDate || null,
        priority
    };

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
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
