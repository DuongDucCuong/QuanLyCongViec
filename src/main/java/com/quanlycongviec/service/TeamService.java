package com.quanlycongviec.service;

import com.quanlycongviec.entity.Team;
import com.quanlycongviec.entity.User;

import java.util.List;

public interface TeamService {
    Team createTeam(String name, String leaderUsername);
    Team assignLeader(Integer teamId, String leaderUsername);
    Team addMember(Integer teamId, String memberUsername);
    List<Team> getAllTeams();
    Team getTeamById(Integer id);
    Team getTeamByMember(String username);
    List<User> getAvailableUsersForTeam();
    List<User> getAvailableLeaders();
}
