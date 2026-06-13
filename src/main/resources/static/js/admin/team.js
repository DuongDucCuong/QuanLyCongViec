document.addEventListener("DOMContentLoaded", function() {
    const role = localStorage.getItem("role");
    if (role !== "ROLE_ADMIN") {
        return;
    }
    loadTeams();
    loadAvailableLeadersDropdown();
});

function loadTeams() {
    fetchWithAuth("/api/admin/teams")
        .then(res => res.json())
        .then(teams => {
            const tbody = document.getElementById("teamsTableBody");
            tbody.innerHTML = "";

            if (teams.length === 0) {
                tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Chưa có nhóm nào. Hãy bấm nút tạo nhóm mới ở trên.</td></tr>`;
                return;
            }

            teams.forEach(t => {
                const leaderName = t.leader ? t.leader.username : "<em>Chưa có</em>";
                const membersCount = t.members ? t.members.length : 0;
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td><strong>#${t.id}</strong></td>
                    <td>${t.name}</td>
                    <td>${leaderName}</td>
                    <td>${membersCount} nhân viên</td>
                    <td class="action-buttons">
                        <button onclick="openTeamDetailsModal(${t.id}, '${t.name.replace(/'/g, "\\'")}')" class="btn btn-primary btn-sm">🔍 Xem chi tiết</button>
                        <button onclick="openAssignLeaderModal(${t.id}, '${t.name.replace(/'/g, "\\'")}')" class="btn btn-secondary btn-sm">👑 Bổ nhiệm Trưởng nhóm</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        })
        .catch(err => {
            showAlert("error", "Lỗi khi tải danh sách nhóm: " + err.message);
        });
}

function loadAvailableLeadersDropdown() {
    fetchWithAuth("/api/admin/teams/available-leaders")
        .then(res => res.json())
        .then(users => {
            const selectCreate = document.getElementById("teamLeaderSelect");
            const selectAssign = document.getElementById("leaderSelect");

            selectCreate.innerHTML = `<option value="">-- Chọn trưởng nhóm --</option>`;
            selectAssign.innerHTML = `<option value="">-- Chọn trưởng nhóm mới --</option>`;

            users.forEach(u => {
                const optionHtml = `<option value="${u.username}">${u.username} (${u.role === "ROLE_LEADER" ? "Trưởng nhóm" : "Nhân viên"})</option>`;
                selectCreate.insertAdjacentHTML("beforeend", optionHtml);
                selectAssign.insertAdjacentHTML("beforeend", optionHtml);
            });
        });
}

function openCreateTeamModal() {
    loadAvailableLeadersDropdown();
    document.getElementById("createTeamModal").classList.add("open");
}

function closeCreateTeamModal() {
    document.getElementById("createTeamModal").classList.remove("open");
}

function submitCreateTeam() {
    const name = document.getElementById("teamName").value.trim();
    const leaderUsername = document.getElementById("teamLeaderSelect").value;

    if (!name) {
        showAlert("error", "Vui lòng nhập tên nhóm!");
        return;
    }

    fetchWithAuth("/api/admin/teams", {
        method: "POST",
        body: JSON.stringify({ name, leaderUsername })
    })
        .then(async res => {
            if (res.ok) {
                showAlert("success", "Tạo nhóm thành công!");
                closeCreateTeamModal();
                loadTeams();
            } else {
                const err = await res.text();
                showAlert("error", "Lỗi: " + err);
            }
        });
}

function openAssignLeaderModal(teamId, teamName) {
    document.getElementById("assignTeamId").value = teamId;
    document.getElementById("assignTeamName").value = teamName;
    loadAvailableLeadersDropdown();
    document.getElementById("assignLeaderModal").classList.add("open");
}

function closeAssignLeaderModal() {
    document.getElementById("assignLeaderModal").classList.remove("open");
}

function submitAssignLeader() {
    const teamId = document.getElementById("assignTeamId").value;
    const leaderUsername = document.getElementById("leaderSelect").value;

    if (!leaderUsername) {
        showAlert("error", "Vui lòng chọn Trưởng nhóm mới!");
        return;
    }

    fetchWithAuth(`/api/admin/teams/${teamId}/assign-leader`, {
        method: "PUT",
        body: JSON.stringify({ leaderUsername })
    })
        .then(async res => {
            if (res.ok) {
                showAlert("success", "Bổ nhiệm Trưởng nhóm mới thành công!");
                closeAssignLeaderModal();
                loadTeams();
            } else {
                const err = await res.text();
                showAlert("error", "Lỗi: " + err);
            }
        });
}

function openTeamDetailsModal(teamId, teamName) {
    document.getElementById("detailsModalTitle").innerText = `Chi tiết Nhóm: ${teamName}`;
    
    fetchWithAuth(`/api/admin/teams/${teamId}/details`)
        .then(res => {
            if (!res.ok) throw new Error("Không thể tải thông tin chi tiết nhóm");
            return res.json();
        })
        .then(data => {
            document.getElementById("detailsTeamLeader").innerText = data.leader;
            document.getElementById("detailsTeamMemberCount").innerText = `${data.members.length} thành viên`;
            
            const container = document.getElementById("detailsMembersContainer");
            container.innerHTML = ""; 
            
            if (data.members.length === 0) {
                container.innerHTML = `<div style="text-align: center; color: var(--text-secondary); padding: 1.5rem; font-style: italic;">Nhóm này chưa có thành viên nào.</div>`;
            } else {
                data.members.forEach(member => {
                    const memberDiv = document.createElement("div");
                    memberDiv.style.border = "1px solid var(--border-color)";
                    memberDiv.style.borderRadius = "var(--border-radius-md)";
                    memberDiv.style.marginBottom = "1.25rem";
                    memberDiv.style.overflow = "hidden";
                    
                    let tasksHtml = "";
                    if (member.tasks.length === 0) {
                        tasksHtml = `<div style="padding: 1rem; color: var(--text-secondary); font-style: italic; font-size: 0.9rem;">Chưa được phân công công việc nào.</div>`;
                    } else {
                        let rows = "";
                        member.tasks.forEach(task => {
                            const badgeClass = `badge-${task.status.toLowerCase()}`;
                            const dueDateText = task.dueDate ? formatDate(task.dueDate) : "Không đặt";
                            rows += `
                                <tr>
                                    <td style="padding: 0.75rem 1rem;"><strong>${task.title}</strong></td>
                                    <td style="padding: 0.75rem 1rem; text-align: center;">
                                        <span class="badge ${badgeClass}">${task.status}</span>
                                    </td>
                                    <td style="padding: 0.75rem 1rem; text-align: right; color: var(--text-secondary);">${dueDateText}</td>
                                </tr>
                            `;
                        });
                        
                        tasksHtml = `
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                                <thead>
                                    <tr style="background-color: var(--bg-primary); border-bottom: 1px solid var(--border-color);">
                                        <th style="padding: 0.5rem 1rem; text-align: left; color: var(--text-secondary); font-weight:600;">Tên công việc</th>
                                        <th style="padding: 0.5rem 1rem; text-align: center; color: var(--text-secondary); font-weight:600; width: 130px;">Trạng thái</th>
                                        <th style="padding: 0.5rem 1rem; text-align: right; color: var(--text-secondary); font-weight:600; width: 130px;">Hạn chót</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rows}
                                </tbody>
                            </table>
                        `;
                    }
                    
                    memberDiv.innerHTML = `
                        <div style="background-color: var(--bg-primary); padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
                            <strong style="color: var(--text-primary);">${member.username}</strong>
                            <span style="font-size: 0.85rem; color: var(--text-secondary);">${member.email || "Chưa cập nhật email"}</span>
                        </div>
                        <div>
                            ${tasksHtml}
                        </div>
                    `;
                    container.appendChild(memberDiv);
                });
            }
            
            document.getElementById("teamDetailsModal").classList.add("open");
        })
        .catch(err => {
            showAlert("error", "Lỗi: " + err.message);
        });
}

function closeTeamDetailsModal() {
    document.getElementById("teamDetailsModal").classList.remove("open");
}

function formatDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateString;
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
