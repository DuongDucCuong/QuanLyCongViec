package com.quanlycongviec.controller.member;

import com.quanlycongviec.entity.Task;
import com.quanlycongviec.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/member/tasks")
@PreAuthorize("hasRole('USER')")
public class MemberTaskController {

    @Autowired
    private TaskService taskService;

    @GetMapping
    public ResponseEntity<List<Task>> getMyTasks(Principal principal) {
        return ResponseEntity.ok(taskService.getTasksForUser(principal.getName()));
    }

    @PutMapping("/{id}/submit")
    public ResponseEntity<?> submitReport(@PathVariable Integer id, @RequestBody Map<String, String> request, Principal principal) {
        try {
            String reportContent = request.get("reportContent");
            Task task = taskService.submitReport(id, reportContent, principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<?> acceptTask(@PathVariable Integer id, Principal principal) {
        try {
            Task task = taskService.updateTaskStatus(id, "DOING", principal.getName());
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
