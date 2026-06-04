package com.quanlycongviec.repository;

import com.quanlycongviec.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    // Hàm tìm kiếm người dùng theo tên đăng nhập
    Optional<User> findByUsername(String username);
}