package com.example.disaster_management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.disaster_management.dto.AuthResponse;
import com.example.disaster_management.dto.LoginRequest;
import com.example.disaster_management.dto.RegisterRequest;
import com.example.disaster_management.model.User;
import com.example.disaster_management.repository.UserRepository;
import com.example.disaster_management.security.JwtUtils;
import com.example.disaster_management.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private JwtUtils jwtUtils;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository repository;

    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        // 1. Map DTO to User Entity
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword()); // Service will hash this!
        user.setPhoneNumber(request.getPhoneNumber());
        user.setRegion(request.getRegion());
        user.setRole(request.getRole());

        // 2. Call Service
        String response = authService.registerUser(user);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        // 1. Authenticate the user (Checks password matches hash in DB)
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword()));

        // 2. If successful, generate JWT Token
        if (authentication.isAuthenticated()) {
            User user = repository.findByEmail(request.getEmail()).orElseThrow();

            // 2. Generate Token with custom claims
            String token = jwtUtils.generateToken(request.getEmail(), user.getPhoneNumber());

            // 3. FETCH THE ROLE
            String role = user.getRole().name(); // "ADMIN" or "RESPONDER"
            return ResponseEntity.ok(new AuthResponse(token, role));
        } else {
            throw new RuntimeException("Invalid user request!");
        }
    }
}
