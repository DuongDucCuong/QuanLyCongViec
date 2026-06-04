package com.quanlycongviec.controller;

import com.quanlycongviec.dto.AuthRequest;
import com.quanlycongviec.dto.AuthResponse;
import com.quanlycongviec.dto.RegisterRequest;
import com.quanlycongviec.entity.User;
import com.quanlycongviec.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller; // Chuyển sang @Controller để hỗ trợ render View Thymeleaf
import org.springframework.web.bind.annotation.*;

@Controller // Dùng @Controller thay vì @RestController để vừa trả về giao diện HTML vừa trả về dữ liệu API
public class AuthController {

    @Autowired
    private AuthService authService;

    // ==========================================
    // 1. CỔNG HIỂN THỊ GIAO DIỆN (VIEW NAVIGATION)
    // ==========================================

    // Hiển thị trang Đăng nhập: GET http://localhost:8080/login
    @GetMapping("/login")
    public String loginPage() {
        return "auth/login"; // Trỏ đến file templates/auth/login.html
    }

    // Hiển thị trang Đăng ký: GET http://localhost:8080/register
    @GetMapping("/register")
    public String registerPage() {
        return "auth/register"; // Trỏ đến file templates/auth/register.html
    }

    // ==========================================
    // 2. CỔNG XỬ LÝ DỮ LIỆU API (JSON DATA)
    // ==========================================

    // API Đăng ký tài khoản: POST http://localhost:8080/api/auth/register
    @PostMapping("/api/auth/register")
    @ResponseBody // Thêm @ResponseBody để báo cho Spring biết hàm này trả về dữ liệu JSON, không phải View HTML
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest request) {
        try {
            User registeredUser = authService.register(request);
            return ResponseEntity.ok(registeredUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // API Đăng nhập: POST http://localhost:8080/api/auth/login
    @PostMapping("/api/auth/login")
    @ResponseBody // Trả về dữ liệu JSON (Token JWT)
    public ResponseEntity<?> loginUser(@RequestBody AuthRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Login failed: " + e.getMessage());
        }
    }
}