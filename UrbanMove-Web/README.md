# UrbanMove Web — Java/JDBC/MySQL

Ce projet est la version Java/Web de la plateforme **UrbanMove** (Smart Urban Mobility). Il a été architecturé pour respecter parfaitement les standards du cours académique JDBC (Pattern DAO avec interfaces, DriverManager, `Class.forName()`, `PreparedStatement` et `ResultSet` dans des blocs `try/finally`).

## 🛠️ Stack Technique

| Couche | Technologie |
|--------|------------|
| **Frontend** | JSP + JSTL + HTML/CSS/JS |
| **Backend** | Java 11 + Jakarta EE 7 (Servlet 3.1 `javax.servlet`) |
| **Base de données** | MySQL 8 (via JDBC `mysql-connector-j` 8.3) |
| **Sécurité** | BCrypt (`jbcrypt`), Session HTTP |
| **Build** | Maven |
| **Serveur** | Apache Tomcat 8.5 (Inclus dans XAMPP) |

---

## 🚀 Guide d'installation et de déploiement (Pour Windows + XAMPP)

Suivez ces étapes pour exécuter le projet sur votre propre machine à l'aide de XAMPP.

### Étape 1 : Préparer la base de données (MySQL via XAMPP)
1. Ouvrez le **Panneau de contrôle XAMPP** (XAMPP Control Panel).
2. Démarrez le module **MySQL** (Cliquez sur "Start").
3. Ouvrez **phpMyAdmin** (http://localhost/phpmyadmin) ou utilisez la console MySQL.
4. Créez une nouvelle base de données nommée `urbanmove`.
5. Importez le fichier SQL du projet :
   - Allez dans l'onglet "Importer".
   - Sélectionnez le fichier situé dans `UrbanMove-Web/sql/urbanmove.sql`.
   - Cliquez sur "Exécuter".
   *(Cela créera toutes les tables IoT, parkings, utilisateurs et insérera les données de démonstration).*

### Étape 2 : Configurer la connexion JDBC
Assurez-vous que les identifiants de base de données correspondent à votre installation XAMPP.
Ouvrez le fichier `UrbanMove-Web/src/main/resources/db.properties` et vérifiez :
```properties
db.url=jdbc:mysql://localhost:3306/urbanmove?useSSL=false&serverTimezone=UTC&characterEncoding=UTF-8
db.user=root
db.password=
```
*(Par défaut sous XAMPP, l'utilisateur est `root` et le mot de passe est vide).*

### Étape 3 : Compiler le projet avec Maven (Générer le .war)
Vous avez besoin de compiler le projet pour générer l'archive web.
*Si vous utilisez un IDE comme Eclipse, IntelliJ ou PhpStorm, vous pouvez exécuter le build Maven directement depuis l'interface.*

En ligne de commande :
1. Ouvrez un terminal dans le dossier du projet `UrbanMove-Web`.
2. Exécutez :
```bash
mvn clean package -DskipTests
```
3. Cela va créer un fichier `urbanmove.war` dans le dossier `UrbanMove-Web/target/`.

### Étape 4 : Déployer sur Tomcat (via XAMPP)
1. Dans le **Panneau de contrôle XAMPP**, démarrez le module **Tomcat**.
2. Copiez le fichier `urbanmove.war` (généré à l'étape précédente).
3. Collez ce fichier dans le dossier de déploiement Tomcat de XAMPP :
   `C:\xampp\tomcat\webapps\`
4. Tomcat va automatiquement décompresser le fichier `.war` et déployer l'application.

### Étape 5 : Accéder à l'application
1. Ouvrez votre navigateur web.
2. Allez à l'adresse suivante : **http://localhost:8080/urbanmove/**

---

## 🔑 Comptes de démonstration

Le script SQL a inséré deux comptes avec des mots de passe hachés en BCrypt pour tester l'application :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| **Utilisateur** | `demo@urbanmove.ma` | `demo123456` |
| **Administrateur**| `admin@urbanmove.ma` | `admin123456` |

---

## 🏗️ Architecture du Code (Alignée sur le Cours JDBC)

Ce projet respecte l'architecture Modèle-Vue-Contrôleur (MVC) et le Pattern DAO :

*   **Vues (`.jsp`)** : Situées dans `src/main/webapp/jsp/`, elles gèrent l'affichage HTML/CSS.
*   **Contrôleurs (`Servlets`)** : Situés dans `com.urbanmove.servlet`, ils traitent les requêtes HTTP (GET/POST) et redirigent vers les Vues.
*   **Modèles (`POJOs`)** : Situés dans `com.urbanmove.model`, ce sont des objets Java simples (User, Parking, Alert).
*   **Couche d'accès aux données (DAO)** :
    *   Utilisation d'interfaces (ex: `IUserDAO`).
    *   Implémentation classique (ex: `UserDAOImpl`) utilisant `DriverManager.getConnection()`.
    *   Sécurisation avec `PreparedStatement` pour éviter les injections SQL.
    *   Fermeture stricte des ressources (`ResultSet`, `PreparedStatement`, `Connection`) dans des blocs `finally`.

## 📊 Pages IoT principales

| URL | Description |
|-----|-------------|
| `/urbanmove/iot-dashboard` | Dashboard IoT global (5 onglets : Environnemental, Économique, Social, Feux IA, Réseau) |
| `/urbanmove/parkings` | Liste des parkings avec taux d'occupation dynamique et badges LoRaWAN |
| `/urbanmove/alerts` | Alertes IoT temps réel avec niveaux de confiance des capteurs |
