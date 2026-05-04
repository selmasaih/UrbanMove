<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="UrbanMove — Plateforme IoT de mobilité urbaine intelligente au Maroc">
    <title>${pageTitle != null ? pageTitle : 'UrbanMove'} — Smart Urban Mobility</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="${pageContext.request.contextPath}/css/style.css">
</head>
<body>
<nav class="navbar">
    <div class="nav-container">
        <a href="${pageContext.request.contextPath}/" class="nav-logo">
            <span class="logo-icon">🚗</span>
            <span class="logo-text">Urban<span class="logo-accent">Move</span></span>
        </a>
        <div class="nav-links" id="navLinks">
            <c:choose>
                <c:when test="${not empty sessionScope.userId}">
                    <a href="${pageContext.request.contextPath}/dashboard">Tableau de bord</a>
                    <a href="${pageContext.request.contextPath}/parkings">Parkings</a>
                    <a href="${pageContext.request.contextPath}/iot-dashboard" class="nav-iot"><span class="live-dot-sm"></span> IoT</a>
                    <a href="${pageContext.request.contextPath}/alerts">Alertes</a>
                    <div class="nav-user">
                        <span class="nav-avatar">${sessionScope.userInitial}</span>
                        <div class="nav-dropdown">
                            <a href="${pageContext.request.contextPath}/dashboard">Mon espace</a>
                            <c:if test="${sessionScope.userRole == 'admin'}">
                                <a href="${pageContext.request.contextPath}/admin">Admin</a>
                            </c:if>
                            <a href="${pageContext.request.contextPath}/logout" class="nav-logout">Déconnexion</a>
                        </div>
                    </div>
                </c:when>
                <c:otherwise>
                    <a href="${pageContext.request.contextPath}/iot-dashboard" class="nav-iot"><span class="live-dot-sm"></span> IoT</a>
                    <a href="${pageContext.request.contextPath}/parkings">Parkings</a>
                    <a href="${pageContext.request.contextPath}/login" class="btn btn-outline btn-sm">Connexion</a>
                    <a href="${pageContext.request.contextPath}/register" class="btn btn-primary btn-sm">Inscription</a>
                </c:otherwise>
            </c:choose>
        </div>
        <button class="nav-toggle" id="navToggle" onclick="document.getElementById('navLinks').classList.toggle('active')">☰</button>
    </div>
</nav>
<main class="main-content">
<c:if test="${not empty error}">
    <div class="alert alert-danger">${error}</div>
</c:if>
<c:if test="${not empty success}">
    <div class="alert alert-success">${success}</div>
</c:if>
