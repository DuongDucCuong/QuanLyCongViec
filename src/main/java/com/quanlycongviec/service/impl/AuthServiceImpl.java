package com.quanlycongviec.service.impl;

import com.quanlycongviec.dto.AuthRequest;
import com.quanlycongviec.dto.AuthResponse;
import com.quanlycongviec.dto.RegisterRequest;
import com.quanlycongviec.entity.User;
import com.quanlycongviec.repository.UserRepository;
import com.quanlycongviec.service.AuthService;
import com.quanlycongviec.utils.JwtUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthServiceImpl implements AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public User register(RegisterRequest request) {
        // 1. Kiểm tra xem username đã tồn tại chưa
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists!");
        }

        // 2. Tạo đối tượng User mới và mã hóa mật khẩu trước khi lưu
        User user = new User();
        user.setUsername(request.getUsername());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Mã hóa mật khẩu
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRole("ROLE_USER"); // Mặc định tài khoản tự đăng ký là USER (Nhân viên)

        return userRepository.save(user);
    }

    @Override
    public AuthResponse login(AuthRequest request) {
        // 1. Gọi Spring Security xác thực đăng nhập (so khớp username & password)
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 2. Tìm thông tin user dưới database
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // 3. Sinh Token JWT từ username
        String token = jwtUtils.generateToken(user.getUsername());

        // 4. Trả kết quả về
        return new AuthResponse(token, user.getUsername(), user.getRole());
    }
}