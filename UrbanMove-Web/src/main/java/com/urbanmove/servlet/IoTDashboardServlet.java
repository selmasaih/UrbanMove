package com.urbanmove.servlet;

import com.urbanmove.dao.IParkingDAO;
import com.urbanmove.dao.ParkingDAOImpl;
import com.urbanmove.dao.IIoTDAO;
import com.urbanmove.dao.IoTDAOImpl;
import com.urbanmove.model.*;
import com.urbanmove.util.IoTCalculator;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;
import java.util.*;

@WebServlet("/iot-dashboard")
public class IoTDashboardServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            IParkingDAO parkingDAO = new ParkingDAOImpl();
            IIoTDAO iotDAO = new IoTDAOImpl();

            // System overview
            int totalParkings = parkingDAO.countAll();
            int totalSpots = parkingDAO.totalSpots();
            int availableSpots = parkingDAO.totalAvailable();
            int totalSensors = parkingDAO.totalSensors();
            int totalReservations = iotDAO.countReservations();
            int activeSensors = (int) Math.round(totalSensors * 0.97);

            req.setAttribute("totalParkings", totalParkings);
            req.setAttribute("totalSpots", totalSpots);
            req.setAttribute("availableSpots", availableSpots);
            req.setAttribute("occupiedSpots", totalSpots - availableSpots);
            req.setAttribute("occupancyRate", totalSpots > 0 ? Math.round(((float)(totalSpots - availableSpots) / totalSpots) * 100) : 0);
            req.setAttribute("totalSensors", totalSensors);
            req.setAttribute("activeSensors", activeSensors);
            req.setAttribute("totalReservations", totalReservations);

            // Impact
            req.setAttribute("co2Saved", IoTCalculator.co2Saved(totalReservations));
            req.setAttribute("fuelSaved", IoTCalculator.fuelSaved(totalReservations));
            req.setAttribute("treesEquivalent", IoTCalculator.treesEquivalent(totalReservations));
            req.setAttribute("timeSavedHours", IoTCalculator.timeSavedHours(totalReservations));
            req.setAttribute("totalEconomy", IoTCalculator.totalEconomy(totalReservations));
            req.setAttribute("fuelCostSaved", IoTCalculator.fuelCostSaved(totalReservations));
            req.setAttribute("timeCostSaved", IoTCalculator.timeCostSaved(totalReservations));

            // Smart lights
            List<SmartLight> lights = iotDAO.getAllSmartLights();
            req.setAttribute("smartLights", lights);
            req.setAttribute("totalSmartLights", iotDAO.totalSmartLightsCount());
            req.setAttribute("totalLights", iotDAO.totalLightsCount());
            req.setAttribute("totalIntersections", iotDAO.totalIntersections());
            int totalL = iotDAO.totalLightsCount();
            int smartL = iotDAO.totalSmartLightsCount();
            req.setAttribute("globalCoverage", totalL > 0 ? Math.round(((float) smartL / totalL) * 100) : 0);

            // Gateways
            List<IoTGateway> gateways = iotDAO.getAllGateways();
            req.setAttribute("gateways", gateways);
            req.setAttribute("onlineGateways", iotDAO.countOnlineGateways());

            // Parkings for city filter
            req.setAttribute("parkings", parkingDAO.findAll());

            // Alerts
            req.setAttribute("recentAlerts", iotDAO.getAlerts(null, null, 10));

        } catch (Exception e) {
            req.setAttribute("error", "Erreur IoT: " + e.getMessage());
            e.printStackTrace();
        }
        req.getRequestDispatcher("/jsp/iot_dashboard.jsp").forward(req, resp);
    }
}
