<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Alertes"); %>
<%@ include file="includes/header.jsp" %>

<section class="page-section">
<div class="container">
    <div class="page-header"><h1>🚨 Alertes Trafic</h1><p>Alertes IoT et signalements en temps réel</p></div>
    <div class="filter-bar">
        <form method="GET" action="${pageContext.request.contextPath}/alerts" class="filter-form">
            <select name="city" onchange="this.form.submit()">
                <option value="">Toutes les villes</option>
                <option value="Rabat" ${selectedCity == 'Rabat' ? 'selected' : ''}>Rabat</option>
                <option value="Casablanca" ${selectedCity == 'Casablanca' ? 'selected' : ''}>Casablanca</option>
                <option value="Tanger" ${selectedCity == 'Tanger' ? 'selected' : ''}>Tanger</option>
            </select>
            <select name="type" onchange="this.form.submit()">
                <option value="">Tous les types</option>
                <option value="traffic" ${selectedType == 'traffic' ? 'selected' : ''}>Trafic</option>
                <option value="accident" ${selectedType == 'accident' ? 'selected' : ''}>Accident</option>
                <option value="works" ${selectedType == 'works' ? 'selected' : ''}>Travaux</option>
                <option value="event" ${selectedType == 'event' ? 'selected' : ''}>Événement</option>
                <option value="construction" ${selectedType == 'construction' ? 'selected' : ''}>Construction</option>
            </select>
        </form>
    </div>
    <div class="alerts-list">
        <c:forEach var="a" items="${alerts}">
            <div class="alert-card alert-${a.severity}">
                <div class="alert-card-header">
                    <span class="alert-type-icon">
                        <c:choose>
                            <c:when test="${a.type == 'traffic'}">🚦</c:when><c:when test="${a.type == 'accident'}">🚗</c:when>
                            <c:when test="${a.type == 'works'}">🚧</c:when><c:when test="${a.type == 'event'}">🎉</c:when>
                            <c:when test="${a.type == 'construction'}">🏗️</c:when><c:when test="${a.type == 'weather'}">🌧️</c:when>
                            <c:otherwise>ℹ️</c:otherwise>
                        </c:choose>
                    </span>
                    <div class="alert-card-title">
                        <h3>${a.title}</h3>
                        <span class="alert-meta">📍 ${a.city} • ${a.source == 'sensor' ? '📡 Capteurs IoT' : a.source == 'authority' ? '🏛️ Autorités' : a.source == 'system' ? '🤖 Système IA' : '👤 Citoyen'}</span>
                    </div>
                    <span class="badge badge-${a.severity == 'high' || a.severity == 'critical' ? 'danger' : a.severity == 'medium' ? 'warning' : 'info'}">${a.severity}</span>
                </div>
                <p class="alert-card-desc">${a.description}</p>
                <div class="alert-card-footer">
                    <span>👥 ${a.user_reports} confirmations</span>
                    <c:if test="${a.source == 'sensor'}"><span class="iot-badge"><span class="live-dot-sm"></span> Confiance: ${a.sensor_confidence * 100}%</span></c:if>
                </div>
            </div>
        </c:forEach>
        <c:if test="${empty alerts}"><div class="empty-state"><p>Aucune alerte active.</p></div></c:if>
    </div>
</div>
</section>
<%@ include file="includes/footer.jsp" %>
