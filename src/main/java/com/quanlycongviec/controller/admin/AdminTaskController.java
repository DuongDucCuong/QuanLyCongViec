package com.quanlycongviec.controller.admin;

import com.quanlycongviec.entity.Task;
import com.quanlycongviec.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/tasks")
@PreAuthorize("hasRole('ADMIN')")
public class AdminTaskController {

    @Autowired
    private TaskService taskService;

    @PostMapping
    public ResponseEntity<?> createBossTask(@RequestBody Map<String, Object> request, Principal principal) {
        try {
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            Integer teamId = Integer.parseInt(request.get("teamId").toString());

            LocalDate dueDate = null;
            if (request.get("dueDate") != null && !request.get("dueDate").toString().isEmpty()) {
                dueDate = LocalDate.parse(request.get("dueDate").toString());
            }
            String priority = (String) request.get("priority");

            Task task = taskService.createBossTask(title, description, teamId, dueDate, priority, principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Task>> getBossTasks(Principal principal) {
        return ResponseEntity.ok(taskService.getTasksByCreator(principal.getName()));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveReport(@PathVariable Integer id, @RequestBody Map<String, String> request, Principal principal) {
        try {
            String feedback = request.get("feedback");
            Task task = taskService.approveReport(id, feedback, principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectReport(@PathVariable Integer id, @RequestBody Map<String, String> request, Principal principal) {
        try {
            String feedback = request.get("feedback");
            Task task = taskService.rejectReport(id, feedback, principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/{id}/subtasks")
    public ResponseEntity<List<Task>> getSubtasks(@PathVariable Integer id) {
        return ResponseEntity.ok(taskService.getSubtasks(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBossTask(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            Integer teamId = Integer.parseInt(request.get("teamId").toString());

            LocalDate dueDate = null;
            if (request.get("dueDate") != null && !request.get("dueDate").toString().isEmpty()) {
                dueDate = LocalDate.parse(request.get("dueDate").toString());
            }
            String priority = (String) request.get("priority");

            Task task = taskService.updateBossTask(id, title, description, teamId, dueDate, priority);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBossTask(@PathVariable Integer id) {
        try {
            taskService.deleteBossTask(id);
            return ResponseEntity.ok("Xóa công việc thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}