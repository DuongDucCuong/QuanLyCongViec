let isEditMode = false;
let allTeams = [];

document.addEventListener("DOMContentLoaded", function() {
    loadTeams();
    loadUsers();
});

// 1. Tải danh sách nhóm để đưa vào form select
function loadTeams() {
    fetchWithAuth("/api/admin/teams")
        .then(res => res.json())
        .then(data => {
            allTeams = data;
            const teamSelect = document.getElementById("teamSelect");
            // Reset option
            teamSelect.innerHTML = '<option value="">-- Chọn nhóm làm việc --</option>';
            data.forEach(team => {
                const opt = document.createElement("option");
                opt.value = team.id;
                opt.innerText = team.name;
                teamSelect.appendChild(opt);
            });
        })
        .catch(err => console.error("Lỗi tải danh sách nhóm:", err));
}

// 2. Tải danh sách người dùng và vẽ lại bảng
function loadUsers() {
    fetchWithAuth("/api/admin/users")
        .then(res => res.json())
        .then(users => {
            const tbody = document.getElementById("usersTableBody");
            tbody.innerHTML = "";

            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:var(--text-secondary);">Chưa có thành viên nào</td></tr>';
                return;
            }

            users.forEach(user => {
                const tr = document.createElement("tr");

                // Team column
                const teamName = user.team ? user.team.name : '<span style="color:var(--text-muted);">Chưa vào nhóm</span>';

                // Display role badge labels
                const roleBadge = getRoleBadgeHtml(user.role);

                tr.innerHTML = `
                    <td><strong>${user.id}</strong></td>
                    <td>${user.username}</td>
                    <td>${user.email || ""}</td>
                    <td>${user.phoneNumber || ""}</td>
                    <td>${roleBadge}</td>
                    <td>${teamName}</td>
                    <td class="action-buttons">
                        <button onclick='editUser(${JSON.stringify(user)})' class="btn btn-sm btn-warning">Sửa</button>
                        <button onclick="deleteUser(${user.id}, '${user.username}')" class="btn btn-sm btn-danger">Xóa</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            showAlert("Không thể tải danh sách người dùng!", "error");
            console.error(err);
        });
}

function getRoleBadgeHtml(role) {
    if (role === "ROLE_ADMIN") {
        return '<span class="badge badge-approved">Sếp / Admin</span>';
    } else if (role === "ROLE_LEADER") {
        return '<span class="badge badge-doing">Trưởng nhóm</span>';
    } else {
        return '<span class="badge badge-pending">Nhân viên</span>';
    }
}

// 3. Mở Modal Form
function openUserModal(edit = false) {
    isEditMode = edit;
    const modal = document.getElementById("userModal");
    const usernameGroup = document.getElementById("usernameGroup");
    const passwordLabel = document.getElementById("passwordLabel");
    const passwordHelp = document.getElementById("passwordHelp");
    const modalTitle = document.getElementById("modalTitle");

    // Reset Form
    document.getElementById("userId").value = "";
    document.getElementById("username").value = "";
    document.getElementById("password").value = "";
    document.getElementById("email").value = "";
    document.getElementById("phoneNumber").value = "";
    document.getElementById("roleSelect").value = "ROLE_USER";
    document.getElementById("teamSelect").value = "";

    if (isEditMode) {
        modalTitle.innerText = "Chỉnh sửa thành viên";
        usernameGroup.style.display = "none"; // Không cho sửa username
        passwordLabel.innerText = "Đổi mật khẩu (Tùy chọn)";
        passwordHelp.style.display = "block";
    } else {
        modalTitle.innerText = "Thêm thành viên mới";
        usernameGroup.style.display = "block";
        passwordLabel.innerText = "Mật khẩu";
        passwordHelp.style.display = "none";
    }

    modal.classList.add("open");
}

function closeUserModal() {
    document.getElementById("userModal").classList.remove("open");
}

// 4. Xử lý sửa người dùng
function editUser(user) {
    openUserModal(true);
    document.getElementById("userId").value = user.id;
    document.getElementById("username").value = user.username;
    document.getElementById("email").value = user.email || "";
    document.getElementById("phoneNumber").value = user.phoneNumber || "";
    document.getElementById("roleSelect").value = user.role;
    document.getElementById("teamSelect").value = user.team ? user.team.id : "";
}

// 5. Gửi dữ liệu form (Thêm hoặc Sửa)
function submitUserForm() {
    const userId = document.getElementById("userId").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const email = document.getElementById("email").value;
    const phoneNumber = document.getElementById("phoneNumber").value;
    const role = document.getElementById("roleSelect").value;
    const teamId = document.getElementById("teamSelect").value;

    const payload = {
        username,
        password,
        email,
        phoneNumber,
        role,
        teamId: teamId ? parseInt(teamId) : null
    };

    let url = "/api/admin/users";
    let method = "POST";

    if (isEditMode) {
        url += "/" + userId;
        method = "PUT";
    }

    fetchWithAuth(url, {
        method: method,
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (res.ok) {
                showAlert(isEditMode ? "Cập nhật thành công!" : "Tạo thành viên thành công!", "success");
                closeUserModal();
                loadUsers();
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

// 6. Xử lý xóa người dùng
function deleteUser(id, username) {
    if (confirm(`Bạn có chắc chắn muốn xóa thành viên "${username}" không? Hành động này không thể hoàn tác.`)) {
        fetchWithAuth(`/api/admin/users/${id}`, {
            method: "DELETE"
        })
            .then(async res => {
                if (res.ok) {
                    showAlert("Xóa thành viên thành công!", "success");
                    loadUsers();
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

// 7. Hiển thị thông báo (Toast/Alert)
function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.className = "alert-box " + type;

    // Cuộn lên đầu trang để người dùng nhìn thấy
    window.scrollTo({ top: 0, behavior: 'smooth' });

    setTimeout(() => {
        alertBox.style.display = "none";
    }, 4000);
}