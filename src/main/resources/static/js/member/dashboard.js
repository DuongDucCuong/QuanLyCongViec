document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_USER") {
        return;
    }
    loadMemberStats();
    loadMemberTasks();
});

function loadMemberStats() {
    fetchWithAuth("/api/member/tasks")
        .then(res => res.json())
        .then(tasks => {
            document.getElementById("statMyTasks").innerText = tasks.length;
            document.getElementById("statDoingTasks").innerText = tasks.filter(t => t.status === "DOING").length;
            document.getElementById("statApprovedTasks").innerText = tasks.filter(t => t.status === "APPROVED").length;
        });
}

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

function openSubmitReportModal(taskId, title) {
    document.getElementById("reportSubtaskId").value = taskId;
    document.getElementById("reportSubtaskTitle").value = title;
    document.getElementById("reportContentInput").value = "";
    document.getElementById("submitSubtaskReportModal").classList.add("open");
}

function closeSubmitSubtaskReportModal() {
    document.getElementById("submitSubtaskReportModal").classList.remove("open");
}

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

function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
