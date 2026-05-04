package com.urbanmove.servlet;

import com.urbanmove.dao.IParkingDAO;
import com.urbanmove.dao.ParkingDAOImpl;
import com.urbanmove.dao.IIoTDAO;
import com.urbanmove.dao.IoTDAOImpl;
import com.urbanmove.util.IoTCalculator;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;

@WebServlet("/dashboard")
public class DashboardServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            IParkingDAO parkingDAO = new ParkingDAOImpl();
            IIoTDAO iotDAO = new IoTDAOImpl();
            int totalParkings = parkingDAO.countAll();
            int totalSpots = parkingDAO.totalSpots();
            int availableSpots = parkingDAO.totalAvailable();
            int totalSensors = parkingDAO.totalSensors();
            int totalReservations = iotDAO.countReservations();

            req.setAttribute("totalParkings", totalParkings);
            req.setAttribute("totalSpots", totalSpots);
            req.setAttribute("availableSpots", availableSpots);
            req.setAttribute("occupiedSpots", totalSpots - availableSpots);
            req.setAttribute("totalSensors", totalSensors);
            req.setAttribute("totalReservations", totalReservations);
            req.setAttribute("co2Saved", IoTCalculator.co2Saved(totalReservations));
            req.setAttribute("timeSaved", IoTCalculator.timeSavedHours(totalReservations));
            req.setAttribute("totalEconomy", IoTCalculator.totalEconomy(totalReservations));
        } catch (Exception e) {
            req.setAttribute("error", e.getMessage());
        }
        req.getRequestDispatcher("/jsp/dashboard.jsp").forward(req, resp);
    }
}
