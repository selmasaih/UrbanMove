package com.urbanmove.dao;

import com.urbanmove.model.User;
import java.sql.SQLException;

/**
 * Interface DAO pour les utilisateurs — Pattern cours JDBC
 */
public interface IUserDAO {
    User findByEmail(String email) throws SQLException;
    User findById(int id) throws SQLException;
    User register(String firstName, String lastName, String email,
                  String phone, String password, String city) throws SQLException;
    User authenticate(String email, String password) throws SQLException;
    int countAll() throws SQLException;
}
