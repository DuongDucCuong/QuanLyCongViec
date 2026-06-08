package com.quanlycongviec.service.impl;

import com.quanlycongviec.entity.Team;
import com.quanlycongviec.entity.User;
import com.quanlycongviec.repository.TeamRepository;
import com.quanlycongviec.repository.UserRepository;
import com.quanlycongviec.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class TeamServiceImpl implements TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private UserRepository userRepository;

    @Override
    public Team createTeam(String name, String leaderUsername) {
        if (teamRepository.findByName(name).isPresent()) {
            throw new RuntimeException("Tên nhóm đã tồn tại!");
        }

        User leader = null;
        if (leaderUsername != null && !leaderUsername.isEmpty()) {
            leader = userRepository.findByUsername(leaderUsername)
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy Trưởng nhóm!"));
            if (!"ROLE_LEADER".equals(leader.getRole())) {
                leader.setRole("ROLE_LEADER");
                userRepository.save(leader);
            }
        }

        Team team = new Team(name, leader);
        Team savedTeam = teamRepository.save(team);

        if (leader != null) {
            leader.setTeam(savedTeam);
            userRepository.save(leader);
        }

        return savedTeam;
    }

    @Override
    public Team assignLeader(Integer teamId, String leaderUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhóm!"));

        User leader = userRepository.findByUsername(leaderUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trưởng nhóm!"));

        // Cập nhật role của leader
        leader.setRole("ROLE_LEADER");
        leader.setTeam(team);
        userRepository.save(leader);

        // Gỡ leader cũ nếu có
        if (team.getLeader() != null && !team.getLeader().equals(leader)) {
            User oldLeader = team.getLeader();
            // Nếu không còn làm leader nhóm nào thì chuyển về USER
            oldLeader.setRole("ROLE_USER");
            userRepository.save(oldLeader);
        }

        team.setLeader(leader);
        return teamRepository.save(team);
    }

    @Override
    public Team addMember(Integer teamId, String memberUsername) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhóm!"));

        User member = userRepository.findByUsername(memberUsername)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy thành viên!"));

        member.setTeam(team);
        userRepository.save(member);

        return teamRepository.findById(teamId).get();
    }

    @Override
    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    @Override
    public Team getTeamById(Integer id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Nhóm!"));
    }

    @Override
    public Team getTeamByMember(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Người dùng!"));
        return user.getTeam();
    }

    @Override
    public List<User> getAvailableUsersForTeam() {
        // Lấy những user chưa thuộc nhóm nào và không phải là ADMIN
        return userRepository.findAll().stream()
                .filter(u -> u.getTeam() == null && !"ROLE_ADMIN".equals(u.getRole()))
                .collect(Collectors.toList());
    }

    @Override
    public List<User> getAvailableLeaders() {
        // Lấy tất cả user không phải admin
        return userRepository.findAll().stream()
                .filter(u -> !"ROLE_ADMIN".equals(u.getRole()))
                .collect(Collectors.toList());
    }
}
