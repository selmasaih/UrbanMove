package com.urbanmove.model;

public class SmartLight {
    private int id;
    private String city;
    private int totalLights;
    private int smartLights;
    private int coveragePct;
    private int intersections;
    private int avgWaitReduction;
    private int peakOptimization;
    private String status;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public int getTotalLights() { return totalLights; }
    public void setTotalLights(int t) { this.totalLights = t; }
    public int getSmartLights() { return smartLights; }
    public void setSmartLights(int s) { this.smartLights = s; }
    public int getCoveragePct() { return coveragePct; }
    public void setCoveragePct(int c) { this.coveragePct = c; }
    public int getIntersections() { return intersections; }
    public void setIntersections(int i) { this.intersections = i; }
    public int getAvgWaitReduction() { return avgWaitReduction; }
    public void setAvgWaitReduction(int a) { this.avgWaitReduction = a; }
    public int getPeakOptimization() { return peakOptimization; }
    public void setPeakOptimization(int p) { this.peakOptimization = p; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
