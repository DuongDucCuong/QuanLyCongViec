package com.quanlycongviec.service;

import com.quanlycongviec.entity.Task;
import java.util.List;
import java.time.LocalDate;

public interface TaskService {
    // 1. Loại bỏ projectId khi Sếp tạo việc lớn
    Task createBossTask(String title, String description, Integer teamId, LocalDate dueDate, String priority, String creatorUsername);

    // 2. Tạo việc con
    Task createSubtask(String title, String description, Integer parentId, String assignedToUsername, LocalDate dueDate, String priority, String creatorUsername);

    Task updateTaskStatus(Integer taskId, String status, String username);
    Task submitReport(Integer taskId, String reportContent, String username);
    Task approveReport(Integer taskId, String feedback, String username);
    Task rejectReport(Integer taskId, String feedback, String username);
    List<Task> getTasksByCreator(String username);
    List<Task> getTasksForUser(String username);
    List<Task> getTasksForTeam(Integer teamId);
    List<Task> getSubtasks(Integer parentId);
    Task getTaskById(Integer id);

    // 3. Loại bỏ projectId khi Sếp sửa việc lớn
    Task updateBossTask(Integer taskId, String title, String description, Integer teamId, LocalDate dueDate, String priority);

    void deleteBossTask(Integer taskId);

    // 4. Sửa việc con
    Task updateSubtask(Integer subtaskId, String title, String description, String assignedToUsername, LocalDate dueDate, String priority);

    void deleteSubtask(Integer subtaskId);
}