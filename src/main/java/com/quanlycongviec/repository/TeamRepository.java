package com.quanlycongviec.repository;

import com.quanlycongviec.entity.User;
import com.quanlycongviec.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Integer> {
    Optional<Team> findByName(String name);

    // THÊM PHƯƠNG THỨC NÀY: Tìm nhóm mà User này đang làm trưởng nhóm
    Optional<Team> findByLeader(User leader);
}
