package com.urbanmove.model;

public class IoTGateway {
    private int id;
    private String gatewayId;
    private String city;
    private String locationName;
    private String status;
    private int signalStrength;
    private int devicesConnected;
    private String protocol;
    private String frequency;

    public int getId() { return id; }
    public void setId(int id) { this.id = id; }
    public String getGatewayId() { return gatewayId; }
    public void setGatewayId(String gatewayId) { this.gatewayId = gatewayId; }
    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }
    public String getLocationName() { return locationName; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getSignalStrength() { return signalStrength; }
    public void setSignalStrength(int signalStrength) { this.signalStrength = signalStrength; }
    public int getDevicesConnected() { return devicesConnected; }
    public void setDevicesConnected(int devicesConnected) { this.devicesConnected = devicesConnected; }
    public String getProtocol() { return protocol; }
    public void setProtocol(String protocol) { this.protocol = protocol; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public boolean isOnline() { return "online".equals(status); }
}
