package com.example.disaster_management.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.disaster_management.model.IncidentReport;
import com.example.disaster_management.service.IncidentService;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@CrossOrigin(origins = "http://localhost:3000")
public class IncidentController {

    @Autowired
    private IncidentService incidentService;

    // Citizens post an emergency
    @PostMapping
    public ResponseEntity<IncidentReport> reportIncident(
            @RequestBody IncidentReport report,
            Authentication authentication) {

        String citizenEmail = authentication.getName();
        IncidentReport savedReport = incidentService.createIncident(report, citizenEmail);
        return ResponseEntity.ok(savedReport);
    }

    // Responders view their assigned queue
    @GetMapping("/my-tasks")
    public ResponseEntity<List<IncidentReport>> getMyTasks(Authentication authentication) {
        String responderEmail = authentication.getName();
        List<IncidentReport> tasks = incidentService.getIncidentsForResponder(responderEmail);
        return ResponseEntity.ok(tasks);
    }

    // Responders acknowledge reading a task
    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<IncidentReport> acknowledgeIncident(
            @PathVariable Long id,
            Authentication authentication) {

        String responderEmail = authentication.getName();
        IncidentReport ackReport = incidentService.acknowledgeIncident(id, responderEmail);
        return ResponseEntity.ok(ackReport);
    }

    // Responders resolve a task
    @PutMapping("/{id}/resolve")
    public ResponseEntity<IncidentReport> resolveIncident(
            @PathVariable Long id,
            Authentication authentication) {

        String responderEmail = authentication.getName();
        IncidentReport resolvedReport = incidentService.resolveIncident(id, responderEmail);
        return ResponseEntity.ok(resolvedReport);
    }

    // Admin view all incidents
    @GetMapping("/all")
    public ResponseEntity<List<IncidentReport>> getAllIncidents() {
        List<IncidentReport> allIncidents = incidentService.getAllIncidents();
        return ResponseEntity.ok(allIncidents);
    }

    // Admin view available responders in a region
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/available-responders")
    public ResponseEntity<List<com.example.disaster_management.model.User>> getAvailableResponders(@RequestParam String region) {
        List<com.example.disaster_management.model.User> responders = incidentService.getAvailableResponders(region);
        return ResponseEntity.ok(responders);
    }

    // Admin assign an incident to a responder
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/{id}/assign")
    public ResponseEntity<IncidentReport> assignIncident(
            @PathVariable Long id,
            @RequestParam Long responderId) {
        IncidentReport assignedReport = incidentService.assignIncident(id, responderId);
        return ResponseEntity.ok(assignedReport);
    }

    // Responder submit report with photographic evidence
    @PostMapping(value = "/{id}/report", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<IncidentReport> submitReport(
            @PathVariable Long id,
            @RequestParam("finalMissionStatus") String finalMissionStatus,
            @RequestParam("evacuationCount") Integer evacuationCount,
            @RequestParam("actionTaken") String actionTaken,
            @RequestParam(value = "evidence", required = false) org.springframework.web.multipart.MultipartFile evidence,
            Authentication authentication) {
        
        String responderEmail = authentication.getName();
        IncidentReport report = incidentService.submitIncidentReport(id, responderEmail, finalMissionStatus, evacuationCount, actionTaken, evidence);
        return ResponseEntity.ok(report);
    }
}
