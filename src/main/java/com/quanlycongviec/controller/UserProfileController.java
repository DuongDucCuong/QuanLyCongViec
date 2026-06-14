package com.quanlycongviec.controller;

import com.quanlycongviec.entity.User;
import com.quanlycongviec.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.security.Principal;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {

    @Autowired
    private UserRepository userRepository;

    // 1. API Lấy thông tin cá nhân của người dùng đang đăng nhập
    @GetMapping
    public ResponseEntity<?> getMyProfile(Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!"));

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("phoneNumber", user.getPhoneNumber());
            response.put("role", user.getRole());
            response.put("teamName", user.getTeam() != null ? user.getTeam().getName() : "Chưa vào nhóm");
            response.put("fullName", user.getFullName());
            response.put("dateOfBirth", user.getDateOfBirth());
            response.put("placeOfBirth", user.getPlaceOfBirth());
            response.put("gender", user.getGender());
            response.put("address", user.getAddress());
            response.put("avatarPath", user.getAvatarPath());
            response.put("cvPath", user.getCvPath());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 2. API cập nhật thông tin cá nhân dạng văn bản
    @PutMapping
    public ResponseEntity<?> updateMyProfile(@RequestBody Map<String, String> request, Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!"));

            user.setFullName(request.get("fullName"));
            user.setDateOfBirth(request.get("dateOfBirth"));
            user.setPlaceOfBirth(request.get("placeOfBirth"));
            user.setGender(request.get("gender"));
            user.setAddress(request.get("address"));
            user.setEmail(request.get("email"));
            user.setPhoneNumber(request.get("phoneNumber"));

            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. API Tải lên ảnh đại diện cá nhân
    @PostMapping("/upload-avatar")
    public ResponseEntity<?> uploadMyAvatar(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Tệp tin trống!");
            }

            // Đường dẫn tuyệt đối đến thư mục resources/static/uploads/avatars
            File uploadDir = new File("src/main/resources/static/uploads/avatars").getAbsoluteFile();
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File destFile = new File(uploadDir, fileName);
            file.transferTo(destFile);

            user.setAvatarPath("/uploads/avatars/" + fileName);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("avatarPath", user.getAvatarPath()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. API Tải lên tệp CV cá nhân
    @PostMapping("/upload-cv")
    public ResponseEntity<?> uploadMyCV(@RequestParam("file") MultipartFile file, Principal principal) {
        try {
            User user = userRepository.findByUsername(principal.getName())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy thông tin tài khoản!"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Tệp tin trống!");
            }

            // Đường dẫn tuyệt đối đến thư mục resources/static/uploads/cvs
            File uploadDir = new File("src/main/resources/static/uploads/cvs").getAbsoluteFile();
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File destFile = new File(uploadDir, fileName);
            file.transferTo(destFile);

            user.setCvPath("/uploads/cvs/" + fileName);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("cvPath", user.getCvPath()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}