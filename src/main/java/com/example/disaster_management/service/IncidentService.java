package com.example.disaster_management.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.disaster_management.model.IncidentReport;
import com.example.disaster_management.model.IncidentStatus;
import com.example.disaster_management.model.Role;
import com.example.disaster_management.model.User;
import com.example.disaster_management.repository.IncidentReportRepository;
import com.example.disaster_management.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;

@Service
public class IncidentService {

    @Autowired
    private IncidentReportRepository incidentRepository;

    @Autowired
    private UserRepository userRepository;

    public IncidentReport createIncident(IncidentReport report, String citizenEmail) {
        // Find citizen
        User citizen = userRepository.findByEmail(citizenEmail)
                .orElseThrow(() -> new RuntimeException("Citizen not found"));

        report.setCitizen(citizen);
        report.setStatus(IncidentStatus.PENDING);

        // Auto-inherit region from Citizen to ensure correct routing
        if (report.getRegion() == null || report.getRegion().isEmpty()) {
            report.setRegion(citizen.getRegion());
        }

        // Also inherit the phone number
        if (report.getPhoneNumber() == null || report.getPhoneNumber().isEmpty()) {
            report.setPhoneNumber(citizen.getPhoneNumber());
        }

        return incidentRepository.save(report);
    }

    public List<IncidentReport> getIncidentsForResponder(String responderEmail) {
        User responder = userRepository.findByEmail(responderEmail)
                .orElseThrow(() -> new RuntimeException("Responder not found"));

        return incidentRepository.findByResponderIdOrderByReportedAtDesc(responder.getId());
    }

    public IncidentReport acknowledgeIncident(Long incidentId, String responderEmail) {
        IncidentReport incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        // Verify the responder owns this incident
        if (!incident.getResponder().getEmail().equals(responderEmail)) {
            throw new RuntimeException("Unauthorized: You are not assigned to this incident.");
        }

        if (incident.getStatus() == IncidentStatus.ASSIGNED) {
            incident.setStatus(IncidentStatus.ACKNOWLEDGED);
            incident.setAcknowledgedAt(LocalDateTime.now());
        }

        return incidentRepository.save(incident);
    }

    public IncidentReport resolveIncident(Long incidentId, String responderEmail) {
        IncidentReport incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        if (!incident.getResponder().getEmail().equals(responderEmail)) {
            throw new RuntimeException("Unauthorized: You are not assigned to this incident.");
        }

        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setResolvedAt(LocalDateTime.now());

        return incidentRepository.save(incident);
    }

    public List<IncidentReport> getAllIncidents() {
        return incidentRepository.findAllByOrderByReportedAtDesc();
    }

    public List<User> getAvailableResponders(String region) {
        return userRepository.findAvailableRespondersByRegion(region);
    }

    public IncidentReport assignIncident(Long incidentId, Long responderId) {
        IncidentReport incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        if (incident.getStatus() != IncidentStatus.PENDING) {
            throw new RuntimeException("Only PENDING incidents can be assigned.");
        }

        User responder = userRepository.findById(responderId)
                .orElseThrow(() -> new RuntimeException("Responder not found"));

        if (responder.getRole() != Role.RESPONDER) {
            throw new RuntimeException("User is not a RESPONDER");
        }

        incident.setResponder(responder);
        incident.setStatus(IncidentStatus.ASSIGNED);
        incident.setAssignedAt(LocalDateTime.now());

        return incidentRepository.save(incident);
    }

    public IncidentReport submitIncidentReport(Long incidentId, String responderEmail, String finalStatus, Integer evalCount, String action, org.springframework.web.multipart.MultipartFile file) {
        IncidentReport incident = incidentRepository.findById(incidentId)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        if (!incident.getResponder().getEmail().equals(responderEmail)) {
            throw new RuntimeException("Unauthorized: You are not assigned to this incident.");
        }

        incident.setFinalMissionStatus(finalStatus);
        incident.setEvacuationCount(evalCount);
        incident.setActionTaken(action);

        if (file != null && !file.isEmpty()) {
            try {
                java.nio.file.Path uploadsDir = java.nio.file.Paths.get("uploads");
                if (!java.nio.file.Files.exists(uploadsDir)) {
                    java.nio.file.Files.createDirectories(uploadsDir);
                }
                String filename = java.util.UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
                java.nio.file.Path filePath = uploadsDir.resolve(filename);
                java.nio.file.Files.copy(file.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                incident.setPhotographicEvidencePath("/uploads/" + filename);
            } catch (Exception e) {
                throw new RuntimeException("Failed to store file", e);
            }
        }

        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setResolvedAt(LocalDateTime.now());

        return incidentRepository.save(incident);
    }
}
