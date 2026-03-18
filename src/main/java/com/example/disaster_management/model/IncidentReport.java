package com.example.disaster_management.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class IncidentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // The citizen who requested help
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id", nullable = false)
    private User citizen;

    // Type of emergency (from the dropdown or custom)
    @Column(nullable = false)
    private String emergencyType;

    // Latitude and Longitude String (e.g. "28.7041, 77.1025")
    @Column(nullable = false)
    private String locationCoordinates;

    // Human-readable address
    @Column(length = 500)
    private String address;

    // Description of the emergency
    @Column(length = 1000)
    private String description;

    // The citizen's phone number at time of reporting
    @Column(nullable = false)
    private String phoneNumber;

    // The state where the disaster occurred, used for auto-routing to responders
    @Column(nullable = false)
    private String region;

    // The status of the response
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IncidentStatus status = IncidentStatus.PENDING;

    // The assigned responder
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responder_id")
    private User responder;

    // Timestamps for performance tracking
    @Column(nullable = false)
    private LocalDateTime reportedAt;

    private LocalDateTime assignedAt;

    private LocalDateTime acknowledgedAt;

    private LocalDateTime resolvedAt;

    // Post-Mission Report Fields
    @Column(length = 50)
    private String finalMissionStatus; // "SECURED", "REQUIRES BACKUP", "FALSE ALARM"

    @Column
    private Integer evacuationCount;

    @Column(length = 2000)
    private String actionTaken;

    @Column(length = 1000)
    private String photographicEvidencePath;

    @PrePersist
    protected void onCreate() {
        reportedAt = LocalDateTime.now();
    }
}
