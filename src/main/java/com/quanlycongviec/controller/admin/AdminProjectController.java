package com.quanlycongviec.controller.admin;

import com.quanlycongviec.entity.Project;
import com.quanlycongviec.repository.ProjectRepository;
import com.quanlycongviec.repository.TaskRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/projects")
@PreAuthorize("hasRole('ADMIN')")
public class AdminProjectController {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private TaskRepository taskRepository;

    // 1. Lấy toàn bộ danh sách dự án
    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectRepository.findAll());
    }

    // 2. Tạo mới dự án
    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody Map<String, Object> request) {
        try {
            String name = (String) request.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Tên dự án không được để trống!");
            }

            Project project = new Project();
            project.setName(name);
            project.setDescription((String) request.get("description"));
            project.setStatus((String) request.get("status"));

            if (request.get("startDate") != null && !request.get("startDate").toString().isEmpty()) {
                project.setStartDate(LocalDate.parse(request.get("startDate").toString()));
            }
            if (request.get("endDate") != null && !request.get("endDate").toString().isEmpty()) {
                project.setEndDate(LocalDate.parse(request.get("endDate").toString()));
            }

            Project savedProject = projectRepository.save(project);
            return ResponseEntity.ok(savedProject);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Cập nhật dự án
    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            Project project = projectRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án!"));

            String name = (String) request.get("name");
            if (name == null || name.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Tên dự án không được để trống!");
            }

            project.setName(name);
            project.setDescription((String) request.get("description"));
            project.setStatus((String) request.get("status"));

            if (request.get("startDate") != null && !request.get("startDate").toString().isEmpty()) {
                project.setStartDate(LocalDate.parse(request.get("startDate").toString()));
            } else {
                project.setStartDate(null);
            }

            if (request.get("endDate") != null && !request.get("endDate").toString().isEmpty()) {
                project.setEndDate(LocalDate.parse(request.get("endDate").toString()));
            } else {
                project.setEndDate(null);
            }

            Project updatedProject = projectRepository.save(project);
            return ResponseEntity.ok(updatedProject);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Xóa dự án
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Integer id) {
        try {
            Project project = projectRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy dự án!"));

            // Kiểm tra ràng buộc: xem dự án có công việc nào không trước khi xóa
            long countTasks = taskRepository.findAll().stream()
                    .filter(task -> task.getProject() != null && task.getProject().getId().equals(id))
                    .count();

            if (countTasks > 0) {
                return ResponseEntity.badRequest().body("Không thể xóa dự án do vẫn còn các công việc liên quan!");
            }

            projectRepository.delete(project);
            return ResponseEntity.ok("Xóa dự án thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}