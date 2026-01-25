// ===== GESTION DU THÈME SOMBRE/CLAIR =====

document.addEventListener('DOMContentLoaded', function() {
    // Vérifier le thème sauvegardé ou la préférence système
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        enableDarkTheme();
    } else {
        enableLightTheme();
    }
    
    // Initialiser le bouton de bascule
    initializeThemeToggle();
});

// Initialiser le bouton de basculement de thème
function initializeThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// Basculer entre thème clair et sombre
function toggleTheme() {
    if (document.body.classList.contains('dark-theme')) {
        enableLightTheme();
    } else {
        enableDarkTheme();
    }
    
    // Mettre à jour l'affichage
    updateThemeDisplay();
    
    // Sauvegarder la préférence
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    // Afficher une notification
    showNotification(`Thème ${isDark ? 'sombre' : 'clair'} activé`, 'success');
}

// Activer le thème sombre
function enableDarkTheme() {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    
    // Mettre à jour la meta theme-color pour les navigateurs mobiles
    updateThemeColorMeta('#1a1d28');
}

// Activer le thème clair
function enableLightTheme() {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    
    // Mettre à jour la meta theme-color pour les navigateurs mobiles
    updateThemeColorMeta('#4361ee');
}

// Mettre à jour la meta theme-color
function updateThemeColorMeta(color) {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    
    if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.name = 'theme-color';
        document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = color;
}

// Mettre à jour l'affichage du bouton thème
function updateThemeDisplay() {
    const isDark = document.body.classList.contains('dark-theme');
    const themeText = document.getElementById('themeText');
    const themeIcon = document.getElementById('themeIcon');
    const currentTheme = document.getElementById('currentTheme');
    
    if (themeText) {
        themeText.textContent = isDark ? 'Mode clair' : 'Mode sombre';
    }
    
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
    
    if (currentTheme) {
        currentTheme.textContent = isDark ? 'Thème sombre' : 'Thème clair';
    }
}

// Fonction de notification (copiée de script.js pour la cohérence)
function showNotification(message, type) {
    // Créer une notification temporaire
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'assertive');
    
    const iconClass = type === 'success' ? 'check-circle' : 'exclamation-circle';
    notification.innerHTML = `
        <i class="fas fa-${iconClass}" aria-hidden="true"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Animation d'entrée
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Supprimer après 3 secondes
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}


// Synchroniser avec les préférences système
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    // Ne changer que si l'utilisateur n'a pas explicitement choisi un thème
    if (!localStorage.getItem('theme')) {
        if (e.matches) {
            enableDarkTheme();
        } else {
            enableLightTheme();
        }
        updateThemeDisplay();
    }
});