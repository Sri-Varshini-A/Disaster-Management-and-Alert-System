package com.example.disaster_management.service;

import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.example.disaster_management.model.User;
import com.example.disaster_management.repository.UserRepository;
@Service
public class AuthService {
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String registerUser(User user)
    {
        if(userRepository.existsByEmail(user.getEmail())) 
        {
            throw new RuntimeException("Error: Email is already in use!");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword())); // Hash the password before saving
        userRepository.save(user);
        return "User registered successfully";
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmail(email);
    }
}
