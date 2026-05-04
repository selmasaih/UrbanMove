package com.urbanmove.dao;

import com.urbanmove.model.IoTGateway;
import com.urbanmove.model.SmartLight;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;

/**
 * Interface DAO pour les données IoT — Pattern cours JDBC
 */
public interface IIoTDAO {
    List<IoTGateway> getAllGateways() throws SQLException;
    int countOnlineGateways() throws SQLException;
    List<SmartLight> getAllSmartLights() throws SQLException;
    int totalSmartLightsCount() throws SQLException;
    int totalLightsCount() throws SQLException;
    int totalIntersections() throws SQLException;
    Map<String, Object> getEnvironmental(int parkingId) throws SQLException;
    List<Map<String, Object>> getAlerts(String city, String type, int limit) throws SQLException;
    int countReservations() throws SQLException;
}
