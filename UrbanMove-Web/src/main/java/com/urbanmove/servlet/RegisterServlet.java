package com.urbanmove.servlet;

import com.urbanmove.dao.IUserDAO;
import com.urbanmove.dao.UserDAOImpl;
import com.urbanmove.model.User;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;

@WebServlet("/register")
public class RegisterServlet extends HttpServlet {
    private final IUserDAO userDAO = new UserDAOImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        req.getRequestDispatcher("/jsp/register.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String firstName = req.getParameter("firstName");
        String lastName = req.getParameter("lastName");
        String email = req.getParameter("email");
        String phone = req.getParameter("phone");
        String password = req.getParameter("password");
        String city = req.getParameter("city");

        try {
            if (userDAO.findByEmail(email) != null) {
                req.setAttribute("error", "Cet email est déjà utilisé");
                req.getRequestDispatcher("/jsp/register.jsp").forward(req, resp);
                return;
            }
            User user = userDAO.register(firstName, lastName, email, phone, password, city);
            if (user != null) {
                HttpSession session = req.getSession(true);
                session.setAttribute("userId", user.getId());
                session.setAttribute("userName", user.getFullName());
                session.setAttribute("userRole", user.getRole());
                session.setAttribute("userCity", user.getCity());
                session.setAttribute("userInitial", user.getInitial());
                resp.sendRedirect(req.getContextPath() + "/dashboard");
            } else {
                req.setAttribute("error", "Erreur lors de l'inscription");
                req.getRequestDispatcher("/jsp/register.jsp").forward(req, resp);
            }
        } catch (Exception e) {
            req.setAttribute("error", "Erreur: " + e.getMessage());
            req.getRequestDispatcher("/jsp/register.jsp").forward(req, resp);
        }
    }
}
