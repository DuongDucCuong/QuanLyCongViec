package com.quanlycongviec.utils;

import com.quanlycongviec.entity.User;
import com.quanlycongviec.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Kiểm tra xem database Oracle đã có tài khoản admin chưa
        if (userRepository.findByUsername("admin").isEmpty()) {
            User admin = new User();
            admin.setUsername("admin");
            admin.setPassword(passwordEncoder.encode("admin123")); // Mật khẩu đăng nhập: admin123
            admin.setEmail("admin@gmail.com");
            admin.setPhoneNumber("0123456789");
            admin.setRole("ROLE_ADMIN"); // Gán vai trò Sếp/Admin cao nhất

            userRepository.save(admin);
            System.out.println("=================================================");
            System.out.println(">>> INITIALIZED DEFAULT ADMIN ACCOUNT SUCCESS!");
            System.out.println(">>> Username: admin");
            System.out.println(">>> Password: admin123");
            System.out.println("=================================================");
        }
    }
}