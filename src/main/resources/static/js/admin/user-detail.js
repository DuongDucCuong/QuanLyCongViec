const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get("id");

// Ảnh đại diện mặc định dạng SVG Data URL tương tự Facebook
const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><rect width="24" height="24" fill="%23cbd5e1"/><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z"/></svg>`;

document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_ADMIN" || !userId) {
        window.location.href = "/admin/users";
        return;
    }
    loadUserDetails();

    // Lắng nghe sự kiện lưu thông tin cá nhân
    document.getElementById("profileForm").addEventListener("submit", function(e) {
        e.preventDefault();
        saveProfile();
    });
});

// 1. Tải chi tiết người dùng và công việc
function loadUserDetails() {
    fetchWithAuth(`/api/admin/users/${userId}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById("detailUsername").value = data.username;
            document.getElementById("detailFullName").value = data.fullName || "";
            document.getElementById("detailDOB").value = data.dateOfBirth || "";
            document.getElementById("detailGender").value = data.gender || "";
            document.getElementById("detailPlaceOfBirth").value = data.placeOfBirth || "";
            document.getElementById("detailPhone").value = data.phoneNumber || "";
            document.getElementById("detailEmail").value = data.email || "";
            document.getElementById("detailTeam").value = data.teamName || "Chưa vào nhóm";
            document.getElementById("detailAddress").value = data.address || "";

            // Hiển thị ảnh đại diện (nếu có, không thì để mặc định)
            const imgEl = document.getElementById("userAvatar");
            imgEl.src = data.avatarPath ? data.avatarPath : DEFAULT_AVATAR;

            // Hiển thị liên kết tải về CV nếu đã có
            const cvContainer = document.getElementById("cvDownloadContainer");
            if (data.cvPath) {
                document.getElementById("cvDownloadLink").href = data.cvPath;
                cvContainer.style.display = "block";
            } else {
                cvContainer.style.display = "none";
            }

            // Vẽ bảng công việc
            const tbody = document.getElementById("userTasksTableBody");
            tbody.innerHTML = "";
            if (!data.tasks || data.tasks.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Chưa được phân công công việc nào.</td></tr>';
            } else {
                data.tasks.forEach(task => {
                    const badgeClass = `badge-${task.status.toLowerCase()}`;
                    const tr = document.createElement("tr");
                    tr.innerHTML = `
                        <td><strong>#${task.id}</strong></td>
                        <td>${task.title}</td>
                        <td><span class="badge ${badgeClass}">${task.status}</span></td>
                        <td>${task.priority}</td>
                        <td>${task.dueDate ? formatDate(task.dueDate) : "Không đặt"}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(err => {
            showAlert("Không thể tải thông tin chi tiết!", "error");
            console.error(err);
        });
}

// 2. Lưu cập nhật thông tin cá nhân
function saveProfile() {
    const payload = {
        fullName: document.getElementById("detailFullName").value.trim(),
        dateOfBirth: document.getElementById("detailDOB").value.trim(),
        gender: document.getElementById("detailGender").value,
        placeOfBirth: document.getElementById("detailPlaceOfBirth").value.trim(),
        phoneNumber: document.getElementById("detailPhone").value.trim(),
        email: document.getElementById("detailEmail").value.trim(),
        address: document.getElementById("detailAddress").value.trim()
    };

    fetchWithAuth(`/api/admin/users/${userId}/profile`, {
        method: "PUT",
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (res.ok) {
                showAlert("Đã lưu thông tin hồ sơ thành công!", "success");
                loadUserDetails();
            } else {
                const err = await res.text();
                showAlert("Lưu hồ sơ thất bại: " + err, "error");
            }
        })
        .catch(err => {
            showAlert("Lỗi kết nối đến server!", "error");
            console.error(err);
        });
}

// 3. Upload ảnh chân dung
function uploadAvatar() {
    const fileInput = document.getElementById("avatarFileInput");
    if (fileInput.files.length === 0) {
        showAlert("Vui lòng chọn một tệp hình ảnh trước!", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetchWithAuth(`/api/admin/users/${userId}/upload-avatar`, {
        method: "POST",
        body: formData
    })
        .then(async res => {
            if (res.ok) {
                showAlert("Tải lên ảnh chân dung thành công!", "success");
                fileInput.value = ""; // reset input
                loadUserDetails();
            } else {
                const err = await res.text();
                showAlert("Lỗi tải ảnh: " + err, "error");
            }
        });
}

// 4. Upload file CV
function uploadCV() {
    const fileInput = document.getElementById("cvFileInput");
    if (fileInput.files.length === 0) {
        showAlert("Vui lòng chọn một tệp CV (PDF/Word) trước!", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetchWithAuth(`/api/admin/users/${userId}/upload-cv`, {
        method: "POST",
        body: formData
    })
        .then(async res => {
            if (res.ok) {
                showAlert("Tải hồ sơ CV thành công!", "success");
                fileInput.value = ""; // reset input
                loadUserDetails();
            } else {
                const err = await res.text();
                showAlert("Lỗi tải CV: " + err, "error");
            }
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

function showAlert(message, type = "success") {
    const alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.className = "alert-box " + type;
    alertBox.style.display = "block";
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 4000);
}