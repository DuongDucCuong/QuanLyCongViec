package com.quanlycongviec.controller.admin;

import com.quanlycongviec.entity.Task;
import com.quanlycongviec.repository.TaskRepository;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import com.quanlycongviec.entity.Team;
import com.quanlycongviec.entity.User;
import com.quanlycongviec.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/teams")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTeamController {

    @Autowired
    private TeamService teamService;

    @Autowired
    private TaskRepository taskRepository;

    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String leaderUsername = request.get("leaderUsername");
            Team team = teamService.createTeam(name, leaderUsername);
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/assign-leader")
    public ResponseEntity<?> assignLeader(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        try {
            String leaderUsername = request.get("leaderUsername");
            Team team = teamService.assignLeader(id, leaderUsername);
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/available-users")
    public ResponseEntity<List<User>> getAvailableUsers() {
        return ResponseEntity.ok(teamService.getAvailableUsersForTeam());
    }

    @GetMapping("/available-leaders")
    public ResponseEntity<List<User>> getAvailableLeaders() {
        return ResponseEntity.ok(teamService.getAvailableLeaders());
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<?> getTeamDetails(@PathVariable Integer id) {
        try {
            Team team = teamService.getTeamById(id);
            List<Map<String, Object>> membersData = new ArrayList<>();
            
            if (team.getMembers() != null) {
                for (User member : team.getMembers()) {
                    // 3. Với mỗi thành viên, lấy danh sách các công việc được giao cho họ từ TaskRepository
                    List<Task> memberTasks = taskRepository.findByAssignedTo(member);

                    // 4. Đóng gói thông tin cơ bản của thành viên
                    Map<String, Object> memberMap = new HashMap<>();
                    memberMap.put("id", member.getId());
                    memberMap.put("username", member.getUsername());
                    memberMap.put("email", member.getEmail());
                    memberMap.put("role", member.getRole());

                    // 5. Đóng gói danh sách công việc của thành viên đó
                    List<Map<String, Object>> tasksData = new ArrayList<>();
                    for (Task task : memberTasks) {
                        Map<String, Object> taskMap = new HashMap<>();
                        taskMap.put("id", task.getId());
                        taskMap.put("title", task.getTitle());
                        taskMap.put("status", task.getStatus());
                        taskMap.put("dueDate", task.getDueDate() != null ? task.getDueDate().toString() : null);
                        taskMap.put("priority", task.getPriority());
                        tasksData.add(taskMap);
                    }
                    memberMap.put("tasks", tasksData);
                    membersData.add(memberMap);
                }
            }

            // 6. Đóng gói dữ liệu tổng thể trả về cho Frontend
            Map<String, Object> response = new HashMap<>();
            response.put("id", team.getId());
            response.put("name", team.getName());
            response.put("leader", team.getLeader() != null ? team.getLeader().getUsername() : "Chưa có");
            response.put("members", membersData);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
