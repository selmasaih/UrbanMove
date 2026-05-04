package com.urbanmove.model;

import java.sql.Timestamp;

public class Alert {
    private int id;
    private String type;
    private String title;
    private String description;
    private double lat;
    private double lng;
    private String street;
    private String city;
    private String severity;
    private String source;
    private Integer reportedBy;
    private boolean active;
    private int userReports;
    private double sensorConfidence;
    private Timestamp estimatedEnd;
    private Timestamp createdAt;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }
    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }
    public Integer getReportedBy() { return reportedBy; }
    public void setReportedBy(Integer reportedBy) { this.reportedBy = reportedBy; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public int getUserReports() { return userReports; }
    public void setUserReports(int userReports) { this.userReports = userReports; }
    public double getSensorConfidence() { return sensorConfidence; }
    public void setSensorConfidence(double sensorConfidence) { this.sensorConfidence = sensorConfidence; }
    public Timestamp getEstimatedEnd() { return estimatedEnd; }
    public void setEstimatedEnd(Timestamp estimatedEnd) { this.estimatedEnd = estimatedEnd; }
    public Timestamp getCreatedAt() { return createdAt; }
    public void setCreatedAt(Timestamp createdAt) { this.createdAt = createdAt; }

    public String getTypeIcon() {
        if (type == null) return "i";
        switch (type) {
            case "accident": return "[Car]";
            case "works": return "[Works]";
            case "event": return "[Event]";
            case "closure": return "[Closed]";
            case "traffic": return "[Light]";
            case "weather": return "[Rain]";
            case "construction": return "[Build]";
            default: return "[Info]";
        }
    }
    public String getSourceLabel() {
        if (source == null) return "Inconnu";
        switch (source) {
            case "sensor": return "Capteurs IoT (LoRaWAN)";
            case "authority": return "Autorites routieres";
            case "system": return "Systeme IA";
            default: return "Signalement citoyen";
        }
    }
}
