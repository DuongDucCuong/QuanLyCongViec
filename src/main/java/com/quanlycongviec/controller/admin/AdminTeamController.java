package com.quanlycongviec.controller.admin;

import com.quanlycongviec.entity.Team;
import com.quanlycongviec.entity.User;
import com.quanlycongviec.service.TeamService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/teams")
@PreAuthorize("hasRole('ADMIN')")
public class
AdminTeamController {

    @Autowired
    private TeamService teamService;

    @PostMapping
    public ResponseEntity<?> createTeam(@RequestBody Map<String, String> request) {
        try {
            String name = request.get("name");
            String leaderUsername = request.get("leaderUsername");
            Team team = teamService.createTeam(name, leaderUsername);
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/assign-leader")
    public ResponseEntity<?> assignLeader(@PathVariable Integer id, @RequestBody Map<String, String> request) {
        try {
            String leaderUsername = request.get("leaderUsername");
            Team team = teamService.assignLeader(id, leaderUsername);
            return ResponseEntity.ok(team);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<List<Team>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams());
    }

    @GetMapping("/available-users")
    public ResponseEntity<List<User>> getAvailableUsers() {
        return ResponseEntity.ok(teamService.getAvailableUsersForTeam());
    }

    @GetMapping("/available-leaders")
    public ResponseEntity<List<User>> getAvailableLeaders() {
        return ResponseEntity.ok(teamService.getAvailableLeaders());
    }
}
