<%@ page contentType="text/html;charset=UTF-8" %>
<% request.setAttribute("pageTitle", "Accueil"); %>
<%@ include file="jsp/includes/header.jsp" %>

<section class="hero">
    <div class="hero-bg"></div>
    <div class="hero-content">
        <div class="hero-badge"><span class="live-dot-sm"></span> Système IoT en ligne</div>
        <h1 class="hero-title">Mobilité Urbaine <span class="gradient-text">Intelligente</span></h1>
        <p class="hero-subtitle">Plateforme IoT de smart parking et feux intelligents pour les villes marocaines. Capteurs LoRaWAN, IA prédictive et impact environnemental mesurable.</p>
        <div class="hero-actions">
            <a href="${pageContext.request.contextPath}/iot-dashboard" class="btn btn-primary btn-lg">Explorer le Dashboard IoT</a>
            <a href="${pageContext.request.contextPath}/register" class="btn btn-outline btn-lg">Créer un compte</a>
        </div>
        <div class="hero-stats">
            <div class="hero-stat"><span class="hero-stat-value">1520+</span><span class="hero-stat-label">Capteurs IoT</span></div>
            <div class="hero-stat"><span class="hero-stat-value">122</span><span class="hero-stat-label">Feux intelligents</span></div>
            <div class="hero-stat"><span class="hero-stat-value">3</span><span class="hero-stat-label">Villes couvertes</span></div>
            <div class="hero-stat"><span class="hero-stat-value">6</span><span class="hero-stat-label">Passerelles LoRaWAN</span></div>
        </div>
    </div>
</section>

<section class="features" id="features">
    <div class="container">
        <h2 class="section-title">Technologies <span class="gradient-text">IoT</span></h2>
        <p class="section-subtitle">Un système complet basé sur les technologies IoT, IA et feux intelligents</p>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon" style="background:rgba(30,136,229,0.1);color:#1E88E5;">🔌</div>
                <h3>Capteurs Ultrasoniques</h3>
                <p>Détection véhicule par place en temps réel via capteurs ultrasoniques connectés au réseau LoRaWAN.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon" style="background:rgba(38,166,154,0.1);color:#26A69A;">🚦</div>
                <h3>Feux Intelligents IA</h3>
                <p>Algorithmes SCATS/SCOOT et Deep Reinforcement Learning pour optimisation du trafic en temps réel.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon" style="background:rgba(255,112,67,0.1);color:#FF7043;">📡</div>
                <h3>Réseau LoRaWAN</h3>
                <p>6 passerelles LoRaWAN à 868 MHz couvrant Rabat, Casablanca et Tanger avec 99.7% d'uptime.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon" style="background:rgba(76,175,80,0.1);color:#4CAF50;">🌍</div>
                <h3>Impact Environnemental</h3>
                <p>Réduction CO₂ de 36% mesurée (MDPI 2023). Économie de carburant et amélioration de la qualité de l'air.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon" style="background:rgba(156,39,176,0.1);color:#9C27B0;">🏗️</div>
                <h3>Architecture 4 Couches</h3>
                <p>Perception → Réseau → Traitement (Cloud + IA) → Application. Edge computing et Apache Kafka.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon" style="background:rgba(255,193,7,0.1);color:#FFC107;">⚽</div>
                <h3>Coupe du Monde 2030</h3>
                <p>Système prêt pour accueillir les millions de visiteurs lors du Mondial 2030 au Maroc.</p>
            </div>
        </div>
    </div>
</section>

<section class="cities-section">
    <div class="container">
        <h2 class="section-title">Villes <span class="gradient-text">Connectées</span></h2>
        <div class="cities-grid">
            <div class="city-card">
                <div class="city-header" style="background: linear-gradient(135deg, #1E88E5, #1565C0);">
                    <h3>🏛️ Rabat</h3><span class="city-badge">3 parkings • 38 feux IA</span>
                </div>
                <div class="city-body">
                    <div class="city-stat"><span>650</span> places connectées</div>
                    <div class="city-stat"><span>81%</span> couverture feux</div>
                    <div class="city-stat"><span>3</span> passerelles LoRaWAN</div>
                </div>
            </div>
            <div class="city-card">
                <div class="city-header" style="background: linear-gradient(135deg, #26A69A, #00897B);">
                    <h3>🏙️ Casablanca</h3><span class="city-badge">1 parking • 62 feux IA</span>
                </div>
                <div class="city-body">
                    <div class="city-stat"><span>500</span> places connectées</div>
                    <div class="city-stat"><span>70%</span> couverture feux</div>
                    <div class="city-stat"><span>2</span> passerelles LoRaWAN</div>
                </div>
            </div>
            <div class="city-card">
                <div class="city-header" style="background: linear-gradient(135deg, #FF7043, #E64A19);">
                    <h3>⚓ Tanger</h3><span class="city-badge">1 parking • 22 feux IA</span>
                </div>
                <div class="city-body">
                    <div class="city-stat"><span>250</span> places connectées</div>
                    <div class="city-stat"><span>71%</span> couverture feux</div>
                    <div class="city-stat"><span>1</span> passerelle LoRaWAN</div>
                </div>
            </div>
        </div>
    </div>
</section>

<%@ include file="jsp/includes/footer.jsp" %>
