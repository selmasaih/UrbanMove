package com.urbanmove.dao;

import com.urbanmove.model.Parking;
import com.urbanmove.util.DBConnection;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class ParkingDAO {

    public List<Parking> findAll() throws SQLException {
        return findByFilter(null, null);
    }

    public List<Parking> findByCity(String city) throws SQLException {
        return findByFilter(city, null);
    }

    public List<Parking> findByFilter(String city, String type) throws SQLException {
        StringBuilder sql = new StringBuilder("SELECT * FROM parkings WHERE is_active = 1");
        List<Object> params = new ArrayList<>();
        if (city != null && !city.isEmpty()) { sql.append(" AND city = ?"); params.add(city); }
        if (type != null && !type.isEmpty()) { sql.append(" AND type = ?"); params.add(type); }
        sql.append(" ORDER BY rating DESC");

        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql.toString())) {
            for (int i = 0; i < params.size(); i++) ps.setObject(i + 1, params.get(i));
            ResultSet rs = ps.executeQuery();
            List<Parking> list = new ArrayList<>();
            while (rs.next()) list.add(mapParking(rs));
            return list;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public Parking findById(int id) throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT * FROM parkings WHERE id = ?")) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapParking(rs);
            return null;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public List<String> getAmenities(int parkingId) throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement("SELECT amenity FROM parking_amenities WHERE parking_id = ?")) {
            ps.setInt(1, parkingId);
            ResultSet rs = ps.executeQuery();
            List<String> list = new ArrayList<>();
            while (rs.next()) list.add(rs.getString("amenity"));
            return list;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int countAll() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM parkings WHERE is_active = 1")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int totalSpots() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COALESCE(SUM(total_spots),0) FROM parkings WHERE is_active = 1")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int totalAvailable() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COALESCE(SUM(available_spots),0) FROM parkings WHERE is_active = 1")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int totalSensors() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COALESCE(SUM(total_sensors),0) FROM parkings WHERE is_active = 1 AND has_sensors = 1")) {
            rs.next(); return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
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
