package com.urbanmove.servlet;

import com.urbanmove.dao.IParkingDAO;
import com.urbanmove.dao.ParkingDAOImpl;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;

@WebServlet("/parkings")
public class ParkingsServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        try {
            IParkingDAO dao = new ParkingDAOImpl();
            String city = req.getParameter("city");
            String type = req.getParameter("type");
            req.setAttribute("parkings", dao.findByFilter(city, type));
            req.setAttribute("selectedCity", city);
            req.setAttribute("selectedType", type);
        } catch (Exception e) {
            req.setAttribute("error", e.getMessage());
        }
        req.getRequestDispatcher("/jsp/parkings.jsp").forward(req, resp);
    }
}
