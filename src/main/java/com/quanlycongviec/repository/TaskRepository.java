package com.quanlycongviec.repository;

import com.quanlycongviec.entity.Task;
import com.quanlycongviec.entity.Team;
import com.quanlycongviec.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Integer> {
    
    // Tìm các công việc giao cho một nhóm cụ thể
    List<Task> findByAssignedTeam(Team team);

    // Tìm các công việc giao cho một nhân viên cụ thể
    List<Task> findByAssignedTo(User user);

    // Tìm các công việc con (sub-tasks) của một công việc cha cụ thể
    List<Task> findByParentTask(Task parentTask);

    // Tìm các công việc do một người dùng tạo ra
    List<Task> findByCreatedBy(User user);
}
