package com.example.disaster_management.model;

public enum IncidentStatus {
    PENDING, // Citizen submitted
    ASSIGNED, // Auto-assigned to a responder
    ACKNOWLEDGED, // Responder saw and accepted
    RESOLVED // Responder marked as handled
}
