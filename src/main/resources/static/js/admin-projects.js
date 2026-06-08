let isEditMode = false;

document.addEventListener("DOMContentLoaded", function() {
    loadProjects();
});

// 1. Tải danh sách dự án
function loadProjects() {
    fetchWithAuth("/api/admin/projects")
        .then(res => res.json())
        .then(projects => {
            const tbody = document.getElementById("projectsTableBody");
            tbody.innerHTML = "";

            if (projects.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-secondary);">Chưa có dự án nào</td></tr>';
                return;
            }

            projects.forEach(project => {
                const tr = document.createElement("tr");

                const startDate = project.startDate ? formatDate(project.startDate) : '<span style="color:var(--text-muted);">Chưa đặt</span>';
                const endDate = project.endDate ? formatDate(project.endDate) : '<span style="color:var(--text-muted);">Chưa đặt</span>';

                const statusBadge = getStatusBadgeHtml(project.status);

                tr.innerHTML = `
                    <td><strong>${project.id}</strong></td>
                    <td>${project.name}</td>
                    <td>${project.description || '<span style="color:var(--text-muted);">Không có mô tả</span>'}</td>
                    <td>${startDate}</td>
                    <td>${endDate}</td>
                    <td>${statusBadge}</td>
                    <td class="action-buttons">
                        <button onclick='editProject(${JSON.stringify(project)})' class="btn btn-sm btn-warning">Sửa</button>
                        <button onclick="deleteProject(${project.id}, '${project.name}')" class="btn btn-sm btn-danger">Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            showAlert("Không thể tải danh sách dự án!", "error");
            console.error(err);
        });
}

// Định dạng ngày hiển thị (YYYY-MM-DD -> DD/MM/YYYY)
function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
}

function getStatusBadgeHtml(status) {
    switch (status) {
        case "PLANNING":
            return '<span class="badge badge-pending">Lên kế hoạch</span>';
        case "ONGOING":
            return '<span class="badge badge-doing">Đang triển khai</span>';
        case "COMPLETED":
            return '<span class="badge badge-approved">Đã hoàn thành</span>';
        case "SUSPENDED":
            return '<span class="badge badge-rejected">Tạm dừng</span>';
        default:
            return `<span class="badge badge-pending">${status}</span>`;
    }
}

// 2. Mở Modal
function openProjectModal(edit = false) {
    isEditMode = edit;
    const modal = document.getElementById("projectModal");
    const modalTitle = document.getElementById("modalTitle");

    // Reset Form
    document.getElementById("projectId").value = "";
    document.getElementById("projectName").value = "";
    document.getElementById("projectDescription").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("statusSelect").value = "PLANNING";

    if (isEditMode) {
        modalTitle.innerText = "Chỉnh sửa dự án";
    } else {
        modalTitle.innerText = "Tạo dự án mới";
    }

    modal.classList.add("open");
}

// Đóng Modal
function closeProjectModal() {
    document.getElementById("projectModal").classList.remove("open");
}

// 3. Sửa dự án
function editProject(project) {
    openProjectModal(true);
    document.getElementById("projectId").value = project.id;
    document.getElementById("projectName").value = project.name;
    document.getElementById("projectDescription").value = project.description || "";
    document.getElementById("startDate").value = project.startDate || "";
    document.getElementById("endDate").value = project.endDate || "";
    document.getElementById("statusSelect").value = project.status;
}

// 4. Gửi Form
function submitProjectForm() {
    const projectId = document.getElementById("projectId").value;
    const name = document.getElementById("projectName").value;
    const description = document.getElementById("projectDescription").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const status = document.getElementById("statusSelect").value;

    if (!name || name.trim() === "") {
        showAlert("❌ Tên dự án không được để trống!", "error");
        return;
    }

    const payload = {
        name,
        description,
        startDate: startDate || null,
        endDate: endDate || null,
        status
    };

    let url = "/api/admin/projects";
    let method = "POST";

    if (isEditMode) {
        url += "/" + projectId;
        method = "PUT";
    }

    fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (res.ok) {
                showAlert(isEditMode ? "Cập nhật dự án thành công!" : "Tạo dự án mới thành công!", "success");
                closeProjectModal();
                loadProjects();
            } else {
                const text = await res.text();
                showAlert("❌ Thao tác thất bại: " + text, "error");
            }
        })
        .catch(err => {
            showAlert("❌ Lỗi kết nối đến server!", "error");
            console.error(err);
        });
}

// 5. Xóa dự án
function deleteProject(id, name) {
    if (confirm(`Bạn có chắc chắn muốn xóa dự án "${name}" không? Hành động này không thể hoàn tác.`)) {
        fetchWithAuth(`/api/admin/projects/${id}`, {
            method: "DELETE"
        })
            .then(async res => {
                if (res.ok) {
                    showAlert("Xóa dự án thành công!", "success");
                    loadProjects();
                } else {
                    const errorMsg = await res.text();
                    showAlert("❌ Không thể xóa: " + errorMsg, "error");
                }
            })
            .catch(err => {
                showAlert("❌ Lỗi kết nối đến server!", "error");
                console.error(err);
            });
    }
}

// 6. Hiển thị thông báo
function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.className = "alert-box " + type;

    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 4000);
}