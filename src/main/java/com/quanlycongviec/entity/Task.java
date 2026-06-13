package com.quanlycongviec.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "CLOB") // Dùng CLOB cho cơ sở dữ liệu Oracle
    private String description;

    // Trạng thái công việc: PENDING, DOING, SUBMITTED, APPROVED, REJECTED
    @Column(nullable = false)
    private String status = "PENDING";

    // Người thực hiện công việc (Nhân viên hoặc Trưởng nhóm)
    @ManyToOne
    @JoinColumn(name = "assigned_to")
    @JsonIgnoreProperties({"team", "password"})
    private User assignedTo;

    // Nhóm thực hiện công việc (Sếp giao cho Nhóm)
    @ManyToOne
    @JoinColumn(name = "assigned_team")
    @JsonIgnoreProperties({"members", "leader"})
    private Team assignedTeam;

    // Người giao việc (Sếp hoặc Trưởng nhóm)
    @ManyToOne
    @JoinColumn(name = "created_by")
    @JsonIgnoreProperties({"team", "password"})
    private User createdBy;

    // Công việc cha (Dùng để chia nhỏ việc lớn thành các việc con)
    @ManyToOne
    @JoinColumn(name = "parent_id")
    @JsonIgnoreProperties({"parentTask", "assignedTo", "assignedTeam", "createdBy"})
    private Task parentTask;

    @Column(name = "due_date")
    private java.time.LocalDate dueDate;

    @Column(nullable = false)
    private String priority = "MEDIUM"; // Mặc định là MEDIUM

    @Column(name = "report_content", columnDefinition = "CLOB")
    private String reportContent;

    @Column(columnDefinition = "CLOB")
    private String feedback;

    public Task() {}

    public Task(String title, String description, User createdBy) {
        this.title = title;
        this.description = description;
        this.createdBy = createdBy;
    }

    // Getters và Setters

    public java.time.LocalDate getDueDate() { return dueDate; }
    public void setDueDate(java.time.LocalDate dueDate) { this.dueDate = dueDate; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }
    public Team getAssignedTeam() { return assignedTeam; }
    public void setAssignedTeam(Team assignedTeam) { this.assignedTeam = assignedTeam; }
    public User getCreatedBy() { return createdBy; }
    public void setCreatedBy(User createdBy) { this.createdBy = createdBy; }
    public Task getParentTask() { return parentTask; }
    public void setParentTask(Task parentTask) { this.parentTask = parentTask; }
    public String getReportContent() { return reportContent; }
    public void setReportContent(String reportContent) { this.reportContent = reportContent; }
    public String getFeedback() { return feedback; }
    public void setFeedback(String feedback) { this.feedback = feedback; }
}