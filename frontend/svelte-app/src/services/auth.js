import { writable } from 'svelte/store';

// Définir l'URL de l'API pour éviter les problèmes de CORS
const API_URL = 'http://localhost:5000';

// Store pour l'état d'authentification - initialisation explicite à false
export const isAuthenticated = writable(false);
export const currentUser = writable(null);

// Vérifier le token au démarrage
export function checkAuth() {
    // Dans un premier temps, tenter de lire le token et l'utilisateur stockés
    if (typeof window === 'undefined' || !window.localStorage) {
        console.log("Environnement sans localStorage, authentification désactivée");
        return false;
    }

    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');

    // Si rien n'est stocké ⇒ pas authentifié
    if (!token || !userStr) {
        logout();
        return false;
    }

    let user;
    try {
        user = JSON.parse(userStr);
    } catch (e) {
        console.log("Erreur de parsing JSON de l'utilisateur :", e);
        logout();
        return false;
    }

    // On suppose l'utilisateur authentifié le temps de valider le token côté backend
    isAuthenticated.set(true);
    currentUser.set({ ...user });

    // Vérification asynchrone de la validité du token auprès du backend
    fetch(`${API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => {
        console.log("Réponse du serveur pour /me:", response.status);
        if (response.status === 401) {
            // Token réellement invalide ou expiré ⇒ on déconnecte
            console.log("Token invalide ou expiré, déconnexion");
            logout();
        } else if (!response.ok) {
            // Autre erreur serveur : on conserve la session et on log uniquement
            console.warn("Erreur lors de la validation du token (", response.status, ") – session conservée");
        }
    })
    .catch(err => {
        // Typiquement déclenché si la requête est annulée par un rafraîchissement ; ne pas déconnecter
        console.warn("Erreur réseau ou requête annulée lors de la vérification du token : ", err);
    });

    return true;
}

// Fonction de déconnexion
export function logout() {
    console.log("Déconnexion utilisateur");
    if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
    }
    isAuthenticated.set(false);
    currentUser.set(null);
}

// Fonction pour récupérer le token
export function getToken() {
    if (typeof window === 'undefined' || !window.localStorage) {
        return null;
    }
    return localStorage.getItem('auth_token');
}

// Intercepteur pour les requêtes API
export async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    let apiUrl = url;
    if (!url.includes('http://') && !url.startsWith('/api')) {
        apiUrl = `${API_URL}/api${url.startsWith('/') ? url : `/${url}`}`;
    } else if (url.startsWith('/api')) {
        apiUrl = `${API_URL}${url}`;
    }
    
    // Préparer headers
    options.headers = options.headers || {};
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }
    // Si le body n'est pas un FormData, on fixe le Content-Type JSON
    if (!(options.body instanceof FormData)) {
        options.headers['Content-Type'] = 'application/json';
    }
    // Toujours inclure les credentials pour cookie si besoin
    options.credentials = options.credentials || 'include';
    
    try {
        const response = await fetch(apiUrl, {
            ...options
        });
        
        // Si on reçoit une erreur 401, on déconnecte l'utilisateur
        if (response.status === 401) {
            console.log("Erreur 401, déconnexion");
            logout();
        }
        
        return response;
    } catch (error) {
        console.error("Erreur de connexion API:", error);
        throw error;
    }
} 