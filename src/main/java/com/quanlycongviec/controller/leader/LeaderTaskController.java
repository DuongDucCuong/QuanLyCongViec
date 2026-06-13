package com.quanlycongviec.controller.leader;

import com.quanlycongviec.entity.Task;
import com.quanlycongviec.entity.Team;
import com.quanlycongviec.service.TaskService;
import com.quanlycongviec.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leader/tasks")
@PreAuthorize("hasRole('LEADER')")
public class LeaderTaskController {

    @Autowired
    private TaskService taskService;

    @Autowired
    private TeamService teamService;

    @GetMapping
    public ResponseEntity<?> getTeamTasks(Principal principal) {
        try {
            Team team = teamService.getTeamByMember(principal.getName());
            if (team == null) {
                return ResponseEntity.badRequest().body("Bạn chưa tham gia nhóm nào!");
            }
            List<Task> tasks = taskService.getTasksForTeam(team.getId());
            return ResponseEntity.ok(tasks);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/subtask")
    public ResponseEntity<?> createSubtask(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            Integer parentId = Integer.parseInt(request.get("parentId").toString());
            String assignedTo = (String) request.get("assignedTo");

            // Đọc thêm Hạn chót & Độ ưu tiên việc con
            LocalDate dueDate = null;
            if (request.get("dueDate") != null && !request.get("dueDate").toString().isEmpty()) {
                dueDate = LocalDate.parse(request.get("dueDate").toString());
            }
            String priority = (String) request.get("priority");

            Task subtask = taskService.createSubtask(title, description, parentId, assignedTo, dueDate, priority, principal.getName());
            return ResponseEntity.ok(subtask);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/subtasks")
    public ResponseEntity<List<Task>> getSubtasks(@PathVariable Integer id) {
        return ResponseEntity.ok(taskService.getSubtasks(id));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveSubtask(@PathVariable Integer id, @RequestBody Map<String, String> request, Principal principal) {
        try {
            String feedback = request.get("feedback");
            Task task = taskService.approveReport(id, feedback, principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectSubtask(@PathVariable Integer id, @RequestBody Map<String, String> request, Principal principal) {
        try {
            String feedback = request.get("feedback");
            Task task = taskService.rejectReport(id, feedback, principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<?> submitTeamTask(@PathVariable Integer id, @RequestBody Map<String, String> request, Principal principal) {
        try {
            String reportContent = request.get("reportContent");
            Task task = taskService.submitReport(id, reportContent, principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/subtask/{id}")
    public ResponseEntity<?> updateSubtask(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            String assignedTo = (String) request.get("assignedTo");

            LocalDate dueDate = null;
            if (request.get("dueDate") != null && !request.get("dueDate").toString().isEmpty()) {
                dueDate = LocalDate.parse(request.get("dueDate").toString());
            }
            String priority = (String) request.get("priority");

            Task subtask = taskService.updateSubtask(id, title, description, assignedTo, dueDate, priority);
            return ResponseEntity.ok(subtask);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/subtask/{id}")
    public ResponseEntity<?> deleteSubtask(@PathVariable Integer id) {
        try {
            taskService.deleteSubtask(id);
            return ResponseEntity.ok("Xóa công việc con thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}