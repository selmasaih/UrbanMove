<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Tableau de bord"); %>
<%@ include file="includes/header.jsp" %>

<section class="dashboard-section">
    <div class="container">
        <div class="dashboard-header">
            <h1>Bienvenue, ${sessionScope.userName} 👋</h1>
            <p>Votre espace UrbanMove — Mobilité intelligente</p>
        </div>

        <div class="stats-grid">
            <div class="stat-card stat-primary">
                <div class="stat-icon">🅿️</div>
                <div class="stat-value">${totalParkings}</div>
                <div class="stat-label">Parkings connectés</div>
            </div>
            <div class="stat-card stat-success">
                <div class="stat-icon">📡</div>
                <div class="stat-value">${totalSensors}</div>
                <div class="stat-label">Capteurs IoT actifs</div>
            </div>
            <div class="stat-card stat-warning">
                <div class="stat-icon">🚗</div>
                <div class="stat-value">${availableSpots} / ${totalSpots}</div>
                <div class="stat-label">Places disponibles</div>
            </div>
            <div class="stat-card stat-info">
                <div class="stat-icon">📋</div>
                <div class="stat-value">${totalReservations}</div>
                <div class="stat-label">Réservations totales</div>
            </div>
        </div>

        <div class="dashboard-grid">
            <div class="card">
                <div class="card-header"><h3>🌍 Impact Environnemental IoT</h3></div>
                <div class="card-body">
                    <div class="impact-mini-grid">
                        <div class="impact-mini"><span class="impact-val">${co2Saved} kg</span><span class="impact-lbl">CO₂ économisé</span></div>
                        <div class="impact-mini"><span class="impact-val">${timeSaved}h</span><span class="impact-lbl">Temps gagné</span></div>
                        <div class="impact-mini"><span class="impact-val">${totalEconomy} MAD</span><span class="impact-lbl">Économie totale</span></div>
                    </div>
                    <a href="${pageContext.request.contextPath}/iot-dashboard" class="btn btn-primary btn-sm" style="margin-top:16px;">Voir le Dashboard IoT</a>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><h3>⚡ Accès rapide</h3></div>
                <div class="card-body">
                    <div class="quick-links">
                        <a href="${pageContext.request.contextPath}/parkings" class="quick-link"><span>🅿️</span> Trouver un parking</a>
                        <a href="${pageContext.request.contextPath}/iot-dashboard" class="quick-link"><span>📊</span> Dashboard IoT</a>
                        <a href="${pageContext.request.contextPath}/alerts" class="quick-link"><span>🚨</span> Alertes trafic</a>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<%@ include file="includes/footer.jsp" %>
