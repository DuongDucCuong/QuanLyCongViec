package com.quanlycongviec.controller.admin;

import com.quanlycongviec.entity.User;
import com.quanlycongviec.entity.Team;
import com.quanlycongviec.repository.UserRepository;
import com.quanlycongviec.repository.TeamRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    // 1. Lấy danh sách toàn bộ người dùng
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    // 2. Tạo mới một người dùng
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> request) {
        try {
            String username = (String) request.get("username");
            if (userRepository.findByUsername(username).isPresent()) {
                return ResponseEntity.badRequest().body("Tên đăng nhập đã tồn tại!");
            }

            User user = new User();
            user.setUsername(username);

            String password = (String) request.get("password");
            if (password == null || password.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Mật khẩu không được để trống!");
            }
            user.setPassword(passwordEncoder.encode(password));
            user.setEmail((String) request.get("email"));
            user.setPhoneNumber((String) request.get("phoneNumber"));

            String role = (String) request.get("role");
            if (role != null && !role.isEmpty()) {
                user.setRole(role);
            } else {
                user.setRole("ROLE_USER");
            }

            // Gán nhóm làm việc nếu có
            if (request.get("teamId") != null && !request.get("teamId").toString().isEmpty()) {
                Integer teamId = Integer.valueOf(request.get("teamId").toString());
                Team team = teamRepository.findById(teamId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
                user.setTeam(team);
            }

            User savedUser = userRepository.save(user);
            return ResponseEntity.ok(savedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 3. Cập nhật thông tin người dùng
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> request) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

            user.setEmail((String) request.get("email"));
            user.setPhoneNumber((String) request.get("phoneNumber"));

            String role = (String) request.get("role");
            if (role != null && !role.isEmpty()) {
                user.setRole(role);
            }

            // Cập nhật nhóm làm việc
            if (request.get("teamId") != null && !request.get("teamId").toString().isEmpty()) {
                Integer teamId = Integer.valueOf(request.get("teamId").toString());
                Team team = teamRepository.findById(teamId)
                        .orElseThrow(() -> new RuntimeException("Không tìm thấy nhóm!"));
                user.setTeam(team);
            } else {
                user.setTeam(null);
            }

            // Cập nhật mật khẩu mới (chỉ cập nhật nếu có nhập mật khẩu mới)
            String password = (String) request.get("password");
            if (password != null && !password.trim().isEmpty()) {
                user.setPassword(passwordEncoder.encode(password));
            }

            User updatedUser = userRepository.save(user);
            return ResponseEntity.ok(updatedUser);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 4. Xóa người dùng
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Integer id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

            if ("admin".equals(user.getUsername())) {
                return ResponseEntity.badRequest().body("Không thể xóa tài khoản admin mặc định!");
            }

            // Gỡ bỏ liên kết Leader nếu người dùng này đang làm trưởng nhóm
            List<Team> teams = teamRepository.findAll();
            for (Team team : teams) {
                if (team.getLeader() != null && team.getLeader().getId().equals(id)) {
                    team.setLeader(null);
                    teamRepository.save(team);
                }
            }

            userRepository.delete(user);
            return ResponseEntity.ok("Xóa người dùng thành công!");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Không thể xóa người dùng này do có dữ liệu liên quan (công việc, báo cáo...)!");
        }
    }
}