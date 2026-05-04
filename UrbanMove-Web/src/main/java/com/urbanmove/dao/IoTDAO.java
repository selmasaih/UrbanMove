package com.urbanmove.dao;

import com.urbanmove.model.IoTGateway;
import com.urbanmove.model.SmartLight;
import com.urbanmove.util.DBConnection;

import java.sql.*;
import java.util.*;

/**
 * IoT DAO — JDBC access for all IoT-related tables:
 * iot_gateways, smart_lights, iot_environmental, smart_light_hourly
 */
public class IoTDAO {

    // ── Gateways ──
    public List<IoTGateway> getAllGateways() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT * FROM iot_gateways ORDER BY city, gateway_id")) {
            List<IoTGateway> list = new ArrayList<>();
            while (rs.next()) {
                IoTGateway g = new IoTGateway();
                g.setId(rs.getInt("id"));
                g.setGatewayId(rs.getString("gateway_id"));
                g.setCity(rs.getString("city"));
                g.setLocationName(rs.getString("location_name"));
                g.setStatus(rs.getString("status"));
                g.setSignalStrength(rs.getInt("signal_strength"));
                g.setDevicesConnected(rs.getInt("devices_connected"));
                g.setProtocol(rs.getString("protocol"));
                g.setFrequency(rs.getString("frequency"));
                list.add(g);
            }
            return list;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int countOnlineGateways() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM iot_gateways WHERE status = 'online'")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    // ── Smart Lights ──
    public List<SmartLight> getAllSmartLights() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT * FROM smart_lights ORDER BY city")) {
            List<SmartLight> list = new ArrayList<>();
            while (rs.next()) {
                SmartLight s = new SmartLight();
                s.setId(rs.getInt("id"));
                s.setCity(rs.getString("city"));
                s.setTotalLights(rs.getInt("total_lights"));
                s.setSmartLights(rs.getInt("smart_lights"));
                s.setCoveragePct(rs.getInt("coverage_pct"));
                s.setIntersections(rs.getInt("intersections"));
                s.setAvgWaitReduction(rs.getInt("avg_wait_reduction"));
                s.setPeakOptimization(rs.getInt("peak_optimization"));
                s.setStatus(rs.getString("status"));
                list.add(s);
            }
            return list;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int totalSmartLightsCount() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COALESCE(SUM(smart_lights),0) FROM smart_lights")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int totalLightsCount() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COALESCE(SUM(total_lights),0) FROM smart_lights")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int totalIntersections() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COALESCE(SUM(intersections),0) FROM smart_lights")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    // ── Environmental ──
    public Map<String, Object> getEnvironmental(int parkingId) throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT * FROM iot_environmental WHERE parking_id = ? ORDER BY recorded_at DESC LIMIT 1")) {
            ps.setInt(1, parkingId);
            ResultSet rs = ps.executeQuery();
            Map<String, Object> data = new HashMap<>();
            if (rs.next()) {
                data.put("temperature", rs.getDouble("temperature"));
                data.put("humidity", rs.getDouble("humidity"));
                data.put("air_quality", rs.getString("air_quality"));
                data.put("co2_level", rs.getInt("co2_level"));
                data.put("noise_level", rs.getInt("noise_level"));
            }
            return data;
        } finally { DBConnection.releaseConnection(conn); }
    }

    // ── Alerts ──
    public List<Map<String, Object>> getAlerts(String city, String type, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM alerts WHERE is_active = 1");
        List<Object> params = new ArrayList<>();
        if (city != null && !city.isEmpty()) { sql.append(" AND city = ?"); params.add(city); }
        if (type != null && !type.isEmpty()) { sql.append(" AND type = ?"); params.add(type); }
        sql.append(" ORDER BY created_at DESC LIMIT ?");
        params.add(limit);

        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            List<Map<String, Object>> list = new ArrayList<>();
            while (rs.next()) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", rs.getInt("id"));
                m.put("type", rs.getString("type"));
                m.put("title", rs.getString("title"));
                m.put("description", rs.getString("description"));
                m.put("city", rs.getString("city"));
                m.put("severity", rs.getString("severity"));
                m.put("source", rs.getString("source"));
                m.put("user_reports", rs.getInt("user_reports"));
                m.put("sensor_confidence", rs.getDouble("sensor_confidence"));
                m.put("created_at", rs.getTimestamp("created_at"));
                list.add(m);
            }
            return list;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int countReservations() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM reservations")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }
}
