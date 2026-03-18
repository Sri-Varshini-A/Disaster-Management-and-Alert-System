package com.example.disaster_management.repository;

import com.example.disaster_management.model.DisasterAlert;
import com.example.disaster_management.model.AlertStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisasterAlertRepository extends JpaRepository<DisasterAlert, Long> {
    List<DisasterAlert> findByStatus(AlertStatus status);

    List<DisasterAlert> findByTypeAndStatus(String type, AlertStatus status);

    List<DisasterAlert> findByLocationContainingIgnoreCaseAndStatus(String location, AlertStatus status);

    List<DisasterAlert> findByLocationAndStatus(String location, AlertStatus status);

    List<DisasterAlert> findByLocationAndTypeAndStatus(String location, String type, AlertStatus status);

    boolean existsByDescription(String description);
}
