package com.urbanmove.dao;

import com.urbanmove.model.Parking;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

/**
 * Implémentation DAO Parking — Cours JDBC
 * Pattern : DriverManager + finally block + PreparedStatement
 */
public class ParkingDAOImpl implements IParkingDAO {

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
    public List<Parking> findAll() throws SQLException {
        return findByFilter(null, null);
    }

    @Override
    public List<Parking> findByCity(String city) throws SQLException {
        return findByFilter(city, null);
    }

    @Override
    public List<Parking> findByFilter(String city, String type) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM parkings WHERE is_active = 1");
        List<Object> params = new ArrayList<>();
        if (city != null && !city.isEmpty()) { sql.append(" AND city = ?"); params.add(city); }
        if (type != null && !type.isEmpty()) { sql.append(" AND type = ?"); params.add(type); }
        sql.append(" ORDER BY rating DESC");

        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql.toString());
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            resultat = ps.executeQuery();
            List<Parking> list = new ArrayList<>();
            while (resultat.next()) list.add(mapParking(resultat));
            return list;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public Parking findById(int id) throws SQLException {
        String sql = "SELECT * FROM parkings WHERE id = ?";
        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql);
            ps.setInt(1, id);
            resultat = ps.executeQuery();
            if (resultat.next()) return mapParking(resultat);
            return null;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public List<String> getAmenities(int parkingId) throws SQLException {
        String sql = "SELECT amenity FROM parking_amenities WHERE parking_id = ?";
        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql);
            ps.setInt(1, parkingId);
            resultat = ps.executeQuery();
            List<String> list = new ArrayList<>();
            while (resultat.next()) list.add(resultat.getString("amenity"));
            return list;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public int countAll() throws SQLException {
        return queryCount("SELECT COUNT(*) FROM parkings WHERE is_active = 1");
    }

    @Override
    public int totalSpots() throws SQLException {
        return queryCount("SELECT COALESCE(SUM(total_spots),0) FROM parkings WHERE is_active = 1");
    }

    @Override
    public int totalAvailable() throws SQLException {
        return queryCount("SELECT COALESCE(SUM(available_spots),0) FROM parkings WHERE is_active = 1");
    }

    @Override
    public int totalSensors() throws SQLException {
        return queryCount("SELECT COALESCE(SUM(total_sensors),0) FROM parkings WHERE is_active = 1 AND has_sensors = 1");
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

    private Parking mapParking(ResultSet rs) throws SQLException {
        Parking p = new Parking();
        p.setId(rs.getInt("id"));
        p.setName(rs.getString("name"));
        p.setDescription(rs.getString("description"));
        p.setType(rs.getString("type"));
        p.setStreet(rs.getString("street"));
        p.setCity(rs.getString("city"));
        p.setPostalCode(rs.getString("postal_code"));
        p.setLat(rs.getDouble("lat"));
        p.setLng(rs.getDouble("lng"));
        p.setTotalSpots(rs.getInt("total_spots"));
        p.setAvailableSpots(rs.getInt("available_spots"));
        p.setHourlyPrice(rs.getDouble("hourly_price"));
        p.setDailyPrice(rs.getDouble("daily_price"));
        p.setMonthlyPrice(rs.getDouble("monthly_price"));
        p.setRating(rs.getDouble("rating"));
        p.setReviewCount(rs.getInt("review_count"));
        p.setHasSensors(rs.getBoolean("has_sensors"));
        p.setSensorProvider(rs.getString("sensor_provider"));
        p.setSensorProtocol(rs.getString("sensor_protocol"));
        p.setTotalSensors(rs.getInt("total_sensors"));
        p.setActive(rs.getBoolean("is_active"));
        return p;
    }
}
