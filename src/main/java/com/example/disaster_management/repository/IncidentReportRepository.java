package com.example.disaster_management.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.disaster_management.model.IncidentReport;

import java.util.List;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, Long> {

    // Find all incidents assigned to a specific responder
    List<IncidentReport> findByResponderIdOrderByReportedAtDesc(Long responderId);

    // Find all incidents submitted by a specific citizen
    List<IncidentReport> findByCitizenIdOrderByReportedAtDesc(Long citizenId);

    // Find all incidents in a specific region
    List<IncidentReport> findByRegionOrderByReportedAtDesc(String region);

    // Find all incidents ordered by reported time desc
    List<IncidentReport> findAllByOrderByReportedAtDesc();
}
