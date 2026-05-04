<%@ page contentType="text/html;charset=UTF-8" %>
<% request.setAttribute("pageTitle", "Connexion"); %>
<%@ include file="includes/header.jsp" %>
<section class="auth-section">
    <div class="auth-card">
        <div class="auth-header">
            <h1>Connexion</h1>
            <p>Accédez à votre espace UrbanMove</p>
        </div>
        <form method="POST" action="${pageContext.request.contextPath}/login" class="auth-form">
            <div class="form-group">
                <label for="email">Email</label>
                <input type="email" id="email" name="email" value="${email}" placeholder="demo@urbanmove.ma" required>
            </div>
            <div class="form-group">
                <label for="password">Mot de passe</label>
                <input type="password" id="password" name="password" placeholder="••••••••" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">Se connecter</button>
        </form>
        <div class="auth-footer">
            <p>Pas encore de compte ? <a href="${pageContext.request.contextPath}/register">S'inscrire</a></p>
            <div class="auth-demo">
                <p><strong>Compte démo :</strong></p>
                <code>demo@urbanmove.ma / demo123456</code>
            </div>
        </div>
    </div>
</section>
<%@ include file="includes/footer.jsp" %>
