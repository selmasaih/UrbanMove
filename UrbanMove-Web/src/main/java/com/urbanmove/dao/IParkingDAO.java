package com.urbanmove.dao;

import com.urbanmove.model.Parking;
import java.sql.SQLException;
import java.util.List;

/**
 * Interface DAO pour les parkings — Pattern cours JDBC
 */
public interface IParkingDAO {
    List<Parking> findAll() throws SQLException;
    List<Parking> findByCity(String city) throws SQLException;
    List<Parking> findByFilter(String city, String type) throws SQLException;
    Parking findById(int id) throws SQLException;
    List<String> getAmenities(int parkingId) throws SQLException;
    int countAll() throws SQLException;
    int totalSpots() throws SQLException;
    int totalAvailable() throws SQLException;
    int totalSensors() throws SQLException;
}
