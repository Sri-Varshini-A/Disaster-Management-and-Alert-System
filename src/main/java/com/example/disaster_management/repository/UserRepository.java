package com.example.disaster_management.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.disaster_management.model.User;
import com.example.disaster_management.model.Role;
import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email); // Used for authentication to find user by email

    Boolean existsByEmail(String email); // Useful for registration to check if email is already taken

    // Find users by role and region (e.g. Find RESPONDERs in "Tamil Nadu")
    List<User> findByRoleAndRegion(Role role, String region);

    @org.springframework.data.jpa.repository.Query(
        "SELECT u FROM User u WHERE u.role = 'RESPONDER' AND u.region = :region " +
        "AND NOT EXISTS (" +
        "   SELECT 1 FROM IncidentReport i WHERE i.responder = u " +
        "   AND i.status IN ('ASSIGNED', 'ACKNOWLEDGED')" +
        ")"
    )
    List<User> findAvailableRespondersByRegion(@org.springframework.data.repository.query.Param("region") String region);
}
