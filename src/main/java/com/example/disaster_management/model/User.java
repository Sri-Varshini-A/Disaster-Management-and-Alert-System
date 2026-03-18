package com.example.disaster_management.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "users")
@Data // Lombok generates Getters, Setters, toString
@NoArgsConstructor // Required by Hibernate
@AllArgsConstructor
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String fullName;
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String password; // In production, store hashed passwords!
    @Column(nullable = false)
    private String phoneNumber;
    @Column(nullable = false)
    private String region;

    @Enumerated(EnumType.STRING) // Stores "ADMIN" as a string in DB
    @Column(nullable = false)
    private Role role;
}
