// Hàm kiểm tra đăng nhập và cấu hình giao diện
document.addEventListener("DOMContentLoaded", function() {
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");
    const role = localStorage.getItem("role");

    // 1. Kiểm tra Token
    if (!token) {
        window.location.href = "/login";
        return;
    }

    // 2. Kiểm tra phân quyền truy cập trang (Client-side Router guard)
    const path = window.location.pathname;
    if (path.startsWith("/admin") && role !== "ROLE_ADMIN") {
        redirectToDashboard(role);
        return;
    }
    if (path.startsWith("/leader") && role !== "ROLE_LEADER") {
        redirectToDashboard(role);
        return;
    }
    if (path.startsWith("/member") && role !== "ROLE_USER") {
        redirectToDashboard(role);
        return;
    }

    // 3. Hiển thị thông tin Header
    if (document.getElementById("headerUsername")) {
        document.getElementById("headerUsername").innerText = username;
    }
    if (document.getElementById("headerRole")) {
        document.getElementById("headerRole").innerText = getRoleLabel(role);
    }
    if (document.getElementById("headerAvatar") && username) {
        document.getElementById("headerAvatar").innerText = username.charAt(0).toUpperCase();
    }

    // 4. Ẩn/hiện menu trên Sidebar dựa theo Role
    configureSidebarMenu(role);
});

// Chuyển hướng thông minh dựa vào vai trò
function redirectToDashboard(role) {
    if (role === "ROLE_ADMIN") {
        window.location.href = "/admin/dashboard";
    } else if (role === "ROLE_LEADER") {
        window.location.href = "/leader/dashboard";
    } else {
        window.location.href = "/member/dashboard";
    }
}

// Lấy nhãn hiển thị cho Role
function getRoleLabel(role) {
    switch(role) {
        case "ROLE_ADMIN": return "Sếp / Admin";
        case "ROLE_LEADER": return "Trưởng nhóm";
        case "ROLE_USER": return "Nhân viên";
        default: return "Thành viên";
    }
}

// Ẩn/hiện menu trên sidebar
function configureSidebarMenu(role) {
    const adminMenus = document.querySelectorAll(".admin-menu");
    const leaderMenus = document.querySelectorAll(".leader-menu");
    const memberMenus = document.querySelectorAll(".member-menu");

    if (role === "ROLE_ADMIN") {
        adminMenus.forEach(el => el.style.display = "block");
        leaderMenus.forEach(el => el.style.display = "none");
        memberMenus.forEach(el => el.style.display = "none");
    } else if (role === "ROLE_LEADER") {
        adminMenus.forEach(el => el.style.display = "none");
        leaderMenus.forEach(el => el.style.display = "block");
        memberMenus.forEach(el => el.style.display = "none");
    } else {
        adminMenus.forEach(el => el.style.display = "none");
        leaderMenus.forEach(el => el.style.display = "none");
        memberMenus.forEach(el => el.style.display = "block");
    }
}

// Hàm gọi API dùng chung đính kèm Authorization Header
function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem("token");
    if (!options.headers) {
        options.headers = {};
    }

    options.headers["Authorization"] = "Bearer " + token;

    if (!(options.body instanceof FormData) && !options.headers["Content-Type"]) {
        options.headers["Content-Type"] = "application/json";
    }

    return fetch(url, options).then(async res => {
        if (res.status === 401 || res.status === 403) {
            const errorText = await res.text();
            // HIỆN THÔNG BÁO ĐỂ BIẾT CHÍNH XÁC LỖI Ở API NÀO
            alert("Lỗi gọi API: " + url + "\nMã lỗi: " + res.status + "\nChi tiết: " + errorText);

            handleLogout();
            throw new Error("Phiên làm việc hết hạn hoặc không có quyền!");
        }
        return res;
    });
}

// Đăng xuất
function handleLogout() {
    localStorage.clear();
    window.location.href = "/login";
}
