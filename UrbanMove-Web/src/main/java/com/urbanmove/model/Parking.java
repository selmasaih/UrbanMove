package com.urbanmove.model;

public class Parking {
    private int id;
    private String name;
    private String description;
    private String type;
    private String street;
    private String city;
    private String postalCode;
    private double lat;
    private double lng;
    private int totalSpots;
    private int availableSpots;
    private double hourlyPrice;
    private double dailyPrice;
    private double monthlyPrice;
    private double rating;
    private int reviewCount;
    private boolean hasSensors;
    private String sensorProvider;
    private String sensorProtocol;
    private int totalSensors;
    private boolean active;

    // Getters & Setters
    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getStreet() { return street; }
    public void setStreet(String street) { this.street = street; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getPostalCode() { return postalCode; }
    public void setPostalCode(String postalCode) { this.postalCode = postalCode; }
    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }
    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }
    public int getTotalSpots() { return totalSpots; }
    public void setTotalSpots(int totalSpots) { this.totalSpots = totalSpots; }
    public int getAvailableSpots() { return availableSpots; }
    public void setAvailableSpots(int availableSpots) { this.availableSpots = availableSpots; }
    public double getHourlyPrice() { return hourlyPrice; }
    public void setHourlyPrice(double hourlyPrice) { this.hourlyPrice = hourlyPrice; }
    public double getDailyPrice() { return dailyPrice; }
    public void setDailyPrice(double dailyPrice) { this.dailyPrice = dailyPrice; }
    public double getMonthlyPrice() { return monthlyPrice; }
    public void setMonthlyPrice(double monthlyPrice) { this.monthlyPrice = monthlyPrice; }
    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }
    public int getReviewCount() { return reviewCount; }
    public void setReviewCount(int reviewCount) { this.reviewCount = reviewCount; }
    public boolean isHasSensors() { return hasSensors; }
    public void setHasSensors(boolean hasSensors) { this.hasSensors = hasSensors; }
    public String getSensorProvider() { return sensorProvider; }
    public void setSensorProvider(String sensorProvider) { this.sensorProvider = sensorProvider; }
    public String getSensorProtocol() { return sensorProtocol; }
    public void setSensorProtocol(String sensorProtocol) { this.sensorProtocol = sensorProtocol; }
    public int getTotalSensors() { return totalSensors; }
    public void setTotalSensors(int totalSensors) { this.totalSensors = totalSensors; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }

    public int getOccupiedSpots() { return totalSpots - availableSpots; }
    public int getOccupancyRate() { return totalSpots > 0 ? Math.round(((float)(totalSpots - availableSpots) / totalSpots) * 100) : 0; }
    public String getAvailabilityStatus() {
        if (totalSpots == 0) return "N/A";
        double ratio = (double) availableSpots / totalSpots;
        if (ratio == 0) return "Complet";
        if (ratio <= 0.1) return "Quasi-plein";
        if (ratio <= 0.3) return "Limité";
        return "Disponible";
    }
    public String getStatusClass() {
        if (totalSpots == 0) return "badge-gray";
        double ratio = (double) availableSpots / totalSpots;
        if (ratio <= 0.1) return "badge-danger";
        if (ratio <= 0.3) return "badge-warning";
        return "badge-success";
    }
}
