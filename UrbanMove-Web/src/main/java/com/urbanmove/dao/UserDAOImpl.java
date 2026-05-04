package com.urbanmove.dao;

import com.urbanmove.model.User;
import org.mindrot.jbcrypt.BCrypt;

import java.sql.*;

/**
 * Implémentation DAO Utilisateur — Cours JDBC
 * Pattern : DriverManager + finally block + PreparedStatement
 * Driver : com.mysql.jdbc.Driver
 */
public class UserDAOImpl implements IUserDAO {

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
    public User findByEmail(String email) throws SQLException {
        String sql = "SELECT * FROM users WHERE email = ?";
        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql);
            ps.setString(1, email);
            resultat = ps.executeQuery();
            if (resultat.next()) return mapUser(resultat);
            return null;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public User findById(int id) throws SQLException {
        String sql = "SELECT * FROM users WHERE id = ?";
        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql);
            ps.setInt(1, id);
            resultat = ps.executeQuery();
            if (resultat.next()) return mapUser(resultat);
            return null;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public User register(String firstName, String lastName, String email,
                         String phone, String password, String city) throws SQLException {
        String hash = BCrypt.hashpw(password, BCrypt.gensalt(12));
        String sql = "INSERT INTO users (first_name, last_name, email, phone, password_hash, city, is_verified) VALUES (?,?,?,?,?,?,1)";
        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet keys = null;
        try {
            connexion = getConnection();
            connexion.setAutoCommit(false);
            ps = connexion.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, firstName);
            ps.setString(2, lastName);
            ps.setString(3, email);
            ps.setString(4, phone);
            ps.setString(5, hash);
            ps.setString(6, city);
            ps.executeUpdate();
            keys = ps.getGeneratedKeys();
            connexion.commit();
            if (keys.next()) return findById(keys.getInt(1));
            return null;
        } catch (SQLException e) {
            if (connexion != null) connexion.rollback();
            throw e;
        } finally {
            if (keys != null) try { keys.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public User authenticate(String email, String password) throws SQLException {
        String sql = "SELECT * FROM users WHERE email = ? AND is_active = 1";
        Connection connexion = null;
        PreparedStatement ps = null;
        ResultSet resultat = null;
        try {
            connexion = getConnection();
            ps = connexion.prepareStatement(sql);
            ps.setString(1, email);
            resultat = ps.executeQuery();
            if (resultat.next()) {
                String hash = resultat.getString("password_hash");
                if (BCrypt.checkpw(password, hash)) {
                    User user = mapUser(resultat);
                    // Update last_login
                    PreparedStatement up = connexion.prepareStatement("UPDATE users SET last_login = NOW() WHERE id = ?");
                    up.setInt(1, user.getId());
                    up.executeUpdate();
                    up.close();
                    return user;
                }
            }
            return null;
        } finally {
            if (resultat != null) try { resultat.close(); } catch (SQLException ignored) {}
            if (ps != null) try { ps.close(); } catch (SQLException ignored) {}
            if (connexion != null) try { connexion.close(); } catch (SQLException ignored) {}
        }
    }

    @Override
    public int countAll() throws SQLException {
        String sql = "SELECT COUNT(*) FROM users";
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
