package com.urbanmove.servlet;

import com.urbanmove.dao.IIoTDAO;
import com.urbanmove.dao.IoTDAOImpl;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;

@WebServlet("/alerts")
public class AlertsServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            IIoTDAO dao = new IoTDAOImpl();
            String city = req.getParameter("city");
            String type = req.getParameter("type");
            req.setAttribute("alerts", dao.getAlerts(city, type, 50));
            req.setAttribute("selectedCity", city);
            req.setAttribute("selectedType", type);
        } catch (Exception e) {
            req.setAttribute("error", e.getMessage());
        }
        req.getRequestDispatcher("/jsp/alerts.jsp").forward(req, resp);
    }
}
