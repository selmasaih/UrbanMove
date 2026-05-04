package com.urbanmove.dao;

import com.urbanmove.model.User;
import com.urbanmove.util.DBConnection;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.*;

public class UserDAO {

    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE email = ?";
        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapUser(rs);
            return null;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public User findById(int id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";
        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, id);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) return mapUser(rs);
            return null;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public User register(String firstName, String lastName, String email, String phone, String password, String city) throws SQLException {
        String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));
        String sql = "INSERT INTO users (first_name, last_name, email, phone, password_hash, city, is_verified) VALUES (?,?,?,?,?,?,1)";
        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, phone);
            ps.setString(5, hash);
            ps.setString(6, city);
            ps.executeUpdate();
            ResultSet keys = ps.getGeneratedKeys();
            if (keys.next()) return findById(keys.getInt(1));
            return null;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public User authenticate(String email, String password) throws SQLException {
        String sql = "SELECT * FROM users WHERE email = ? AND is_active = 1";
        Connection conn = DBConnection.getConnection();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, email);
            ResultSet rs = ps.executeQuery();
            if (rs.next()) {
                String hash = rs.getString("password_hash");
                if (BCrypt.checkpw(password, hash)) {
                    User user = mapUser(rs);
                    // Update last login
                    try (PreparedStatement up = conn.prepareStatement("UPDATE users SET last_login = NOW() WHERE id = ?")) {
                        up.setInt(1, user.getId());
                        up.executeUpdate();
                    }
                    return user;
                }
            }
            return null;
        } finally { DBConnection.releaseConnection(conn); }
    }

    public int countAll() throws SQLException {
        Connection conn = DBConnection.getConnection();
        try (Statement st = conn.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM users")) {
            rs.next();
            return rs.getInt(1);
        } finally { DBConnection.releaseConnection(conn); }
    }

    private User mapUser(ResultSet rs) throws SQLException {
        User u = new User();
        u.setId(rs.getInt("id"));
        u.setFirstName(rs.getString("first_name"));
        u.setLastName(rs.getString("last_name"));
        u.setEmail(rs.getString("email"));
        u.setPhone(rs.getString("phone"));
        u.setPasswordHash(rs.getString("password_hash"));
        u.setRole(rs.getString("role"));
        u.setCity(rs.getString("city"));
        u.setWalletBalance(rs.getDouble("wallet_balance"));
        u.setVerified(rs.getBoolean("is_verified"));
        u.setActive(rs.getBoolean("is_active"));
        u.setLastLogin(rs.getTimestamp("last_login"));
        u.setCreatedAt(rs.getTimestamp("created_at"));
        return u;
    }
}
