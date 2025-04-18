import { writable } from 'svelte/store';

// Définir l'URL de l'API pour éviter les problèmes de CORS
const API_URL = 'http://localhost:5000';

// Store pour l'état d'authentification - initialisation explicite à false
export const isAuthenticated = writable(false);
export const currentUser = writable(null);

// Vérifier le token au démarrage
export function checkAuth() {
    // Initialiser l'état d'authentification à false par défaut
    isAuthenticated.set(false);
    currentUser.set(null);
    
    if (typeof window === 'undefined' || !window.localStorage) {
        console.log("Environnement sans localStorage, authentification désactivée");
        return false;
    }
    
    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
        console.log("Pas de token ou d'utilisateur en localStorage");
        return false;
    }
    
    try {
        const user = JSON.parse(userStr);
        
        // Vérifier la validité du token avec le backend
        fetch(`${API_URL}/api/auth/me`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        })
        .then(response => {
            console.log("Réponse du serveur pour /me:", response.status);
            if (response.ok) {
                console.log("Token validé par le backend");
                isAuthenticated.set(true);
                currentUser.set({ ...user });
                return true;
            } else {
                console.log("Token invalide, déconnexion");
                // Token invalide, nettoyer le stockage
                logout();
                return false;
            }
        })
        .catch((err) => {
            console.log("Erreur de vérification du token:", err);
            logout();
            return false;
        });
    } catch (e) {
        console.log("Erreur de parsing JSON:", e);
        // En cas d'erreur de parsing, nettoyer le stockage
        logout();
        return false;
    }
    return false;
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
    
    // Adapter l'URL en fonction du type de requête
    let apiUrl = url;
    
    // Si l'URL ne contient pas déjà http:// et ne commence pas par /api, ajuster le format
    if (!url.includes('http://') && !url.startsWith('/api')) {
        apiUrl = `${API_URL}/api${url.startsWith('/') ? url : `/${url}`}`;
    } else if (url.startsWith('/api')) {
        apiUrl = `${API_URL}${url}`;
    }
    
    console.log("URL modifiée pour fetch:", apiUrl);
    
    if (token) {
        options.headers = {
            ...options.headers || {},
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
        console.log("Envoi requête avec token:", `Bearer ${token}`);
    }
    
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