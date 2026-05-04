<%@ page contentType="text/html;charset=UTF-8" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<% request.setAttribute("pageTitle", "IoT Dashboard"); %>
<%@ include file="includes/header.jsp" %>

<section class="iot-section">
<div class="container">
    <!-- Header -->
    <div class="iot-header">
        <div>
            <h1>Impact & IoT</h1>
            <p>Smart Urban Mobility System</p>
        </div>
        <div class="live-indicator"><span class="live-dot"></span> LIVE</div>
    </div>

    <!-- System Status -->
    <div class="iot-system-card">
        <div class="iot-system-header">
            <span>🔌 Système IoT</span>
            <span class="badge badge-success">En ligne</span>
        </div>
        <p class="iot-tech-label">IoT (LoRaWAN + Capteurs ultrasoniques)</p>
        <div class="iot-system-stats">
            <div class="iot-sys-stat"><span class="iot-sys-val">${totalParkings}</span><span class="iot-sys-lbl">Parkings</span></div>
            <div class="iot-sys-divider"></div>
            <div class="iot-sys-stat"><span class="iot-sys-val">${totalSensors}</span><span class="iot-sys-lbl">Capteurs</span></div>
            <div class="iot-sys-divider"></div>
            <div class="iot-sys-stat"><span class="iot-sys-val">99.7%</span><span class="iot-sys-lbl">Uptime</span></div>
            <div class="iot-sys-divider"></div>
            <div class="iot-sys-stat"><span class="iot-sys-val">3</span><span class="iot-sys-lbl">Villes</span></div>
        </div>
    </div>

    <!-- Real-time Occupancy -->
    <div class="card">
        <div class="card-header"><h3>Occupation en temps réel</h3></div>
        <div class="card-body">
            <div class="occupancy-bar-lg"><div class="occupancy-fill" style="width:${occupancyRate}%;background:${occupancyRate > 80 ? '#F44336' : occupancyRate > 60 ? '#FFC107' : '#4CAF50'};"></div></div>
            <div class="occupancy-percent">${occupancyRate}%</div>
            <div class="occupancy-details">
                <span><span class="dot dot-red"></span> Occupées: ${occupiedSpots}</span>
                <span><span class="dot dot-green"></span> Libres: ${availableSpots}</span>
                <span>🚗 Total: ${totalSpots}</span>
            </div>
        </div>
    </div>

    <!-- Tabs -->
    <div class="iot-tabs">
        <button class="iot-tab active" data-tab="environmental">🌍 Environ.</button>
        <button class="iot-tab" data-tab="economic">📈 Écon.</button>
        <button class="iot-tab" data-tab="social">👥 Social</button>
        <button class="iot-tab" data-tab="smartlights">💡 Feux IA</button>
        <button class="iot-tab" data-tab="network">🔌 Réseau</button>
    </div>

    <!-- Tab: Environmental -->
    <div class="iot-tab-content active" id="tab-environmental">
        <div class="impact-header"><span>🌍</span><div><h3>Impact Environnemental</h3><p>Étude MDPI (2023) : réduction CO₂ de 32% à 40%</p></div></div>
        <div class="impact-grid">
            <div class="impact-card" style="background:#E8F5E9;"><div class="impact-card-icon">☁️</div><div class="impact-card-val">${co2Saved} kg</div><div class="impact-card-lbl">CO₂ économisé</div></div>
            <div class="impact-card" style="background:#E3F2FD;"><div class="impact-card-icon">💧</div><div class="impact-card-val">${fuelSaved} L</div><div class="impact-card-lbl">Carburant économisé</div></div>
            <div class="impact-card" style="background:#F1F8E9;"><div class="impact-card-icon">🌱</div><div class="impact-card-val">${treesEquivalent}</div><div class="impact-card-lbl">Arbres équivalents</div></div>
            <div class="impact-card" style="background:#FFF3E0;"><div class="impact-card-icon">☀️</div><div class="impact-card-val">36%</div><div class="impact-card-lbl">Réduction CO₂</div></div>
        </div>
        <div class="study-card">📄 Une gestion intelligente des parkings réduit les émissions de CO₂ de 32 à 40% en fonction de la densité du trafic (MDPI, 2023). Moins de temps passé à chercher une place = moins de pollution.</div>
    </div>

    <!-- Tab: Economic -->
    <div class="iot-tab-content" id="tab-economic">
        <div class="impact-header"><span>💰</span><div><h3>Impact Économique</h3><p>Réduction temps d'attente jusqu'à 72%</p></div></div>
        <div class="impact-grid">
            <div class="impact-card" style="background:#E8EAF6;"><div class="impact-card-icon">⏱️</div><div class="impact-card-val">${timeSavedHours}h</div><div class="impact-card-lbl">Temps économisé</div></div>
            <div class="impact-card" style="background:#FCE4EC;"><div class="impact-card-icon">💳</div><div class="impact-card-val">${totalEconomy} MAD</div><div class="impact-card-lbl">Économie totale</div></div>
            <div class="impact-card" style="background:#E0F7FA;"><div class="impact-card-icon">📋</div><div class="impact-card-val">${totalReservations}</div><div class="impact-card-lbl">Réservations</div></div>
            <div class="impact-card" style="background:#F3E5F5;"><div class="impact-card-icon">🚀</div><div class="impact-card-val">72%</div><div class="impact-card-lbl">Gain productivité</div></div>
        </div>
        <div class="detail-row">
            <div class="detail-card" style="border-left-color:#C62828;"><div class="detail-label">Carburant</div><div class="detail-value">${fuelCostSaved} MAD</div><div class="detail-sub">Économie essence</div></div>
            <div class="detail-card" style="border-left-color:#283593;"><div class="detail-label">Temps valorisé</div><div class="detail-value">${timeCostSaved} MAD</div><div class="detail-sub">À ~50 MAD/heure</div></div>
        </div>
    </div>

    <!-- Tab: Social -->
    <div class="iot-tab-content" id="tab-social">
        <div class="impact-header"><span>❤️</span><div><h3>Impact Social</h3><p>Federal Highway Administration</p></div></div>
        <div class="impact-grid">
            <div class="impact-card" style="background:#FFEBEE;"><div class="impact-card-icon">😊</div><div class="impact-card-val">45%</div><div class="impact-card-lbl">Réduction stress</div></div>
            <div class="impact-card" style="background:#E8F5E9;"><div class="impact-card-icon">🛡️</div><div class="impact-card-val">13.3%</div><div class="impact-card-lbl">Moins d'accidents</div></div>
            <div class="impact-card" style="background:#FFF8E1;"><div class="impact-card-icon">⚠️</div><div class="impact-card-val">35.8%</div><div class="impact-card-lbl">Accidents graves ↓</div></div>
            <div class="impact-card" style="background:#E0F2F1;"><div class="impact-card-icon">⭐</div><div class="impact-card-val">92%</div><div class="impact-card-lbl">Satisfaction</div></div>
        </div>
        <div class="social-lists">
            <div><h4>Les embouteillages provoquent :</h4>
                <ul class="list-bad"><li>Stress quotidien des automobilistes</li><li>Fatigue chronique et baisse cognitive</li><li>Retards au travail</li><li>Accidents routiers</li></ul>
            </div>
            <div><h4>Notre solution réduit :</h4>
                <ul class="list-good"><li>15 min de recherche en moyenne</li><li>Temps d'attente aux feux réduit de 42%</li><li>Accidents graves réduits de 35.8%</li><li>Qualité de vie améliorée</li></ul>
            </div>
        </div>
    </div>

    <!-- Tab: Smart Lights -->
    <div class="iot-tab-content" id="tab-smartlights">
        <div class="impact-header"><span>💡</span><div><h3>Feux Intelligents</h3><p>${totalSmartLights} feux IA / ${totalLights} total — ${globalCoverage}% couverture</p></div></div>
        <div class="impact-grid">
            <div class="impact-card" style="background:#FFF3E0;"><div class="impact-card-icon">💡</div><div class="impact-card-val">${totalSmartLights}</div><div class="impact-card-lbl">Feux connectés</div></div>
            <div class="impact-card" style="background:#E8F5E9;"><div class="impact-card-icon">🔗</div><div class="impact-card-val">${totalIntersections}</div><div class="impact-card-lbl">Intersections</div></div>
            <div class="impact-card" style="background:#E3F2FD;"><div class="impact-card-icon">⏱️</div><div class="impact-card-val">${globalCoverage}%</div><div class="impact-card-lbl">Couverture</div></div>
            <div class="impact-card" style="background:#FCE4EC;"><div class="impact-card-icon">🚗</div><div class="impact-card-val">V2I</div><div class="impact-card-lbl">Protocole</div></div>
        </div>
        <h4 style="margin-top:24px;">Couverture par ville</h4>
        <c:forEach var="sl" items="${smartLights}">
            <div class="city-light-card">
                <div class="city-light-header">
                    <span class="city-light-name">${sl.city}</span>
                    <span class="badge ${sl.status == 'avancé' ? 'badge-success' : 'badge-warning'}">${sl.status == 'avancé' ? '✓ Avancé' : '⟳ En cours'}</span>
                </div>
                <div class="city-light-stats">
                    <div><strong>${sl.smartLights}/${sl.totalLights}</strong><br>Feux IA</div>
                    <div><strong>${sl.intersections}</strong><br>Carrefours</div>
                    <div><strong>-${sl.avgWaitReduction}s</strong><br>Attente ↓</div>
                    <div><strong>${sl.peakOptimization}%</strong><br>Pic optimisé</div>
                </div>
                <div class="coverage-bar"><div class="coverage-fill" style="width:${sl.coveragePct}%"></div></div>
                <span class="coverage-label">${sl.coveragePct}% de couverture</span>
            </div>
        </c:forEach>
        <h4 style="margin-top:24px;">Algorithmes & Technologies</h4>
        <div class="tech-grid">
            <div class="tech-item"><div class="tech-icon">📊</div><div><strong>SCATS</strong><br>Sydney Coordinated Adaptive Traffic System</div></div>
            <div class="tech-item"><div class="tech-icon">🔀</div><div><strong>SCOOT</strong><br>Split Cycle Offset Optimisation Technique</div></div>
            <div class="tech-item"><div class="tech-icon">🧠</div><div><strong>DRL</strong><br>Deep Reinforcement Learning temps réel</div></div>
            <div class="tech-item"><div class="tech-icon">🌊</div><div><strong>Wave Green</strong><br>Onde verte pour corridors prioritaires</div></div>
        </div>
        <div class="ia-card">
            <h4>🤖 Capacités IA</h4>
            <ul class="list-good">
                <li>Détection automatique de congestion</li><li>Prédiction des flux à 30 min</li>
                <li>Priorité véhicules d'urgence</li><li>Adaptation météo (pluie, brouillard)</li>
                <li>Coordination multi-intersections</li><li>Gestion des événements sportifs (WC 2030)</li>
            </ul>
        </div>
    </div>

    <!-- Tab: Network -->
    <div class="iot-tab-content" id="tab-network">
        <div class="impact-header"><span>🔌</span><div><h3>Réseau IoT</h3><p>${activeSensors}/${totalSensors} capteurs actifs — ${onlineGateways} passerelles</p></div></div>
        <div class="impact-grid">
            <div class="impact-card" style="background:#E8EAF6;"><div class="impact-card-icon">📡</div><div class="impact-card-val">${activeSensors}</div><div class="impact-card-lbl">Capteurs actifs</div></div>
            <div class="impact-card" style="background:#E8F5E9;"><div class="impact-card-icon">📶</div><div class="impact-card-val">${onlineGateways}</div><div class="impact-card-lbl">Passerelles</div></div>
            <div class="impact-card" style="background:#FFF3E0;"><div class="impact-card-icon">📈</div><div class="impact-card-val">99.7%</div><div class="impact-card-lbl">Uptime</div></div>
            <div class="impact-card" style="background:#E0F7FA;"><div class="impact-card-icon">🌐</div><div class="impact-card-val">3</div><div class="impact-card-lbl">Villes</div></div>
        </div>

        <h4 style="margin-top:24px;">Métriques temps réel</h4>
        <div class="metrics-card">
            <div class="metric-row"><span>↔️ Latence moyenne</span><strong>12 ms</strong></div>
            <div class="metric-row"><span>⚠️ Perte de paquets</span><strong>0.02%</strong></div>
            <div class="metric-row"><span>⚡ Bande passante</span><strong>2.4/10 Gbps</strong></div>
            <div class="metric-row"><span>💬 Messages/sec</span><strong>~1000</strong></div>
            <div class="metric-row"><span>💾 Données traitées</span><strong>~15 GB/jour</strong></div>
        </div>

        <h4 style="margin-top:24px;">Architecture IoT — 4 Couches</h4>
        <div class="arch-layers">
            <div class="arch-layer">
                <div class="arch-num" style="background:#1E88E5;">1</div>
                <div class="arch-content"><strong>Couche Perception</strong><p>Capteurs ultrasoniques (${totalSensors}), capteurs environnementaux, boucles inductives (122), caméras IA (78)</p></div>
            </div>
            <div class="arch-connector">↓</div>
            <div class="arch-layer">
                <div class="arch-num" style="background:#26A69A;">2</div>
                <div class="arch-content"><strong>Couche Réseau</strong><p>Passerelles LoRaWAN (${onlineGateways}), points d'accès 4G/5G (12), switches Edge (8)</p></div>
            </div>
            <div class="arch-connector">↓</div>
            <div class="arch-layer">
                <div class="arch-num" style="background:#FF7043;">3</div>
                <div class="arch-content"><strong>Couche Traitement</strong><p>Serveurs Cloud (MySQL + Java), moteur IA (TensorFlow), Stream Processing (Apache Kafka)</p></div>
            </div>
            <div class="arch-connector">↓</div>
            <div class="arch-layer">
                <div class="arch-num" style="background:#4CAF50;">4</div>
                <div class="arch-content"><strong>Couche Application</strong><p>App Mobile (React Native), Dashboard Web (Java/JSP), API REST publique</p></div>
            </div>
        </div>

        <h4 style="margin-top:24px;">Passerelles LoRaWAN</h4>
        <c:forEach var="gw" items="${gateways}">
            <div class="gateway-card">
                <div class="gateway-header">
                    <span class="dot ${gw.online ? 'dot-green' : 'dot-red'}"></span>
                    <strong>${gw.gatewayId}</strong>
                    <span class="gateway-city">${gw.city}</span>
                </div>
                <div class="gateway-stats">
                    <span>📍 ${gw.locationName}</span>
                    <span>📶 ${gw.signalStrength}%</span>
                    <span>📡 ${gw.devicesConnected} devices</span>
                </div>
                <div class="gateway-proto">${gw.protocol} — ${gw.frequency}</div>
            </div>
        </c:forEach>
    </div>

    <!-- World Cup 2030 -->
    <div class="worldcup-card">
        <div class="worldcup-header"><span>⚽🏆</span><h3>Coupe du Monde 2030</h3></div>
        <p>Avec l'organisation de la Coupe du Monde 2030, le Maroc accueillera des millions de visiteurs. Notre système IoT de smart parking et feux intelligents est prêt.</p>
        <div class="worldcup-stats">
            <div><strong>${totalParkings}</strong><br>Parkings prêts</div>
            <div><strong>3</strong><br>Villes couvertes</div>
            <div><strong>${totalSpots}</strong><br>Places totales</div>
        </div>
        <div class="worldcup-ready">✅ ${totalSmartLights} feux intelligents • ${onlineGateways} passerelles • Couverture ${globalCoverage}%</div>
    </div>

    <!-- Problematique -->
    <div class="problem-card">
        <h3>❓ Problématique</h3>
        <p>Comment digitaliser le transport urbain afin d'améliorer la mobilité, réduire la congestion et rendre les villes marocaines plus intelligentes et durables ?</p>
        <div class="problem-solution">💡 Solution : Un système intelligent de gestion du stationnement et du trafic basé sur les technologies IoT, IA et feux intelligents</div>
    </div>
</div>
</section>
<%@ include file="includes/footer.jsp" %>
