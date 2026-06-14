const DEFAULT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2394a3b8"><rect width="24" height="24" fill="%23cbd5e1"/><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-7 2-7 4v1h14v-1c0-2-3-4-7-4z"/></svg>`;

document.addEventListener("DOMContentLoaded", function() {
    loadMyProfile();

    // Sự kiện submit lưu thông tin cá nhân
    document.getElementById("profileForm").addEventListener("submit", function(e) {
        e.preventDefault();
        saveMyProfile();
    });
});

// 1. Tải thông tin cá nhân của chính mình từ API
function loadMyProfile() {
    fetchWithAuth("/api/profile")
        .then(res => res.json())
        .then(data => {
            document.getElementById("profileUsername").value = data.username;
            document.getElementById("profileFullName").value = data.fullName || "";
            document.getElementById("profileDOB").value = data.dateOfBirth || "";
            document.getElementById("profileGender").value = data.gender || "";
            document.getElementById("profilePlaceOfBirth").value = data.placeOfBirth || "";
            document.getElementById("profilePhone").value = data.phoneNumber || "";
            document.getElementById("profileEmail").value = data.email || "";
            document.getElementById("profileTeam").value = data.teamName || "Chưa vào nhóm";
            document.getElementById("profileAddress").value = data.address || "";

            // Nạp ảnh đại diện
            const avatarImg = document.getElementById("profileAvatarImg");
            avatarImg.src = data.avatarPath ? data.avatarPath : DEFAULT_AVATAR;

            // Nạp link download CV nếu đã tải lên
            const cvContainer = document.getElementById("cvDownloadContainer");
            if (data.cvPath) {
                document.getElementById("cvDownloadLink").href = data.cvPath;
                cvContainer.style.display = "block";
            } else {
                cvContainer.style.display = "none";
            }
        })
        .catch(err => {
            showAlert("Không thể tải thông tin hồ sơ!", "error");
            console.error(err);
        });
}

// 2. Gửi yêu cầu cập nhật thông tin cá nhân
function saveMyProfile() {
    const payload = {
        fullName: document.getElementById("profileFullName").value.trim(),
        dateOfBirth: document.getElementById("profileDOB").value.trim(),
        gender: document.getElementById("profileGender").value,
        placeOfBirth: document.getElementById("profilePlaceOfBirth").value.trim(),
        phoneNumber: document.getElementById("profilePhone").value.trim(),
        email: document.getElementById("profileEmail").value.trim(),
        address: document.getElementById("profileAddress").value.trim()
    };

    fetchWithAuth("/api/profile", {
        method: "PUT",
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (res.ok) {
                showAlert("Cập nhật hồ sơ cá nhân thành công!", "success");
                loadMyProfile();
            } else {
                const err = await res.text();
                showAlert("Lỗi lưu thông tin: " + err, "error");
            }
        })
        .catch(err => {
            showAlert("Lỗi kết nối đến máy chủ!", "error");
            console.error(err);
        });
}

// 3. Tải lên ảnh đại diện chân dung
function uploadAvatar() {
    const fileInput = document.getElementById("avatarFileInput");
    if (fileInput.files.length === 0) {
        showAlert("Vui lòng chọn hình ảnh trước khi tải lên!", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetchWithAuth("/api/profile/upload-avatar", {
        method: "POST",
        body: formData
    })
        .then(async res => {
            if (res.ok) {
                showAlert("Tải lên ảnh chân dung của bạn thành công!", "success");
                fileInput.value = "";
                loadMyProfile();
            } else {
                const err = await res.text();
                showAlert("Lỗi tải ảnh đại diện: " + err, "error");
            }
        });
}

// 4. Tải lên hồ sơ tệp CV
function uploadCV() {
    const fileInput = document.getElementById("cvFileInput");
    if (fileInput.files.length === 0) {
        showAlert("Vui lòng chọn tệp CV (.pdf, .doc, .docx) trước khi tải lên!", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    fetchWithAuth("/api/profile/upload-cv", {
        method: "POST",
        body: formData
    })
        .then(async res => {
            if (res.ok) {
                showAlert("Tải hồ sơ CV của bạn thành công!", "success");
                fileInput.value = "";
                loadMyProfile();
            } else {
                const err = await res.text();
                showAlert("Lỗi tải tệp hồ sơ CV: " + err, "error");
            }
        });
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