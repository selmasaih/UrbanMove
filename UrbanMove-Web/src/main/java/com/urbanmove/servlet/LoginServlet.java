package com.urbanmove.servlet;

import com.urbanmove.dao.IUserDAO;
import com.urbanmove.dao.UserDAOImpl;
import com.urbanmove.model.User;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.*;
import java.io.IOException;

@WebServlet("/login")
public class LoginServlet extends HttpServlet {
    private final IUserDAO userDAO = new UserDAOImpl();

    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        if (req.getSession(false) != null && req.getSession().getAttribute("userId") != null) {
            resp.sendRedirect(req.getContextPath() + "/dashboard");
            return;
        }
        req.getRequestDispatcher("/jsp/login.jsp").forward(req, resp);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        String email = req.getParameter("email");
        String password = req.getParameter("password");
        try {
            User user = userDAO.authenticate(email, password);
            if (user != null) {
                HttpSession session = req.getSession(true);
                session.setAttribute("userId", user.getId());
                session.setAttribute("userName", user.getFullName());
                session.setAttribute("userRole", user.getRole());
                session.setAttribute("userCity", user.getCity());
                session.setAttribute("userInitial", user.getInitial());
                resp.sendRedirect(req.getContextPath() + "/dashboard");
            } else {
                req.setAttribute("error", "Email ou mot de passe incorrect");
                req.setAttribute("email", email);
                req.getRequestDispatcher("/jsp/login.jsp").forward(req, resp);
            }
        } catch (Exception e) {
            req.setAttribute("error", "Erreur serveur: " + e.getMessage());
            req.getRequestDispatcher("/jsp/login.jsp").forward(req, resp);
        }
    }
}
