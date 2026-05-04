<%@ page contentType="text/html;charset=UTF-8" %>
<% request.setAttribute("pageTitle", "Inscription"); %>
<%@ include file="includes/header.jsp" %>
<section class="auth-section">
    <div class="auth-card">
        <div class="auth-header"><h1>Inscription</h1><p>Rejoignez UrbanMove</p></div>
        <form method="POST" action="${pageContext.request.contextPath}/register" class="auth-form">
            <div class="form-row">
                <div class="form-group"><label for="firstName">Prénom</label><input type="text" id="firstName" name="firstName" required></div>
                <div class="form-group"><label for="lastName">Nom</label><input type="text" id="lastName" name="lastName" required></div>
            </div>
            <div class="form-group"><label for="email">Email</label><input type="email" id="email" name="email" required></div>
            <div class="form-group"><label for="phone">Téléphone</label><input type="tel" id="phone" name="phone" placeholder="0612345678" required></div>
            <div class="form-group"><label for="city">Ville</label>
                <select id="city" name="city">
                    <option value="rabat">Rabat</option><option value="casablanca">Casablanca</option><option value="tanger">Tanger</option>
                    <option value="marrakech">Marrakech</option><option value="fes">Fès</option><option value="agadir">Agadir</option>
                </select>
            </div>
            <div class="form-group"><label for="password">Mot de passe</label><input type="password" id="password" name="password" minlength="6" required></div>
            <button type="submit" class="btn btn-primary btn-block">S'inscrire</button>
        </form>
        <div class="auth-footer"><p>Déjà un compte ? <a href="${pageContext.request.contextPath}/login">Se connecter</a></p></div>
    </div>
</section>
<%@ include file="includes/footer.jsp" %>
