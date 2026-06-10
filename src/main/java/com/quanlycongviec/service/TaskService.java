package com.quanlycongviec.service;

import com.quanlycongviec.entity.Task;
import java.util.List;

public interface TaskService {
    // Thêm tham số Integer projectId để liên kết dự án khi giao việc lớn
    Task createBossTask(String title, String description, Integer teamId, Integer projectId, String creatorUsername);

    Task createSubtask(String title, String description, Integer parentId, String assignedToUsername, String creatorUsername);
    Task updateTaskStatus(Integer taskId, String status, String username);
    Task submitReport(Integer taskId, String reportContent, String username);
    Task approveReport(Integer taskId, String feedback, String username);
    Task rejectReport(Integer taskId, String feedback, String username);
    List<Task> getTasksByCreator(String username);
    List<Task> getTasksForUser(String username);
    List<Task> getTasksForTeam(Integer teamId);
    List<Task> getSubtasks(Integer parentId);
    Task getTaskById(Integer id);

    // BỔ SUNG 4 PHƯƠNG THỨC CRUD MỚI:
    Task updateBossTask(Integer taskId, String title, String description, Integer teamId, Integer projectId);
    void deleteBossTask(Integer taskId);
    Task updateSubtask(Integer subtaskId, String title, String description, String assignedToUsername);
    void deleteSubtask(Integer subtaskId);
}