package com.quanlycongviec.service.impl;

import com.quanlycongviec.entity.Task;
import com.quanlycongviec.entity.Team;
import com.quanlycongviec.entity.User;
import com.quanlycongviec.repository.TaskRepository;
import com.quanlycongviec.repository.TeamRepository;
import com.quanlycongviec.repository.UserRepository;
import com.quanlycongviec.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class TaskServiceImpl implements TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Task createBossTask(String title, String description, Integer teamId, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người tạo!"));

        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhóm nhận việc!"));

        Task task = new Task(title, description, creator);
        task.setAssignedTeam(team);
        // Sếp giao việc lớn cho nhóm, người thực hiện chính ở cấp độ này là Leader của nhóm
        task.setAssignedTo(team.getLeader());
        task.setStatus("PENDING");

        return taskRepository.save(task);
    }

    @Override
    public Task createSubtask(String title, String description, Integer parentId, String assignedToUsername, String creatorUsername) {
        User creator = userRepository.findByUsername(creatorUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người giao việc!"));

        Task parentTask = taskRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc cha!"));

        User assignedTo = userRepository.findByUsername(assignedToUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người nhận việc!"));

        Task subtask = new Task(title, description, creator);
        subtask.setParentTask(parentTask);
        subtask.setAssignedTo(assignedTo);
        subtask.setStatus("PENDING");

        // Khi tạo việc con, việc cha tự động đổi trạng thái thành DOING nếu đang là PENDING
        if ("PENDING".equals(parentTask.getStatus())) {
            parentTask.setStatus("DOING");
            taskRepository.save(parentTask);
        }

        return taskRepository.save(subtask);
    }

    @Override
    public Task updateTaskStatus(Integer taskId, String status, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc!"));
        task.setStatus(status);
        return taskRepository.save(task);
    }

    @Override
    public Task submitReport(Integer taskId, String reportContent, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc!"));

        if (task.getAssignedTo() == null || !task.getAssignedTo().getUsername().equals(username)) {
            throw new RuntimeException("Bạn không được phân công thực hiện công việc này!");
        }

        task.setReportContent(reportContent);
        task.setStatus("SUBMITTED"); // Chờ duyệt

        return taskRepository.save(task);
    }

    @Override
    public Task approveReport(Integer taskId, String feedback, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc!"));

        task.setFeedback(feedback);
        task.setStatus("APPROVED");

        return taskRepository.save(task);
    }

    @Override
    public Task rejectReport(Integer taskId, String feedback, String username) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc!"));

        task.setFeedback(feedback);
        task.setStatus("REJECTED"); // Yêu cầu làm lại

        return taskRepository.save(task);
    }

    @Override
    public List<Task> getTasksByCreator(String username) {
        User creator = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        return taskRepository.findByCreatedBy(creator);
    }

    @Override
    public List<Task> getTasksForUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));
        return taskRepository.findByAssignedTo(user);
    }

    @Override
    public List<Task> getTasksForTeam(Integer teamId) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhóm!"));
        return taskRepository.findByAssignedTeam(team);
    }

    @Override
    public List<Task> getSubtasks(Integer parentId) {
        Task parent = taskRepository.findById(parentId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc cha!"));
        return taskRepository.findByParentTask(parent);
    }

    @Override
    public Task getTaskById(Integer id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công việc!"));
    }
}
