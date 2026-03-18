package com.example.disaster_management.service;

import com.example.disaster_management.model.AlertStatus;
import com.example.disaster_management.model.DisasterAlert;
import com.example.disaster_management.repository.DisasterAlertRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.NodeList;
import java.io.ByteArrayInputStream;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class DisasterDataFetchService {

    @Autowired
    private DisasterAlertRepository repository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Run every 10 minutes
    @Scheduled(fixedRate = 600000)
    public void fetchNDMAAlerts() {
        System.out.println("Fetching disaster alerts from NDMA India...");

        Map<String, String> stateUrls = Map.ofEntries(
                Map.entry("Tamil Nadu", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_tamil.xml"),
                Map.entry("Karnataka", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_karnataka.xml"),
                Map.entry("Kerala", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_kerala.xml"),
                Map.entry("Andhra Pradesh", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_andhra.xml"),
                Map.entry("Telangana", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_telangana.xml"),
                Map.entry("Maharashtra", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_maharashtra.xml"),
                Map.entry("Gujarat", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_gujarat.xml"),
                Map.entry("Rajasthan", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_rajasthan.xml"),
                Map.entry("Madhya Pradesh", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_madhya_pradesh.xml"),
                Map.entry("Uttar Pradesh", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_uttar_pradesh.xml"),
                Map.entry("Punjab", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_punjab.xml"),
                Map.entry("Haryana", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_haryana.xml"),
                Map.entry("Himachal Pradesh", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_himachal.xml"),
                Map.entry("Uttarakhand", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_uttarakhand.xml"),
                Map.entry("West Bengal", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_west_bengal.xml"),
                Map.entry("Odisha", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_odisha.xml"),
                Map.entry("Bihar", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_bihar.xml"),
                Map.entry("Assam", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_assam.xml"),
                Map.entry("Jharkhand", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_jharkhand.xml"),
                Map.entry("Chhattisgarh", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_chhattisgarh.xml"),
                Map.entry("Delhi", "https://sachet.ndma.gov.in/cap_public_website/rss/rss_delhi.xml"));

        int totalCount = 0;

        for (Map.Entry<String, String> entry : stateUrls.entrySet()) {
            String stateName = entry.getKey();
            String url = entry.getValue();

            System.out.println("Fetching alerts for " + stateName + "...");
            try {
                byte[] xmlResponseBytes = restTemplate.getForObject(url, byte[].class);

                if (xmlResponseBytes != null && xmlResponseBytes.length > 0) {
                    DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
                    DocumentBuilder builder = factory.newDocumentBuilder();
                    Document document = builder
                            .parse(new ByteArrayInputStream(xmlResponseBytes));

                    NodeList itemList = document.getElementsByTagName("item");

                    // Format: Wed, 25 Feb 2026 08:31:58 GMT
                    DateTimeFormatter formatter = DateTimeFormatter.ofPattern("EEE, dd MMM yyyy HH:mm:ss z",
                            Locale.ENGLISH);

                    int count = 0;
                    for (int i = 0; i < itemList.getLength(); i++) {
                        Element item = (Element) itemList.item(i);

                        String title = getElementText(item, "title");
                        String category = getElementText(item, "category");
                        String author = getElementText(item, "author");
                        String pubDateStr = getElementText(item, "pubDate");

                        if (title != null && !title.isEmpty()) {
                            try {
                                if (repository.existsByDescription(title)) {
                                    continue;
                                }

                                DisasterAlert alert = new DisasterAlert();

                                String displayType = "Disaster Alert";
                                if (category != null) {
                                    switch (category.toLowerCase()) {
                                        case "met":
                                            displayType = "Weather";
                                            break;
                                        case "geo":
                                            displayType = "Earthquake / Tsunami";
                                            break;
                                        case "safety":
                                            displayType = "Public Safety";
                                            break;
                                        case "security":
                                            displayType = "Security";
                                            break;
                                        case "rescue":
                                            displayType = "Rescue Operations";
                                            break;
                                        case "fire":
                                            displayType = "Fire Risk";
                                            break;
                                        case "health":
                                            displayType = "Public Health";
                                            break;
                                        case "env":
                                            displayType = "Environmental Hazard";
                                            break;
                                        case "transport":
                                            displayType = "Transportation Hazard";
                                            break;
                                        case "infra":
                                            displayType = "Infrastructure Failure";
                                            break;
                                        default:
                                            displayType = category;
                                    }
                                }
                                alert.setType(displayType);
                                alert.setLocation(stateName);

                                String finalTitle = title;
                                if (finalTitle.length() > 990) {
                                    finalTitle = finalTitle.substring(0, 990) + "...";
                                }
                                alert.setDescription(finalTitle);

                                String alertSource = author != null ? author : "NDMA " + stateName;
                                if (alertSource.length() > 250) {
                                    alertSource = alertSource.substring(0, 250);
                                }
                                alert.setSource(alertSource);

                                // Fetch severity from the individual CAP XML link if available
                                String severityStr = "Low";
                                String link = getElementText(item, "link");
                                if (link != null && !link.isEmpty()) {
                                    try {
                                        byte[] capXmlBytes = restTemplate.getForObject(link, byte[].class);
                                        if (capXmlBytes != null && capXmlBytes.length > 0) {
                                            DocumentBuilder capBuilder = factory.newDocumentBuilder();
                                            Document capDoc = capBuilder.parse(new ByteArrayInputStream(capXmlBytes));
                                            String capSeverity = getElementText(capDoc.getDocumentElement(),
                                                    "cap:severity");
                                            if (capSeverity == null || capSeverity.isEmpty()) {
                                                capSeverity = getElementText(capDoc.getDocumentElement(), "severity");
                                            }
                                            if (capSeverity != null) {
                                                String lowerSev = capSeverity.toLowerCase();
                                                if (lowerSev.contains("extreme") || lowerSev.contains("severe")) {
                                                    severityStr = "High";
                                                } else if (lowerSev.contains("moderate")) {
                                                    severityStr = "Medium";
                                                }
                                            }

                                            String capEvent = getElementText(capDoc.getDocumentElement(), "cap:event");
                                            if (capEvent == null || capEvent.isEmpty()) {
                                                capEvent = getElementText(capDoc.getDocumentElement(), "event");
                                            }
                                            if (capEvent != null && !capEvent.isEmpty()) {
                                                alert.setType(capEvent);
                                            }
                                        }

                                        // Small delay for individual alert CAP fetch
                                        try {
                                            Thread.sleep(500);
                                        } catch (InterruptedException ie) {
                                            Thread.currentThread().interrupt();
                                        }
                                    } catch (Exception e) {
                                        System.err.println(
                                                "Could not fetch cap:severity for " + link + ": " + e.getMessage());
                                    }
                                }
                                alert.setSeverity(severityStr);

                                try {
                                    if (pubDateStr != null && !pubDateStr.isEmpty()) {
                                        LocalDateTime dateTime = LocalDateTime.parse(pubDateStr, formatter);
                                        alert.setTimestamp(dateTime);
                                    } else {
                                        alert.setTimestamp(LocalDateTime.now());
                                    }
                                } catch (DateTimeParseException e) {
                                    alert.setTimestamp(LocalDateTime.now());
                                }

                                alert.setStatus(AlertStatus.PENDING);
                                repository.save(alert);

                                count++;
                                if (count >= 10) // Limit per state to avoid overwhelming DB in one pass
                                    break;
                            } catch (Exception ex) {
                                System.err.println("Skipped an alert due to parsing error: " + ex.getMessage());
                            }
                        }
                    }
                    totalCount += count;
                }
            } catch (Exception e) {
                System.err.println("Error fetching NDMA data for " + stateName + ": " + e.getMessage());
            }

            // Be kind to the government servers! Prevent 429 Rate Limit Exceeded
            try {
                Thread.sleep(2000); // 2 second pause
            } catch (InterruptedException ie) {
                Thread.currentThread().interrupt();
            }
        }
        System.out.println("Imported " + totalCount + " new alerts across all states from NDMA!");
    }

    private String getElementText(Element parent, String tagName) {
        NodeList nodeList = parent.getElementsByTagName(tagName);
        if (nodeList.getLength() > 0) {
            return nodeList.item(0).getTextContent();
        }
        return null;
    }
}
