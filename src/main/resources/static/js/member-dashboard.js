// Khởi chạy khi tải trang
document.addEventListener("DOMContentLoaded", function() {
    const path = window.location.pathname;

    if (path.includes("/member/dashboard")) {
        loadMemberStats();
        loadMemberTasks();
    } else if (path.includes("/member/task-report")) {
        loadMemberTaskHistory();
    }
});

// ==========================================
// 1. TẢI DỮ LIỆU ĐỔ VÀO VIEW
// ==========================================

// Tải số liệu thống kê Dashboard
function loadMemberStats() {
    fetchWithAuth("/api/member/tasks")
        .then(res => res.json())
        .then(tasks => {
            document.getElementById("statMyTasks").innerText = tasks.length;
            document.getElementById("statDoingTasks").innerText = tasks.filter(t => t.status === "DOING").length;
            document.getElementById("statApprovedTasks").innerText = tasks.filter(t => t.status === "APPROVED").length;
        });
}

// Tải danh sách công việc cá nhân
function loadMemberTasks() {
    fetchWithAuth("/api/member/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("memberTasksTable");
            tbody.innerHTML = "";

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Bạn chưa được giao việc con nào. Hãy tận hưởng thời gian rảnh rỗi nhé!</td></tr>`;
                return;
            }

            tasks.forEach(t => {
                const creatorName = t.createdBy ? t.createdBy.username : "N/A";
                const tr = document.createElement("tr");

                // Tạo các nút hành động tùy theo trạng thái
                let actionBtn = "";
                if (t.status === "PENDING") {
                    actionBtn = `<button onclick="acceptTask(${t.id})" class="btn btn-primary btn-sm">⚡ Nhận việc (Start)</button>`;
                } else if (t.status === "DOING" || t.status === "REJECTED") {
                    actionBtn = `<button onclick="openSubmitReportModal(${t.id}, '${t.title.replace(/'/g, "\\'")}')" class="btn btn-primary btn-sm" style="background-color: var(--success); hover:background-color:#047857;">✍️ Nộp báo cáo</button>`;
                } else {
                    actionBtn = `<span style="font-size: 0.85rem; color: var(--text-secondary);">Đang chờ duyệt / Đã đóng</span>`;
                }

                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td><strong>${t.title}</strong></td>
                    <td>${t.description || "Không có mô tả"}</td>
                    <td>${creatorName}</td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                    <td>${actionBtn}</td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// Tải lịch sử báo cáo và nhận xét
function loadMemberTaskHistory() {
    fetchWithAuth("/api/member/tasks")
        .then(res => res.json())
        .then(tasks => {
            const tbody = document.getElementById("memberTaskHistoryTable");
            tbody.innerHTML = "";

            if (tasks.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Bạn chưa có lịch sử công việc nào.</td></tr>`;
                return;
            }

            tasks.forEach(t => {
                const report = t.reportContent || "<em>Chưa gửi báo cáo</em>";
                const feedback = t.feedback || "<em>Chưa có nhận xét</em>";
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td><strong>${t.title}</strong></td>
                    <td>${report}</td>
                    <td><span style="color: var(--primary); font-weight: 500;">${feedback}</span></td>
                    <td><span class="badge badge-${t.status.toLowerCase()}">${t.status}</span></td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// ==========================================
// 2. HÀNH ĐỘNG NHẬN VIỆC & NỘP BÁO CÁO
// ==========================================

// Nhận việc (Đổi trạng thái sang DOING)
function acceptTask(taskId) {
    fetchWithAuth(`/api/member/tasks/${taskId}/accept`, {
        method: "PUT"
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Đã nhận việc thành công! Bắt đầu thực hiện.");
            loadMemberStats();
            loadMemberTasks();
        } else {
            const err = await res.text();
            showAlert("error", "Lỗi: " + err);
        }
    });
}

// Mở modal báo cáo
function openSubmitReportModal(taskId, title) {
    document.getElementById("reportSubtaskId").value = taskId;
    document.getElementById("reportSubtaskTitle").value = title;
    document.getElementById("reportContentInput").value = "";
    document.getElementById("submitSubtaskReportModal").classList.add("open");
}
function closeSubmitSubtaskReportModal() {
    document.getElementById("submitSubtaskReportModal").classList.remove("open");
}

// Gửi báo cáo
function submitSubtaskReport() {
    const taskId = document.getElementById("reportSubtaskId").value;
    const reportContent = document.getElementById("reportContentInput").value.trim();

    if (!reportContent) {
        showAlert("error", "Vui lòng điền nội dung báo cáo kết quả!");
        return;
    }

    fetchWithAuth(`/api/member/tasks/${taskId}/submit`, {
        method: "PUT",
        body: JSON.stringify({ reportContent })
    })
    .then(async res => {
        if (res.ok) {
            showAlert("success", "Đã nộp báo cáo lên Trưởng nhóm thành công!");
            closeSubmitSubtaskReportModal();
            loadMemberStats();
            loadMemberTasks();
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
