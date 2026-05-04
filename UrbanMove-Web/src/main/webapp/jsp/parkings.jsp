<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "Parkings"); %>
<%@ include file="includes/header.jsp" %>

<section class="page-section">
    <div class="container">
        <div class="page-header">
            <h1>🅿️ Smart Parkings</h1>
            <p>Parkings connectés avec capteurs IoT en temps réel</p>
        </div>
        <div class="filter-bar">
            <form method="GET" action="${pageContext.request.contextPath}/parkings" class="filter-form">
                <select name="city" onchange="this.form.submit()">
                    <option value="">Toutes les villes</option>
                    <option value="Rabat" ${selectedCity == 'Rabat' ? 'selected' : ''}>Rabat</option>
                    <option value="Casablanca" ${selectedCity == 'Casablanca' ? 'selected' : ''}>Casablanca</option>
                    <option value="Tanger" ${selectedCity == 'Tanger' ? 'selected' : ''}>Tanger</option>
                </select>
                <select name="type" onchange="this.form.submit()">
                    <option value="">Tous les types</option>
                    <option value="underground" ${selectedType == 'underground' ? 'selected' : ''}>Souterrain</option>
                    <option value="outdoor" ${selectedType == 'outdoor' ? 'selected' : ''}>Extérieur</option>
                    <option value="multilevel" ${selectedType == 'multilevel' ? 'selected' : ''}>Multi-niveaux</option>
                </select>
            </form>
        </div>
        <div class="parkings-grid">
            <c:forEach var="p" items="${parkings}">
                <div class="parking-card">
                    <div class="parking-card-header">
                        <h3>${p.name}</h3>
                        <span class="badge ${p.statusClass}">${p.availabilityStatus}</span>
                    </div>
                    <p class="parking-desc">${p.description}</p>
                    <div class="parking-meta">
                        <span>📍 ${p.city}</span>
                        <span>⭐ ${p.rating}/5 (${p.reviewCount})</span>
                    </div>
                    <div class="parking-occupancy">
                        <div class="occupancy-bar"><div class="occupancy-fill" style="width:${p.occupancyRate}%"></div></div>
                        <span>${p.occupancyRate}% occupé</span>
                    </div>
                    <div class="parking-spots">
                        <span class="spots-available">${p.availableSpots}</span> / ${p.totalSpots} places libres
                    </div>
                    <div class="parking-price">${p.hourlyPrice} MAD/h</div>
                    <div class="parking-footer">
                        <c:if test="${p.hasSensors}">
                            <span class="iot-badge"><span class="live-dot-sm"></span> IoT ${p.sensorProtocol}</span>
                        </c:if>
                        <span class="type-badge">${p.type}</span>
                    </div>
                </div>
            </c:forEach>
            <c:if test="${empty parkings}">
                <div class="empty-state"><p>Aucun parking trouvé avec ces filtres.</p></div>
            </c:if>
        </div>
    </div>
</section>
<%@ include file="includes/footer.jsp" %>
