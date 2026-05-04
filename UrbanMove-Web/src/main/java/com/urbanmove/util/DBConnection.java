package com.urbanmove.util;

import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

/**
 * JDBC Connection Pool — UrbanMove
 * Simple pool using db.properties configuration.
 */
public class DBConnection {

    private static final BlockingQueue<Connection> pool;
    private static String url;
    private static String user;
    private static String password;

    static {
        Properties props = new Properties();
        try (InputStream is = DBConnection.class.getClassLoader().getResourceAsStream("db.properties")) {
            props.load(is);
            url = props.getProperty("db.url");
            user = props.getProperty("db.user");
            password = props.getProperty("db.password");
            String driver = props.getProperty("db.driver");
            int poolSize = Integer.parseInt(props.getProperty("db.pool.size", "10"));

            Class.forName(driver);
            pool = new ArrayBlockingQueue<>(poolSize);
            for (int i = 0; i < poolSize; i++) {
                pool.add(DriverManager.getConnection(url, user, password));
            }
            System.out.println("✅ JDBC Pool initialisé — " + poolSize + " connexions");
        } catch (Exception e) {
            throw new RuntimeException("❌ Erreur initialisation JDBC: " + e.getMessage(), e);
        }
    }

    public static Connection getConnection() throws SQLException {
        try {
            Connection conn = pool.take();
            if (conn.isClosed() || !conn.isValid(2)) {
                conn = DriverManager.getConnection(url, user, password);
            }
            return conn;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new SQLException("Pool interrupted", e);
        }
    }

    public static void releaseConnection(Connection conn) {
        if (conn != null) {
            try {
                if (!conn.isClosed()) {
                    conn.setAutoCommit(true);
                    pool.offer(conn);
                }
            } catch (SQLException ignored) {}
        }
    }
}
