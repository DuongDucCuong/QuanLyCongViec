package com.quanlycongviec.controller.leader;

import com.quanlycongviec.entity.Team;
import com.quanlycongviec.entity.User;
import com.quanlycongviec.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leader/teams")
@PreAuthorize("hasRole('LEADER')")
public class LeaderTeamController {

    @Autowired
    private TeamService teamService;

    @GetMapping
    public ResponseEntity<?> getMyTeam(Principal principal) {
        try {
            Team team = teamService.getTeamByMember(principal.getName());
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/add-member")
    public ResponseEntity<?> addMember(@RequestBody Map<String, String> request, Principal principal) {
        try {
            Team team = teamService.getTeamByMember(principal.getName());
            if (team == null) {
                return ResponseEntity.badRequest().body("Bạn chưa làm trưởng nhóm của nhóm nào!");
            }
            String memberUsername = request.get("memberUsername");
            Team updatedTeam = teamService.addMember(team.getId(), memberUsername);
            return ResponseEntity.ok(updatedTeam);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/available-members")
    public ResponseEntity<List<User>> getAvailableMembers() {
        return ResponseEntity.ok(teamService.getAvailableUsersForTeam());
    }
}
