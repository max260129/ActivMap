<script>
    import { createEventDispatcher } from 'svelte';
    import { fade, fly } from 'svelte/transition';
    import { isAuthenticated, currentUser } from '../services/auth.js';
    
    const dispatch = createEventDispatcher();
    
    // Utiliser la même URL que dans auth.js
    const API_URL = 'http://localhost:5000';
    
    let email = '';
    let password = '';
    let error = '';
    let loading = false;
    let isRegisterMode = false;
    
    async function handleSubmit() {
        error = '';
        loading = true;
        
        // Validation simple côté client
        if (!email || !password) {
            error = 'Veuillez remplir tous les champs';
            loading = false;
            return;
        }
        
        // Validation email simple
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            error = 'Format d\'email invalide';
            loading = false;
            return;
        }
        
        // Validation du mot de passe
        if (password.length < 6) {
            error = 'Le mot de passe doit contenir au moins 6 caractères';
            loading = false;
            return;
        }
        
        try {
            const endpoint = isRegisterMode ? `${API_URL}/api/auth/register` : `${API_URL}/api/auth/login`;
            console.log('Tentative de connexion à:', endpoint);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                error = data.error || `Erreur de connexion: ${response.status} ${response.statusText}`;
                loading = false;
                return;
            }
            
            if (isRegisterMode) {
                // Si c'est une inscription réussie, passer en mode connexion
                isRegisterMode = false;
                email = '';
                password = '';
                error = '';
                loading = false;
                return;
            }
            
            console.log('Connexion réussie, redirection...');
            console.log('Token reçu du serveur:', data.access_token);
            
            // Sauvegarder le token et les infos utilisateur
            localStorage.setItem('auth_token', data.access_token);
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Token et user stockés dans localStorage');
            
            // Mettre à jour les stores
            isAuthenticated.set(true);
            currentUser.set(data.user);
            
            // Informer le composant parent de la connexion réussie
            dispatch('login-success');
            
        } catch (err) {
            console.error('Erreur de connexion détaillée:', err);
            error = 'Erreur de connexion au serveur. Vérifiez que le backend est accessible.';
        } finally {
            loading = false;
        }
    }
    
    function toggleMode() {
        isRegisterMode = !isRegisterMode;
        error = '';
    }
</script>

<style>
    .auth-container {
        max-width: 400px;
        margin: 0 auto;
    }
    
    .form-group {
        margin-bottom: 1rem;
    }
    
    .error-message {
        color: #ff4444;
        margin-top: 1rem;
        text-align: center;
    }
    
    .toggle-mode {
        text-align: center;
        margin-top: 1rem;
    }
    
    .toggle-link {
        color: #cc5200;
        cursor: pointer;
        text-decoration: underline;
    }
    
    .toggle-link:hover {
        color: #ff6600;
    }
    
    .loading-spinner {
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid #cc5200;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        animation: spin 1s linear infinite;
        margin: 1rem auto;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
</style>

<div class="auth-container" in:fly={{ y: -20, duration: 400 }}>
    <h2>{isRegisterMode ? 'Créer un compte' : 'Connexion'}</h2>
    
    <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
            <label for="email">Email :</label>
            <input 
                type="email" 
                id="email" 
                bind:value={email} 
                required 
                autocomplete="email" 
                placeholder="votre@email.com"
            />
        </div>
        
        <div class="form-group">
            <label for="password">Mot de passe :</label>
            <input 
                type="password" 
                id="password" 
                bind:value={password} 
                required 
                autocomplete={isRegisterMode ? 'new-password' : 'current-password'}
                placeholder="Votre mot de passe"
            />
        </div>
        
        <button type="submit" disabled={loading}>
            {isRegisterMode ? 'S\'inscrire' : 'Se connecter'}
        </button>
        
        {#if loading}
            <div class="loading-spinner"></div>
        {/if}
        
        {#if error}
            <p class="error-message" in:fade>{error}</p>
        {/if}
    </form>
    
    <div class="toggle-mode">
        <a class="toggle-link" href="#forgot">Mot de passe oublié ?</a>
    </div>
    
    <div class="toggle-mode">
        {#if isRegisterMode}
            Déjà inscrit ? <span class="toggle-link" on:click={toggleMode}>Se connecter</span>
        {:else}
            Pas encore de compte ? <span class="toggle-link" on:click={toggleMode}>S'inscrire</span>
        {/if}
    </div>
</div> 