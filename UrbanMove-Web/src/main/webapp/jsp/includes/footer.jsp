<%@ page contentType="text/html;charset=UTF-8" %>
</main>
<footer class="footer">
    <div class="footer-container">
        <div class="footer-grid">
            <div class="footer-col">
                <h3><span class="logo-icon">🚗</span> UrbanMove</h3>
                <p>Plateforme IoT de mobilité urbaine intelligente pour les villes marocaines.</p>
                <div class="footer-tech">
                    <span class="tech-badge">LoRaWAN</span>
                    <span class="tech-badge">IoT</span>
                    <span class="tech-badge">IA</span>
                    <span class="tech-badge">JDBC</span>
                </div>
            </div>
            <div class="footer-col">
                <h4>Plateforme</h4>
                <a href="${pageContext.request.contextPath}/parkings">Smart Parking</a>
                <a href="${pageContext.request.contextPath}/iot-dashboard">Dashboard IoT</a>
                <a href="${pageContext.request.contextPath}/alerts">Alertes Trafic</a>
            </div>
            <div class="footer-col">
                <h4>Villes 🇲🇦</h4>
                <a href="${pageContext.request.contextPath}/parkings?city=Rabat">Rabat</a>
                <a href="${pageContext.request.contextPath}/parkings?city=Casablanca">Casablanca</a>
                <a href="${pageContext.request.contextPath}/parkings?city=Tanger">Tanger</a>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; 2026 UrbanMove — Projet Éducatif PFE. Mobilité intelligente au Maroc 🇲🇦</p>
        </div>
    </div>
</footer>
<script src="${pageContext.request.contextPath}/js/app.js"></script>
</body>
</html>
