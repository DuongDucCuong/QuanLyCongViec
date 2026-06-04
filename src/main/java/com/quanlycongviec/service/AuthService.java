package com.quanlycongviec.service;

import com.quanlycongviec.dto.AuthRequest;
import com.quanlycongviec.dto.AuthResponse;
import com.quanlycongviec.dto.RegisterRequest;
import com.quanlycongviec.entity.User;

public interface AuthService {
    // Khai báo hàm Đăng ký
    User register(RegisterRequest request);

    // Khai báo hàm Đăng nhập
    AuthResponse login(AuthRequest request);
}