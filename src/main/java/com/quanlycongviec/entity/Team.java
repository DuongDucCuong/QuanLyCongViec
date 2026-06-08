package com.quanlycongviec.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "teams")
public class Team {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    // Trưởng nhóm (Leader)
    @OneToOne
    @JoinColumn(name = "leader_id")
    @JsonIgnoreProperties({"team", "password"})
    private User leader;

    // Các thành viên trong nhóm
    @OneToMany(mappedBy = "team", fetch = FetchType.LAZY)
    @JsonIgnoreProperties({"team", "password"})
    private List<User> members;

    public Team() {}

    public Team(String name, User leader) {
        this.name = name;
        this.leader = leader;
    }

    // Getters và Setters
    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public User getLeader() { return leader; }
    public void setLeader(User leader) { this.leader = leader; }
    public List<User> getMembers() { return members; }
    public void setMembers(List<User> members) { this.members = members; }
}
