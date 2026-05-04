package com.urbanmove.dao;

import com.urbanmove.model.IoTGateway;
import com.urbanmove.model.SmartLight;

import java.sql.*;
import java.util.*;

/**
 * Implémentation DAO IoT — Cours JDBC
 * Pattern : DriverManager + finally block + PreparedStatement/Statement
 */
public class IoTDAOImpl implements IIoTDAO {

    private static final String URL  = "jdbc:mysql://localhost:3306/urbanmove?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8";
    private static final String USER = "root";
    private static final String PASS = "";

    static {
        try { Class.forName("com.mysql.cj.jdbc.Driver"); }
        catch (ClassNotFoundException e) { throw new RuntimeException("Driver MySQL introuvable", e); }
    }

    private Connection getConnection() throws SQLException {
        return DriverManager.getConnection(URL, USER, PASS);
    }

    @Override
    public List<IoTGateway> getAllGateways() throws SQLException {
        String sql = "SELECT * FROM iot_gateways ORDER BY city, gateway_id";
        Connection connexion = null;
        Statement st = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            st = connexion.createStatement();
            resultat = st.executeQuery(sql);
            List<IoTGateway> list = new ArrayList<>();
            while (resultat.next()) {
                IoTGateway g = new IoTGateway();
                g.setId(resultat.getInt("id"));
                g.setGatewayId(resultat.getString("gateway_id"));
                g.setCity(resultat.getString("city"));
                g.setLocationName(resultat.getString("location_name"));
                g.setStatus(resultat.getString("status"));
                g.setSignalStrength(resultat.getInt("signal_strength"));
                g.setDevicesConnected(resultat.getInt("devices_connected"));
                g.setProtocol(resultat.getString("protocol"));
                g.setFrequency(resultat.getString("frequency"));
                list.add(g);
            }
            return list;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (st != null) try { st.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public int countOnlineGateways() throws SQLException {
        return queryCount("SELECT COUNT(*) FROM iot_gateways WHERE status = 'online'");
    }

    @Override
    public List<SmartLight> getAllSmartLights() throws SQLException {
        String sql = "SELECT * FROM smart_lights ORDER BY city";
        Connection connexion = null;
        Statement st = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            st = connexion.createStatement();
            resultat = st.executeQuery(sql);
            List<SmartLight> list = new ArrayList<>();
            while (resultat.next()) {
                SmartLight s = new SmartLight();
                s.setId(resultat.getInt("id"));
                s.setCity(resultat.getString("city"));
                s.setTotalLights(resultat.getInt("total_lights"));
                s.setSmartLights(resultat.getInt("smart_lights"));
                s.setCoveragePct(resultat.getInt("coverage_pct"));
                s.setIntersections(resultat.getInt("intersections"));
                s.setAvgWaitReduction(resultat.getInt("avg_wait_reduction"));
                s.setPeakOptimization(resultat.getInt("peak_optimization"));
                s.setStatus(resultat.getString("status"));
                list.add(s);
            }
            return list;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (st != null) try { st.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public int totalSmartLightsCount() throws SQLException {
        return queryCount("SELECT COALESCE(SUM(smart_lights),0) FROM smart_lights");
    }

    @Override
    public int totalLightsCount() throws SQLException {
        return queryCount("SELECT COALESCE(SUM(total_lights),0) FROM smart_lights");
    }

    @Override
    public int totalIntersections() throws SQLException {
        return queryCount("SELECT COALESCE(SUM(intersections),0) FROM smart_lights");
    }

    @Override
    public Map<String, Object> getEnvironmental(int parkingId) throws SQLException {
        String sql = "SELECT * FROM iot_environmental WHERE parking_id = ? ORDER BY recorded_at DESC LIMIT 1";
        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql);
            ps.setInt(1, parkingId);
            resultat = ps.executeQuery();
            Map<String, Object> data = new HashMap<>();
            if (resultat.next()) {
                data.put("temperature", resultat.getDouble("temperature"));
                data.put("humidity", resultat.getDouble("humidity"));
                data.put("air_quality", resultat.getString("air_quality"));
                data.put("co2_level", resultat.getInt("co2_level"));
                data.put("noise_level", resultat.getInt("noise_level"));
            }
            return data;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public List<Map<String, Object>> getAlerts(String city, String type, int limit) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM alerts WHERE is_active = 1");
        List<Object> params = new ArrayList<>();
        if (city != null && !city.isEmpty()) { sql.append(" AND city = ?"); params.add(city); }
        if (type != null && !type.isEmpty()) { sql.append(" AND type = ?"); params.add(type); }
        sql.append(" ORDER BY created_at DESC LIMIT ?");
        params.add(limit);

        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql.toString());
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            resultat = ps.executeQuery();
            List<Map<String, Object>> list = new ArrayList<>();
            while (resultat.next()) {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",               resultat.getInt("id"));
                m.put("type",             resultat.getString("type"));
                m.put("title",            resultat.getString("title"));
                m.put("description",      resultat.getString("description"));
                m.put("city",             resultat.getString("city"));
                m.put("severity",         resultat.getString("severity"));
                m.put("source",           resultat.getString("source"));
                m.put("user_reports",     resultat.getInt("user_reports"));
                m.put("sensor_confidence",resultat.getDouble("sensor_confidence"));
                m.put("created_at",       resultat.getTimestamp("created_at"));
                list.add(m);
            }
            return list;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public int countReservations() throws SQLException {
        return queryCount("SELECT COUNT(*) FROM reservations");
    }

    private int queryCount(String sql) throws SQLException {
        Connection connexion = null;
        Statement st = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            st = connexion.createStatement();
            resultat = st.executeQuery(sql);
            resultat.next();
            return resultat.getInt(1);
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (st != null) try { st.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }
}
