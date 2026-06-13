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
import com.quanlycongviec.entity.Task;
import com.quanlycongviec.repository.TaskRepository;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.util.HashMap;
import java.util.ArrayList;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    @Autowired
    private TaskRepository taskRepository;

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

    // 5. API Lấy thông tin chi tiết của 1 User kèm danh sách công việc của họ
    @GetMapping("/{id}")
    public ResponseEntity<?> getUserDetails(@PathVariable Integer id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

            List<Task> tasks = taskRepository.findByAssignedTo(user);

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

            List<Map<String, Object>> tasksData = new ArrayList<>();
            for (Task task : tasks) {
                Map<String, Object> taskMap = new HashMap<>();
                taskMap.put("id", task.getId());
                taskMap.put("title", task.getTitle());
                taskMap.put("status", task.getStatus());
                taskMap.put("dueDate", task.getDueDate() != null ? task.getDueDate().toString() : null);
                taskMap.put("priority", task.getPriority());
                tasksData.add(taskMap);
            }
            response.put("tasks", tasksData);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 6. API cập nhật các thông tin cá nhân dạng text
    @PutMapping("/{id}/profile")
    public ResponseEntity<?> updateProfile(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

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

    // 7. API Nhận và xử lý tải ảnh chân dung lên (Đã sửa lỗi đường dẫn tạm)
    @PostMapping("/{id}/upload-avatar")
    public ResponseEntity<?> uploadAvatar(@PathVariable Integer id, @RequestParam("file") MultipartFile file) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Tệp tin trống!");
            }

            // Ép đường dẫn thành đường dẫn tuyệt đối của dự án
            File uploadDir = new File("src/main/resources/static/uploads/avatars").getAbsoluteFile();
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File destFile = new File(uploadDir, fileName);

            // Lưu tệp tin vào đường dẫn tuyệt đối
            file.transferTo(destFile);

            // Lưu đường dẫn URL tĩnh vào database
            user.setAvatarPath("/uploads/avatars/" + fileName);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("avatarPath", user.getAvatarPath()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 8. API Nhận và xử lý tải CV lên (Đã sửa lỗi đường dẫn tạm)
    @PostMapping("/{id}/upload-cv")
    public ResponseEntity<?> uploadCV(@PathVariable Integer id, @RequestParam("file") MultipartFile file) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body("Tệp tin trống!");
            }

            // Ép đường dẫn thành đường dẫn tuyệt đối của dự án
            File uploadDir = new File("src/main/resources/static/uploads/cvs").getAbsoluteFile();
            if (!uploadDir.exists()) {
                uploadDir.mkdirs();
            }

            String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            File destFile = new File(uploadDir, fileName);

            // Lưu tệp tin vào đường dẫn tuyệt đối
            file.transferTo(destFile);

            user.setCvPath("/uploads/cvs/" + fileName);
            userRepository.save(user);

            return ResponseEntity.ok(Map.of("cvPath", user.getCvPath()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}