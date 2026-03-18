package com.example.disaster_management.service;

import com.example.disaster_management.model.AlertStatus;
import com.example.disaster_management.model.DisasterAlert;
import com.example.disaster_management.repository.DisasterAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class DisasterAlertService {

    @Autowired
    private DisasterAlertRepository alertRepository;

    public List<DisasterAlert> getAllAlerts() {
        return alertRepository.findAll();
    }

    public List<DisasterAlert> getAlertsByStatus(AlertStatus status) {
        return alertRepository.findByStatus(status);
    }

    public List<DisasterAlert> getAlertsByTypeAndStatus(String type, AlertStatus status) {
        return alertRepository.findByTypeAndStatus(type, status);
    }

    public List<DisasterAlert> getAlertsByLocationAndStatus(String location, AlertStatus status) {
        return alertRepository.findByLocationAndStatus(location, status);
    }

    public List<DisasterAlert> getAlertsByLocationAndTypeAndStatus(String location, String type, AlertStatus status) {
        return alertRepository.findByLocationAndTypeAndStatus(location, type, status);
    }

    public Optional<DisasterAlert> getAlertById(Long id) {
        return alertRepository.findById(id);
    }

    public DisasterAlert updateAlertStatus(Long id, AlertStatus status) {
        DisasterAlert alert = alertRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alert not found"));
        alert.setStatus(status);
        return alertRepository.save(alert);
    }

    public DisasterAlert createAlert(DisasterAlert alert) {
        return alertRepository.save(alert);
    }
}
