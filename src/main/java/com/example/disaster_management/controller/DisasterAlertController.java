package com.example.disaster_management.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.disaster_management.model.AlertStatus;
import com.example.disaster_management.model.DisasterAlert;
import com.example.disaster_management.model.User;
import com.example.disaster_management.repository.UserRepository;
import com.example.disaster_management.service.DisasterAlertService;

@RestController
@RequestMapping("/api/disasters")
public class DisasterAlertController {

    @Autowired
    private DisasterAlertService alertService;

    @Autowired
    private UserRepository userRepository;

    // Accessible to all (Citizens and Responders will want to see BROADCASTED
    // alerts)

    @GetMapping
    public ResponseEntity<List<DisasterAlert>> getAlerts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type) {

        AlertStatus alertStatus = null;
        if (status != null) {
            try {
                alertStatus = AlertStatus.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String tempUserRegion = null;

        if (authentication != null && authentication.getName() != null
                && !authentication.getName().equals("anonymousUser")) {
            String email = authentication.getName();
            User currentUser = userRepository.findByEmail(email).orElse(null);
            if (currentUser != null && currentUser.getRole().name().equals("CITIZEN")) {
                tempUserRegion = currentUser.getRegion();
            }
        }

        final String userRegion = tempUserRegion;

        List<DisasterAlert> alerts;

        if (userRegion != null) {
            // Citizen specific alerts
            if (type != null && alertStatus != null) {
                alerts = alertService.getAlertsByLocationAndTypeAndStatus(userRegion, type, alertStatus);
            } else if (alertStatus != null) {
                alerts = alertService.getAlertsByLocationAndStatus(userRegion, alertStatus);
            } else {
                // Fallback if no status, filter getAll by region manually
                alerts = alertService.getAllAlerts().stream()
                        .filter(a -> a.getLocation().equalsIgnoreCase(userRegion))
                        .collect(java.util.stream.Collectors.toList());
            }
        } else {
            // Admins/Responders
            if (type != null && alertStatus != null) {
                alerts = alertService.getAlertsByTypeAndStatus(type, alertStatus);
            } else if (alertStatus != null) {
                alerts = alertService.getAlertsByStatus(alertStatus);
            } else {
                alerts = alertService.getAllAlerts();
            }
        }

        return ResponseEntity.ok(alerts);
    }

    // Admins only: verify and broadcast a pending alert
    @PutMapping("/{id}/verify")
    public ResponseEntity<DisasterAlert> verifyAlert(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "BROADCASTED") String status) {
        try {
            AlertStatus newStatus = AlertStatus.valueOf(status.toUpperCase());
            DisasterAlert updated = alertService.updateAlertStatus(id, newStatus);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
