let isEditMode = false;

document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_ADMIN") {
        return;
    }
    loadBossTasks();
    loadTeamsDropdown();
});

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

function getPriorityBadgeHtml(priority) {
    if (priority === "HIGH") {
        return '<span class="badge badge-rejected" style="background-color: var(--danger-light); color: var(--danger);">HIGH</span>';
    } else if (priority === "LOW") {
        return '<span class="badge badge-pending" style="background-color: #f1f5f9; color: #64748b;">LOW</span>';
    } else {
        return '<span class="badge badge-doing" style="background-color: var(--warning-light); color: var(--warning);">MEDIUM</span>';
    }
}

function loadBossTasks() {
    fetchWithAuth("/api/admin/tasks")
        .then(res => res.json())
        .then(tasks => {
            const searchQuery = document.getElementById("searchTask").value.trim().toLowerCase();
            const statusFilter = document.getElementById("statusFilter").value;

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

            const tbody = document.getElementById("tasksTableBody");
            tbody.innerHTML = "";

            if (filteredTasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-secondary);">Không tìm thấy công việc phù hợp.</td></tr>`;
                return;
            }

            const today = new Date().toISOString().split("T")[0];

            filteredTasks.forEach(t => {
                const teamName = t.assignedTeam ? t.assignedTeam.name : "N/A";

                let dueDateText = '<span style="color:var(--text-muted);">Không đặt</span>';
                if (t.dueDate) {
                    const formattedDate = formatDate(t.dueDate);
                    if (t.dueDate < today && t.status !== "APPROVED") {
                        dueDateText = `<span style="color:var(--danger); font-weight:600;" title="Trễ hạn!">⚠️ ${formattedDate}</span>`;
                    } else {
                        dueDateText = `<span>${formattedDate}</span>`;
                    }
                }

                const priorityBadge = getPriorityBadgeHtml(t.priority);

                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td>
                        <strong style="color:var(--text-primary);">${t.title}</strong>
                        <br><small style="color:var(--text-secondary);">${t.description || "N/A"}</small>
                    </td>
                    <td><span class="badge badge-doing">${teamName}</span></td>
                    <td>${priorityBadge}</td>
                    <td>${dueDateText}</td>
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

function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

function openCreateTaskModal() {
    isEditMode = false;
    document.getElementById("modalTitle").innerText = "Giao công việc cho Nhóm";
    document.getElementById("btnSubmitTask").innerText = "Giao việc";
    document.getElementById("taskId").value = "";
    document.getElementById("taskTitle").value = "";
    document.getElementById("taskDescription").value = "";
    document.getElementById("taskDueDate").value = "";
    document.getElementById("taskPriority").value = "MEDIUM";

    loadTeamsDropdown();

    document.getElementById("createTaskModal").classList.add("open");
}

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
    document.getElementById("taskDueDate").value = task.dueDate || "";
    document.getElementById("taskPriority").value = task.priority || "MEDIUM";

    loadTeamsDropdown();

    setTimeout(() => {
        document.getElementById("taskTeamSelect").value = task.assignedTeam ? task.assignedTeam.id : "";
    }, 200);

    document.getElementById("createTaskModal").classList.add("open");
}

function closeCreateTaskModal() {
    document.getElementById("createTaskModal").classList.remove("open");
}

function submitCreateTask() {
    const taskId = document.getElementById("taskId").value;
    const title = document.getElementById("taskTitle").value.trim();
    const description = document.getElementById("taskDescription").value.trim();
    const teamId = document.getElementById("taskTeamSelect").value;
    const dueDate = document.getElementById("taskDueDate").value;
    const priority = document.getElementById("taskPriority").value;

    if (!title || !teamId) {
        showAlert("error", "Vui lòng điền đủ thông tin tiêu đề và chọn nhóm nhận việc!");
        return;
    }

    const payload = {
        title,
        description,
        teamId: parseInt(teamId),
        dueDate: dueDate || null,
        priority
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

function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
