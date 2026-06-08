package com.quanlycongviec.service;

import com.quanlycongviec.entity.Task;
import java.util.List;

public interface TaskService {
    Task createBossTask(String title, String description, Integer teamId, String creatorUsername);
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
}
