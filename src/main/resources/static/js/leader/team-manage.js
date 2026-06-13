document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_LEADER") {
        return;
    }
    loadLeaderTeamInfo();
    loadAvailableMembersDropdown();
});

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

function showAlert(type, msg) {
    const alertBox = document.getElementById("alertBox");
    alertBox.className = "alert-box " + type;
    alertBox.innerText = msg;
    alertBox.style.display = "block";
    setTimeout(() => {
        alertBox.style.display = "none";
    }, 3000);
}
