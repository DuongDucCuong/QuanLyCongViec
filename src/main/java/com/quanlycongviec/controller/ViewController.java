package com.quanlycongviec.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class ViewController {

    @GetMapping("/")
    public String index() {
        return "redirect:/login";
    }

    @GetMapping("/admin/dashboard")
    public String adminDashboard() {
        return "admin/dashboard";
    }

    @GetMapping("/admin/team")
    public String adminTeam() {
        return "admin/team";
    }

    @GetMapping("/admin/task")
    public String adminTask() {
        return "admin/task";
    }

    @GetMapping("/leader/dashboard")
    public String leaderDashboard() {
        return "leader/dashboard";
    }

    @GetMapping("/leader/team-manage")
    public String leaderTeamManage() {
        return "leader/team-manage";
    }

    @GetMapping("/leader/task-report")
    public String leaderTaskReport() {
        return "leader/task-report";
    }

    @GetMapping("/member/dashboard")
    public String memberDashboard() {
        return "member/dashboard";
    }

    @GetMapping("/member/task-report")
    public String memberTaskReport() {
        return "member/task-report";
    }

    @GetMapping("/admin/users")
    public String adminUsers() { return "admin/users";}

    @GetMapping("/admin/users/detail")
    public String adminUserDetail() {return "admin/user-detail"; }// Sẽ khớp với templates/admin/user-detail.html
}